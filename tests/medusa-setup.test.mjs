import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../apps/medusa/src/scripts/setup-store.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText;

function fixture(seed = {}) {
  const records = { Categories: [], Types: [], Tags: [], Collections: [], ...seed };
  let writes = 0;
  const service = {};
  for (const name of Object.keys(records)) {
    service['listProduct' + name] = async (_filter, { skip, take }) =>
      records[name].slice().sort((a, b) => a.id.localeCompare(b.id)).slice(skip, skip + take);
    service['createProduct' + name] = async data => {
      writes++;
      const record = { id: `created_${name}_${writes}`, ...data };
      records[name].push(record);
      return record;
    };
  }
  return { records, service, writes: () => writes };
}

async function run(f, preview = false, args = ['fashion'], env = {}) {
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: name => {
      if (name === '@medusajs/framework/utils') return { Modules: { PRODUCT: 'product' } };
      if (name === '@medusajs/medusa/core-flows') return {};
      if (name === 'node:fs/promises') return { readFile() { throw new Error('Unexpected file read'); }, writeFile() { throw new Error('Unexpected file write'); } };
      if (name === 'node:path') return {};
      throw new Error('Unexpected import: ' + name);
    },
    process: { env: { AMOON_TAXONOMY_DRY_RUN: String(preview), ...env } },
    console: { log() {} },
  });
  await module.exports.default({ args, container: { resolve(name) {
    assert.equal(name, 'product');
    return f.service;
  } } });
}

test('core preview requires no services or connection-file writes', async () => {
  await run(null, false, ['core', 'preview']);
});

test('all preview reads taxonomy but never creates records', async () => {
  const f = fixture();
  await run(f, false, ['all', 'preview']);
  assert.equal(f.writes(), 0);
});

test('invalid arguments and unsupported delivery fees fail before resolving services', async () => {
  await assert.rejects(run(null, false, ['unknown']), /Usage:/);
  await assert.rejects(run(null, false, ['core', 'invalid']), /Usage:/);
  await assert.rejects(run(null, false, ['core', 'preview', 'extra']), /Usage:/);
  await assert.rejects(run(null, false, [], { AMOON_DELIVERY_FEE: '30' }), /free delivery/);
});

test('default setup runs catalog, checkout and taxonomy using the newly generated connection', async () => {
  const f = fixture();
  const calls = [];
  let saved;
  let fulfillmentCreated = false;
  let profileCreated = false;
  const results = {
    createStoresWorkflow: [{ id: 'store_test', supported_currencies: [] }],
    createRegionsWorkflow: [{ id: 'reg_test' }],
    createSalesChannelsWorkflow: [{ id: 'sc_test' }],
    createApiKeysWorkflow: [{ id: 'key_test', token: 'pk_test' }],
    createStockLocationsWorkflow: [{ id: 'loc_test' }],
    createServiceZonesWorkflow: [{ id: 'zone_test' }],
  };
  const flows = new Proxy({}, { get: (_, name) => () => ({ run: async ({ input }) => {
    calls.push({ name, input });
    if (name === 'createLocationFulfillmentSetWorkflow') fulfillmentCreated = true;
    if (name === 'createShippingProfilesWorkflow') profileCreated = true;
    return { result: results[name] || [] };
  } }) });
  const services = {
    REGION: { listRegions: async () => [] },
    SALES_CHANNEL: { listSalesChannels: async () => [] },
    API_KEY: { listApiKeys: async () => [] },
    STORE: { listStores: async () => [] },
    STOCK_LOCATION: { listStockLocations: async () => [] },
    PRODUCT: f.service,
    LINK: { create: async input => calls.push({ name: 'link', input }) },
    FULFILLMENT: {
      listServiceZones: async () => [],
      listShippingProfiles: async () => profileCreated ? [{ id: 'profile_test' }] : [],
      listShippingOptions: async () => [],
    },
    QUERY: { graph: async ({ entity, filters }) => {
      if (entity === 'api_key') return { data: [{ sales_channels: [] }] };
      if (entity === 'region') {
        assert.equal(filters.id, saved.region_id);
        return { data: [{ currency_code: 'mad', payment_providers: [] }] };
      }
      if (entity === 'stock_location') return { data: [{ fulfillment_sets: fulfillmentCreated ? [{ id: 'set_test', name: 'Amoon Livraison Maroc' }] : [] }] };
      throw new Error('Unexpected query: ' + entity);
    } },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: name => {
      if (name === '@medusajs/framework/utils') return {
        Modules: new Proxy({}, { get: (_, key) => key }),
        ContainerRegistrationKeys: { QUERY: 'QUERY', LINK: 'LINK' },
      };
      if (name === '@medusajs/medusa/core-flows') return flows;
      if (name === 'node:path') return { default: { resolve: (...parts) => parts.join('/') } };
      if (name === 'node:fs/promises') return {
        writeFile: async (_, contents) => { saved = JSON.parse(contents); },
        readFile: async () => { throw new Error('Checkout must use the new catalog settings directly'); },
      };
      throw new Error('Unexpected import: ' + name);
    },
    process: { env: {}, cwd: () => '/test' },
    console: { log() {} },
  });
  await module.exports.default({ args: [], container: { resolve: name => {
    assert.ok(services[name], 'Unknown service: ' + name);
    return services[name];
  } } });
  assert.deepEqual(saved, { region_id: 'reg_test', sales_channel_id: 'sc_test', publishable_key: 'pk_test' });
  assert.equal(calls.find(call => call.name === 'updateRegionsWorkflow').input.update.payment_providers[0], 'pp_system_default');
  const shipping = calls.find(call => call.name === 'createShippingOptionsWorkflow').input[0];
  assert.equal(shipping.prices[0].currency_code, 'mad');
  assert.equal(shipping.prices[0].amount, 0);
  assert.equal(shipping.provider_id, 'manual_manual');
  assert.ok(f.records.Categories.some(category => category.handle === 'women-clothing-dresses'));
});

test('preview makes no writes, including when child categories need planned parents', async () => {
  const f = fixture();
  await run(f, true);
  assert.equal(f.writes(), 0);
  assert.ok(Object.values(f.records).every(records => records.length === 0));
});

test('creates distinct nested handles and reruns without changing existing records', async () => {
  const f = fixture();
  await run(f);
  const byHandle = new Map(f.records.Categories.map(c => [c.handle, c]));
  assert.equal(byHandle.size, f.records.Categories.length);
  assert.equal(byHandle.get('women-clothing-dresses').parent_category_id, byHandle.get('women-clothing').id);
  assert.equal(byHandle.get('men-shoes-sneakers').parent_category_id, byHandle.get('men-shoes').id);
  const category = byHandle.get('women');
  category.name = 'Owner label';
  category.is_active = false;
  const before = JSON.stringify(f.records);
  const writes = f.writes();
  await run(f);
  assert.equal(f.writes(), writes);
  assert.equal(JSON.stringify(f.records), before);
});

test('reuses matching records beyond the first 1000 and preserves case variants', async () => {
  const dummy = () => Array.from({ length: 1001 }, (_, i) => ({ id: `a${String(i).padStart(4, '0')}`, handle: `existing-${i}`, value: `existing-${i}` }));
  const f = fixture({
    Categories: [...dummy(), { id: 'z_women', handle: 'women', parent_category_id: null }],
    Types: [...dummy(), { id: 'z_type', value: 't-shirt' }],
    Tags: [...dummy(), { id: 'z_tag', value: 'COTTON' }],
    Collections: [...dummy(), { id: 'z_collection', handle: 'new-arrivals' }],
  });
  await run(f);
  assert.equal(f.records.Categories.filter(c => c.handle === 'women').length, 1);
  assert.equal(f.records.Categories.find(c => c.handle === 'women-clothing').parent_category_id, 'z_women');
  assert.equal(f.records.Types.filter(t => t.value.toLowerCase() === 't-shirt').length, 1);
  assert.equal(f.records.Tags.filter(t => t.value.toLowerCase() === 'cotton').length, 1);
  assert.equal(f.records.Collections.filter(c => c.handle === 'new-arrivals').length, 1);
});

test('conflicting parent is rejected without moving the existing category', async () => {
  const f = fixture({ Categories: [{ id: 'women_id', handle: 'women', parent_category_id: 'unrelated_parent' }] });
  await assert.rejects(run(f), /different parent/);
  assert.equal(f.writes(), 0);
  assert.equal(f.records.Categories[0].parent_category_id, 'unrelated_parent');
});

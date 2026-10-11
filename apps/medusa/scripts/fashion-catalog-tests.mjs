import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/scripts/setup-fashion-catalog.ts', import.meta.url), 'utf8');
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

async function run(f, preview = false) {
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: name => {
      assert.equal(name, '@medusajs/framework/utils');
      return { Modules: { PRODUCT: 'product' } };
    },
    process: { env: { AMOON_TAXONOMY_DRY_RUN: String(preview) } },
    console: { log() {} },
  });
  await module.exports.default({ container: { resolve(name) {
    assert.equal(name, 'product');
    return f.service;
  } } });
}

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

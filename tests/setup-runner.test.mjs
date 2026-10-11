import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseOptions, syncConnectionValues } from '../scripts/setup-store.mjs';

test('setup arguments default to all and reject mistakes', () => {
  assert.equal(parseOptions([]).scope, 'all');
  assert.equal(parseOptions(['--docker', '--scope', 'fashion', '--preview']).preview, true);
  assert.throws(() => parseOptions(['--scope']), /Choose/);
  assert.throws(() => parseOptions(['--scope', 'wrong']), /Choose/);
  assert.throws(() => parseOptions(['--typo']), /Unknown/);
});

test('connection synchronization preserves public origins and unrelated settings', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'amoon-setup-test-'));
  try {
    await mkdir(path.join(workspace, 'apps/storefront'), { recursive: true });
    const files = ['.env', 'apps/storefront/.env'].map(file => path.join(workspace, file));
    const original = 'STOREFRONT_URL=https://amoon.ma\nCART_COOKIE_SECRET=test-preserved\nMEDUSA_REGION_ID=reg_old\n';
    for (const file of files) await writeFile(file, original);
    const catalog = { publishable_key: 'pk_test', region_id: 'reg_test', sales_channel_id: 'sc_test' };
    await syncConnectionValues(catalog, 'http://localhost:9001', workspace);
    for (const file of files) {
      const contents = await readFile(file, 'utf8');
      assert.match(contents, /^STOREFRONT_URL=https:\/\/amoon.ma$/m);
      assert.match(contents, /^CART_COOKIE_SECRET=test-preserved$/m);
      assert.match(contents, /^MEDUSA_INTERNAL_URL=http:\/\/localhost:9001$/m);
      assert.match(contents, /^MEDUSA_REGION_ID=reg_test$/m);
      assert.equal(contents.match(/^MEDUSA_REGION_ID=/gm).length, 1);
    }
    const before = await Promise.all(files.map(file => readFile(file, 'utf8')));
    await assert.rejects(syncConnectionValues({ ...catalog, publishable_key: 'invalid\nINJECTED=true' }, undefined, workspace), /Invalid catalog/);
    assert.deepEqual(await Promise.all(files.map(file => readFile(file, 'utf8'))), before);
  } finally {
    assert.equal(path.dirname(workspace), path.resolve(tmpdir()));
    assert.ok(path.basename(workspace).startsWith('amoon-setup-test-'));
    await rm(workspace, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';

// Use Wrangler's installed workerd, not Node's fetch implementation. Node
// accepts redirect:"error"; Workers throws before sending the request.
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler'));
const { build } = wranglerRequire('esbuild');
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const origin = 'https://indexnow.example.com';
const key = 'worker-test-public-key-12345';
const requests = [];
let respond;
let runtime;

before(async () => {
  const bundle = await build({
    stdin: {
      resolveDir: resolve(import.meta.dirname, '..'),
      sourcefile: 'workers-outbound-test.ts',
      contents: `
        import { submitUrls } from './src/modules/indexnow/service';
        import { testSeeAPI } from './src/modules/config/seeapi-test';
        import { SeeAPIProvider } from './src/core/ai/seeapi';
        export default {
          async fetch(request) {
            globalThis.__CF_ENV__ = { VITE_APP_URL: ${JSON.stringify(origin)} };
            const action = new URL(request.url).pathname;
            if (action === '/indexnow')
              return Response.json(await submitUrls(${JSON.stringify(key)}, [
                ${JSON.stringify(origin + '/page')},
                ${JSON.stringify(origin + '/page#top')}
              ]));
            if (action === '/credentials')
              return Response.json(await testSeeAPI({ seeapi_api_key: 'isolated-test-credential' }));
            const provider = new SeeAPIProvider({ apiKey: 'isolated-test-credential' });
            try {
              return Response.json(await provider.query({ taskId: 'worker_task' }));
            } catch (error) {
              return Response.json({ status: error.status, definitive: error.definitive });
            }
          }
        };
      `,
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    plugins: [
      {
        name: 'no-database-or-encryption-in-transport-tests',
        setup(builder) {
          const stubs = {
            '@/core/db':
              'export function db() { throw new Error("Unexpected database access"); }',
            '@/config/db/schema': 'export const config = {};',
            '@/lib/crypto':
              'export function decryptSecret() { throw new Error("Unexpected decryption"); }',
          };
          builder.onResolve(
            { filter: /^@\/(core\/db|config\/db\/schema|lib\/crypto)$/ },
            ({ path }) => ({ path, namespace: 'isolated-transport' })
          );
          builder.onLoad(
            { filter: /.*/, namespace: 'isolated-transport' },
            ({ path }) => ({ contents: stubs[path], loader: 'js' })
          );
        },
      },
    ],
  });
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      compatibilityDate: '2026-10-01',
      script: bundle.outputFiles[0].text,
      // No external search-engine submissions, credentials, or databases.
      outboundService: async (request) => {
        requests.push({
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: await request.text(),
        });
        return respond(request);
      },
    })
  );
});

after(async () => {
  await runtime?.dispose();
});

test('IndexNow sends its deduplicated payload from the real Workers runtime', async () => {
  requests.length = 0;
  respond = () => new Response('', { status: 202 });
  const result = await (
    await runtime.dispatchFetch('https://test/indexnow')
  ).json();
  assert.equal(result.results[0].ok, true);
  assert.equal(result.submitted, 1);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.indexnow.org/indexnow');
  assert.equal(requests[0].method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].body), {
    host: 'indexnow.example.com',
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList: [`${origin}/page`],
  });
});

test('Workers does not follow an IndexNow redirect and uses only a known fallback', async () => {
  requests.length = 0;
  respond = () =>
    requests.length === 1
      ? new Response('', {
          status: 307,
          headers: { location: 'https://untrusted.example/leak' },
        })
      : new Response('', { status: 200 });
  const result = await (
    await runtime.dispatchFetch('https://test/indexnow')
  ).json();
  assert.equal(result.results[0].ok, true);
  assert.deepEqual(
    requests.map((r) => new URL(r.url).hostname),
    ['api.indexnow.org', 'www.bing.com']
  );
  assert.deepEqual(
    result.results[0].attempts.map((a) => a.status),
    [307, 200]
  );
});

test('SeeAPI credential checks and task queries work in Workers without creating a generation', async () => {
  requests.length = 0;
  respond = (request) =>
    request.url.endsWith('/credits')
      ? Response.json({ credits: 0 })
      : Response.json({
          generation: {
            id: 'worker_task',
            model: 'seedream-5-5',
            endpoint: 'text-to-image',
            status: 'processing',
          },
        });
  const checked = await (
    await runtime.dispatchFetch('https://test/credentials')
  ).json();
  assert.equal(checked.success, true);
  const queried = await (
    await runtime.dispatchFetch('https://test/query')
  ).json();
  assert.equal(queried.taskId, 'worker_task');
  assert.equal(queried.taskStatus, 'processing');
  assert.deepEqual(
    requests.map((r) => r.method),
    ['GET', 'GET']
  );
  assert.ok(
    requests.every(
      (r) =>
        r.headers.get('authorization') === 'Bearer isolated-test-credential'
    )
  );
});

test('Workers rejects SeeAPI redirects without forwarding the credential', async () => {
  requests.length = 0;
  respond = () =>
    new Response('', {
      status: 302,
      headers: { location: 'https://untrusted.example/leak' },
    });
  const checked = await (
    await runtime.dispatchFetch('https://test/credentials')
  ).json();
  assert.equal(checked.success, false);
  const queried = await (
    await runtime.dispatchFetch('https://test/query')
  ).json();
  assert.equal(queried.status, 302);
  assert.ok(
    requests.every((r) => new URL(r.url).hostname === 'api.seeapi.com')
  );
  assert.equal(requests.length, 2);
});

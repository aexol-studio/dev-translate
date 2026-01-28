import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { DevTranslateClient, Languages } from '../lib/index.js';

/**
 * Unit tests for DevTranslateClient using a local stub HTTP server.
 * These tests do not require a real API key or network access.
 */

describe('DevTranslateClient Unit Tests', () => {
  /** @type {http.Server} */
  let server;
  /** @type {number} */
  let port;
  /** @type {DevTranslateClient} */
  let client;
  /** @type {string|undefined} */
  let lastApiKeyHeader;

  before(async () => {
    // Create a stub HTTP server that mimics the GraphQL API
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        // Capture the api-key header for assertions
        lastApiKeyHeader = req.headers['api-key'];

        try {
          const parsed = JSON.parse(body);
          const query = parsed.query || '';

          // Extract content from the GraphQL query
          // The Zeus client embeds the content directly in the query string
          // Try to extract content from variables first, then from query
          let contentStr = '';

          if (parsed.variables?.translate?.content) {
            contentStr = parsed.variables.translate.content;
          } else {
            // Extract content:"..." from query using regex
            // The content is JSON-escaped in the query string
            const contentMatch = query.match(/content:\s*"((?:\\.|[^"\\])*)"/);
            if (contentMatch) {
              // Unescape the JSON string
              contentStr = JSON.parse('"' + contentMatch[1] + '"');
            }
          }

          // Parse the content JSON to get the contentMap
          let contentMap = {};
          if (contentStr) {
            try {
              contentMap = JSON.parse(contentStr);
            } catch {
              // If parsing fails, use empty object
            }
          }

          // Extract languages from query
          // Languages appear as: languages:[PL] or languages:[PL,DE]
          const languagesMatch = query.match(/languages:\s*\[([^\]]+)\]/);
          const languages = [];
          if (languagesMatch) {
            const langStr = languagesMatch[1];
            // Split by comma and trim
            const langParts = langStr.split(',').map((l) => l.trim());
            languages.push(...langParts);
          }

          // Build translated result: each value becomes `${value}-translated`
          const translatedMap = {};
          for (const [key, value] of Object.entries(contentMap)) {
            translatedMap[key] = `${value}-translated`;
          }

          // Build response for each language
          const results = languages.map((lang) => ({
            language: lang,
            result: JSON.stringify(translatedMap),
            consumedTokens: '5',
          }));

          const response = {
            data: {
              api: {
                translate: {
                  results,
                },
              },
            },
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ errors: [{ message: err.message }] }));
        }
      });
    });

    // Start server on a random available port
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        port = address.port;
        resolve();
      });
    });

    // Create client pointing to our stub server
    client = new DevTranslateClient({
      apiKey: 'test-key',
      host: `http://127.0.0.1:${port}/graphql`,
    });
  });

  after(async () => {
    // Clean up server
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  it('translateStrings returns translations array per language', async () => {
    const result = await client.translateStrings({
      content: ['hello', 'world'],
      languages: [Languages.PL],
    });

    assert.ok(Array.isArray(result), 'result should be an array');
    assert.equal(result.length, 1, 'should have one result for one language');

    const plResult = result[0];
    assert.equal(plResult.language, Languages.PL, 'language should be PL');
    assert.ok(Array.isArray(plResult.translations), 'translations should be an array');
    assert.equal(plResult.translations.length, 2, 'should have two translations');
    assert.equal(plResult.translations[0], 'hello-translated', 'first translation should be hello-translated');
    assert.equal(plResult.translations[1], 'world-translated', 'second translation should be world-translated');
    assert.equal(plResult.consumedTokens, 5, 'consumedTokens should be 5');
  });

  it('translateStrings preserves order of input strings', async () => {
    const result = await client.translateStrings({
      content: ['first', 'second', 'third'],
      languages: [Languages.PL],
    });

    const translations = result[0].translations;
    assert.equal(translations[0], 'first-translated');
    assert.equal(translations[1], 'second-translated');
    assert.equal(translations[2], 'third-translated');
  });

  it('translateStrings works with multiple languages', async () => {
    const result = await client.translateStrings({
      content: ['test'],
      languages: [Languages.PL, Languages.DE],
    });

    assert.equal(result.length, 2, 'should have two results for two languages');

    const languages = result.map((r) => r.language);
    assert.ok(languages.includes(Languages.PL), 'should include PL');
    assert.ok(languages.includes(Languages.DE), 'should include DE');

    // Each language result should have the translation
    for (const langResult of result) {
      assert.equal(langResult.translations[0], 'test-translated');
    }
  });

  it('translateStrings sends api-key header', async () => {
    await client.translateStrings({
      content: ['check-header'],
      languages: [Languages.PL],
    });

    assert.equal(lastApiKeyHeader, 'test-key', 'api-key header should be set');
  });

  it('translateStrings handles empty content array', async () => {
    const result = await client.translateStrings({
      content: [],
      languages: [Languages.PL],
    });

    assert.ok(Array.isArray(result), 'result should be an array');
    assert.equal(result.length, 1, 'should have one result');
    assert.equal(result[0].translations.length, 0, 'translations should be empty');
  });
});

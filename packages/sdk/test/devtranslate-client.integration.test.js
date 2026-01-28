import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DevTranslateClient, Languages } from '../lib/index.js';

/**
 * Integration tests for DevTranslateClient
 * These tests call the real API and are skipped when DEV_TRANSLATE_API_KEY is not set.
 *
 * Environment variables:
 * - DEV_TRANSLATE_API_KEY (required): API key to authenticate
 * - DEV_TRANSLATE_TEST_HOST (optional): Override the default API host
 * - DEV_TRANSLATE_TEST_PROJECT_ID (optional): Project ID for clearCache test
 */

const API_KEY = process.env.DEV_TRANSLATE_API_KEY;
const TEST_HOST = process.env.DEV_TRANSLATE_TEST_HOST;
const TEST_PROJECT_ID = process.env.DEV_TRANSLATE_TEST_PROJECT_ID;

// Small, safe payload to minimize cost
const TEST_CONTENT = '{"hello":"world"}';
const TEST_LANGUAGES = [Languages.PL];

describe('DevTranslateClient Integration', { timeout: 30000 }, () => {
  if (!API_KEY) {
    it('skipped: DEV_TRANSLATE_API_KEY not set', { skip: true }, () => {
      // This test is intentionally skipped when no API key is provided
    });
    return;
  }

  /** @type {DevTranslateClient} */
  const client = new DevTranslateClient({
    apiKey: API_KEY,
    ...(TEST_HOST && { host: TEST_HOST }),
  });

  it('predictTranslationCost returns numeric cost and cached values', async () => {
    const prediction = await client.predictTranslationCost({
      content: TEST_CONTENT,
      languages: TEST_LANGUAGES,
    });

    assert.equal(typeof prediction.cost, 'number', 'cost should be a number');
    assert.ok(prediction.cost >= 0, 'cost should be >= 0');
    assert.equal(typeof prediction.cached, 'number', 'cached should be a number');
    assert.ok(prediction.cached >= 0, 'cached should be >= 0');
  });

  it('translate returns array with expected structure', async () => {
    const results = await client.translate({
      content: TEST_CONTENT,
      languages: TEST_LANGUAGES,
    });

    assert.ok(Array.isArray(results), 'results should be an array');
    assert.ok(results.length >= 1, 'should have at least one result');

    const firstResult = results[0];
    assert.equal(typeof firstResult.result, 'string', 'result should be a string');
    assert.equal(firstResult.language, Languages.PL, 'language should match requested language');
    assert.equal(typeof firstResult.consumedTokens, 'number', 'consumedTokens should be a number');
    assert.ok(firstResult.consumedTokens >= 0, 'consumedTokens should be >= 0');
  });

  it('translateStrings returns array with expected structure', async () => {
    const inputContent = ['hello', 'world'];
    const results = await client.translateStrings({
      content: inputContent,
      languages: [Languages.PL],
    });

    assert.ok(Array.isArray(results), 'results should be an array');
    assert.ok(results.length >= 1, 'should have at least one result');

    const firstResult = results[0];
    assert.equal(firstResult.language, Languages.PL, 'language should match requested language');
    assert.ok(Array.isArray(firstResult.translations), 'translations should be an array');
    assert.equal(firstResult.translations.length, inputContent.length, 'translations length should match input length');

    for (const translation of firstResult.translations) {
      assert.equal(typeof translation, 'string', 'each translation should be a string');
    }

    assert.equal(typeof firstResult.consumedTokens, 'number', 'consumedTokens should be a number');
    assert.ok(firstResult.consumedTokens >= 0, 'consumedTokens should be >= 0');
  });

  if (TEST_PROJECT_ID) {
    it('clearCache with projectId returns true', async () => {
      const result = await client.clearCache(TEST_PROJECT_ID);

      assert.equal(result, true, 'clearCache should return true');
    });
  } else {
    it('skipped: clearCache test requires DEV_TRANSLATE_TEST_PROJECT_ID', { skip: true }, () => {
      // This test is skipped when no project ID is provided
    });
  }
});

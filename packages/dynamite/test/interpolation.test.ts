import { getDynamiteSync } from '../src/server.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

// Setup: create temp locale files
const tmpDir = join(import.meta.dirname, '.test-locales');

mkdirSync(tmpDir, { recursive: true });

// loadTranslations expects flat files: {localesDir}/{locale}.json
writeFileSync(
  join(tmpDir, 'en.json'),
  JSON.stringify({
    'Hello {{name}}!': 'Hello {{name}}!',
    'You have {{count}} items': 'You have {{count}} items',
    'Hello world': 'Hello world',
    'Hello {{name}}, you have {{count}} items': 'Hello {{name}}, you have {{count}} items',
  }),
);

writeFileSync(
  join(tmpDir, 'es.json'),
  JSON.stringify({
    'Hello {{name}}!': 'Hola {{name}}!',
    'You have {{count}} items': 'Tienes {{count}} artículos',
    'Hello world': 'Hola mundo',
    'Hello {{name}}, you have {{count}} items': 'Hola {{name}}, tienes {{count}} artículos',
  }),
);

// Get t() function for English locale
const { t: tEn } = getDynamiteSync('en', {
  localesDir: tmpDir,
  defaultLocale: 'en',
});

// Get t() function for Spanish locale
const { t: tEs } = getDynamiteSync('es', {
  localesDir: tmpDir,
  defaultLocale: 'en',
});

const tests = [
  {
    name: 'Basic interpolation (English)',
    result: tEn('Hello {{name}}!', { name: 'Alice' }),
    expected: 'Hello Alice!',
  },
  {
    name: 'Basic interpolation (Spanish translation)',
    result: tEs('Hello {{name}}!', { name: 'Adrianne' }),
    expected: 'Hola Adrianne!',
  },
  {
    name: 'Multiple placeholders (English)',
    result: tEn('Hello {{name}}, you have {{count}} items', { name: 'Alice', count: 5 }),
    expected: 'Hello Alice, you have 5 items',
  },
  {
    name: 'Multiple placeholders (Spanish)',
    result: tEs('Hello {{name}}, you have {{count}} items', { name: 'Adrianne', count: 3 }),
    expected: 'Hola Adrianne, tienes 3 artículos',
  },
  {
    name: 'No params — backward compatible',
    result: tEn('Hello world'),
    expected: 'Hello world',
  },
  {
    name: 'No params — backward compatible (Spanish)',
    result: tEs('Hello world'),
    expected: 'Hola mundo',
  },
  {
    name: 'Missing param — placeholder preserved',
    result: tEn('Hello {{name}}!'),
    expected: 'Hello {{name}}!',
  },
  {
    name: 'Number value',
    result: tEn('You have {{count}} items', { count: 42 }),
    expected: 'You have 42 items',
  },
  {
    name: 'Key not found — fallback with interpolation',
    result: tEn('Unknown {{thing}}', { thing: 'widget' }),
    expected: 'Unknown widget',
  },
  {
    name: 'Key not found — fallback without params',
    result: tEn('This key does not exist'),
    expected: 'This key does not exist',
  },
];

// Run tests
let passed = 0;
let failed = 0;

for (const test of tests) {
  if (test.result === test.expected) {
    console.log(`  ✅ ${test.name}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.name}`);
    console.log(`     Expected: "${test.expected}"`);
    console.log(`     Got:      "${test.result}"`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

// Cleanup
rmSync(tmpDir, { recursive: true, force: true });

if (failed > 0) {
  process.exit(1);
}

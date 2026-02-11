#!/usr/bin/env node

// bump-version.mjs — Interactive monorepo version bump script
//
// Interactive mode (no args):
//   node scripts/bump-version.mjs
//
// Non-interactive mode (backward-compatible):
//   node scripts/bump-version.mjs 0.5.0     # explicit version
//   node scripts/bump-version.mjs patch      # 0.4.1 → 0.4.2
//   node scripts/bump-version.mjs minor      # 0.4.1 → 0.5.0
//   node scripts/bump-version.mjs major      # 0.4.1 → 1.0.0

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline/promises';

// --- ANSI colors (no external deps) ---

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const bold = (s) => `${BOLD}${s}${RESET}`;
const green = (s) => `${GREEN}${s}${RESET}`;
const yellow = (s) => `${YELLOW}${s}${RESET}`;
const cyan = (s) => `${CYAN}${s}${RESET}`;
const dim = (s) => `${DIM}${s}${RESET}`;

// --- Constants ---

const ROOT = process.cwd();

// All package.json files to update (relative to monorepo root)
const PACKAGE_PATHS = [
  'package.json',
  'packages/core/package.json',
  'packages/config/package.json',
  'packages/cli/package.json',
  'packages/watch/package.json',
  'packages/vite-plugin-dev-translate/package.json',
  'packages/nextjs-dev-translate-plugin/package.json',
  'packages/sdk/package.json',
  'packages/dynamite/package.json',
  'packages/testground/package.json',
  // packages/docs excluded — private docs site with independent versioning (0.0.1)
];

// Internal package names whose dependency versions should be updated
const INTERNAL_PACKAGES = new Set([
  '@aexol/dev-translate-core',
  '@aexol/dev-translate-config',
  '@aexol/dev-translate-watch',
  '@aexol/dev-translate',
  '@aexol/vite-plugin-dev-translate',
  '@aexol/nextjs-dev-translate-plugin',
  '@aexol/sdk',
  '@aexol/dynamite',
  '@aexol/testground-dev-translate',
]);

// SDK uses exact versions (no caret) for this specific dependency
const EXACT_VERSION_RULES = [
  {
    packagePath: 'packages/sdk/package.json',
    dependencyName: '@aexol/dev-translate-core',
  },
];

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
const BUMP_TYPES = ['patch', 'minor', 'major'];

// Dependency sections to scan
const DEP_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'];

// --- Pure helper functions ---

/** Parse a semver string into [major, minor, patch] */
const parseSemver = (version) => {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return null;
  }
  return parts;
};

/** Calculate next version from current version and bump type */
const bumpVersion = (currentVersion, bumpType) => {
  const parts = parseSemver(currentVersion);
  if (!parts) return null;

  const [major, minor, patch] = parts;

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return null;
  }
};

/** Determine new version from CLI argument and current version */
const resolveNewVersion = (arg, currentVersion) => {
  if (SEMVER_REGEX.test(arg)) return arg;
  if (BUMP_TYPES.includes(arg)) return bumpVersion(currentVersion, arg);
  return null;
};

/** Check if a dependency entry should use exact version (no caret) */
const isExactVersionEntry = (packagePath, depName) =>
  EXACT_VERSION_RULES.some((rule) => rule.packagePath === packagePath && rule.dependencyName === depName);

/** Format a dependency version string with or without caret */
const formatDepVersion = (newVersion, useExact) => (useExact ? newVersion : `^${newVersion}`);

/** Read and parse a package.json file */
const readPackageJson = (relativePath) => {
  const fullPath = join(ROOT, relativePath);
  const content = readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
};

/** Write a package.json object back to disk */
const writePackageJson = (relativePath, data) => {
  const fullPath = join(ROOT, relativePath);
  writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
};

// --- Core version processing (shared by preview and apply) ---

/**
 * Process all packages for a version bump.
 * When apply = false: reads packages, detects changes, returns { updatedFiles, updatedDeps } without writing.
 * When apply = true: reads packages, applies changes, writes files, returns { updatedFiles, updatedDeps }.
 */
const processPackages = (newVersion, apply = false) => {
  const updatedFiles = [];
  const updatedDeps = [];

  for (const pkgPath of PACKAGE_PATHS) {
    const pkg = readPackageJson(pkgPath);
    let fileChanged = false;

    if (pkg.version !== newVersion) {
      if (apply) pkg.version = newVersion;
      fileChanged = true;
    }

    for (const section of DEP_SECTIONS) {
      const deps = pkg[section];
      if (!deps) continue;

      for (const depName of Object.keys(deps)) {
        if (!INTERNAL_PACKAGES.has(depName)) continue;

        const useExact = isExactVersionEntry(pkgPath, depName);
        const newDepVersion = formatDepVersion(newVersion, useExact);
        const oldDepVersion = deps[depName];

        if (oldDepVersion !== newDepVersion) {
          if (apply) deps[depName] = newDepVersion;
          fileChanged = true;
          updatedDeps.push({ file: pkgPath, dep: depName, from: oldDepVersion, to: newDepVersion });
        }
      }
    }

    if (fileChanged) {
      if (apply) writePackageJson(pkgPath, pkg);
      updatedFiles.push(pkgPath);
    }
  }

  return { updatedFiles, updatedDeps };
};

/** Build a preview of all changes that would be applied for a given new version */
const buildChangePreview = (newVersion) => processPackages(newVersion, false);

/** Apply version bump to all package.json files and return a summary */
const applyVersionBump = (newVersion) => processPackages(newVersion, true);

// --- Output helpers ---

/** Print the result summary after changes are applied */
const printSummary = (newVersion, { updatedFiles, updatedDeps }) => {
  console.log('\nUpdated files:');
  if (updatedFiles.length === 0) {
    console.log('  (none — all files already at target version)');
  } else {
    for (const file of updatedFiles) {
      console.log(`  ${green('✓')} ${file}`);
    }
  }

  console.log('\nUpdated dependency references:');
  if (updatedDeps.length === 0) {
    console.log('  (none — all dependency refs already correct)');
  } else {
    for (const { file, dep, from, to } of updatedDeps) {
      console.log(`  ${green('✓')} ${file}: ${dep} ${dim(from)} → ${bold(to)}`);
    }
  }
};

/** Print the "what's next" instructions */
const printNextSteps = (newVersion) => {
  console.log(`\n${green('✅')} All packages bumped to ${bold(newVersion)}\n`);
  console.log('Next steps to publish:');
  console.log(cyan(`  git add -A && git commit -m "chore: bump all packages to ${newVersion}"`));
  console.log(cyan(`  git tag ${newVersion}`));
  console.log(cyan(`  git push && git push origin ${newVersion}`));
  console.log('');
};

/** Print the change preview (files + deps that will be modified) */
const printPreview = (currentVersion, newVersion, { updatedFiles, updatedDeps }) => {
  console.log(`\n${bold('Preview:')} ${dim(currentVersion)} → ${bold(newVersion)}\n`);

  console.log('  Files to update:');
  if (updatedFiles.length === 0) {
    console.log('    (none — already at target version)');
  } else {
    for (const file of updatedFiles) {
      console.log(`    • ${file}`);
    }
  }

  if (updatedDeps.length > 0) {
    console.log('\n  Dependency references to update:');
    for (const { file, dep, from, to } of updatedDeps) {
      console.log(`    • ${file}: ${dep} ${dim(from)} → ${bold(to)}`);
    }
  }

  console.log('');
};

// --- Prompt helper (works with both TTY and piped stdin) ---

/**
 * Create a prompt function that works reliably with piped input.
 * When stdin is piped, readline may close before all questions are asked.
 * We pre-buffer all lines so subsequent prompts can draw from the buffer.
 */
const createPrompter = () => {
  const isTTY = process.stdin.isTTY;

  if (isTTY) {
    // TTY mode: use readline/promises directly
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return {
      ask: (query) => rl.question(query),
      close: () => rl.close(),
    };
  }

  // Piped mode: read all stdin upfront, then serve lines on demand
  const lines = [];
  let resolve;
  let ready = new Promise((r) => {
    resolve = r;
  });

  const chunks = [];
  process.stdin.on('data', (chunk) => chunks.push(chunk));
  process.stdin.on('end', () => {
    const input = Buffer.concat(chunks).toString('utf-8');
    lines.push(...input.split('\n'));
    resolve();
  });

  return {
    ask: async (query) => {
      await ready;
      process.stdout.write(query);
      const line = lines.shift() ?? '';
      console.log(line);
      return line;
    },
    close: () => {},
  };
};

// --- Interactive mode ---

/** Prompt the user to choose a version bump interactively */
const runInteractive = async (currentVersion) => {
  const prompter = createPrompter();

  try {
    const patchVersion = bumpVersion(currentVersion, 'patch');
    const minorVersion = bumpVersion(currentVersion, 'minor');
    const majorVersion = bumpVersion(currentVersion, 'major');

    console.log(`\nCurrent version: ${bold(currentVersion)}\n`);
    console.log('Select version bump:');
    console.log(`  ${bold('1)')} patch  → ${bold(patchVersion)}`);
    console.log(`  ${bold('2)')} minor  → ${bold(minorVersion)}`);
    console.log(`  ${bold('3)')} major  → ${bold(majorVersion)}`);
    console.log(`  ${bold('4)')} custom`);
    console.log('');

    const choice = (await prompter.ask('Choice: ')).trim();

    let newVersion;

    switch (choice) {
      case '1':
        newVersion = patchVersion;
        break;
      case '2':
        newVersion = minorVersion;
        break;
      case '3':
        newVersion = majorVersion;
        break;
      case '4': {
        const custom = (await prompter.ask('Enter version: ')).trim();
        if (!SEMVER_REGEX.test(custom)) {
          console.error(`\n${yellow('Error:')} Invalid semver "${custom}". Expected format: X.Y.Z`);
          process.exit(1);
        }
        newVersion = custom;
        break;
      }
      default:
        console.error(`\n${yellow('Error:')} Invalid choice "${choice}". Pick 1–4.`);
        process.exit(1);
    }

    // Show preview
    const preview = buildChangePreview(newVersion);
    printPreview(currentVersion, newVersion, preview);

    // Confirm
    const confirm = (await prompter.ask('Proceed? (y/N): ')).trim().toLowerCase();
    if (confirm !== 'y') {
      console.log('\nAborted — no changes made.\n');
      process.exit(0);
    }

    // Apply
    const result = applyVersionBump(newVersion);
    printSummary(newVersion, result);
    printNextSteps(newVersion);
  } finally {
    prompter.close();
  }
};

// --- Non-interactive mode (backward-compatible) ---

/** Run in non-interactive mode with a CLI argument */
const runNonInteractive = (arg) => {
  const corePkg = readPackageJson('packages/core/package.json');
  const currentVersion = corePkg.version;

  const newVersion = resolveNewVersion(arg, currentVersion);
  if (!newVersion) {
    console.error(
      `${yellow('Error:')} Invalid version argument "${arg}". Must be a semver (e.g., 0.5.0) or bump type (patch, minor, major).\n`,
    );
    console.error('Usage: node scripts/bump-version.mjs <version|patch|minor|major>');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/bump-version.mjs 0.5.0    # explicit version');
    console.error('  node scripts/bump-version.mjs patch     # bump patch');
    console.error('  node scripts/bump-version.mjs minor     # bump minor');
    console.error('  node scripts/bump-version.mjs major     # bump major');
    process.exit(1);
  }

  console.log(`\nVersion bump: ${dim(currentVersion)} → ${bold(newVersion)}\n`);

  const result = applyVersionBump(newVersion);
  printSummary(newVersion, result);
  printNextSteps(newVersion);
};

// --- Main ---

const main = async () => {
  const arg = process.argv[2];

  if (arg) {
    runNonInteractive(arg);
  } else {
    const corePkg = readPackageJson('packages/core/package.json');
    await runInteractive(corePkg.version);
  }
};

main();

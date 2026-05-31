#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const { promisify } = require('util');

// ── Paths ────────────────────────────────────────────────────────────────────
const ROOT = __dirname;
const MANIFEST = path.join(ROOT, 'manifest.json');
const BUILDS_DIR = path.join(ROOT, 'builds');
const STATE_FILE = path.join(BUILDS_DIR, '.last-build.json');
const DIST_DIR = path.join(ROOT, 'dist');

// Files/dirs to pack into the zip (relative to ROOT)
const PACK_ITEMS = [
  'dist',
  'icons',
  'manifest.json',
  'README.md',
  'LICENSE',
  'THIRD-PARTY-NOTICES.txt',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return readJSON(STATE_FILE); } catch { }
  }
  return {};
}

function saveState(state) {
  fs.mkdirSync(BUILDS_DIR, { recursive: true });
  writeJSON(STATE_FILE, state);
}

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function bold(s) { return `\x1b[1m${s}\x1b[0m`; }
function green(s) { return `\x1b[32m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }
function cyan(s) { return `\x1b[36m${s}\x1b[0m`; }
function red(s) { return `\x1b[31m${s}\x1b[0m`; }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold('\n╔══════════════════════════════╗'));
  console.log(bold('║   KEQ  ·  Release Builder    ║'));
  console.log(bold('╚══════════════════════════════╝\n'));

  // Read current manifest version
  const manifest = readJSON(MANIFEST);
  const currentVersion = manifest.version;

  // Load last build state
  const state = loadState();
  const lastVersion = state.version || null;
  const lastZip = state.zipFile || null;
  const lastBuiltAt = state.builtAt || null;

  if (lastVersion) {
    console.log(cyan('Last build:'));
    console.log(`  Version : ${bold(lastVersion)}`);
    console.log(`  File    : ${lastZip}`);
    console.log(`  Built   : ${lastBuiltAt}\n`);
  } else {
    console.log(yellow('No previous build found.\n'));
  }

  console.log(`Current manifest version: ${bold(currentVersion)}`);

  // Ask for new version
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const raw = await prompt(rl, `Enter new version [${yellow(currentVersion)}]: `);
  const newVersion = raw.trim() || currentVersion;

  // Validate semver-ish
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error(red(`\nInvalid version format "${newVersion}". Expected x.y.z`));
    rl.close();
    process.exit(1);
  }

  const zipName = `KEQ-v${newVersion}.zip`;
  const zipPath = path.join(BUILDS_DIR, zipName);

  const confirm = await prompt(rl, `\nBuild ${bold(`v${newVersion}`)} → ${cyan(zipPath)}? [Y/n] `);
  rl.close();

  if (confirm.trim().toLowerCase() === 'n') {
    console.log(yellow('\nAborted.'));
    process.exit(0);
  }

  // ── Step 1: Update manifest ──────────────────────────────────────────────
  console.log(`\n${bold('[1/3]')} Updating manifest.json to v${newVersion}...`);
  manifest.version = newVersion;
  writeJSON(MANIFEST, manifest);
  console.log(green('  ✓ manifest.json updated'));

  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = readJSON(pkgPath);
  pkg.version = newVersion;
  writeJSON(pkgPath, pkg);
  console.log(green('  ✓ package.json updated'));

  // ── Step 2: Build ────────────────────────────────────────────────────────
  console.log(`\n${bold('[2/3]')} Running build...`);
  try {
    const out = execSync('npm run build', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    process.stdout.write(out.split('\n').map(l => '  ' + l).join('\n'));
    console.log(green('  ✓ Build complete'));
  } catch (err) {
    console.error(red('\nBuild failed:'));
    console.error(err.stdout || err.message);
    process.exit(1);
  }

  // ── Step 3: Zip ──────────────────────────────────────────────────────────
  console.log(`\n${bold('[3/3]')} Creating zip: ${cyan(zipName)}...`);
  fs.mkdirSync(BUILDS_DIR, { recursive: true });

  // Remove old zip with same name if it exists
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  // Build PowerShell compress command
  const items = PACK_ITEMS
    .filter(item => fs.existsSync(path.join(ROOT, item)))
    .map(item => path.join(ROOT, item));

  if (items.length === 0) {
    console.error(red('No items to pack!'));
    process.exit(1);
  }

  // Use PowerShell Compress-Archive with multiple sources
  const psItems = items.map(i => `"${i}"`).join(', ');
  const psCmd = `Compress-Archive -Path ${psItems} -DestinationPath "${zipPath}" -Force`;

  try {
    execSync(`powershell -NoProfile -Command "${psCmd.replace(/"/g, '\\"')}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: 'powershell.exe'
    });
  } catch (err) {
    // Fallback: try with escaped path
    try {
      execSync(`powershell -NoProfile -NonInteractive -Command ${JSON.stringify(psCmd)}`, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'inherit'
      });
    } catch (err2) {
      console.error(red('\nFailed to create zip:'));
      console.error(err2.message);
      process.exit(1);
    }
  }

  if (!fs.existsSync(zipPath)) {
    console.error(red(`\nZip not found at expected path: ${zipPath}`));
    process.exit(1);
  }

  const zipSizeKB = (fs.statSync(zipPath).size / 1024).toFixed(1);
  console.log(green(`  ✓ ${zipName} (${zipSizeKB} KB)`));

  // ── Save state ───────────────────────────────────────────────────────────
  saveState({
    version: newVersion,
    zipFile: zipPath,
    builtAt: new Date().toLocaleString(),
  });

  console.log(bold(green(`\nRelease v${newVersion} ready → ${zipPath}\n`)));
}

main().catch(err => {
  console.error(red('\nUnexpected error:'), err);
  process.exit(1);
});

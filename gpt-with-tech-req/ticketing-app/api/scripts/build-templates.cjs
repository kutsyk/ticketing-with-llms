#!/usr/bin/env node
/**
 * api/scripts/build-templates.cjs
 *
 * Compile all MJML templates from ./templates/emails/**.mjml
 * into ./public/emails/compiled/*.html
 *
 * Usage:
 *   node scripts/build-templates.cjs
 *   node scripts/build-templates.cjs --src templates/emails --out public/emails/compiled --minify
 */

const fs = require('fs');
const path = require('path');

let mjml;
try {
  mjml = require('mjml');
} catch (e) {
  console.error('❌ Missing dependency: "mjml". Install it with:');
  console.error('   npm i -D mjml');
  process.exit(1);
}

// --------------------------- CLI ---------------------------
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return def;
  if (hit.includes('=')) return hit.split('=')[1];
  const idx = args.indexOf(hit);
  const val = args[idx + 1];
  return !val || val.startsWith('--') ? def : val;
};

const SRC_DIR = path.resolve(getArg('src', 'templates/emails'));
const OUT_DIR = path.resolve(getArg('out', 'public/emails/compiled'));
const MINIFY = args.includes('--minify');

// ------------------------- Helpers -------------------------
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

/** Recursively collect all .mjml files under a directory */
function collectMjmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...collectMjmlFiles(full));
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.mjml')) {
      files.push(full);
    }
  }
  return files;
}

/** Compile a single MJML file and write to OUT_DIR preserving structure */
function compileOne(srcPath) {
  const rel = path.relative(SRC_DIR, srcPath); // e.g. "tickets/ticket-delivery.mjml"
  const outRel = rel.replace(/\.mjml$/i, '.html');
  const destPath = path.join(OUT_DIR, outRel);

  // Read MJML
  const mjmlSource = fs.readFileSync(srcPath, 'utf8');

  // Compile
  const { html, errors } = mjml(mjmlSource, {
    filePath: srcPath, // enables mj-include relative paths if used
    minify: MINIFY,
    validationLevel: 'strict',
    keepComments: false,
    beautify: !MINIFY
  });

  if (errors && errors.length) {
    console.error(`\n❌ MJML errors in ${srcPath}:`);
    for (const err of errors) {
      console.error(`  - ${err.formattedMessage || err.message || JSON.stringify(err)}`);
    }
    throw new Error(`MJML compilation failed for ${srcPath}`);
  }

  // Write HTML
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, html, 'utf8');
  return { srcPath, destPath };
}

// --------------------------- Main --------------------------
function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }
  ensureDir(OUT_DIR);

  const files = collectMjmlFiles(SRC_DIR);
  if (files.length === 0) {
    console.warn(`⚠️  No .mjml files found under: ${SRC_DIR}`);
    // Still exit 0 so CI doesn’t fail if templates are optional
    return;
  }

  console.log(`🛠  Compiling ${files.length} MJML template(s) → ${OUT_DIR} ${MINIFY ? '(minified)' : ''}`);

  let ok = 0;
  for (const f of files) {
    try {
      const { destPath } = compileOne(f);
      console.log(`✅ ${path.relative(process.cwd(), f)} → ${path.relative(process.cwd(), destPath)}`);
      ok++;
    } catch (e) {
      console.error(e.message || e);
      // Continue to compile others; track failures
    }
  }

  if (ok !== files.length) {
    const failed = files.length - ok;
    console.error(`\n❌ ${failed} template(s) failed to compile.`);
    process.exit(2);
  } else {
    console.log('🎉 All templates compiled successfully.');
  }
}

if (require.main === module) {
  main();
}

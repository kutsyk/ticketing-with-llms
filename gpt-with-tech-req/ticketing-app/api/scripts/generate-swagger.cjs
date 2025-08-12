#!/usr/bin/env node
/**
 * api/scripts/generate-swagger.cjs
 *
 * Generates a static OpenAPI 3.0 JSON file from JSDoc comments in:
 *  - pages/api/**/*.js
 *  - src/pages/api/**/*.js  (if you ever move under src/)
 *  - docs/**/*.js           (for shared components/schemas)
 *
 * Usage:
 *   node scripts/generate-swagger.cjs
 *   SERVER_URL=https://api.example.com node scripts/generate-swagger.cjs
 *   node scripts/generate-swagger.cjs --server https://api.example.com --out public/swagger.json
 */

const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

// ------------------------ CLI / ENV ------------------------
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const a = args.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!a) return fallback;
  if (a.includes('=')) return a.split('=')[1];
  const i = args.indexOf(a);
  return args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const SERVER_URL =
  process.env.SERVER_URL ||
  getArg('server', 'http://localhost:3000');

const OUT_FILE =
  getArg('out', 'public/swagger.json');

// ---------------------- Project Meta -----------------------
let pkgVersion = '1.0.0';
try {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );
  pkgVersion = pkg.version || pkgVersion;
} catch (_) {
  // ignore
}

// ---------------------- Swagger Options --------------------
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ticketing API',
      description:
        'API for user authentication, events, ticket purchasing, QR validation, seller/checker flows, and admin operations.',
      version: pkgVersion,
      contact: {
        name: 'Ticketing',
        url: 'https://example.com',
        email: 'support@example.com'
      }
    },
    servers: [{ url: SERVER_URL }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    path.join(process.cwd(), 'pages', 'api', '**', '*.js'),
    path.join(process.cwd(), 'src', 'pages', 'api', '**', '*.js'),
    path.join(process.cwd(), 'docs', '**', '*.js')
  ]
};

// ---------------------- Generate Spec ----------------------
const spec = swaggerJSDoc(options);

// Ensure pretty, stable key order
const json = JSON.stringify(spec, null, 2);

// Ensure output dir exists
const outAbs = path.isAbsolute(OUT_FILE)
  ? OUT_FILE
  : path.join(process.cwd(), OUT_FILE);

fs.mkdirSync(path.dirname(outAbs), { recursive: true });

// Write file
fs.writeFileSync(outAbs, json, 'utf8');

console.log(`✅ Swagger JSON generated at ${outAbs}`);
console.log(`   - Server: ${SERVER_URL}`);
console.log(`   - Paths:  ${Object.keys(spec.paths || {}).length}`);
console.log(`   - Tags:   ${Array.isArray(spec.tags) ? spec.tags.length : 0}`);

// Provide non-zero exit if empty (helps in CI)
if (!spec.paths || Object.keys(spec.paths).length === 0) {
  console.error('⚠️  No paths discovered. Ensure your JSDoc blocks use `@openapi` and globs are correct.');
  process.exitCode = 2;
}

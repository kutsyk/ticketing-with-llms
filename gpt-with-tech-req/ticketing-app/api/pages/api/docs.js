// pages/api/docs.js
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { createServer } from 'http';
import next from 'next';

// Load swagger.json or swagger.yaml from /public
function loadSwaggerDocument() {
  const jsonPath = path.join(process.cwd(), 'public', 'swagger.json');
  const yamlPath = path.join(process.cwd(), 'public', 'swagger.yaml');

  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } else if (fs.existsSync(yamlPath)) {
    return YAML.load(yamlPath);
  } else {
    throw new Error('Swagger definition file not found in public/');
  }
}

export const config = {
  api: {
    bodyParser: false, // swagger-ui-express will handle it
    externalResolver: true,
  },
};

export default function handler(req, res) {
  const swaggerDocument = loadSwaggerDocument();

  // We need to create a tiny express-like handler inside Next.js API route
  const express = require('express');
  const app = express();

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  return app(req, res);
}

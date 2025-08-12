// pages/api/docs.js
import path from 'path';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // No need to parse JSON body for this route
  },
};

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'swagger.json');
    const swaggerJson = fs.readFileSync(filePath, 'utf8');

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(swaggerJson);
  } catch (err) {
    console.error('Failed to read swagger.json:', err);
    res.status(500).json({ error: 'Unable to load API documentation' });
  }
}

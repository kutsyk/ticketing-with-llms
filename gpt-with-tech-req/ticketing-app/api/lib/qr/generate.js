// lib/qr/generate.js
// QR code generation utilities (PNG/SVG) for tickets.
// Uses a compact, versioned payload format: `TKT:<version>:<opaque|jwt>`
// PNG output includes a data URL (for inline email) and a Buffer (for files).

import QRCode from 'qrcode';

/** Default visual + ECC settings chosen for mobile scanners in dim venues */
const DEFAULTS = {
  width: 320,                 // good balance of detail and email size
  margin: 2,                  // quiet zone around code
  errorCorrectionLevel: 'Q',  // Q/H are robust; Q balances size
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
};

/**
 * Build the actual text payload that goes into the QR image.
 * Format: "TKT:<version>:<token-or-jwt>"
 * - `version` lets you rotate/alter payload semantics over time.
 * - `data` is either an opaque random token OR a signed JWT from payload.js.
 *
 * @param {{ data: string, version?: number }} p
 * @returns {string}
 */
export function buildQrText({ data, version = 1 }) {
  if (!data || typeof data !== 'string') {
    throw new Error('QR data must be a non-empty string');
  }
  return `TKT:${version}:${data}`;
}

/**
 * Generate a PNG QR code and return a Data URL string.
 * @param {string} text - text to encode
 * @param {Partial<typeof DEFAULTS>} [opts]
 * @returns {Promise<string>} data:image/png;base64,...
 */
export async function toDataUrlPng(text, opts = {}) {
  const options = { ...DEFAULTS, ...opts };
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    width: options.width,
    color: options.color
  });
}

/**
 * Generate a PNG QR code and return a Buffer (raw PNG bytes).
 * @param {string} text
 * @param {Partial<typeof DEFAULTS>} [opts]
 * @returns {Promise<Buffer>}
 */
export async function toPngBuffer(text, opts = {}) {
  const options = { ...DEFAULTS, ...opts };
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    width: options.width,
    color: options.color,
    type: 'png'
  });
}

/**
 * Generate an SVG QR code string.
 * @param {string} text
 * @param {Partial<typeof DEFAULTS>} [opts]
 * @returns {Promise<string>} raw <svg>...</svg>
 */
export async function toSvgString(text, opts = {}) {
  const options = { ...DEFAULTS, ...opts };
  return QRCode.toString(text, {
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    width: options.width,
    color: options.color,
    type: 'svg'
  });
}

/**
 * Generate a QR for a ticket from an opaque token or JWT.
 * Returns PNG Data URL + Buffer by default (best for emails and attachment files),
 * or SVG string if requested.
 *
 * @param {{
 *   token?: string,           // opaque random token (recommended)
 *   jwt?: string,             // alternatively, a signed JWT payload
 *   version?: number,         // qr_version (rotate over time)
 *   format?: 'png'|'svg',
 *   width?: number,
 *   margin?: number,
 *   errorCorrectionLevel?: 'L'|'M'|'Q'|'H',
 *   color?: { dark?: string, light?: string }
 * }} p
 * @returns {Promise<
 *   | { format: 'png', dataUrl: string, buffer: Buffer, text: string }
 *   | { format: 'svg', svg: string, text: string }
 * >}
 */
export async function generateTicketQr(p = {}) {
  const {
    token,
    jwt,
    version = 1,
    format = 'png',
    width,
    margin,
    errorCorrectionLevel,
    color
  } = p;

  const data = jwt || token;
  if (!data) {
    throw new Error('generateTicketQr: either `token` or `jwt` is required');
  }
  const text = buildQrText({ data, version });

  const opts = { width, margin, errorCorrectionLevel, color };

  if (format === 'svg') {
    const svg = await toSvgString(text, opts);
    return { format: 'svg', svg, text };
  }

  // Default PNG flow for email-friendly outputs
  const dataUrl = await toDataUrlPng(text, opts);
  const base64 = dataUrl.split(',')[1] || '';
  const buffer = Buffer.from(base64, 'base64');
  return { format: 'png', dataUrl, buffer, text };
}

/**
 * Convenience: turn a PNG data URL into a Nodemailer attachment for inline embedding.
 * Use `cid` in your HTML as <img src="cid:..."> to reference it.
 *
 * @param {{ dataUrl: string, cid: string, filename?: string }} p
 * @returns {{ filename: string, cid: string, content: Buffer, contentType: string }}
 */
export function inlineAttachmentFromDataUrl({ dataUrl, cid, filename = 'ticket-qr.png' }) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    throw new Error('Invalid data URL for QR inline attachment');
  }
  const contentType = match[1];
  const base64 = match[2];
  return {
    filename,
    cid,
    content: Buffer.from(base64, 'base64'),
    contentType
  };
}

/**
 * Convenience: build a download-friendly (non-inline) PNG attachment from Buffer.
 * @param {{ buffer: Buffer, filename?: string }} p
 * @returns {{ filename: string, content: Buffer, contentType: string }}
 */
export function fileAttachmentFromBuffer({ buffer, filename = 'ticket-qr.png' }) {
  return {
    filename,
    content: buffer,
    contentType: 'image/png'
  };
}

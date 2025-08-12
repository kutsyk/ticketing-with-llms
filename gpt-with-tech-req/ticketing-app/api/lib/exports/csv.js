// lib/exports/csv.js
// Utility to export data arrays as CSV strings or streams.

import { stringify } from 'csv-stringify/sync';

/**
 * Export an array of objects to CSV string.
 * Automatically infers columns from the first object if not provided.
 *
 * @param {Array<Object>} rows - Array of records to export
 * @param {string[]} [columns] - Optional list of column keys to export (in order)
 * @param {Object} [options] - Additional CSV options
 * @param {boolean} [options.header=true] - Whether to include a header row
 * @returns {string} CSV data
 */
export function exportToCsv(rows, columns, options = {}) {
  if (!Array.isArray(rows)) {
    throw new Error('rows must be an array');
  }
  if (rows.length === 0) {
    return '';
  }

  const inferredColumns = columns || Object.keys(rows[0]);
  const csv = stringify(rows, {
    header: options.header !== false,
    columns: inferredColumns,
    quoted: true,
    quoted_empty: true
  });

  return csv;
}

/**
 * Send CSV as HTTP response with proper headers.
 * @param {Object} res - Express/Next.js response object
 * @param {string} filename - Name of the CSV file
 * @param {Array<Object>} rows - Array of records
 * @param {string[]} [columns] - Optional list of column keys
 */
export function sendCsvResponse(res, filename, rows, columns) {
  const csv = exportToCsv(rows, columns);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}

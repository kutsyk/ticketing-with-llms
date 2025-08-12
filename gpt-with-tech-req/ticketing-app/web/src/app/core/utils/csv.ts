// web/src/app/core/utils/csv.ts

/**
 * Converts an array of objects to a CSV string.
 * @param data - Array of objects
 * @param delimiter - Optional CSV delimiter (default: ',')
 */
export function toCSV(data: Record<string, any>[], delimiter = ','): string {
  if (!data || !data.length) {
    return '';
  }

  const keys = Object.keys(data[0]);
  const header = keys.join(delimiter);
  const rows = data.map(row =>
    keys
      .map(key => {
        let cell = row[key] ?? '';
        if (typeof cell === 'string' && (cell.includes(delimiter) || cell.includes('"'))) {
          cell = `"${cell.replace(/"/g, '""')}"`; // Escape quotes
        }
        return cell;
      })
      .join(delimiter)
  );

  return [header, ...rows].join('\n');
}

/**
 * Triggers a CSV file download in the browser.
 * @param filename - Name of the file (e.g., 'export.csv')
 * @param data - Array of objects to export
 */
export function downloadCSV(filename: string, data: Record<string, any>[]): void {
  const csvContent = toCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

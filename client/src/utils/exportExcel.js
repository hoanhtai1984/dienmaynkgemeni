import * as XLSX from 'xlsx';

/**
 * Builds and downloads a real .xlsx file from plain-object rows.
 * `sheets`: array of { name, rows } - each `rows` entry's object keys become
 * the column headers (in insertion order), so callers should build rows with
 * Vietnamese-labeled keys directly (e.g. { 'Tên sản phẩm': p.name }).
 */
export function exportToExcel(filename, sheets) {
  const workbook = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const sheet = XLSX.utils.json_to_sheet(rows);
    // Excel sheet names are capped at 31 chars and can't contain []:*?/\
    const safeName = name.slice(0, 31).replace(/[[\]:*?/\\]/g, ' ');
    XLSX.utils.book_append_sheet(workbook, sheet, safeName);
  }
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

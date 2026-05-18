import { Injectable } from '@angular/core';

export type CsvCell = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  export(filename: string, headers: string[], rows: CsvCell[][]): void {
    const csv = [
      headers,
      ...rows
    ].map((row) => row.map((cell) => this.escapeCell(cell)).join(',')).join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeCell(cell: CsvCell): string {
    const value = String(cell ?? '');
    if (!/[",\r\n]/.test(value)) {
      return value;
    }

    return `"${value.replaceAll('"', '""')}"`;
  }
}

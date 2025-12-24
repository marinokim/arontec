
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '배송상품샘플 - 2025-12-24-182944.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const range = XLSX.utils.decode_range(sheet['!ref']);

    // Get headers (first row)
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
        headers.push(cell ? cell.v : `UNKNOWN_${C}`);
    }

    // Get first data row (row 2, index 1)
    const firstRow = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 1, c: C })];
        firstRow.push(cell ? cell.v : '');
    }

    const result = {
        sheetName,
        headers,
        firstRow
    };

    fs.writeFileSync(path.join(__dirname, 'analysis_result.txt'), JSON.stringify(result, null, 2));
    console.log('Analysis saved to analysis_result.txt');

} catch (error) {
    console.error('Error analyzing Excel:', error);
}

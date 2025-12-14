
import XLSX from 'xlsx';
import path from 'path';

const files = [
    'excel/aron_product_upload.xlsx',
    'excel/귀빈정 5.xls'
];

files.forEach(file => {
    try {
        const wb = XLSX.readFile(file);
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];

        // Get headers (first row)
        const headers = [];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
            headers.push(cell ? cell.v : `UNKNOWN_${C}`);
        }

        console.log(`\n=== Headers for ${path.basename(file)} ===`);
        console.log(headers.join(' | '));

        // Print first row of data to understand context
        const firstRow = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = sheet[XLSX.utils.encode_cell({ r: 1, c: C })];
            firstRow.push(cell ? cell.v : '');
        }
        console.log(`-- Sample Data --`);
        console.log(firstRow.join(' | '));

    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});

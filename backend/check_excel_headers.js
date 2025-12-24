const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../excel/aron_product_upload_consolidated.xlsx');
console.log('Reading file:', filePath);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Get raw array of arrays

if (data.length > 0) {
    console.log('Headers:', JSON.stringify(data[0]));
} else {
    console.log('Empty file');
}


import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const SRC_DIR = 'excel/홈페이지 (2)';
const OUTPUT_FILE = 'excel/aron_product_upload_consolidated.xlsx';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        // Skip hidden files
        if (file.startsWith('.') || file.startsWith('~$')) return;

        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.xls') || file.endsWith('.xlsx')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

function mapRow(row, category, fileName) {
    // Helper to clean strings
    const clean = (val) => val ? String(val).trim() : '';
    // Helper to parse price (remove commas, currency symbols)
    const parsePrice = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
    };

    // Mapping Strategy based on header analysis
    // Source Headers: 상품명, 상품이미지, 설명, 제조원, 원산지, 카톤\n입수량, 소비자가, 공급가, 개별배송비, 대표이미지, 상세이미지, 비고

    // Check key variations due to newlines
    const getVal = (possibleKeys) => {
        for (const k of possibleKeys) {
            for (const rowKey in row) {
                if (rowKey.includes(k)) return row[rowKey];
            }
        }
        return '';
    };

    return {
        'SourceFile': path.basename(fileName).normalize('NFC'),
        'Brand': clean(getVal(['제조원'])), // Use Manufacturer as Brand default
        'ModelName': clean(getVal(['상품명'])),
        'ModelNo': '', // No data
        'Category': category, // From folder structure
        'Description': clean(getVal(['설명'])),
        'B2BPrice': parsePrice(getVal(['공급가'])),
        'SupplyPrice': parsePrice(getVal(['공급가'])),
        'ConsumerPrice': parsePrice(getVal(['소비자가'])),
        'Stock': 999, // Default
        'ImageURL': clean(getVal(['대표이미지'])),
        'DetailURL': clean(getVal(['상세이미지'])),
        'Manufacturer': clean(getVal(['제조원'])),
        'Origin': clean(getVal(['원산지'])),
        'ProductSpec': '',
        'ProductOptions': '', // Could parse from Description if smart, but keep simple
        'IsTaxFree': 'False',
        'QuantityPerCarton': clean(getVal(['입수량', '카톤'])),
        'ShippingFeeIndividual': parsePrice(getVal(['개별배송비'])),
        'ShippingFeeCarton': 0, // Not explicitly in source usually
        'remark': clean(getVal(['비고']))
    };
}

function run() {
    try {
        console.log(`🔍 Scanning directory: ${SRC_DIR}`);
        const files = getAllFiles(SRC_DIR);
        console.log(`Found ${files.length} Excel files.`);

        let allProducts = [];

        files.forEach(filePath => {
            console.log(`Processing: ${path.basename(filePath)}`);
            try {
                // Determine Category from Parent Folder Name
                // e.g. excel/homepage/food/file.xls -> food
                const parentDir = path.basename(path.dirname(filePath));
                // Map common folder names to readable Categories if needed (e.g. food -> Food)
                const category = parentDir.charAt(0).toUpperCase() + parentDir.slice(1);

                const wb = XLSX.readFile(filePath);

                wb.SheetNames.forEach(sheetName => {
                    const sheet = wb.Sheets[sheetName];

                    // Convert to array of arrays first to find header row
                    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    // Find row index containing "상품명"
                    let headerRowIndex = -1;
                    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
                        if (rawData[i] && rawData[i].some(cell => cell && String(cell).includes('상품명'))) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    if (headerRowIndex === -1) {
                        // console.log(`Skipping sheet ${sheetName} in ${path.basename(filePath)}: No '상품명' header found`);
                        return;
                    }

                    // Re-parse with correct header row
                    // range: headerRowIndex means start from that row
                    const range = XLSX.utils.decode_range(sheet['!ref']);
                    range.s.r = headerRowIndex;
                    const newOptions = { range: range };
                    const data = XLSX.utils.sheet_to_json(sheet, newOptions);

                    data.forEach(row => {
                        // Double check if it's a valid row
                        if (!row['상품명'] && !Object.keys(row).some(k => k.includes('상품명'))) return;

                        const mapped = mapRow(row, category, filePath);
                        allProducts.push(mapped);
                    });
                });

            } catch (err) {
                console.error(`❌ Error converting ${filePath}:`, err.message);
            }
        });

        console.log(`\n✅ Consolidation Complete. Total Products: ${allProducts.length}`);

        // Create Output Workbook using Template Headers
        // Brand | ModelName | ModelNo | Category | Description | B2BPrice ...
        const newSheet = XLSX.utils.json_to_sheet(allProducts, {
            header: [
                'SourceFile', 'Brand', 'ModelName', 'ModelNo', 'Category', 'Description',
                'B2BPrice', 'SupplyPrice', 'ConsumerPrice', 'Stock',
                'ImageURL', 'DetailURL', 'Manufacturer', 'Origin',
                'ProductSpec', 'ProductOptions', 'IsTaxFree',
                'QuantityPerCarton', 'ShippingFeeIndividual', 'ShippingFeeCarton', 'remark'
            ]
        });

        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, newSheet, "Consolidated Products");

        XLSX.writeFile(newWb, OUTPUT_FILE);
        console.log(`💾 Saved to: ${OUTPUT_FILE}`);

    } catch (err) {
        console.error("Fatal Error:", err);
    }
}

run();

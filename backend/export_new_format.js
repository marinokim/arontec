
import pg from 'pg';
import XLSX from 'xlsx';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const OUTPUT_FILE = path.join(__dirname, '../products_export_delivery_sample.xlsx');

const HEADERS = [
    "상품코드(신규등록시 생략)",
    "대표상품명",
    "부가상품명",
    "1차 분류",
    "2차 분류",
    "3차 분류",
    "타임세일설정(적용, 미적용)",
    "타임세일 시작일",
    "타임세일 시작시간",
    "타임세일 종료일",
    "타임세일 종료시간",
    "판매설정(상시판매, 기간판매)",
    "판매시작일(기간판매)",
    "판매종료일(기간판매)",
    "브랜드",
    "과세여부(과세, 면세)",
    "정상가",
    "판매가",
    "네이버페이 사용유무(사용, 미사용)",
    "재고량",
    "제조사",
    "원산지",
    "1회 최소 구매개수",
    "구매 단위",
    "1회 최대 구매개수",
    "중복구매 가능여부(가능, 불가능)",
    "배송정보",
    "배송처리(기본, 상품별배송, 개별배송, 무료배송)",
    "개별배송 - 배송비",
    "상품별배송 - 배송비(기본배송비)",
    "상품별배송 - 배송비(무료배송비)",
    "관련상품 적용방식(사용안함, 자동지정, 수동지정)",
    "관련상품 상품코드(수동지정시 상품코드를|로 구분하여 기입)",
    "상품설명(엔터제외)",
    "목록이미지",
    "목록오버이미지",
    "상세이미지1",
    "상세이미지2",
    "상세이미지3",
    "상세이미지4",
    "상세이미지5",
    "옵션사용여부(사용안함,1차옵션,2차옵션,3차옵션)",
    "옵션(옵션명|공급가|판매가|재고§옵션명2|공급가2|판매가2|재고2)",
    "1차 옵션 타이틀",
    "2차 옵션 타이틀",
    "3차 옵션 타이틀"
];

async function run() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        // Fetch products with category names
        const query = `
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id ASC
        `;
        const res = await client.query(query);
        const products = res.rows;
        client.release();

        console.log(`Fetched ${products.length} products.`);

        const exportData = products.map(p => {
            // Logic to format Detail URL
            let detailHtml = '';
            if (p.detail_url) {
                const val = p.detail_url.trim();
                // Helper to wrap in centered div
                const wrapCenter = (html) => `<div style="text-align: center;" align="center">${html}</div>`;

                // Check if it looks like HTML containing images
                if (val.includes('<img') || val.includes('<div')) {
                    // Extract all src attributes
                    const srcRegex = /src=["']([^"']+)["']/g;
                    let match;
                    let images = [];
                    while ((match = srcRegex.exec(val)) !== null) {
                        images.push(match[1]);
                    }

                    if (images.length > 0) {
                        // Rebuild as simple img tags without div wrappers
                        const imgs = images.map(u => `<img src="${u.trim()}">`).join('');
                        detailHtml = wrapCenter(imgs);
                    } else {
                        // Fallback: just remove newlines if no img tags found but looks like HTML
                        detailHtml = val.replace(/(\r\n|\n|\r)/gm, "");
                    }
                } else if (val.startsWith('http')) {
                    // Simple URL (comma or newline separated?)
                    // Split by newlines or commas just in case
                    const urls = val.split(/[,\r\n]+/).filter(u => u.trim());
                    const imgs = urls.map(u => `<img src="${u.trim()}">`).join('');
                    detailHtml = wrapCenter(imgs);
                } else {
                    detailHtml = val;
                }
            }

            // Logic for Shipping
            // If individual shipping fee exists and > 0, use '개별배송'
            // Otherwise use '기본' (or whatever default)
            let shippingType = '기본';
            let individualFee = '';
            if (p.shipping_fee_individual && Number(p.shipping_fee_individual) > 0) {
                shippingType = '개별배송';
                individualFee = p.shipping_fee_individual;
            } else if (p.shipping_fee_individual === 0) {
                shippingType = '무료배송';
            }

            const mappedItem = {
                "상품코드(신규등록시 생략)": "",
                "대표상품명": p.model_name || p.name,
                "부가상품명": p.model_no || '',
                "1차 분류": p.category_name || '기타',
                "2차 분류": "",
                "3차 분류": "",
                "타임세일설정(적용, 미적용)": "미적용",
                "타임세일 시작일": "",
                "타임세일 시작시간": "",
                "타임세일 종료일": "",
                "타임세일 종료시간": "",
                "판매설정(상시판매, 기간판매)": "상시판매",
                "판매시작일(기간판매)": "",
                "판매종료일(기간판매)": "",
                "브랜드": p.manufacturer || p.brand || "", // Map Manufacturer to Brand column if Brand is empty
                "과세여부(과세, 면세)": p.is_tax_free ? "면세" : "과세",
                "정상가": p.consumer_price || 0,
                "판매가": p.b2b_price || p.supply_price || 0, // Use B2B Price as Sales Price
                "네이버페이 사용유무(사용, 미사용)": "사용",
                "재고량": p.stock_quantity || 999,
                "제조사": p.manufacturer || "",
                "원산지": p.origin || "",
                "1회 최소 구매개수": 1,
                "구매 단위": 1,
                "1회 최대 구매개수": p.quantity_per_carton || "", // Determine max buy? Or keep empty? User sample had '1'. 
                "중복구매 가능여부(가능, 불가능)": "가능",
                "배송정보": "", // Policy info?
                "배송처리(기본, 상품별배송, 개별배송, 무료배송)": shippingType,
                "개별배송 - 배송비": individualFee,
                "상품별배송 - 배송비(기본배송비)": "",
                "상품별배송 - 배송비(무료배송비)": "",
                "관련상품 적용방식(사용안함, 자동지정, 수동지정)": "자동지정",
                "관련상품 상품코드(수동지정시 상품코드를|로 구분하여 기입)": "",
                "상품설명(엔터제외)": detailHtml,
                "목록이미지": p.image_url || "",
                "목록오버이미지": "",
                "상세이미지1": "",
                "상세이미지2": "",
                "상세이미지3": "",
                "상세이미지4": "",
                "상세이미지5": "",
                "옵션사용여부(사용안함,1차옵션,2차옵션,3차옵션)": "사용안함",
                "옵션(옵션명|공급가|판매가|재고§옵션명2|공급가2|판매가2|재고2)": "",
                "1차 옵션 타이틀": "",
                "2차 옵션 타이틀": "",
                "3차 옵션 타이틀": ""
            };



            // Price Calculation: Arontec Supply Price * 1.1
            const baseSupplyPrice = Number(p.supply_price) || 0;
            const finalSellPrice = Math.floor(baseSupplyPrice * 1.1);

            // Override '판매가' with calculated price
            mappedItem["판매가"] = finalSellPrice;

            // Option Handling
            if (p.product_options && p.product_options.trim()) {
                const opts = p.product_options.split(',').map(s => s.trim()).filter(s => s);
                if (opts.length > 0) {
                    // Option Format: OptionName|SupplyPrice(0)|SellPrice|Stock
                    // SellPrice = finalSellPrice
                    const stock = p.stock_quantity || 999;

                    const optionString = opts.map(opt => `${opt}|0|${finalSellPrice}|${stock}`).join('§');

                    mappedItem["옵션사용여부(사용안함,1차옵션,2차옵션,3차옵션)"] = "1차옵션";
                    mappedItem["옵션(옵션명|공급가|판매가|재고§옵션명2|공급가2|판매가2|재고2)"] = optionString;
                    mappedItem["1차 옵션 타이틀"] = "색상";

                }
            }

            return mappedItem;
        });

        const newSheet = XLSX.utils.json_to_sheet(exportData, { header: HEADERS });
        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, newSheet, "배송상품등록");

        XLSX.writeFile(newWb, OUTPUT_FILE);
        console.log(`✅ Successfully exported ${exportData.length} products to ${OUTPUT_FILE}`);
        process.exit(0);

    } catch (err) {
        console.error("Error exporting:", err);
        process.exit(1);
    }
}

run();

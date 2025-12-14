
import pg from 'pg';
import XLSX from 'xlsx';
import path from 'path';

const { Pool } = pg;

// Supabase Connection
const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

const FILE_PATH = 'excel/aron_product_upload_consolidated.xlsx';
const LIMIT = 10000; // Import ALL products (High limit)

async function run() {
    const client = await pool.connect();
    try {
        console.log("🛠 Connecting to Database...");

        // 1. Ensure Table Structure (Add 'detail_url' if missing)
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'detail_url') THEN 
                    ALTER TABLE products ADD COLUMN detail_url TEXT; 
                END IF; 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'remarks') THEN 
                    ALTER TABLE products ADD COLUMN remarks TEXT; 
                END IF; 
            END $$;
        `);
        console.log("✅ Verified Schema (Added detail_url if missing)");

        // 2. Read Excel
        console.log(`📂 Reading Excel: ${FILE_PATH}`);
        const wb = XLSX.readFile(FILE_PATH);
        const sheet = wb.Sheets[wb.SheetNames[0]]; // Final file has 1 sheet
        const allData = XLSX.utils.sheet_to_json(sheet);

        const dataToUpload = allData.slice(0, LIMIT);
        console.log(`📊 Processing first ${dataToUpload.length} items...`);

        // 3. Cache Categories
        const catRes = await client.query("SELECT id, name FROM categories");
        const categoryMap = {}; // Name -> ID
        catRes.rows.forEach(r => categoryMap[r.name] = r.id);

        let successCount = 0;
        let errorCount = 0;

        // 4. Insert Data
        for (const row of dataToUpload) {
            try {
                // Resolve Category
                let catId = categoryMap[row.Category];
                if (!catId) {
                    // Create Category if missing
                    const newCat = await client.query(
                        "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id",
                        [row.Category, row.Category.toLowerCase().replace(/[^a-z0-9]/g, '-')]
                    );
                    catId = newCat.rows[0].id;
                    categoryMap[row.Category] = catId;
                    console.log(`   + Created Category: ${row.Category}`);
                }

                // Insert Product
                await client.query(`
                    INSERT INTO products (
                        category_id, brand, model_name, model_no, description, 
                        b2b_price, stock_quantity, image_url, detail_url,
                        manufacturer, origin, is_tax_free, 
                        shipping_fee_individual, shipping_fee_carton, 
                        product_spec, product_options, remarks,
                        consumer_price, supply_price, quantity_per_carton
                    ) VALUES (
                        $1, $2, $3, $4, $5, 
                        $6, $7, $8, $9,
                        $10, $11, $12, 
                        $13, $14, 
                        $15, $16, $17,
                        $18, $19, $20
                    )
                `, [
                    catId,
                    row.Brand || row.Manufacturer || 'Unknown',
                    row.ModelName,
                    row.ModelNo || '',
                    row.Description || '',
                    row.B2BPrice || 0,
                    row.Stock || 999,
                    row.ImageURL || '',
                    row.DetailURL || '',
                    row.Manufacturer || '',
                    row.Origin || '',
                    (row.IsTaxFree === 'True' || row.IsTaxFree === true),
                    row.ShippingFeeIndividual || 0,
                    row.ShippingFeeCarton || 0,
                    row.ProductSpec || '',
                    row.ProductOptions || '',
                    row.remark || '',
                    row.ConsumerPrice || 0,
                    row.SupplyPrice || 0,
                    row.QuantityPerCarton || 0
                ]);
                successCount++;
                // console.log(`   ✓ Inserted: ${row.ModelName}`);
            } catch (err) {
                console.error(`   ❌ Failed: ${row.ModelName} - ${err.message}`);
                errorCount++;
            }
        }

        console.log(`\n🎉 Import Complete!`);
        console.log(`   Success: ${successCount}`);
        console.log(`   Failed:  ${errorCount}`);

    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();

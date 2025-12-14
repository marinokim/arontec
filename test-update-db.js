
import pg from 'pg';
const { Pool } = pg;

// Supabase Connection
const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        console.log("🛠 Testing Update Query...");

        // Target Product ID (use one existing from previous check, e.g. 64)
        const id = 64;

        // Params based on the FIXED query in products.js
        // 24 params total
        const params = [
            2, // category_id (assume valid)
            'Test Brand',
            'Test Model',
            'Test Desc',
            'http://test.com/img.jpg',
            10000,
            99,
            true,
            'http://detail',
            20000,
            15000,
            10,
            // manufacturer ($13)
            'Test Maker',
            // origin ($14)
            'Korea',
            // is_tax_free ($15)
            false,
            // shipping_fee_individual ($16)
            3000,
            // shipping_fee_carton ($17)
            0,
            // product_options ($18)
            'Option A',
            // model_no ($19)
            'TM-001',
            // remarks ($20)
            'Test Remark',
            // display_order ($21)
            0,
            // product_spec ($22)
            'Spec',
            // is_new ($23)
            false,
            // ID ($24)
            id
        ];

        const query = `UPDATE products 
       SET category_id = $1, brand = $2, model_name = $3, description = $4, 
           image_url = $5, b2b_price = $6, stock_quantity = $7, is_available = $8, detail_url = $9, 
           consumer_price = $10, supply_price = $11, quantity_per_carton = $12,
           manufacturer = $13, origin = $14, is_tax_free = $15,
           shipping_fee_individual = $16, shipping_fee_carton = $17, product_options = $18, model_no = $19,
           remarks = $20, display_order = $21, product_spec = $22, is_new = $23,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $24
       RETURNING *`;

        const result = await client.query(query, params);

        console.log("✅ Update Success!");
        console.log("Updated Row:", result.rows[0]);

    } catch (err) {
        console.error("❌ Update Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();

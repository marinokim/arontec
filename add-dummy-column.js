
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        console.log("🛠 Adding dummy shipping_fee column...");

        await client.query(`
            DO $$ 
            BEGIN 
                -- Add shipping_fee to prevent errors in old backend code
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shipping_fee') THEN 
                    ALTER TABLE products ADD COLUMN shipping_fee INTEGER DEFAULT 0; 
                    RAISE NOTICE 'Added shipping_fee';
                END IF; 
            END $$;
        `);
        console.log("✅ Schema Emergency Fix Complete");

    } catch (err) {
        console.error("❌ Schema Fix Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();

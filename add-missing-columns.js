
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        console.log("🛠 Adding missing columns...");

        await client.query(`
            DO $$ 
            BEGIN 
                -- Add consumer_price
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'consumer_price') THEN 
                    ALTER TABLE products ADD COLUMN consumer_price DECIMAL(12, 2); 
                    RAISE NOTICE 'Added consumer_price';
                END IF; 

                -- Add supply_price
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supply_price') THEN 
                    ALTER TABLE products ADD COLUMN supply_price DECIMAL(12, 2); 
                    RAISE NOTICE 'Added supply_price';
                END IF;

                -- Add quantity_per_carton
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'quantity_per_carton') THEN 
                    ALTER TABLE products ADD COLUMN quantity_per_carton INTEGER; 
                    RAISE NOTICE 'Added quantity_per_carton';
                END IF;
            END $$;
        `);
        console.log("✅ Schema Update Complete");

    } catch (err) {
        console.error("❌ Schema Update Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();

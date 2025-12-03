
import pool from './config/database.js';

const addColumns = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Add consumer_price
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='consumer_price') THEN
                    ALTER TABLE products ADD COLUMN consumer_price DECIMAL(12, 2);
                END IF;
            END $$;
        `);

        // Add supply_price
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='supply_price') THEN
                    ALTER TABLE products ADD COLUMN supply_price DECIMAL(12, 2);
                END IF;
            END $$;
        `);

        // Add quantity_per_carton
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='quantity_per_carton') THEN
                    ALTER TABLE products ADD COLUMN quantity_per_carton INTEGER;
                END IF;
            END $$;
        `);

        // Add shipping_fee
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='shipping_fee') THEN
                    ALTER TABLE products ADD COLUMN shipping_fee DECIMAL(12, 2) DEFAULT 0;
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('Columns added successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding columns:', error);
    } finally {
        client.release();
        process.exit();
    }
};

addColumns();

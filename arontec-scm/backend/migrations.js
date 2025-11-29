
import pool from './config/database.js'

export const runMigrations = async () => {
    try {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // Add manufacturer column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'manufacturer') THEN 
                        ALTER TABLE products ADD COLUMN manufacturer VARCHAR(255); 
                    END IF; 
                END $$;
            `)

            // Add origin column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'origin') THEN 
                        ALTER TABLE products ADD COLUMN origin VARCHAR(255); 
                    END IF; 
                END $$;
            `)

            // Add slug column to categories if missing
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN 
                        ALTER TABLE categories ADD COLUMN slug VARCHAR(100); 
                        UPDATE categories SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
                        ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
                        ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
                    END IF; 
                END $$;
            `)

            // Add is_tax_free column to products if missing
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_tax_free') THEN 
                        ALTER TABLE products ADD COLUMN is_tax_free BOOLEAN DEFAULT FALSE; 
                    END IF; 
                END $$;
            `)

            // Add shipping_fee_individual column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shipping_fee_individual') THEN 
                        ALTER TABLE products ADD COLUMN shipping_fee_individual INTEGER DEFAULT 0; 
                    END IF; 
                END $$;
            `)

            // Add shipping_fee_carton column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shipping_fee_carton') THEN 
                        ALTER TABLE products ADD COLUMN shipping_fee_carton INTEGER DEFAULT 0; 
                    END IF; 
                END $$;
            `)

            // Add product_options column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_options') THEN 
                        ALTER TABLE products ADD COLUMN product_options TEXT; 
                    END IF; 
                END $$;
            `)

            await client.query('COMMIT')
            console.log('✅ Database migrations completed successfully')
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('❌ Migration error:', error)
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('❌ Database connection error during migration:', error)
    }
}

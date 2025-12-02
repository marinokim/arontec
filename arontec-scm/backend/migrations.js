
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

            // Add model_no column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_no') THEN 
                        ALTER TABLE products ADD COLUMN model_no VARCHAR(255); 
                    END IF; 
                END $$;
            `)

            // Sanitize existing text fields (remove double quotes)
            await client.query(`
                UPDATE products 
                SET 
                    description = REPLACE(description, '"', ''),
                    model_name = REPLACE(model_name, '"', ''),
                    model_no = REPLACE(model_no, '"', ''),
                    manufacturer = REPLACE(manufacturer, '"', ''),
                    origin = REPLACE(origin, '"', ''),
                    remarks = REPLACE(remarks, '"', ''),
                    product_options = REPLACE(product_options, '"', '')
                WHERE 
                    description LIKE '%"%' OR
                    model_name LIKE '%"%' OR
                    model_no LIKE '%"%' OR
                    manufacturer LIKE '%"%' OR
                    origin LIKE '%"%' OR
                    remarks LIKE '%"%' OR
                    product_options LIKE '%"%';
            `)

            // Update carts table to support options
            await client.query(`
                DO $$ 
                BEGIN 
                    -- Add option column if missing
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carts' AND column_name = 'option') THEN 
                        ALTER TABLE carts ADD COLUMN option VARCHAR(255) DEFAULT ''; 
                    END IF;

                    -- Drop old unique constraint if exists
                    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_user_id_product_id_key') THEN
                        ALTER TABLE carts DROP CONSTRAINT carts_user_id_product_id_key;
                    END IF;

                    -- Add new unique constraint including option
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_user_id_product_id_option_key') THEN
                        ALTER TABLE carts ADD CONSTRAINT carts_user_id_product_id_option_key UNIQUE (user_id, product_id, option);
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

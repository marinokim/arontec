
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

            // Add display_order column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'display_order') THEN 
                        ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0; 
                    END IF; 
                END $$;
            `)

            // Add product_spec column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_spec') THEN 
                        ALTER TABLE products ADD COLUMN product_spec TEXT; 
                    END IF; 
                END $$;
            `)

            // Add is_new column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_new') THEN 
                        ALTER TABLE products ADD COLUMN is_new BOOLEAN DEFAULT FALSE; 
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

            // Set correct business number for admin
            await client.query(`
                UPDATE users 
                SET business_number = '1078660486' 
                WHERE email = 'admin@arontec.com';
            `)

            // Delete specific users as requested - REMOVED
            /*
            await client.query(`
                DELETE FROM users 
                WHERE company_name IN ('(주)갑을', '(주)마인드케이');
            `)
            */

            // Force delete test accounts and related data - REMOVED
            // const targetEmails = ['twovol@naver.com', 'twovol@gmail.com']

            // for (const email of targetEmails) {
            //     // Get user ID
            //     const userRes = await client.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email])
            //     if (userRes.rows.length > 0) {
            //         const userId = userRes.rows[0].id

            //         // Delete related data
            //         await client.query("DELETE FROM quote_items WHERE quote_id IN (SELECT id FROM quotes WHERE user_id = $1)", [userId])
            //         await client.query("DELETE FROM quotes WHERE user_id = $1", [userId])
            //         await client.query("DELETE FROM carts WHERE user_id = $1", [userId])
            //         await client.query("DELETE FROM notifications WHERE user_id = $1", [userId])

            //         // Delete user
            //         await client.query("DELETE FROM users WHERE id = $1", [userId])
            //         console.log(`Deleted user ${email} and related data`)
            //     }
            // }

            // Create notifications table
            await client.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `)

            // Create proposal_history table
            await client.query(`
                CREATE TABLE IF NOT EXISTS proposal_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    title VARCHAR(255),
                    items JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
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

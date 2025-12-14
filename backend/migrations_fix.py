
import pg8000.native
import ssl

def run_migration():
    # Connection details
    # postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
    user = "postgres.zgqnhbaztgpekerhxwbc"
    password = "gmlrhks0528&*" 
    host = "aws-1-ap-northeast-2.pooler.supabase.com"
    port = 5432
    database = "postgres"

    # Create SSL context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print("Connecting to database...")
    try:
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
        
        print("Starting migration...")
        con.run("BEGIN")

        # SQL block
        sql = """
            DO $$
            BEGIN
                -- shipping_fee_individual (DECIMAL)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='shipping_fee_individual') THEN
                    ALTER TABLE products ADD COLUMN shipping_fee_individual DECIMAL(12, 2) DEFAULT 0;
                END IF;

                -- shipping_fee_carton (DECIMAL)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='shipping_fee_carton') THEN
                    ALTER TABLE products ADD COLUMN shipping_fee_carton DECIMAL(12, 2) DEFAULT 0;
                END IF;

                 -- product_options (TEXT)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='product_options') THEN
                    ALTER TABLE products ADD COLUMN product_options TEXT DEFAULT '';
                END IF;

                -- model_no (VARCHAR)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='model_no') THEN
                    ALTER TABLE products ADD COLUMN model_no VARCHAR(255) DEFAULT '';
                END IF;

                -- remarks (TEXT)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='remarks') THEN
                    ALTER TABLE products ADD COLUMN remarks TEXT DEFAULT '';
                END IF;

                -- display_order (INTEGER)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='display_order') THEN
                    ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0;
                END IF;
                
                 -- product_spec (TEXT)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='product_spec') THEN
                    ALTER TABLE products ADD COLUMN product_spec TEXT DEFAULT '';
                END IF;

                 -- is_new (BOOLEAN)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_new') THEN
                    ALTER TABLE products ADD COLUMN is_new BOOLEAN DEFAULT FALSE;
                END IF;

                 -- manufacturer (VARCHAR)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='manufacturer') THEN
                    ALTER TABLE products ADD COLUMN manufacturer VARCHAR(255);
                END IF;

                -- origin (VARCHAR)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='origin') THEN
                    ALTER TABLE products ADD COLUMN origin VARCHAR(100);
                END IF;

                -- is_tax_free (BOOLEAN)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_tax_free') THEN
                    ALTER TABLE products ADD COLUMN is_tax_free BOOLEAN DEFAULT FALSE;
                END IF;

                 -- consumer_price
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='consumer_price') THEN
                    ALTER TABLE products ADD COLUMN consumer_price DECIMAL(12, 2);
                END IF;

                -- supply_price
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='supply_price') THEN
                    ALTER TABLE products ADD COLUMN supply_price DECIMAL(12, 2);
                END IF;

                -- quantity_per_carton
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='quantity_per_carton') THEN
                    ALTER TABLE products ADD COLUMN quantity_per_carton INTEGER;
                END IF;

            END $$;
        """
        
        con.run(sql)
        con.run("COMMIT")
        print("Migration completed successfully.")
        con.close()

    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()


import pg8000.native
import ssl

def check_columns():
    # Connection details
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
        
        print("Fetching columns for 'products' table...")
        # Query information_schema
        results = con.run("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'")
        
        print("Columns found:")
        found_columns = [row[0] for row in results]
        for row in results:
            print(f"- {row[0]} ({row[1]})")

        # Check for expected columns
        expected_columns = [
            'shipping_fee_individual', 'shipping_fee_carton', 'product_options', 
            'model_no', 'remarks', 'display_order', 'product_spec', 'is_new', 
            'manufacturer', 'origin', 'is_tax_free', 'consumer_price', 
            'supply_price', 'quantity_per_carton'
        ]
        
        missing = [col for col in expected_columns if col not in found_columns]
        
        if missing:
            print("\n❌ MISSING COLUMNS:")
            for col in missing:
                print(f"- {col}")
        else:
            print("\n✅ All expected columns are present.")

        con.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()

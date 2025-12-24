import pg8000.native
import ssl
import json

# Database connection details
DB_URL = "postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

def check_prices():
    try:
        # Create SSL context (disable verification for simplicity/compatibility)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        con = pg8000.native.Connection(
            user="postgres.zgqnhbaztgpekerhxwbc",
            password="gmlrhks0528&*",
            host="aws-1-ap-northeast-2.pooler.supabase.com",
            port=5432,
            database="postgres",
            ssl_context=ssl_context
        )

        print("Connecting to database...")
        
        # Query for '나틴다'
        query = "SELECT brand, model_name, b2b_price, consumer_price, supply_price FROM products WHERE brand LIKE '%나틴다%' OR brand LIKE '%Natinda%' LIMIT 5"
        
        results = con.run(query)
        
        print(f"Found {len(results)} rows:")
        for row in results:
             print(f"Brand: {row[0]}, Model: {row[1]}, B2B: {row[2]}, Consumer: {row[3]}, Supply: {row[4]}")

        con.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_prices()

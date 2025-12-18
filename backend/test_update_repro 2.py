
import pg8000.native
import ssl
from decimal import Decimal

def test_update():
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
        
        print("Detailed connection established.")

        # Target Product ID (using 8 from dump as it exists)
        target_id = 8
        
        # Test Data matching the query params structure
        # Params:
        # $1: category_id (int)
        # $2: brand (str)
        # $3: model_name (str)
        # $4: description (str)
        # $5: image_url (str)
        # $6: b2b_price (decimal)
        # $7: stock_quantity (int)
        # $8: is_available (bool)
        # $9: detail_url (str)
        # $10: consumer_price (decimal)
        # $11: supply_price (decimal)
        # $12: quantity_per_carton (int)
        # $13: manufacturer (str)
        # $14: origin (str)
        # $15: is_tax_free (bool)
        # $16: shipping_fee_individual (decimal/int)
        # $17: shipping_fee_carton (decimal/int)
        # $18: product_options (str)
        # $19: model_no (str)
        # $20: remarks (str)
        # $21: display_order (int)
        # $22: product_spec (str)
        # $23: is_new (bool)
        # $24: id (int)

        params = [
            1, # category_id (Audio)
            'TestBrand', # brand
            'TestModel', # model_name
            'Test Description', # description
            'http://example.com/image.jpg', # image_url
            Decimal('10000.00'), # b2b_price
            100, # stock_quantity
            True, # is_available
            'http://example.com/detail', # detail_url
            Decimal('20000.00'), # consumer_price
            Decimal('15000.00'), # supply_price
            10, # quantity_per_carton
            'TestManufacturer', # manufacturer
            'Korea', # origin
            False, # is_tax_free
            3000, # shipping_fee_individual
            0, # shipping_fee_carton
            'Option1, Option2', # product_options
            'TM-123', # model_no
            'Test Remarks', # remarks
            1, # display_order
            'Specs...', # product_spec
            True, # is_new
            target_id # id
        ]

        query = """
            UPDATE products 
            SET category_id = $1, brand = $2, model_name = $3, description = $4, 
                image_url = $5, b2b_price = $6, stock_quantity = $7, is_available = $8, detail_url = $9, 
                consumer_price = $10, supply_price = $11, quantity_per_carton = $12,
                manufacturer = $13, origin = $14, is_tax_free = $15,
                shipping_fee_individual = $16, shipping_fee_carton = $17, product_options = $18, model_no = $19,
                remarks = $20, display_order = $21, product_spec = $22, is_new = $23,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $24
            RETURNING *
        """
        
        
        print("Executing UPDATE query (Valid Data)...")
        try:
             # Use *params to unpack list into individual arguments
             result = con.run(query, *params)
             print("✅ UPDATE (Valid Data) Successful!")
        except Exception as e:
             print(f"❌ UPDATE (Valid Data) Failed: {e}")

        # Test Case 2: Empty String (Should Fail at DB level)
        print("\nExecuting UPDATE query (Empty String for Numeric)...")
        params_invalid = list(params)
        params_invalid[9] = "" # consumer_price ($10)
        
        try:
            con.run(query, *params_invalid)
            print("❌ UPDATE (Invalid Data) Succeeded (Unexpected!)")
        except Exception as e:
            print(f"✅ UPDATE (Invalid Data) Failed matches expected DB behavior: {e}")

        # Test Case 3: Simulated Sanitized Data (NULL/None) - This verifies my Backend Fix
        print("\nExecuting UPDATE query (Sanitized Data - None instead of '')...")
        params_sanitized = list(params)
        params_sanitized[9] = None # consumer_price ($10) set to NULL
        params_sanitized[10] = None # supply_price ($11)
        params_sanitized[11] = None # quantity_per_carton ($12)
        
        try:
            con.run(query, *params_sanitized)
            print("✅ UPDATE (Sanitized Data) Successful! (Fix Verified)")
        except Exception as e:
             print(f"❌ UPDATE (Sanitized Data) Failed: {e}")

        con.run("ROLLBACK") # Don't actually change data
        con.close()

    except Exception as e:
        print(f"❌ Connection/Setup Failed: {e}")

if __name__ == "__main__":
    test_update()

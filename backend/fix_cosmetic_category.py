import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def fix_cosmetics():
    # DB Connection
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print("Connecting to DB...")
    con = pg8000.native.Connection(
        user="postgres.zgqnhbaztgpekerhxwbc",
        password="gmlrhks0528&*",
        host="aws-1-ap-northeast-2.pooler.supabase.com",
        port=5432,
        database="postgres",
        ssl_context=ssl_context
    )

    print("Updating Cosmetics/Amenities to Category 3 (Beauty)...")
    # Keywords: 일리윤, 포고니아, 발망, 에르메스, 여행용, Amenity, 어메니티
    # Update where category was incorrectly set to 2 (Mobile)
    
    query = """
        UPDATE products 
        SET category_id = 3 
        WHERE (
            model_name LIKE '%일리윤%' OR 
            model_name LIKE '%포고니아%' OR 
            model_name LIKE '%발망%' OR 
            model_name LIKE '%에르메스%' OR 
            model_name LIKE '%여행용%' OR 
            model_name LIKE '%Amenity%' OR 
            model_name LIKE '%어메니티%'
        ) AND category_id = 2
    """
    con.run(query)
    
    print("Verification:")
    res = con.run("""
        SELECT id, model_name, category_id 
        FROM products 
        WHERE model_name LIKE '%에르메스%' OR model_name LIKE '%파우치%' 
        ORDER BY id DESC LIMIT 10
    """)
    for r in res:
        print(r)
        
    con.close()

if __name__ == "__main__":
    fix_cosmetics()

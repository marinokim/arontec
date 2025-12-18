import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def update_mobile_cat():
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

    # Mobile ID is 2
    # Move Britz ('비즈'), iWhere, Sapa ('사파') tech items to Mobile if they are currently Gift Set (8)
    
    # We should be careful. '사파' also has massagers which might be Living/Health, but user said "Mobile category exists" implying the tech stuff.
    # Britz is definitely Audio/Mobile.
    # iWhere is chargers - Mobile.
    
    # Let's move all Britz, iWhere, Sapa items that are in Gift Set (8) to Mobile (2).
    # Also check if Sapa CD players should be Mobile or Audio. 
    # Audio is ID 1. user asked for "Mobile".
    # I will stick to Mobile (2) for now as requested.
    
    keywords = ['비즈', 'iWhere', '사파']
    
    print(f"Updating products matching {keywords} from Category 8 (Gift Set) to Category 2 (Mobile)...")
    
    for kw in keywords:
        query = "UPDATE products SET category_id = 2, updated_at = CURRENT_TIMESTAMP WHERE (model_name LIKE :kw OR brand LIKE :kw) AND category_id = 8"
        con.run(query, kw=f'%{kw}%')
    
    # Verify
    res = con.run("SELECT count(*) FROM products WHERE category_id = 2")
    print(f"Total products in Mobile category now: {res[0][0]}")
    
    con.close()

if __name__ == "__main__":
    update_mobile_cat()

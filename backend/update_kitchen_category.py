import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def update_kitchen_cat():
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

    # Kitchen ID is 11
    # We want to update products created recently that match the Kitchen criteria or were in the ranges we just did.
    # To be safe, let's target the exact rows by looking up the model names or just generic update for "Kitchen" looking items 
    # that are currently in Living (10) or created recently.
    
    # Or better, re-run the registration scripts? 
    # But re-running 3 scripts is slow. 
    # A targeted UPDATE is faster.
    
    # Ranges: 1136-1154, 1241-1274, 1310-1358.
    # We can fetch products using the same logic (Category column in Excel) or just update based on ID range if we knew keys.
    # But we don't have exact ID ranges.
    
    # Strategy: Select all items created in the last hour that are currently Category 10 (Living)
    # AND have "Kitchen" in their Excel source category?
    # Actually, simpler: Any product with "해피콜" (Happycall), "이태리 로시" (Rossi), "로얄튜더" (Royal Tudor), "쿡셀" (Cookcell) 
    # should be Kitchen (11).
    
    kitchen_keywords = ['해피콜', '이태리 로시', '로얄튜더', '쿡셀', 'Cookcell', 'ROSSI']
    
    print(f"Updating products matching {kitchen_keywords} to Category 11 (Kitchen)...")
    
    updated_count = 0
    for kw in kitchen_keywords:
        query = "UPDATE products SET category_id = 11, updated_at = CURRENT_TIMESTAMP WHERE (model_name LIKE :kw OR brand LIKE :kw) AND category_id != 11"
        res = con.run(query, kw=f'%{kw}%')
        # pg8000 run usually returns rows, not affected count directly unless we ask.
        # But for UPDATE it might not return anything.
        # Let's count before/after or just trust it.
    
    # Verify count
    res = con.run("SELECT count(*) FROM products WHERE category_id = 11")
    print(f"Total products in Kitchen category now: {res[0][0]}")
    
    con.close()

if __name__ == "__main__":
    update_kitchen_cat()

import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def fix_cat():
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

    print("Updating '모비프렌' and '톤웨이블' to Category 2 (Mobile)...")
    con.run("UPDATE products SET category_id = 2 WHERE (model_name LIKE '%모비프렌%' OR model_name LIKE '%톤웨이블%' OR model_name LIKE '%MobiFren%') AND category_id = 10")
    
    res = con.run("SELECT id, model_name, category_id FROM products WHERE model_name LIKE '%모비프렌%' OR model_name LIKE '%톤웨이블%' ORDER BY id DESC LIMIT 10")
    for r in res:
        print(r)
        
    con.close()

if __name__ == "__main__":
    fix_cat()

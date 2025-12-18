import sys
import os
import ssl
import time
sys.path.append(os.path.join(os.getcwd(), 'pylib'))
import pg8000.native

def verify_2552():
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    max_retries = 3
    for i in range(max_retries):
        try:
            print(f"Connecting to DB (Attempt {i+1})...")
            con = pg8000.native.Connection(
                user="postgres.zgqnhbaztgpekerhxwbc",
                password="gmlrhks0528&*",
                host="aws-1-ap-northeast-2.pooler.supabase.com",
                port=5432,
                database="postgres",
                ssl_context=ssl_context
            )
            
            print("Querying DearCoustic product...")
            rows = con.run("SELECT id, category_id, brand, model_name FROM products WHERE brand = '디어쿠스틱' OR model_name LIKE '%티어쿠스틱%' ORDER BY id DESC LIMIT 1")
            
            for r in rows:
                print(f"ID: {r[0]}, Cat: {r[1]}, Brand: {r[2]}, Name: {r[3][:30]}...")
                
            con.close()
            return
        except Exception as e:
            print(f"Connection failed: {e}")
            time.sleep(2)

if __name__ == "__main__":
    verify_2552()

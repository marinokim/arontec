import pg8000.native
import ssl

def check_duplicates():
    try:
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

        print("--- Checking 'jazz' ---")
        res = con.run("SELECT id, model_name, description, b2b_price FROM products WHERE model_name ILIKE '%jazz%'")
        for r in res:
             print(f"ID: {r[0]}, Name: {r[1]}, Desc: {str(r[2])[:20]}..., B2B: {r[3]}")

        print("\n--- Checking '올인원오디오' ---")
        res = con.run("SELECT id, model_name, description, b2b_price FROM products WHERE model_name LIKE '%올인원오디오%'")
        for r in res:
             print(f"ID: {r[0]}, Name: {r[1]}, Desc: {str(r[2])[:20]}..., B2B: {r[3]}")

        con.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_duplicates()

import pg8000.native
import ssl

def verify_update():
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

        # check ID 58
        res = con.run("SELECT id, brand, model_name, b2b_price, consumer_price, supply_price FROM products WHERE id = 58")
        if res:
             row = res[0]
             print(f"ID: {row[0]}, Brand: {row[1]}, Model: {row[2]}")
             print(f"B2B: {row[3]}, Consumer: {row[4]}, Supply: {row[5]}")
        else:
            print("Product 58 not found")

        con.close()
    except Exception as e:
        print(e)

if __name__ == "__main__":
    verify_update()

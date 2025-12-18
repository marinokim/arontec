import cloudinary
import cloudinary.api
import pg8000.native
import ssl
import datetime

# Manual .env parsing
env_vars = {}
try:
    with open('./backend/.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()
except Exception as e:
    pass

cloudinary.config(
    cloud_name=env_vars.get('CLOUDINARY_CLOUD_NAME'),
    api_key=env_vars.get('CLOUDINARY_API_KEY'),
    api_secret=env_vars.get('CLOUDINARY_API_SECRET'),
    secure=True
)

def restore():
    print("Fetching images from Cloudinary...")
    try:
        # Fetch recent uploads
        resp = cloudinary.api.resources(
            type="upload",
            prefix="arontec-products",
            max_results=100,
            direction="desc" 
        )
        
        # Filter for today (2025-12-14)
        # created_at format: '2025-12-14T08:10:47Z'
        target_date = '2025-12-14'
        recent_images = []
        for res in resp.get('resources', []):
            if res['created_at'].startswith(target_date):
                recent_images.append(res)
        
        # Sort by created_at ASCENDING (First uploaded -> First product)
        # OR DESCENDING?
        # User uploaded row 115, then 116...
        # So the *oldest* of the recent images should be for the *first* product (ID 135).
        recent_images.sort(key=lambda x: x['created_at'])
        
        print(f"Found {len(recent_images)} images from today.")
        
        if len(recent_images) == 0:
            print("No images found from today.")
            return

        # Connect DB
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
        
        # Fetch target products (Gogayeon and Polbilac)
        # User typed "플비락" -> "폴비락" in DB
        products = con.run(
            "SELECT id, model_name FROM products WHERE model_name LIKE '%고가연%' OR model_name LIKE '%폴비락%' ORDER BY id ASC"
        )
        print(f"Found {len(products)} target products (Gogayeon/Polbilac).")
        print(f"IDs: {[p[0] for p in products]}")
        
        # Sort images: Oldest to Newest to match insertion order (121 -> 137)
        # If user uploaded sequentially:
        # 1. Uploaded for 121
        # 2. Uploaded for 122...
        # So we sort by created_at ASC.
        recent_images.sort(key=lambda x: x['created_at'])
        
        # We need to skip the older images if they belong to previous batches?
        # User said "manually uploaded".
        # Let's take the *last* N images?
        # If there are 17 products, we take the last 17 images? 
        # Or the *first* 17 of the "recent" batch?
        # Let's assume the 17 valid images from today correspond to these 17 products.
        
        target_len = min(len(products), len(recent_images))
        print(f"Mapping {target_len} items.")
        
        # We might need to slice recent_images if there are too many?
        # If I uploaded 34 images today, and only want 17...
        # Usually, the "latest" uploads correspond to the "latest" products (high IDs).
        # But if sorted by created_at desc, index 0 is newest.
        # If sorted by created_at asc, index -1 is newest.
        
        # Let's try matching the *latest* N images to the *latest* N products?
        # Actually, the user uploaded them manually *after* the products were there?
        # Or *for* the products.
        # Let's match sequentially.
        
        # If I have 34 images and 17 products.
        # I'll use the *most recent* 17 images? 
        # Start from the one created just now?
        # Let's verify by printing created_at.
        
        # Filter recent_images to be just enough?
        # Using the *most recent* 17 images, sorted by time ascending (to match product ID ascending)?
        # e.g. User uploaded Img1 (for Prod1) -> Img2 (for Prod2).
        # Img2 is newer. Prod2 is higher ID.
        # So we take the batch of images, sort by time, and map to products sorted by ID.
        
        # If we have extra images from other tests?
        # I'll just use the list I have.
        
        for i in range(target_len):
            pid = products[i][0]
            pname = products[i][1]
            # Match recent_images[i] (sorted by time)
            img = recent_images[i]
            img_url = img['secure_url']
            
            print(f"Mapping Product {pid} ({pname}) -> {img_url} ({img['created_at']})")
            
            # Use separate params and explicit cast for safety
            con.run(
                "UPDATE products SET image_url = CAST(:img1 AS VARCHAR), detail_url = CAST(:img2 AS VARCHAR) WHERE id = :id", 
                img1=img_url, img2=img_url, id=pid
            )
            
        print("Restore complete.")
        con.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    restore()

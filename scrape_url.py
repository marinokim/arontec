import requests
from bs4 import BeautifulSoup
import sys

def scrape_url(url):
    print(f"Scraping: {url}")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        # 1. Get Title
        title = soup.title.string.strip() if soup.title else "No Title"
        print(f"Page Title: {title}")
        
        # 2. Get Main Image (og:image)
        og_image = soup.find('meta', property='og:image')
        main_image_url = og_image['content'] if og_image else "Not found"
        print(f"Main Image (og:image): {main_image_url}")
        
        # 3. Try to find detail images
        # Heuristic: Look for long vertical images or container with many images
        # Common classes: .detail, .content, .view, .product_detail
        
        candidates = []
        for img in soup.find_all('img'):
            src = img.get('src')
            if not src: continue
            if 'logo' in src.lower() or 'icon' in src.lower(): continue
            
            # Simple scoring: large images are likely details
            # But without rendering, checking size is hard.
            # We can check parent containers.
            candidates.append(src)
            
        print(f"Found {len(candidates)} potential images.")
        
        # Try to find a specific container that looks like "detail"
        detail_container = None
        selectors = [
            '#detail', '.detail', '.product_detail', '.detial_view', '#contents', 
            '.goods_desc', '.detail_area', '.detail_info', '#prd_detail', 
            '.cont_detail', '.detail_cont', '#detail_info'
        ]
        
        for selector in selectors:
            found = soup.select_one(selector)
            if found:
                detail_container = found
                print(f"Found detail container by selector: {selector}")
                break
        
        # Fallback: Find div with most images
        if not detail_container:
            print("No known selector matched. Trying heuristics...")
            max_imgs = 0
            best_div = None
            for div in soup.find_all('div'):
                # Filter out header/footer/nav
                if div.get('id') and 'header' in div['id']: continue
                if div.get('class') and any('header' in c for c in div['class']): continue
                
                imgs = div.find_all('img', recursive=False) # Direct children or close?
                # Sometimes images are wrapped in p or center
                # Let's count *all* images inside, but penalize tiny ones?
                # For now just count all.
                count = len(div.find_all('img'))
                if count > max_imgs and count < 100: # 100 is safety cap
                    max_imgs = count
                    best_div = div
            
            if best_div and max_imgs > 2:
                print(f"Found heuristic detail container with {max_imgs} images.")
                detail_container = best_div
        
        detail_html = ""
        if detail_container:
            # Extract only images or the whole HTML
            # User said "copy html of detail images"
            # often just the images
            # Clean up images: remove style, class, etc? Or keep as is?
            # User said: "Copy inner HTML".
            # If we just grab images, we might lose layout.
            # But usually it's just a stack of images.
            imgs = detail_container.find_all('img')
            print(f"Found {len(imgs)} images in detail container.")
            
            # Construct a clean HTML block of images
            # Make sure src is absolute
            final_imgs = []
            for img in imgs:
                if not img.get('src'): continue
                if img['src'].startswith('//'):
                    img['src'] = 'https:' + img['src']
                elif img['src'].startswith('/'):
                    # Need base url
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    base = f"{parsed.scheme}://{parsed.netloc}"
                    img['src'] = base + img['src']
                
                final_imgs.append(str(img))

            detail_html = "".join(final_imgs)
        else:
            print("No specific detail container found.")

        return {
            "title": title,
            "main_image": main_image_url,
            "detail_html": detail_html,
            "detail_html_snippet": detail_html[:500] + "..." if len(detail_html) > 500 else detail_html
        }

    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        scrape_url(sys.argv[1])
    else:
        # Default test
        scrape_url("https://store.hanssem.com/goods/1105920")

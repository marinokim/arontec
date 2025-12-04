import { Buffer } from 'node:buffer';

async function testProxyLogic() {
    const url = 'https://gi.esmplus.com/ygc3000/SAFA/SH-100-6.jpg';
    console.log(`Testing fetch for ${url}...`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://gi.esmplus.com/'
            }
        });

        console.log('Status:', response.status);

        if (!response.ok) {
            console.error('Fetch failed:', response.statusText);
            return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Buffer created successfully. Size:', buffer.length);

    } catch (error) {
        console.error('Error occurred:', error);
    }
}

testProxyLogic();

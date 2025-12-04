
async function testFetch() {
    // Try HTTPS
    const url = 'https://gi.esmplus.com/ygc3000/SAFA/SH-100-6.jpg';
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Status:', response.status);

        if (!response.ok) {
            console.error('Fetch failed:', response.statusText);
            return;
        }
        console.log('Success');

    } catch (error) {
        console.error('Error:', error);
    }
}

testFetch();

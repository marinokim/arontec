document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // API Configuration
    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : 'https://arontec-backend.onrender.com';

    // Helper to get full image URL
    function getImageUrl(url) {
        if (!url) return '';
        const cleanUrl = url.trim();
        if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) return cleanUrl;
        if (cleanUrl.startsWith('/')) return `${API_BASE_URL}${cleanUrl}`;
        return cleanUrl;
    }

    // Render Notices
    const noticeList = document.getElementById('notice-list');
    if (noticeList) {
        fetchNotices();
    }

    async function fetchNotices() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications`);
            if (res.ok) {
                const notices = await res.json();
                const activeNotices = notices.filter(n => n.is_active);

                if (activeNotices.length === 0) {
                    noticeList.innerHTML = '<p style="text-align: center; color: #666;">등록된 공지사항이 없습니다.</p>';
                    return;
                }

                noticeList.innerHTML = activeNotices.map(notice => `
                    <div class="notice-item" style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <h3 style="font-size: 1.1rem; color: var(--primary-color); margin: 0;">${notice.title}</h3>
                            <span style="font-size: 0.8rem; color: #999;">${new Date(notice.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style="color: #555; line-height: 1.5;">${notice.content}</p>
                    </div>
                `).join('');
            } else {
                noticeList.innerHTML = '<p style="text-align: center; color: #666;">공지사항을 불러올 수 없습니다.</p>';
            }
        } catch (error) {
            console.error('Fetch notices error:', error);
            noticeList.innerHTML = '<p style="text-align: center; color: #666;">공지사항을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // Render New Arrivals
    const newProductList = document.getElementById('new-product-list');
    if (newProductList) {
        fetchNewProducts();
    }

    async function fetchNewProducts() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products?isNew=true&limit=30`);
            if (res.ok) {
                const data = await res.json();
                const products = data.products;

                if (products.length === 0) {
                    newProductList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">등록된 신상품이 없습니다.</p>';
                    return;
                }

                newProductList.innerHTML = products.map(product => {
                    // Normalize image URL
                    const imageUrl = getImageUrl(product.image_url);

                    // Check if image is an emoji (legacy support)
                    const isEmoji = !imageUrl.includes('/') && !imageUrl.includes('.');
                    const imageHtml = isEmoji
                        ? `<div class="product-icon" style="font-size: 3rem; padding: 2rem; background: #fff; display: flex; align-items: center; justify-content: center; height: 200px;">${imageUrl}</div>`
                        : `<div class="product-image-container" style="height: 200px; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; padding: 10px;">
                             <img src="${imageUrl}" alt="${product.model_name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                           </div>`;

                    return `
                    <div class="card product-card" onclick="window.location.href='product_detail.html?id=${product.id}'" style="cursor: pointer; padding: 0; overflow: hidden;">
                        ${imageHtml}
                        <div style="padding: 1.5rem;">
                            <h3 style="font-size: 1rem; color: #666; margin-bottom: 0.5rem;">${product.brand}</h3>
                            <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.model_name}</h4>
                        </div>
                    </div>
                `}).join('');
            } else {
                newProductList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">신상품 목록을 불러올 수 없습니다.</p>';
            }
        } catch (error) {
            console.error('Fetch new products error:', error);
            newProductList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">신상품 목록을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // Render Brands
    const brandList = document.getElementById('brand-list');
    if (brandList) {
        fetchAndRenderBrands();
    }

    // Brand Data Mapping
    const brandData = {
        'INKEL': { icon: '🎧', desc: '대한민국 대표 음향 가전 브랜드' },
        'IRIVER': { icon: '🔊', desc: '라이프스타일 오디오 & 모바일 액세서리' },
        'MobiFren': { icon: '📱', desc: '프리미엄 블루투스 이어폰 & 케이스' },
        'Elargo': { icon: '💄', desc: '자연주의 뷰티 & 코스메틱' },
        'Swisswin': { icon: '🎒', desc: '글로벌 기능성 가방 브랜드' },
        'LG Electronics': { icon: '📺', desc: '스마트 라이프를 위한 가전' },
        'Yamaha': { icon: '🎹', desc: '감동을 전하는 사운드' },
        'SOUL': { icon: '🎵', desc: '파워풀한 사운드 퍼포먼스' }
    };

    async function fetchAndRenderBrands() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/brands`);
            if (res.ok) {
                const data = await res.json();
                const brands = data.brands;

                if (brands.length === 0) {
                    brandList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">등록된 브랜드가 없습니다.</p>';
                    return;
                }

                brandList.innerHTML = brands.map(brandName => {
                    const info = brandData[brandName] || { icon: '📦', desc: 'Global Brand' };
                    return `
                    <div class="brand-card">
                        <div class="brand-icon">${info.icon}</div>
                        <h3>${brandName}</h3>
                        <p>${info.desc}</p>
                    </div>
                `}).join('');
            } else {
                brandList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">브랜드 목록을 불러올 수 없습니다.</p>';
            }
        } catch (error) {
            console.error('Fetch brands error:', error);
            brandList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">브랜드 목록을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // Category Constants (Synced with SCM)
    const CATEGORY_ORDER = [
        'Audio',
        'Premium Audio',
        'Mobile',
        'Beauty',
        'Food',
        'Living',
        'GIFT SET',
        'Travel',
        'Kitchen',
        'Other'
    ];

    const CATEGORY_COLORS = {
        'Audio': '#007bff',          // Blue
        'Premium Audio': '#6610f2',  // Indigo
        'Mobile': '#fd7e14',         // Orange
        'Beauty': '#e83e8c',         // Pink
        'Food': '#dc3545',           // Red
        'Living': '#28a745',         // Green
        'GIFT SET': '#20c997',       // Teal
        'Travel': '#17a2b8',         // Cyan
        'Kitchen': '#ffc107',        // Yellow
        'Other': '#6c757d'           // Gray
    };

    // Render Products & Categories
    const productGrid = document.getElementById('product-grid');
    const categoryContainer = document.querySelector('.category-filters');
    let fetchedProducts = [];
    let activeCategory = 'All';

    async function initProducts() {
        if (!productGrid) return;

        // 1. Fetch Categories
        await fetchAndRenderCategories();

        // 2. Fetch Products
        await fetchAndRenderProducts();
    }

    async function fetchAndRenderCategories() {
        if (!categoryContainer) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/products/categories`);
            if (res.ok) {
                const data = await res.json();
                let categories = data.categories;

                // Sort categories based on SCM order
                categories.sort((a, b) => {
                    const indexA = CATEGORY_ORDER.indexOf(a.name);
                    const indexB = CATEGORY_ORDER.indexOf(b.name);

                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;

                    // If neither is in the list, sort alphabetically
                    if (a.name === 'Other') return 1;
                    if (b.name === 'Other') return -1;
                    return a.name.localeCompare(b.name);
                });

                // Create buttons: All + Dynamic Categories
                let buttonsHtml = `<button class="category-btn active" data-category="All" style="background-color: #333; color: white; border-color: #333;">All</button>`;

                categories.forEach(cat => {
                    const color = CATEGORY_COLORS[cat.name] || '#6c757d';
                    // Initially inactive, so white background with colored border/text
                    // We will handle active state in the click listener or via inline style if we want them always colored
                    // Let's make them colored outline by default, and filled when active
                    buttonsHtml += `<button class="category-btn" data-category="${cat.name}" data-color="${color}" style="border-color: ${color}; color: ${color};">${cat.name}</button>`;
                });

                categoryContainer.innerHTML = buttonsHtml;

                // Re-attach event listeners
                attachCategoryListeners();
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            // Fallback to existing hardcoded buttons if fetch fails (or do nothing if they are already there)
        }
    }

    function attachCategoryListeners() {
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all and reset styles
                categoryBtns.forEach(b => {
                    b.classList.remove('active');
                    const color = b.getAttribute('data-color');
                    if (color) {
                        b.style.backgroundColor = 'white';
                        b.style.color = color;
                    } else {
                        // For 'All' button
                        b.style.backgroundColor = 'white';
                        b.style.color = '#333';
                    }
                });

                // Add active class to clicked and apply active styles
                btn.classList.add('active');
                const color = btn.getAttribute('data-color');
                if (color) {
                    btn.style.backgroundColor = color;
                    btn.style.color = 'white';
                } else {
                    // For 'All' button
                    btn.style.backgroundColor = '#333';
                    btn.style.color = 'white';
                }

                const category = btn.getAttribute('data-category');
                activeCategory = category;
                renderFilteredProducts(category);
            });
        });
    }

    async function fetchAndRenderProducts() {
        try {
            // Try to fetch from SCM API
            const res = await fetch(`${API_BASE_URL}/api/products?sort=display_order`);
            if (res.ok) {
                const data = await res.json();
                // Map SCM data to Homepage format
                fetchedProducts = data.products.map(p => {
                    return {
                        id: p.id,
                        brand: p.brand,
                        model: p.model_name,
                        description: p.description,
                        price: Number(p.b2b_price),
                        category: p.category_name || 'Other',
                        image: p.image_url,
                        detailUrl: p.detail_url
                    };
                });
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.warn('Failed to fetch from SCM API, using static data:', error);
            // Fallback to static products if defined
            if (typeof products !== 'undefined') {
                fetchedProducts = products;
            }
        }

        renderFilteredProducts(activeCategory);
    }

    function renderFilteredProducts(category) {
        const filteredProducts = category === 'All'
            ? fetchedProducts
            : fetchedProducts.filter(p => p.category === category);

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">해당 카테고리에 제품이 없습니다.</p>';
            return;
        }

        productGrid.innerHTML = filteredProducts.map(product => {
            // Normalize image URL
            const imageUrl = getImageUrl(product.image);

            // Check if image is an emoji or a URL
            const isEmoji = !imageUrl.includes('/') && !imageUrl.includes('.');
            const imageHtml = isEmoji
                ? `<div class="product-icon" style="font-size: 3rem; padding: 2rem; background: #fff; display: flex; align-items: center; justify-content: center; height: 200px;">${imageUrl}</div>`
                : `<div class="product-image-container" style="height: 200px; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; padding: 10px;">
                     <img src="${imageUrl}" alt="${product.model}" class="product-thumb" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                   </div>`;

            return `
            <div class="product-card" onclick="window.location.href='product_detail.html?id=${product.id}'" style="cursor: pointer;">
                ${imageHtml}
                <div class="product-info">
                    <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${product.brand}</h3>
                    <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${product.model}</h4>
                    <p style="color: #666; margin-bottom: 1rem;">${product.description}</p>
                </div>
            </div>
        `}).join('');
    }

    if (productGrid) {
        initProducts();
    }

    // Product Detail Page Logic
    const detailContainer = document.getElementById('product-detail-container');
    if (detailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (productId) {
            fetchProductDetail(productId);
        } else {
            detailContainer.innerHTML = '<p style="text-align: center;">잘못된 접근입니다.</p>';
        }
    }

    async function fetchProductDetail(id) {
        try {
            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 5000)
            );

            // Race fetch against timeout
            const res = await Promise.race([
                fetch(`${API_BASE_URL}/api/products/${id}`),
                timeout
            ]);

            if (res.ok) {
                const data = await res.json();
                renderProductDetail(data.product);
            } else {
                throw new Error('Product not found');
            }
        } catch (error) {
            console.warn('Error fetching product detail, trying static data:', error);

            // Fallback to static data
            if (typeof products !== 'undefined') {
                // products array from products_data.js
                // Note: ID from URL is string, product.id might be number
                const product = products.find(p => p.id == id);
                if (product) {
                    renderProductDetail(product);
                    return;
                }
            }

            // If both fail, show error
            detailContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <p style="color: #666; font-size: 1.2rem;">제품 정보를 불러올 수 없습니다.</p>
                    <p style="color: #999; font-size: 0.9rem; margin-top: 10px;">(Error: ${error.message})</p>
                    <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">다시 시도</button>
                    <button onclick="history.back()" style="margin-top: 20px; margin-left: 10px; padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">목록으로</button>
                </div>
            `;
        }
    }

    function renderProductDetail(product) {
        // Normalize properties (API returns snake_case, static data returns camelCase)
        const imageUrl = getImageUrl(product.image_url || product.image);
        const detailUrl = product.detail_url || product.detailUrl;
        const modelName = product.model_name || product.model;

        const isEmoji = !imageUrl.includes('/') && !imageUrl.includes('.');
        const imageHtml = isEmoji
            ? `<div style="font-size: 10rem; text-align: center; background: #f8f9fa; padding: 2rem; border-radius: 8px;">${imageUrl}</div>`
            : `<img src="${imageUrl}" alt="${modelName}" style="width: 100%; max-width: 500px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 0 auto;">`;

        let detailContentHtml = '';
        if (detailUrl) {
            // Check if it contains HTML tags (specifically img)
            if (detailUrl.trim().match(/<img/i) || detailUrl.includes('<img')) {
                detailContentHtml = `<div class="product-detail-content">${detailUrl}</div>`;
            } else {
                detailContentHtml = `<div class="product-detail-content"><img src="${detailUrl}" alt="Detail"></div>`;
            }
        }

        const detailImageHtml = detailContentHtml
            ? `<div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 40px;">
                 <h3 style="font-size: 1.5rem; margin-bottom: 20px; border-left: 4px solid var(--primary-color); padding-left: 10px;">상세 정보</h3>
                 ${detailContentHtml}
               </div>`
            : '';

        detailContainer.innerHTML = `
            <div class="product-detail-wrapper" style="max-width: 800px; margin: 0 auto;">
                <div style="text-align: center;">
                    ${imageHtml}
                </div>
                <div style="padding: 20px; text-align: center;">
                    <span style="background: #f0f0f0; padding: 5px 10px; border-radius: 20px; font-size: 0.9rem; color: #666;">${product.category_name || product.category}</span>
                    <h2 style="font-size: 2rem; margin: 10px 0 20px; color: #333;">${product.brand}</h2>
                    <h1 style="font-size: 1.5rem; margin-bottom: 20px; font-weight: normal; color: #555;">${modelName}</h1>
                    <p style="font-size: 1.1rem; line-height: 1.6; color: #666; margin-bottom: 30px; word-break: keep-all;">${product.description}</p>
                    
                    <div style="margin-top: 30px;">
                        <button onclick="history.back()" style="padding: 12px 30px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">목록으로</button>
                    </div>
                </div>
            </div>
            ${detailImageHtml}
        `;
    }

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Simple Scroll Animation Observer
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply fade-in animation to sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

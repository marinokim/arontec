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
    // const API_BASE_URL = 'http://localhost:5001'; // Localhost
    // const API_BASE_URL = 'http://192.168.0.7:5001'; // Local Network
    // const API_BASE_URL = 'http://localhost:5001'; // Localhost
    // const API_BASE_URL = 'http://192.168.0.7:5001'; // Local Network
    const API_BASE_URL = 'https://arontec-backend.onrender.com'; // Production

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

    // Render Products
    const productGrid = document.getElementById('product-grid');
    const categoryBtns = document.querySelectorAll('.category-btn');
    let fetchedProducts = [];

    async function fetchAndRenderProducts(category = 'All') {
        if (!productGrid) return;

        try {
            // Try to fetch from SCM API
            const res = await fetch(`${API_BASE_URL}/api/products`);
            if (res.ok) {
                const data = await res.json();
                // Map SCM data to Homepage format
                fetchedProducts = data.products.map(p => {
                    // SCM now returns English category names (Audio, Mobile, Beauty, Food, Other)
                    // We can use them directly, but keep a fallback just in case
                    const category = p.category_name || 'Other';

                    return {
                        id: p.id,
                        brand: p.brand,
                        model: p.model_name,
                        description: p.description,
                        price: Number(p.b2b_price),
                        category: category,
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

        renderFilteredProducts(category);
    }

    function renderFilteredProducts(category) {
        const filteredProducts = category === 'All'
            ? fetchedProducts
            : fetchedProducts.filter(p => p.category === category || (category === 'Other' && !['Audio', 'Mobile', 'Beauty', 'Food', 'Living'].includes(p.category)));

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">해당 카테고리에 제품이 없습니다.</p>';
            return;
        }

        productGrid.innerHTML = filteredProducts.map(product => {
            // Check if image is an emoji or a URL
            const isEmoji = !product.image.includes('/') && !product.image.includes('.');
            const imageHtml = isEmoji
                ? `<div class="product-icon" style="font-size: 3rem; margin-bottom: 1rem;">${product.image}</div>`
                : `<div class="product-image" style="margin-bottom: 1rem; height: 150px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                     <img src="${product.image}" alt="${product.model}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                   </div>`;

            return `
            <div class="product-card" onclick="window.location.href='product_detail.html?id=${product.id}'" style="cursor: pointer;">
                ${imageHtml}
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${product.brand}</h3>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${product.model}</h4>
                <p style="color: #666; margin-bottom: 1rem;">${product.description}</p>
            </div>
        `}).join('');
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
            const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
            if (res.ok) {
                const data = await res.json();
                renderProductDetail(data.product);
            } else {
                throw new Error('Product not found');
            }
        } catch (error) {
            console.warn('Error fetching product detail, trying static data:', error);
            if (typeof products !== 'undefined') {
                // products array from products_data.js
                // Note: ID from URL is string, product.id might be number
                const product = products.find(p => p.id == id);
                if (product) {
                    renderProductDetail(product);
                    return;
                }
            }
            detailContainer.innerHTML = '<p style="text-align: center;">제품 정보를 불러올 수 없습니다.</p>';
        }
    }

    function renderProductDetail(product) {
        // Normalize properties (API returns snake_case, static data returns camelCase)
        const imageUrl = product.image_url || product.image;
        const detailUrl = product.detail_url || product.detailUrl;
        const modelName = product.model_name || product.model;

        const isEmoji = !imageUrl.includes('/') && !imageUrl.includes('.');
        const imageHtml = isEmoji
            ? `<div style="font-size: 10rem; text-align: center; background: #f8f9fa; padding: 2rem; border-radius: 8px;">${imageUrl}</div>`
            : `<img src="${imageUrl}" alt="${modelName}" style="width: 100%; max-width: 500px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 0 auto;">`;

        const detailImageHtml = detailUrl
            ? `<div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 40px;">
                 <h3 style="font-size: 1.5rem; margin-bottom: 20px; border-left: 4px solid var(--primary-color); padding-left: 10px;">상세 정보</h3>
                 <img src="${detailUrl}" alt="Detail" style="width: 100%; max-width: 800px; display: block; margin: 0 auto;">
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

    if (productGrid) {
        fetchAndRenderProducts(); // Initial fetch and render

        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                categoryBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked
                btn.classList.add('active');

                const category = btn.getAttribute('data-category');
                renderFilteredProducts(category);
            });
        });
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

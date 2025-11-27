document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Render Products
    const productGrid = document.getElementById('product-grid');
    const categoryBtns = document.querySelectorAll('.category-btn');
    let fetchedProducts = [];

    async function fetchAndRenderProducts(category = 'All') {
        if (!productGrid) return;

        try {
            // Try to fetch from SCM API
            const res = await fetch('http://localhost:5001/api/products');
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
            : fetchedProducts.filter(p => p.category === category || (category === 'Other' && !['Audio', 'Mobile', 'Beauty', 'Food', 'Fashion'].includes(p.category)));

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
            const res = await fetch(`http://localhost:5001/api/products/${id}`);
            if (res.ok) {
                const data = await res.json();
                renderProductDetail(data.product);
            } else {
                throw new Error('Product not found');
            }
        } catch (error) {
            console.error('Error fetching product detail:', error);
            detailContainer.innerHTML = '<p style="text-align: center;">제품 정보를 불러올 수 없습니다.</p>';
        }
    }

    function renderProductDetail(product) {
        const isEmoji = !product.image_url.includes('/') && !product.image_url.includes('.');
        const imageHtml = isEmoji
            ? `<div style="font-size: 10rem; text-align: center; background: #f8f9fa; padding: 2rem; border-radius: 8px;">${product.image_url}</div>`
            : `<img src="${product.image_url}" alt="${product.model_name}" style="width: 100%; max-width: 500px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">`;

        const detailImageHtml = product.detail_url
            ? `<div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 40px;">
                 <h3 style="font-size: 1.5rem; margin-bottom: 20px; border-left: 4px solid var(--primary-color); padding-left: 10px;">상세 정보</h3>
                 <img src="${product.detail_url}" alt="Detailed Description" style="width: 100%; max-width: 1000px; display: block; margin: 0 auto;">
               </div>`
            : '';

        detailContainer.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 40px; margin-bottom: 40px; justify-content: center;">
                <div style="flex: 1; min-width: 300px; text-align: center;">
                    ${imageHtml}
                </div>
                <div style="flex: 1; min-width: 300px;">
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                        <span style="background: var(--secondary-color); color: white; padding: 5px 10px; border-radius: 4px; font-size: 0.9rem;">${product.category_name || 'Product'}</span>
                        <h1 style="font-size: 2rem; margin: 15px 0; color: #333;">${product.model_name}</h1>
                        <h3 style="color: #666; margin-bottom: 20px; font-weight: 500;">${product.brand}</h3>
                        <p style="font-size: 1.1rem; line-height: 1.6; color: #555; margin-bottom: 30px;">${product.description}</p>
                        
                        <div style="border-top: 1px solid #eee; padding-top: 20px;">
                            <a href="contact.html" class="btn-nav" style="background-color: var(--primary-color); color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; display: inline-block;">
                                견적 문의하기
                            </a>
                        </div>
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

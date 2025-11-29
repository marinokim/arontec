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

                // Sort categories: 'Other' at the end
                categories.sort((a, b) => {
                    if (a.name === 'Other') return 1;
                    if (b.name === 'Other') return -1;
                    return 0; // Keep original order for others (or sort by ID/Name if needed)
                });

                // Create buttons: All + Dynamic Categories
                let buttonsHtml = `<button class="category-btn active" data-category="All">All</button>`;

                categories.forEach(cat => {
                    buttonsHtml += `<button class="category-btn" data-category="${cat.name}">${cat.name}</button>`;
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
                // Remove active class from all
                categoryBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked
                btn.classList.add('active');

                const category = btn.getAttribute('data-category');
                activeCategory = category;
                renderFilteredProducts(category);
            });
        });
    }

    async function fetchAndRenderProducts() {
        try {
            // Try to fetch from SCM API
            const res = await fetch(`${API_BASE_URL}/api/products`);
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

    if (productGrid) {
        initProducts();
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

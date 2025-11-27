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
                    let category = 'Other';
                    const catName = p.category_name;

                    // Map Korean categories to English
                    if (catName === '뷰티' || catName === 'Beauty') category = 'Beauty';
                    else if (catName === '오디오' || catName === 'Audio') category = 'Audio';
                    else if (catName === '모바일' || catName === 'Mobile') category = 'Mobile';
                    else if (catName === '패션' || catName === 'Fashion') category = 'Fashion';
                    else if (catName === '기타' || catName === 'Other') category = 'Other';
                    else category = 'Other';

                    return {
                        id: p.id,
                        brand: p.brand,
                        model: p.model_name,
                        description: p.description,
                        price: Number(p.b2b_price),
                        category: category,
                        image: p.image_url
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
            : fetchedProducts.filter(p => p.category === category || (category === 'Other' && !['Audio', 'Mobile', 'Beauty', 'Fashion'].includes(p.category)));

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
            <div class="product-card">
                ${imageHtml}
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${product.brand}</h3>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${product.model}</h4>
                <p style="color: #666; margin-bottom: 1rem;">${product.description}</p>
                <div style="font-weight: bold; color: var(--secondary-color);">₩${product.price.toLocaleString()}</div>
            </div>
        `}).join('');
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

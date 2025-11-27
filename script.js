document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Render Products if on products page
    const productGrid = document.getElementById('product-grid');
    const categoryBtns = document.querySelectorAll('.category-btn');

    function renderProducts(category = 'All') {
        if (!productGrid || typeof products === 'undefined') return;

        const filteredProducts = category === 'All'
            ? products
            : products.filter(p => p.category === category);

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">해당 카테고리에 제품이 없습니다.</p>';
            return;
        }

        productGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-icon" style="font-size: 3rem; margin-bottom: 1rem;">${product.image}</div>
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${product.brand}</h3>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${product.model}</h4>
                <p style="color: #666; margin-bottom: 1rem;">${product.description}</p>
                <div style="font-weight: bold; color: var(--secondary-color);">₩${product.price.toLocaleString()}</div>
            </div>
        `).join('');
    }

    if (productGrid) {
        renderProducts(); // Initial render

        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                categoryBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked
                btn.classList.add('active');

                const category = btn.getAttribute('data-category');
                renderProducts(category);
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

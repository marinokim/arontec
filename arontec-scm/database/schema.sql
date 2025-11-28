-- B2B SCM Database Schema for Arontec Korea

-- Users Table (Partners + Admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    business_number VARCHAR(50),
    is_approved BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    brand VARCHAR(100) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    b2b_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Table
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Quotes Table
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    delivery_date DATE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    total_amount DECIMAL(12, 2),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quote Items Table
CREATE TABLE quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL
);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approved ON users(is_approved);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- Sample Data for Testing

-- Insert Admin User (password: admin123)
INSERT INTO users (email, password_hash, company_name, contact_person, phone, is_approved, is_admin)
VALUES ('admin@arontec.com', '$2a$10$YourHashHere', '아론텍코리아', '관리자', '031-947-4938', TRUE, TRUE);

-- Insert Sample Categories
INSERT INTO categories (name, slug, description) VALUES
('오디오', 'audio', '스피커, 헤드폰, 이어폰 등'),
('모바일', 'mobile', '휴대폰 액세서리 및 주변기기'),
('뷰티', 'beauty', '미용 및 뷰티 제품'),
('라이프스타일', 'lifestyle', '생활용품 및 잡화');

-- Insert Sample Products
INSERT INTO products (category_id, brand, model_name, description, b2b_price, stock_quantity) VALUES
(1, 'INKEL', 'INKEL-SP100', '블루투스 스피커', 45000, 100),
(1, 'IRIVER', 'IRIVER-HP200', '노이즈 캔슬링 헤드폰', 89000, 50),
(2, 'MobiFren', 'MF-CASE-01', '프리미엄 휴대폰 케이스', 15000, 200),
(3, 'Elargo', 'EL-BEAUTY-01', '페이셜 클렌저', 25000, 150),
(4, 'Swisswin', 'SW-BAG-01', '백팩', 65000, 80);

-- Insert Sample Notification
INSERT INTO notifications (title, content) VALUES
('시스템 오픈 안내', 'B2B SCM 시스템이 오픈되었습니다. 회원가입 후 관리자 승인을 받으시면 이용 가능합니다.');

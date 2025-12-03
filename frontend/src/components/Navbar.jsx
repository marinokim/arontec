import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar({ user }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = async () => {
        await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.reload()
    }

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">ARONTEC KOREA B2B SCM</div>
                <div className="navbar-toggle" onClick={toggleMenu}>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </div>
                <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>대시보드</Link>
                    <Link to="/catalog" onClick={() => setIsMenuOpen(false)}>상품 카탈로그</Link>
                    <Link to="/cart" onClick={() => setIsMenuOpen(false)}>장바구니</Link>
                    <Link to="/mypage" onClick={() => setIsMenuOpen(false)}>내 정보</Link>
                    {user?.isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)}>관리자</Link>}
                    <button onClick={handleLogout} className="btn-logout">로그아웃</button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar

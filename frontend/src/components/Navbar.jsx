import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar({ user, isAdminMode = false }) {
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
                    {isAdminMode ? (
                        <>
                            <Link to="/admin" onClick={() => setIsMenuOpen(false)}>대시보드</Link>
                            <Link to="/admin/members" onClick={() => setIsMenuOpen(false)}>회원 관리</Link>
                            <Link to="/admin/products" onClick={() => setIsMenuOpen(false)}>상품 관리</Link>
                            <Link to="/admin/quotes" onClick={() => setIsMenuOpen(false)}>견적 관리</Link>
                            <Link to="/admin/notifications" onClick={() => setIsMenuOpen(false)}>알림</Link>
                            <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>사용자 모드</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>대시보드</Link>
                            <Link to="/catalog" onClick={() => setIsMenuOpen(false)}>상품 카탈로그</Link>
                            <Link to="/cart" onClick={() => setIsMenuOpen(false)}>장바구니</Link>
                            <Link to="/mypage" onClick={() => setIsMenuOpen(false)}>내 정보</Link>
                            {user?.isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)}>관리자모드</Link>}
                        </>
                    )}
                    <button onClick={handleLogout} className="btn-logout">로그아웃</button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar

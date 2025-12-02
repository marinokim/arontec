import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../Dashboard.css'

function AdminDashboard() {
    const [stats, setStats] = useState({
        pendingMembers: 0,
        pendingQuotes: 0,
        lowStockProducts: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/stats', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch admin stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.href = '/login'
    }

    if (loading) return <div className="loading">로딩중...</div>

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">ARONTEC KOREA ADMIN</div>
                <div className="nav-links">
                    <Link to="/admin">대시보드</Link>
                    <Link to="/admin/members">회원 관리</Link>
                    <Link to="/admin/products">상품 관리</Link>
                    <Link to="/admin/quotes">견적 관리</Link>
                    <Link to="/admin/notifications">공지사항</Link>
                    <Link to="/dashboard">사용자 모드</Link>
                    <button onClick={handleLogout} className="btn-logout">로그아웃</button>
                </div>
            </nav>

            <div className="dashboard-content container">
                <div className="dashboard-header">
                    <h1>관리자 대시보드</h1>
                    <p>시스템 현황 및 관리</p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>👥 회원 가입 대기</h3>
                        <div className="stat-value">{stats.pendingMembers}건</div>
                        <p className="stat-desc">승인이 필요한 신규 파트너사</p>
                        <Link to="/admin/members" className="btn btn-primary btn-block" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                            회원 승인하러 가기
                        </Link>
                    </div>

                    <div className="dashboard-card">
                        <h3>📄 견적 요청 대기</h3>
                        <div className="stat-value">{stats.pendingQuotes}건</div>
                        <p className="stat-desc">처리되지 않은 견적 요청</p>
                        <Link to="/admin/quotes" className="btn btn-primary btn-block" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                            견적 관리하러 가기
                        </Link>
                    </div>

                    <div className="dashboard-card">
                        <h3>📦 재고 부족 상품</h3>
                        <div className="stat-value">{stats.lowStockProducts}개</div>
                        <p className="stat-desc">재고 10개 미만 상품</p>
                        <Link to="/admin/products" className="btn btn-primary btn-block" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                            상품 관리하러 가기
                        </Link>
                    </div>
                </div>

                <div className="quick-actions-card card">
                    <h3>⚡️ 빠른 작업</h3>
                    <div className="action-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/admin/products" className="btn btn-secondary">상품 등록</Link>
                        <Link to="/admin/members" className="btn btn-secondary">전체 회원 조회</Link>
                        <Link to="/admin/quotes" className="btn btn-secondary">전체 견적 조회</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard

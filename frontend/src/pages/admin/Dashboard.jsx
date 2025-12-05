import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../Dashboard.css'

import Navbar from '../../components/Navbar'

function AdminDashboard({ user }) {
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

    if (loading) return <div className="loading">로딩중...</div>

    return (
        <div className="dashboard">
            <Navbar user={user} isAdminMode={true} />

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
                        <Link to="/admin/proposals" className="btn btn-secondary">제안서 이력 조회</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Members() {
    const [members, setMembers] = useState([])

    useEffect(() => {
        fetchMembers()
    }, [])

    const fetchMembers = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/members', { credentials: 'include' })
        const data = await res.json()
        setMembers(data.members)
    }

    const toggleApproval = async (id, isApproved) => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/members/${id}/approval`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ approved: isApproved })
        })

        if (res.ok) {
            fetchMembers()
        } else {
            if (res.status === 401) {
                alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                window.location.href = '/login'
                return
            }
            alert('승인 상태 변경 실패')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('정말로 이 회원을 삭제하시겠습니까? 연관된 모든 데이터(견적서 등)가 함께 삭제됩니다.')) return

        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/members/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })

        if (res.ok) {
            alert('회원이 삭제되었습니다.')
            fetchMembers()
        } else {
            alert('회원 삭제 실패')
        }
    }

    const handleLogout = async () => {
        await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.href = '/login'
    }

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">ARONTEC KOREA ADMIN</div>
                <div className="nav-links">
                    <Link to="/admin">대시보드</Link>
                    <Link to="/admin/members" className="active">회원 관리</Link>
                    <Link to="/admin/products">상품 관리</Link>
                    <Link to="/admin/quotes">견적 관리</Link>
                    <Link to="/admin/notifications">공지사항</Link>
                    <Link to="/dashboard">사용자 모드</Link>
                    <button onClick={handleLogout} className="btn-logout">로그아웃</button>
                </div>
            </nav>

            <div className="dashboard-content container">
                <h1>회원 관리</h1>
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>회사명</th>
                                <th>담당자</th>
                                <th>이메일</th>
                                <th>승인 상태</th>
                                <th>등록일</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id}>
                                    <td>{member.company_name}</td>
                                    <td>{member.contact_person}</td>
                                    <td>{member.email}</td>
                                    <td>
                                        <span className={`badge ${member.is_approved ? 'badge-success' : 'badge-warning'}`}>
                                            {member.is_approved ? '승인' : '대기중'}
                                        </span>
                                    </td>
                                    <td>{new Date(member.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {!member.is_approved && (
                                                <button onClick={() => toggleApproval(member.id, true)} className="btn btn-primary">
                                                    승인
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(member.id)} className="btn btn-danger" style={{ backgroundColor: '#dc3545', color: 'white' }}>
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Members

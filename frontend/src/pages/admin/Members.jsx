import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../../components/Navbar'

function Members({ user }) {
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
        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/members/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isApproved })
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

    const handleResetPassword = async (id) => {
        if (!window.confirm('비밀번호를 "user1111"로 초기화하시겠습니까?')) return

        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/members/${id}/reset-password`, {
            method: 'POST',
            credentials: 'include'
        })

        if (res.ok) {
            alert('비밀번호가 "user1111"로 초기화되었습니다.')
        } else {
            alert('초기화 실패')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('정말로 이 회원을 삭제하시겠습니까? 연관된 모든 데이터(견적서 등)가 함께 삭제됩니다.')) return

        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/members/${id}/delete`, {
            method: 'POST',
            credentials: 'include'
        })

        if (res.ok) {
            alert('회원이 삭제되었습니다.')
            fetchMembers()
        } else {
            alert('회원 삭제 실패')
        }
    }

    return (
        <div className="dashboard">
            <Navbar user={user} isAdminMode={true} />

            <div className="dashboard-content container" style={{ maxWidth: '1600px' }}>
                <h1>회원 관리</h1>
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>회사명</th>
                                <th>사업자번호</th>
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
                                    <td>{member.business_number}</td>
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
                                            {!member.is_approved ? (
                                                <button onClick={() => toggleApproval(member.id, true)} className="btn btn-primary">
                                                    승인
                                                </button>
                                            ) : (
                                                <button onClick={() => toggleApproval(member.id, false)} className="btn btn-warning" style={{ backgroundColor: '#ffc107', color: 'black' }}>
                                                    사용중지
                                                </button>
                                            )}
                                            <button onClick={() => handleResetPassword(member.id)} className="btn btn-secondary" style={{ backgroundColor: '#6c757d', color: 'white' }}>
                                                비번초기화
                                            </button>
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

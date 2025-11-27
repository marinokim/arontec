import { useState, useEffect } from 'react'

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
        await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/members/${id}/approval`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ approved: isApproved })
        })
        fetchMembers()
    }

    return (
        <div className="catalog-page">
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
                                    {!member.is_approved && (
                                        <button onClick={() => toggleApproval(member.id, true)} className="btn btn-primary">
                                            승인
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Members

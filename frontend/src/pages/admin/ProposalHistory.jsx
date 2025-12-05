import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'

function ProposalHistory({ user }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/proposals/all', { credentials: 'include' })
            const data = await res.json()
            if (data.history) {
                setHistory(data.history)
            }
        } catch (error) {
            console.error('Failed to fetch proposal history:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="dashboard">
            <Navbar user={user} isAdminMode={true} />
            <div className="dashboard-content container">
                <div className="dashboard-header">
                    <h1>제안서 다운로드 이력 (전체)</h1>
                    <p>모든 사용자의 제안서 다운로드 내역입니다.</p>
                </div>

                <div className="card">
                    {loading ? (
                        <p>로딩중...</p>
                    ) : history.length === 0 ? (
                        <p className="text-muted">이력이 없습니다.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>회사명</th>
                                    <th>담당자</th>
                                    <th>파일명</th>
                                    <th>상품수</th>
                                    <th>다운로드 일시</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.company_name}</td>
                                        <td>{item.username} ({item.email})</td>
                                        <td>{item.title}</td>
                                        <td>{item.items?.length || 0}개</td>
                                        <td>{new Date(item.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProposalHistory

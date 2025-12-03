import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../../components/Navbar'

function AdminQuotes({ user }) {
    const [quotes, setQuotes] = useState([])
    const [shippingModal, setShippingModal] = useState({ open: false, quoteId: null })
    const [shippingInfo, setShippingInfo] = useState({ carrier: '', trackingNumber: '' })

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/quotes', { credentials: 'include' })
        const data = await res.json()
        setQuotes(data.quotes)
    }

    const updateStatus = async (id, status) => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/quotes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status })
        })

        if (res.ok) {
            fetchQuotes()
        } else {
            if (res.status === 401) {
                alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                window.location.href = '/login'
                return
            }
            alert('상태 변경 실패')
        }
    }

    const openShippingModal = (quoteId) => {
        setShippingModal({ open: true, quoteId })
        setShippingInfo({ carrier: '', trackingNumber: '' })
    }

    const handleShippingUpdate = async () => {
        if (!shippingInfo.carrier || !shippingInfo.trackingNumber) {
            alert('택배사와 송장번호를 입력해주세요.')
            return
        }

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/quotes/${shippingModal.quoteId}/shipping`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(shippingInfo)
            })

            if (res.ok) {
                alert('송장 정보가 등록되었습니다.')
                setShippingModal({ open: false, quoteId: null })
                fetchQuotes()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                alert('송장 등록에 실패했습니다.')
            }
        } catch (error) {
            console.error('Shipping update error:', error)
            alert('오류가 발생했습니다.')
        }
    }

    return (
        <div className="dashboard">
            <Navbar user={user} isAdminMode={true} />

            <div className="dashboard-content container">
                <h1>견적 관리</h1>
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>견적번호</th>
                                <th>회사명</th>
                                <th>담당자</th>
                                <th>금액</th>
                                <th>상태</th>
                                <th>요청일</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(quote => (
                                <tr key={quote.id}>
                                    <td>{quote.quote_number}</td>
                                    <td>{quote.company_name}</td>
                                    <td>{quote.contact_person}</td>
                                    <td>{parseInt(quote.total_amount).toLocaleString()}원</td>
                                    <td>
                                        <span className={`badge badge-${quote.status}`}>
                                            {quote.status === 'pending' ? '대기중' : quote.status === 'approved' ? '승인' : quote.status === 'shipped' ? '배송중' : '거절'}
                                        </span>
                                    </td>
                                    <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {quote.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateStatus(quote.id, 'approved')} className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
                                                    승인
                                                </button>
                                                <button onClick={() => updateStatus(quote.id, 'rejected')} className="btn btn-secondary">
                                                    거절
                                                </button>
                                            </>
                                        )}
                                        {quote.status === 'approved' && (
                                            <button onClick={() => openShippingModal(quote.id)} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                                                송장 등록
                                            </button>
                                        )}
                                        {quote.status === 'shipped' && (
                                            <div style={{ fontSize: '0.8rem' }}>
                                                <div>{quote.carrier}</div>
                                                <div>{quote.tracking_number}</div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {shippingModal.open && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px' }}>
                            <h2>송장 등록</h2>
                            <div style={{ margin: '1rem 0' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>택배사</label>
                                <input
                                    type="text"
                                    value={shippingInfo.carrier}
                                    onChange={e => setShippingInfo({ ...shippingInfo, carrier: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    placeholder="예: CJ대한통운"
                                />
                            </div>
                            <div style={{ margin: '1rem 0' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>송장번호</label>
                                <input
                                    type="text"
                                    value={shippingInfo.trackingNumber}
                                    onChange={e => setShippingInfo({ ...shippingInfo, trackingNumber: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    placeholder="숫자만 입력"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button onClick={() => setShippingModal({ open: false, quoteId: null })} className="btn btn-secondary">취소</button>
                                <button onClick={handleShippingUpdate} className="btn btn-primary">등록</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminQuotes

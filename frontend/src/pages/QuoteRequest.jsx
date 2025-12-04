import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Navbar from '../components/Navbar'

function QuoteRequest({ user }) {
    const [formData, setFormData] = useState({ deliveryDate: '', notes: '' })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error)
            }

            alert('견적 요청이 완료되었습니다!')
            navigate('/mypage')
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="catalog-page">
            <Navbar user={user} />
            <div className="catalog-header">
                <h1>견적 요청</h1>
                <button onClick={() => navigate('/cart')} className="btn btn-secondary">← 장바구니</button>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>희망 납기일 *</label>
                        <input
                            type="date"
                            value={formData.deliveryDate}
                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>비고</label>
                        <textarea
                            rows="5"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="요청사항을 입력해주세요"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '요청 중...' : '견적 요청'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default QuoteRequest

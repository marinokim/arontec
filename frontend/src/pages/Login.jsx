import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'

function Login({ setUser }) {
    const [formData, setFormData] = useState({ businessNumber: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || '로그인 실패')
            }

            setUser(data.user)
            navigate('/dashboard')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
    const [forgotStep, setForgotStep] = useState(1) // 1: Check, 2: Reset
    const [forgotForm, setForgotForm] = useState({
        email: '',
        contactPerson: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [resetUserId, setResetUserId] = useState(null)

    const handleForgotCheck = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/reset-password-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotForm.email,
                    contactPerson: forgotForm.contactPerson,
                    phone: forgotForm.phone
                })
            })

            const data = await res.json()

            if (res.ok) {
                setResetUserId(data.userId)
                setForgotStep(2)
            } else {
                alert(data.error || '일치하는 회원 정보를 찾을 수 없습니다')
            }
        } catch (error) {
            console.error('Check error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (forgotForm.newPassword !== forgotForm.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다')
            return
        }

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: resetUserId,
                    newPassword: forgotForm.newPassword
                })
            })

            if (res.ok) {
                alert('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.')
                setIsForgotModalOpen(false)
                setForgotStep(1)
                setForgotForm({ email: '', contactPerson: '', phone: '', newPassword: '', confirmPassword: '' })
            } else {
                const data = await res.json()
                alert(data.error || '비밀번호 재설정에 실패했습니다')
            }
        } catch (error) {
            console.error('Reset error:', error)
            alert('오류가 발생했습니다')
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>ARONTEC KOREA B2B SCM</h1>
                    <p>파트너사 전용 시스템</p>
                </div>

                <div className="warning-message" style={{
                    color: '#dc3545',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '10px',
                    border: '2px solid #dc3545',
                    borderRadius: '8px',
                    backgroundColor: '#fff5f5'
                }}>
                    당사 모든상품은 온라인노출 불가하며<br />
                    패쇄몰,특판만 가능합니다
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>사업자번호</label>
                        <input
                            type="text"
                            name="businessNumber"
                            value={formData.businessNumber}
                            onChange={handleChange}
                            required
                            placeholder="사업자번호를 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '로그인 중...' : '로그인'}
                    </button>

                    <div className="login-footer">
                        <p>아직 계정이 없으신가요? <Link to="/register">회원가입</Link></p>
                        <p style={{ marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setIsForgotModalOpen(true)}
                                style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                비밀번호를 잊으셨나요?
                            </button>
                        </p>
                    </div>
                </form>
            </div>

            {isForgotModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>비밀번호 찾기</h2>

                        {forgotStep === 1 ? (
                            <form onSubmit={handleForgotCheck}>
                                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                    가입 시 입력한 정보를 입력해주세요.
                                </p>
                                <div className="form-group">
                                    <label>이메일</label>
                                    <input
                                        type="email"
                                        value={forgotForm.email}
                                        onChange={e => setForgotForm({ ...forgotForm, email: e.target.value })}
                                        required
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>담당자명</label>
                                    <input
                                        type="text"
                                        value={forgotForm.contactPerson}
                                        onChange={e => setForgotForm({ ...forgotForm, contactPerson: e.target.value })}
                                        required
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>전화번호</label>
                                    <input
                                        type="text"
                                        value={forgotForm.phone}
                                        onChange={e => setForgotForm({ ...forgotForm, phone: e.target.value })}
                                        required
                                        className="form-control"
                                        placeholder="010-0000-0000"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '2rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setIsForgotModalOpen(false)} className="btn btn-secondary">취소</button>
                                    <button type="submit" className="btn btn-primary">확인</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                    새로운 비밀번호를 입력해주세요.
                                </p>
                                <div className="form-group">
                                    <label>새 비밀번호</label>
                                    <input
                                        type="password"
                                        value={forgotForm.newPassword}
                                        onChange={e => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                                        required
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        value={forgotForm.confirmPassword}
                                        onChange={e => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                                        required
                                        className="form-control"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '2rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => { setIsForgotModalOpen(false); setForgotStep(1); }} className="btn btn-secondary">취소</button>
                                    <button type="submit" className="btn btn-primary">변경하기</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Login

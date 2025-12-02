import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'

function Login({ setUser }) {
    const [formData, setFormData] = useState({ email: '', password: '' })
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
                        <label>이메일</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="이메일을 입력하세요"
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
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login

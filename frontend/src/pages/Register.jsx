import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        contactPerson: '',
        phone: '',
        businessNumber: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    const formatBusinessNumber = (value) => {
        const numbers = value.replace(/[^0-9]/g, '')
        if (numbers.length <= 3) return numbers
        if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name === 'businessNumber') {
            setFormData({ ...formData, [name]: formatBusinessNumber(value) })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다')
            return
        }

        setLoading(true)

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    businessNumber: formData.businessNumber.replace(/-/g, '')
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || '회원가입 실패')
            }

            setSuccess(true)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="success-message">
                        <h2>✅ 회원가입 완료!</h2>
                        <p>관리자 승인 후 이용 가능합니다.</p>
                        <p>곧 로그인 페이지로 이동합니다...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>파트너사 회원가입</h1>
                    <p>B2B 전용 시스템 가입 신청</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>사업자번호 (아이디) *</label>
                        <input type="text" name="businessNumber" value={formData.businessNumber} onChange={handleChange} required placeholder="000-00-00000" maxLength="12" />
                    </div>

                    <div className="form-group">
                        <label>이메일 *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>비밀번호 *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            style={{ imeMode: 'disabled' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>비밀번호 확인 *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            style={{ imeMode: 'disabled' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>회사명 *</label>
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>담당자명 *</label>
                        <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>연락처</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>



                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? '가입 신청 중...' : '가입 신청'}
                    </button>

                    <div className="login-footer">
                        <p>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Register

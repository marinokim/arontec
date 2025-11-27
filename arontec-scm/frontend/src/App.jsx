import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Catalog from './pages/Catalog'
import Cart from './pages/Cart'
import QuoteRequest from './pages/QuoteRequest'
import MyPage from './pages/MyPage'
import AdminDashboard from './pages/admin/Dashboard'
import AdminMembers from './pages/admin/Members'
import AdminProducts from './pages/admin/Products'
import AdminQuotes from './pages/admin/Quotes'
import ProductDetail from './pages/ProductDetail'

function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = async () => {
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/me', { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)
                }
            } catch (error) {
                console.error('Auth check failed:', error)
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    if (loading) {
        return <div className="loading">로딩중...</div>
    }

    return (
        <Router>
            <div className="app">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
                    <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

                    {/* Protected Routes - B2B Partner */}
                    <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
                    <Route path="/catalog" element={user ? <Catalog /> : <Navigate to="/login" />} />
                    <Route path="/product/:id" element={user ? <ProductDetail /> : <Navigate to="/login" />} />
                    <Route path="/cart" element={user ? <Cart /> : <Navigate to="/login" />} />
                    <Route path="/quote-request" element={user ? <QuoteRequest /> : <Navigate to="/login" />} />
                    <Route path="/mypage" element={user ? <MyPage user={user} /> : <Navigate to="/login" />} />

                    {/* Protected Routes - Admin Only */}
                    <Route path="/admin" element={user?.isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
                    <Route path="/admin/members" element={user?.isAdmin ? <AdminMembers /> : <Navigate to="/dashboard" />} />
                    <Route path="/admin/products" element={user?.isAdmin ? <AdminProducts /> : <Navigate to="/dashboard" />} />
                    <Route path="/admin/quotes" element={user?.isAdmin ? <AdminQuotes /> : <Navigate to="/dashboard" />} />

                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App

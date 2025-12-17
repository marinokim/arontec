import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Catalog.css'
import { sortCategories, getCategoryColor } from '../constants/categories'

import Navbar from '../components/Navbar'
import ProposalGuide from '../components/ProposalGuide'
import ProposalModal from '../components/ProposalModal'
import ProposalFABs from '../components/ProposalFABs'
import { generateProposalExcel } from '../utils/proposalUtils'

function Catalog({ user }) {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [totalCount, setTotalCount] = useState(0)

    // Initialize state from sessionStorage if available
    const [selectedCategory, setSelectedCategory] = useState(() => {
        return sessionStorage.getItem('catalog_category') || ''
    })
    const [showNewOnly, setShowNewOnly] = useState(() => {
        return sessionStorage.getItem('catalog_showNew') === 'true'
    })
    const [search, setSearch] = useState(() => {
        return sessionStorage.getItem('catalog_search') || ''
    })
    const [sortBy, setSortBy] = useState(() => {
        return sessionStorage.getItem('catalog_sortBy') || 'newest'
    })

    const [proposalItems, setProposalItems] = useState([])
    const [showProposalModal, setShowProposalModal] = useState(false)
    const [showGuide, setShowGuide] = useState(() => localStorage.getItem('catalog_showGuide') !== 'false')
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (location.state?.openProposal) {
            setShowProposalModal(true)
            // Clear the state so it doesn't reopen on refresh?
            // Actually replacing state is better but for now this works.
            window.history.replaceState({}, document.title)
        }
    }, [location])

    // Save state to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('catalog_category', selectedCategory)
        sessionStorage.setItem('catalog_showNew', showNewOnly)
        sessionStorage.setItem('catalog_search', search)
        sessionStorage.setItem('catalog_sortBy', sortBy)
    }, [selectedCategory, showNewOnly, search, sortBy])

    // Restore scroll position
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('catalog_scroll')
        if (savedScroll && products.length > 0) {
            // Small timeout to ensure rendering is done
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll))
                // Optional: Clear scroll after restoring? 
                // No, keep it in case user navigates away and back again without unmounting/remounting issues, 
                // though usually we want to clear it if they navigate to a different page from catalog that isn't product detail.
                // But detecting "where they are going" is hard here.
                // Let's just keep it. If they manually scroll, it updates.
            }, 100)
        }
    }, [products])

    // Save scroll position on scroll
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('catalog_scroll', window.scrollY)
        }

        // Debounce scroll handler
        let timeoutId
        const debouncedScroll = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleScroll, 100)
        }

        window.addEventListener('scroll', debouncedScroll)
        return () => {
            window.removeEventListener('scroll', debouncedScroll)
            clearTimeout(timeoutId)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
        fetchProducts()
        const savedProposal = localStorage.getItem('proposalItems')
        if (savedProposal) {
            setProposalItems(JSON.parse(savedProposal))
        }
    }, [selectedCategory, search, showNewOnly, sortBy])

    // Restore scroll position
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('catalog_scroll')
        if (savedScroll && products.length > 0) {
            const targetScroll = parseInt(savedScroll)

            // Robust scroll restoration with retries
            const attemptScroll = (attempt) => {
                window.scrollTo(0, targetScroll)

                // Check if restoration was successful
                // We consider it success if we are close to target OR if we hit the bottom
                const currentFn = window.scrollY
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight
                const isCloseEnough = Math.abs(currentFn - targetScroll) < 20
                const isAtBottom = targetScroll >= maxScroll && currentFn >= maxScroll - 20

                if (isCloseEnough || isAtBottom) {
                    sessionStorage.removeItem('catalog_scroll')
                } else if (attempt < 5) { // Retry up to 5 times (approx 1.5s total)
                    setTimeout(() => attemptScroll(attempt + 1), 100 + (attempt * 50))
                } else {
                    // Final cleanup even if failed, to avoid jumping later
                    sessionStorage.removeItem('catalog_scroll')
                }
            }

            // Initial attempt
            setTimeout(() => attemptScroll(1), 50)
        }
    }, [products])

    const fetchCategories = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/categories?sort=display_order', { credentials: 'include' })
        const data = await res.json()
        setCategories(data.categories)
        setTotalCount(data.totalCount || 0)
    }

    const fetchProducts = async () => {
        const params = new URLSearchParams()
        if (selectedCategory) params.append('category', selectedCategory)
        if (search) params.append('search', search)
        if (showNewOnly) params.append('isNew', 'true')
        params.append('sort', sortBy)

        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products?${params}`, { credentials: 'include' })
        const data = await res.json()
        setProducts(data.products)
    }

    const addToCart = async (productId, items) => {
        // items can be a single object { quantity, option } or an array of objects
        const itemsToAdd = Array.isArray(items) ? items : [items]

        if (itemsToAdd.length === 0) return

        let successCount = 0

        for (const item of itemsToAdd) {
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        productId,
                        quantity: item.quantity,
                        option: item.option
                    })
                })

                if (res.ok) {
                    successCount++
                } else {
                    if (res.status === 401) {
                        alert('로그인이 필요합니다')
                        return
                    }
                    const data = await res.json()
                    console.error('Add to cart failed:', data.error)
                }
            } catch (error) {
                console.error('Add to cart error:', error)
            }
        }

        if (successCount > 0) {
            alert(`${successCount}개 항목이 장바구니에 추가되었습니다`)
        } else {
            alert('장바구니 추가에 실패했습니다')
        }
    }

    const addToProposal = (product) => {
        if (proposalItems.find(item => item.id === product.id)) {
            alert('이미 제안서 목록에 있는 상품입니다.')
            return
        }
        const newItems = [...proposalItems, product]
        setProposalItems(newItems)
        localStorage.setItem('proposalItems', JSON.stringify(newItems))
    }

    const removeFromProposal = (productId) => {
        const newItems = proposalItems.filter(item => item.id !== productId)
        setProposalItems(newItems)
        localStorage.setItem('proposalItems', JSON.stringify(newItems))
    }

    const handleDownloadProposal = () => {
        generateProposalExcel(proposalItems, user, setProposalItems, setShowProposalModal)
    }

    return (
        <div className="catalog-page">
            <Navbar user={user} />
            <div className="sticky-header-wrapper">
                <div className="catalog-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h1>상품 카탈로그</h1>
                        <label style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: showNewOnly ? '#ff4444' : '#fff',
                            padding: '8px 16px',
                            borderRadius: '25px',
                            border: '2px solid #ff4444',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            whiteSpace: 'nowrap'
                        }}>
                            <input
                                type="checkbox"
                                checked={showNewOnly}
                                onChange={(e) => setShowNewOnly(e.target.checked)}
                                style={{ display: 'none' }}
                            />
                            <span style={{
                                fontWeight: 'bold',
                                color: showNewOnly ? '#fff' : '#ff4444',
                                fontSize: '0.9rem'
                            }}>
                                {showNewOnly ? '✓ NEW' : 'NEW 신상품'}
                            </span>
                        </label>
                    </div>

                    <div className="search-container">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            className="search-input-enhanced"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="상품명, 브랜드, 모델명으로 검색해보세요"
                        />
                    </div>

                    <div className="sort-controls" style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                        {[
                            { id: 'newest', label: '최신순' },
                            { id: 'price_asc', label: '낮은가격순' },
                            { id: 'price_desc', label: '높은가격순' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setSortBy(opt.id)}
                                style={{
                                    background: sortBy === opt.id ? '#4a5568' : '#fff',
                                    color: sortBy === opt.id ? '#fff' : '#718096',
                                    border: `1px solid ${sortBy === opt.id ? '#4a5568' : '#e2e8f0'}`,
                                    padding: '6px 12px',
                                    borderRadius: '15px',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: sortBy === opt.id ? '600' : '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>← 대시보드</button>
                </div>

                <ProposalGuide
                    show={showGuide}
                    onClose={() => {
                        setShowGuide(false)
                        localStorage.setItem('catalog_showGuide', 'false')
                    }}
                />

                <div className="catalog-filters">
                    <div className="category-list" style={{
                        display: 'flex',
                        gap: '10px',
                        paddingBottom: '5px'
                    }}>
                        <style>
                            {`
                            .category-list::-webkit-scrollbar {
                                display: none;
                            }
                            .category-btn {
                                white-space: nowrap;
                                padding: 8px 16px;
                                border-radius: 20px;
                                border: 1px solid #eee;
                                background: white;
                                cursor: pointer;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                font-size: 0.95rem;
                                color: #666;
                                display: flex;
                                alignItems: center;
                                gap: 6px;
                            }
                            .category-btn:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            }
                            .category-count {
                                background: rgba(0,0,0,0.05);
                                padding: 2px 8px;
                                borderRadius: 10px;
                                font-size: 0.8rem;
                            }
                        `}
                        </style>
                        <button
                            className="category-btn"
                            onClick={() => setSelectedCategory('')}
                            style={{
                                backgroundColor: selectedCategory === '' ? '#007bff' : 'white',
                                color: selectedCategory === '' ? 'white' : '#666',
                                borderColor: '#007bff'
                            }}
                        >
                            전체
                            <span className="category-count" style={{
                                background: selectedCategory === '' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                color: selectedCategory === '' ? 'white' : 'inherit'
                            }}>{totalCount}</span>
                        </button>
                        {sortCategories(categories).map(cat => {
                            const catColor = getCategoryColor(cat.name);
                            const isActive = selectedCategory === cat.slug;

                            return (
                                <button
                                    key={cat.id}
                                    className="category-btn"
                                    onClick={() => setSelectedCategory(cat.slug)}
                                    style={{
                                        backgroundColor: isActive ? catColor : 'white',
                                        color: isActive ? 'white' : catColor,
                                        borderColor: catColor,
                                        fontWeight: isActive ? 'bold' : 'normal',
                                        boxShadow: isActive ? `0 4px 12px ${catColor}40` : 'none'
                                    }}
                                >
                                    {cat.name}
                                    <span className="category-count" style={{
                                        background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                        color: isActive ? 'white' : 'inherit'
                                    }}>{cat.product_count || 0}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>



            <div className="products-grid">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        onAddToProposal={addToProposal}
                        onRemoveFromProposal={removeFromProposal}
                        navigate={navigate}
                        user={user}
                        proposalItems={proposalItems}
                    />
                ))}
            </div>

            {
                products.length === 0 && (
                    <div className="no-products">조회된 상품이 없습니다</div>
                )
            }

            <ProposalFABs
                itemCount={proposalItems.length}
                onOpenProposal={() => setShowProposalModal(true)}
                onOpenGuide={() => setShowGuide(true)}
            />

            <ProposalModal
                show={showProposalModal}
                onClose={() => setShowProposalModal(false)}
                items={proposalItems}
                onRemove={removeFromProposal}
                onClear={() => {
                    setProposalItems([])
                    localStorage.removeItem('proposalItems')
                }}
                onDownload={handleDownloadProposal}
            />
        </div >
    )
}

function ProductCard({ product, onAddToCart, onAddToProposal, onRemoveFromProposal, navigate, user, proposalItems }) {
    const [isHovered, setIsHovered] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [quantities, setQuantities] = useState({})
    const [defaultQuantity, setDefaultQuantity] = useState(1)

    const isInProposal = proposalItems && proposalItems.find(item => item.id === product.id)

    // Parse options: support comma, newline, slash
    const rawOptions = product.product_options

    const options = rawOptions
        ? rawOptions.split(/[,/\n]+/).map(opt => opt.trim()).filter(opt => opt)
        : []

    // Initialize quantities for options
    useEffect(() => {
        if (options.length > 0) {
            const initialQuantities = {}
            options.forEach(opt => {
                initialQuantities[opt] = 0
            })
            setQuantities(initialQuantities)
        }
    }, [product.product_options])

    const handleQuantityChange = (option, delta) => {
        setQuantities(prev => ({
            ...prev,
            [option]: Math.max(0, (prev[option] || 0) + delta)
        }))
    }

    const handleAddToCart = (e) => {
        e.stopPropagation()

        if (options.length > 0) {
            const itemsToAdd = Object.entries(quantities)
                .filter(([_, qty]) => qty > 0)
                .map(([opt, qty]) => ({
                    quantity: qty,
                    option: opt
                }))

            if (itemsToAdd.length === 0) {
                alert('최소 1개 이상의 옵션을 선택해주세요')
                return
            }

            onAddToCart(product.id, itemsToAdd)

            // Reset quantities after add
            const resetQuantities = {}
            options.forEach(opt => {
                resetQuantities[opt] = 0
            })
            setQuantities(resetQuantities)
        } else {
            onAddToCart(product.id, { quantity: defaultQuantity, option: '' })
        }

        // Optional: Close after adding? Let's keep it open or close it.
        // User might want to add more. Let's keep it open but maybe give feedback.
        // For now, let's close it to indicate success and reset state.
        setIsLocked(false)
        setIsHovered(false)
    }

    const handleAddToProposal = (e) => {
        e.stopPropagation()
        if (isInProposal) {
            onRemoveFromProposal(product.id)
        } else {
            onAddToProposal(product)
        }
    }

    const showOptions = isHovered || isLocked

    return (
        <div
            className="product-card"
            onClick={() => {
                sessionStorage.setItem('catalog_scroll', window.scrollY.toString())
                navigate(`/product/${product.id}`)
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="product-image-container">
                <div className={`product-image ${showOptions ? 'hovered' : ''}`}>
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.model_name} />
                    ) : (
                        <div className="no-image">No Image</div>
                    )}

                    <button
                        className={`product-heart-btn ${isInProposal ? 'active' : ''}`}
                        onClick={handleAddToProposal}
                        title={isInProposal ? '제안서에서 제거' : '제안서에 담기'}
                    >
                        ♥
                    </button>

                    {showOptions && (
                        <div className="image-overlay">
                            <h3>{product.brand}</h3>
                            <p className="model">{product.model_name}</p>
                            <div className="prices">
                                <span className="consumer-price">{parseInt(product.consumer_price).toLocaleString()}</span>
                                <span className="b2b-price">{parseInt(product.b2b_price).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!showOptions ? (
                <div className="product-info-default">
                    <h3>{product.brand}</h3>
                    <p className="model">{product.model_name}</p>
                    <div className="prices">
                        <span className="consumer-price">{parseInt(product.consumer_price).toLocaleString()}</span>
                        <span className="b2b-price">{parseInt(product.b2b_price).toLocaleString()}</span>
                    </div>
                    {product.remarks && (
                        <p className="remarks">{product.remarks}</p>
                    )}
                    <div className="action-buttons-default">
                        <button
                            className="btn-add-cart-default"
                            onMouseEnter={() => setIsHovered(true)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLocked(true);
                                setIsHovered(true);
                            }}
                        >
                            바로담기
                        </button>
                    </div>
                </div>
            ) : (
                <div className="product-actions-hover" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLocked(false);
                                setIsHovered(false);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#999', padding: '0 5px' }}
                            title="닫기"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="option-selector-container" style={{
                        maxHeight: '150px',
                        overflowY: 'auto',
                        marginBottom: '10px',
                        width: '100%'
                    }}>
                        {options.length > 0 ? (
                            <div className="option-list" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {options.map((opt, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#333' }}>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '5px' }}>{opt}</span>
                                        <div className="quantity-control" style={{ background: '#f1f3f5', borderRadius: '4px', padding: '2px' }}>
                                            <button onClick={() => handleQuantityChange(opt, -1)} style={{ color: '#333', border: 'none', background: 'transparent' }}>-</button>
                                            <span style={{ minWidth: '20px', textAlign: 'center', display: 'inline-block', fontWeight: 'bold' }}>{quantities[opt] || 0}</span>
                                            <button onClick={() => handleQuantityChange(opt, 1)} style={{ color: '#333', border: 'none', background: 'transparent' }}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333' }}>
                                <span>기본 옵션</span>
                                <div className="quantity-control" style={{ background: '#f1f3f5', borderRadius: '4px', padding: '2px' }}>
                                    <button onClick={() => setDefaultQuantity(Math.max(1, defaultQuantity - 1))} style={{ color: '#333', border: 'none', background: 'transparent' }}>-</button>
                                    <span style={{ minWidth: '20px', textAlign: 'center', display: 'inline-block', fontWeight: 'bold' }}>{defaultQuantity}</span>
                                    <button onClick={() => setDefaultQuantity(defaultQuantity + 1)} style={{ color: '#333', border: 'none', background: 'transparent' }}>+</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn-add-cart-hover"
                        onClick={handleAddToCart}
                        style={{ width: '100%', marginTop: '5px' }}
                    >
                        바로담기
                    </button>
                </div>
            )}
        </div>
    )
}

export default Catalog

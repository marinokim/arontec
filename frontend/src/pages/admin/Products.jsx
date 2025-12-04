import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getCategoryColor, sortCategories, CATEGORY_ORDER } from '../../constants/categories'

import Navbar from '../../components/Navbar'

function AdminProducts({ user }) {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [brands, setBrands] = useState([])
    const [manufacturers, setManufacturers] = useState([])
    const [origins, setOrigins] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showModal, setShowModal] = useState(false)
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isExcelUploading, setIsExcelUploading] = useState(false)
    const scrollPosition = useRef(0)



    const rankingOptions = [
        { label: '최상단', value: 100 },
        { label: '상단', value: 80 },
        { label: '중상단', value: 60 },
        { label: '중간', value: 40 },
        { label: '중하단', value: 20 },
        { label: '하단', value: 10 },
        { label: '최하단', value: 0 }
    ]

    const initialFormState = {
        categoryId: '',
        brand: '',
        modelName: '', // This is now "Product Name"
        modelNo: '',   // This is the new "Model Name"
        description: '',
        productSpec: '', // New field
        imageUrl: '',
        consumerPrice: '',
        supplyPrice: '',
        b2bPrice: '',
        stockQuantity: '',
        quantityPerCarton: '',
        shippingFeeIndividual: '',
        shippingFeeCarton: '',
        productOptions: '',
        manufacturer: '',
        origin: '',
        isAvailable: true,
        isTaxFree: false,
        detailUrl: '',
        remarks: '',
        displayOrder: '0'
    }

    const [formData, setFormData] = useState(initialFormState)
    const [isDownloading, setIsDownloading] = useState(false)
    const [showDownloadModal, setShowDownloadModal] = useState(false)
    const [downloadFilterType, setDownloadFilterType] = useState('all') // 'all', 'category', 'brand'
    const [downloadTarget, setDownloadTarget] = useState('')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadMode, setUploadMode] = useState('all') // 'all', 'new', 'update'

    useEffect(() => {
        fetchProducts()
        fetchCategories()
        fetchBrands()
        fetchManufacturers()
        fetchOrigins()
    }, [])

    useEffect(() => {
        if (scrollPosition.current > 0) {
            window.scrollTo(0, scrollPosition.current)
            scrollPosition.current = 0
        }
    }, [products])

    const fetchBrands = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/brands', { credentials: 'include' })
            const data = await res.json()
            setBrands(data.brands)
        } catch (error) {
            console.error('Fetch brands error:', error)
        }
    }

    const fetchManufacturers = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/manufacturers', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setManufacturers(data.manufacturers || [])
            } else {
                setManufacturers([])
            }
        } catch (error) {
            console.error('Fetch manufacturers error:', error)
            setManufacturers([])
        }
    }

    const fetchOrigins = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/origins', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setOrigins(data.origins || [])
            } else {
                setOrigins([])
            }
        } catch (error) {
            console.error('Fetch origins error:', error)
            setOrigins([])
        }
    }

    const fetchProducts = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products', { credentials: 'include' })
        const data = await res.json()
        setProducts(data.products)
    }

    const fetchCategories = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/categories', { credentials: 'include' })
        const data = await res.json()
        setCategories(sortCategories(data.categories || []))
    }

    const formatPrice = (value) => {
        if (!value) return ''
        // Handle numeric values that might have decimals (e.g. 3000.00 from DB)
        const stringValue = typeof value === 'number' ? Math.floor(value).toString() : value.toString()
        // If string contains decimal, take integer part
        const integerPart = stringValue.split('.')[0]
        const number = integerPart.replace(/[^0-9]/g, '')
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    const parsePrice = (value) => {
        if (!value) return ''
        return value.toString().replace(/,/g, '')
    }

    const handlePriceChange = (field, value) => {
        const formatted = formatPrice(value)
        setFormData({ ...formData, [field]: formatted })
    }

    const extractImageFromHtml = async (url) => {
        if (!url || !url.match(/\.html?$/i)) return null

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/proxy-image?url=${encodeURIComponent(url)}`)
            if (res.ok) {
                const html = await res.text()
                const match = html.match(/<img[^>]+src=['"]([^'"]+)['"]/)
                if (match && match[1]) {
                    let imgUrl = match[1]
                    if (!imgUrl.startsWith('http')) {
                        // Resolve relative URL
                        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
                        imgUrl = new URL(imgUrl, baseUrl).href
                    }
                    return imgUrl
                }
            }
        } catch (error) {
            console.error('Failed to extract image from HTML:', error)
        }
        return null
    }

    const extractAllImagesFromHtml = async (url) => {
        if (!url || !url.match(/\.html?$/i)) return null

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/proxy-image?url=${encodeURIComponent(url)}`)
            if (res.ok) {
                const html = await res.text()
                console.log('Fetched HTML length:', html.length)

                // More robust regex: case insensitive, handles spaces around =
                const regex = /<img\s+[^>]*src\s*=\s*['"]([^'"]+)['"]/gi
                const matches = []
                let match
                while ((match = regex.exec(html)) !== null) {
                    let imgUrl = match[1]
                    if (!imgUrl.startsWith('http')) {
                        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
                        imgUrl = new URL(imgUrl, baseUrl).href
                    }
                    matches.push(imgUrl)
                }

                console.log(`Found ${matches.length} images in HTML`)

                if (matches.length > 0) {
                    // Convert to HTML tags as requested
                    return matches.map(imgUrl => `<img src="${imgUrl}"><br>`).join('')
                }
            }
        } catch (error) {
            console.error('Failed to extract images from HTML:', error)
        }
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const baseUrl = import.meta.env.VITE_API_URL || ''
        const url = editingProduct ? `${baseUrl}/api/products/${editingProduct.id}` : `${baseUrl}/api/products`
        const method = editingProduct ? 'PUT' : 'POST'

        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            let finalImageUrl = formData.imageUrl
            // Check for <img src="..."> tag first
            const imgTagSrc = finalImageUrl && finalImageUrl.match(/<img[^>]+src=['"]([^'"]+)['"]/i)
            if (imgTagSrc && imgTagSrc[1]) {
                finalImageUrl = imgTagSrc[1]
            } else if (finalImageUrl && finalImageUrl.match(/\.html?$/i)) {
                const extractedUrl = await extractImageFromHtml(finalImageUrl)
                if (extractedUrl) {
                    finalImageUrl = extractedUrl
                }
            }

            let finalDetailUrl = formData.detailUrl
            if (finalDetailUrl && finalDetailUrl.match(/\.html?$/i)) {
                const extractedHtml = await extractAllImagesFromHtml(finalDetailUrl)
                if (extractedHtml) {
                    finalDetailUrl = extractedHtml
                }
            }

            const payload = {
                ...formData,
                imageUrl: finalImageUrl,
                detailUrl: finalDetailUrl,
                consumerPrice: parsePrice(formData.consumerPrice),
                supplyPrice: parsePrice(formData.supplyPrice),
                b2bPrice: parsePrice(formData.b2bPrice),
                b2bPrice: parsePrice(formData.b2bPrice),
                stockQuantity: parsePrice(formData.stockQuantity),
                quantityPerCarton: formData.quantityPerCarton ? formData.quantityPerCarton : '0',
                shippingFeeIndividual: formData.shippingFeeIndividual ? parsePrice(formData.shippingFeeIndividual) : '0',
                shippingFeeCarton: formData.shippingFeeCarton ? parsePrice(formData.shippingFeeCarton) : '0',
                // Keep legacy shippingFee for compatibility if needed, or remove it. Let's set it to individual fee for now.
                shippingFee: formData.shippingFeeIndividual ? parsePrice(formData.shippingFeeIndividual) : '0',
                productOptions: formData.productOptions,
                // Remove double quotes from text fields as requested
                modelName: formData.modelName ? formData.modelName.replace(/"/g, '') : '',
                modelNo: formData.modelNo ? formData.modelNo.replace(/"/g, '') : '',
                manufacturer: formData.manufacturer ? formData.manufacturer.replace(/"/g, '') : '',
                origin: formData.origin ? formData.origin.replace(/"/g, '') : '',
                isTaxFree: formData.isTaxFree,
                remarks: formData.remarks ? formData.remarks.replace(/"/g, '') : '',
                productOptions: formData.productOptions ? formData.productOptions.replace(/"/g, '') : '',
                productOptions: formData.productOptions ? formData.productOptions.replace(/"/g, '') : '',
                description: formData.description ? formData.description.replace(/"/g, '') : '',
                productSpec: formData.productSpec ? formData.productSpec.replace(/"/g, '') : '',
                displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert(editingProduct ? '상품이 수정되었습니다' : '상품이 등록되었습니다')

                // Save scroll position
                scrollPosition.current = window.scrollY

                setShowModal(false)
                setEditingProduct(null)
                setFormData(initialFormState)
                fetchProducts()
                fetchBrands()
                fetchManufacturers()
                fetchOrigins()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                const data = await res.json()
                alert(data.error || '오류가 발생했습니다')
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert('오류가 발생했습니다')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleNew = async (productId, currentStatus) => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${productId}/new-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isNew: !currentStatus })
            })

            if (res.ok) {
                fetchProducts()
            } else {
                alert('상태 변경 실패')
            }
        } catch (error) {
            console.error('Error toggling new status:', error)
            alert('상태 변경 중 오류 발생')
        }
    }

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0]
        if (!file) return

        if (isUploading) return
        setIsUploading(true)

        const formData = new FormData()
        formData.append('image', file)

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })

            if (res.ok) {
                const data = await res.json()

                let fullUrl = data.url
                // Only prepend API URL if the returned URL is relative (starts with /)
                if (fullUrl.startsWith('/')) {
                    let apiUrl = import.meta.env.VITE_API_URL || ''
                    if (apiUrl && !apiUrl.startsWith('http') && !apiUrl.startsWith('/')) {
                        apiUrl = 'https://' + apiUrl
                    }
                    fullUrl = apiUrl + fullUrl
                }

                setFormData(prev => ({ ...prev, [field]: fullUrl }))
                alert('이미지 업로드 성공')
            } else {
                alert('이미지 업로드 실패')
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('이미지 업로드 중 오류 발생')
        } finally {
            setIsUploading(false)
            // Reset file input
            e.target.value = ''
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${id}`, { method: 'DELETE', credentials: 'include' })
            if (res.ok) {
                fetchProducts()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                alert('삭제 실패')
            }
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handleToggleAvailability = async (product) => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${product.id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isAvailable: !product.is_available })
            })

            if (res.ok) {
                setProducts(products.map(p =>
                    p.id === product.id ? { ...p, is_available: !p.is_available } : p
                ))
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                const data = await res.json()
                alert(data.error || '상태 변경 실패')
            }
        } catch (error) {
            console.error('Toggle availability error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const handleDisplayOrderChange = async (productId, newOrder) => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${productId}/display-order`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ displayOrder: parseInt(newOrder) })
            })

            if (res.ok) {
                // Save scroll position
                scrollPosition.current = window.scrollY
                fetchProducts() // Refetch to re-sort
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                alert('순위 변경 실패')
            }
        } catch (error) {
            console.error('Change display order error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setFormData({
            categoryId: product.category_id,
            brand: product.brand,
            modelName: product.model_name,
            modelNo: product.model_no || '',
            description: product.description || '',
            imageUrl: product.image_url || '',
            consumerPrice: formatPrice(product.consumer_price || ''),
            supplyPrice: formatPrice(product.supply_price || ''),
            b2bPrice: formatPrice(product.b2b_price),
            stockQuantity: formatPrice(product.stock_quantity),
            quantityPerCarton: product.quantity_per_carton || '',
            shippingFeeIndividual: formatPrice(product.shipping_fee_individual || product.shipping_fee || ''),
            shippingFeeCarton: formatPrice(product.shipping_fee_carton || ''),
            productOptions: product.product_options || '',
            manufacturer: product.manufacturer || '',
            origin: product.origin || '',
            isAvailable: product.is_available,
            isTaxFree: product.is_tax_free || false,
            detailUrl: product.detail_url || '',
            detailUrl: product.detail_url || '',
            detailUrl: product.detail_url || '',
            remarks: product.remarks || '',
            productSpec: product.product_spec || '',
            displayOrder: product.display_order || '0'
        })
        setShowModal(true)
    }

    const openAddModal = () => {
        setEditingProduct(null)
        setFormData(initialFormState)
        setShowModal(true)
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newCategoryName })
            })

            if (res.ok) {
                alert('카테고리가 추가되었습니다')
                setNewCategoryName('')
                setShowCategoryModal(false)
                fetchCategories()
            } else {
                alert('카테고리 추가 실패')
            }
        } catch (error) {
            console.error('Add category error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const getImageUrl = (url) => {
        if (!url) return ''
        const cleanUrl = url.trim()

        if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) return cleanUrl

        // Handle relative paths (starting with /)
        if (cleanUrl.startsWith('/')) {
            let apiUrl = import.meta.env.VITE_API_URL || ''
            // Ensure API URL has protocol
            if (apiUrl && !apiUrl.startsWith('http')) {
                apiUrl = 'https://' + apiUrl
            }
            return apiUrl + cleanUrl
        }

        // If it has a slash but no protocol, assume it's domain/path -> prepend https://
        if (cleanUrl.includes('/')) {
            return 'https://' + cleanUrl
        }

        // Just a filename or other format - return as is to avoid ERR_NAME_NOT_RESOLVED
        return cleanUrl
    }

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!confirm('엑셀 파일로 상품을 일괄 등록하시겠습니까? 기존 데이터가 업데이트될 수 있습니다.')) {
            e.target.value = ''
            return
        }

        if (isExcelUploading) return
        setIsExcelUploading(true)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('mode', uploadMode) // Add mode to request

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/excel/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })

            const data = await res.json()

            if (res.ok) {
                alert(`처리 완료\n성공: ${data.success}건\n실패: ${data.failed}건\n${data.errors.length > 0 ? '\n오류 목록:\n' + data.errors.slice(0, 5).join('\n') + (data.errors.length > 5 ? `\n...외 ${data.errors.length - 5}건` : '') : ''}`)
                fetchProducts()
                fetchCategories()
                fetchBrands()
            } else {
                alert('업로드 실패: ' + (data.error || '알 수 없는 오류'))
            }
        } catch (error) {
            console.error('Excel upload error:', error)
            alert('업로드 중 오류가 발생했습니다.')
        } finally {
            e.target.value = ''
            setIsExcelUploading(false)
        }
    }

    const downloadTemplate = () => {
        // Create a CSV template
        const headers = ['No.', 'Brand', 'ModelName', 'ModelNo', 'Category', 'Description', 'B2BPrice', 'SupplyPrice', 'ConsumerPrice', 'Stock', 'ImageURL', 'DetailURL', 'Manufacturer', 'Origin', 'ProductSpec', 'ProductOptions', 'IsTaxFree', 'QuantityPerCarton', 'ShippingFeeIndividual', 'ShippingFeeCarton', 'remark']
        const example = ['1', 'Samsung', 'Galaxy S24', 'SM-S921', 'Mobile', 'Latest smartphone', '1000000', '900000', '1200000', '100', 'https://example.com/image.jpg', 'https://example.com/detail.jpg', 'Samsung Electronics', 'Vietnam', '256GB, 8GB RAM', 'Phantom Black, Cream', 'FALSE', '20', '3000', '0', 'Special Offer']

        const csvContent = [
            headers.join(','),
            example.join(',')
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'product_upload_template.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const downloadAllProducts = () => {
        setIsDownloading(true)
        setShowDownloadModal(false) // Close modal

        // Use setTimeout to allow UI to update before heavy processing
        setTimeout(() => {
            try {
                let productsToDownload = [...products];

                // Filter based on selection
                if (downloadFilterType === 'category' && downloadTarget) {
                    productsToDownload = productsToDownload.filter(p => p.category_id === parseInt(downloadTarget));
                } else if (downloadFilterType === 'brand' && downloadTarget) {
                    productsToDownload = productsToDownload.filter(p => p.brand === downloadTarget);
                }

                // Sort products by category order, then by brand
                const sortedProducts = productsToDownload.sort((a, b) => {
                    const indexA = CATEGORY_ORDER.indexOf(a.category_name);
                    const indexB = CATEGORY_ORDER.indexOf(b.category_name);

                    let comparison = 0;

                    if (indexA !== -1 && indexB !== -1) {
                        comparison = indexA - indexB;
                    } else if (indexA !== -1) {
                        comparison = -1;
                    } else if (indexB !== -1) {
                        comparison = 1;
                    } else {
                        if (a.category_name === 'Other') comparison = 1;
                        else if (b.category_name === 'Other') comparison = -1;
                        else comparison = (a.category_name || '').localeCompare(b.category_name || '');
                    }

                    if (comparison !== 0) return comparison;

                    // Secondary Sort: Brand
                    return (a.brand || '').localeCompare(b.brand || '');
                });

                const headers = ['No.', 'Brand', 'ModelName', 'ModelNo', 'Category', 'Description', 'B2BPrice', 'SupplyPrice', 'ConsumerPrice', 'Stock', 'ImageURL', 'DetailURL', 'Manufacturer', 'Origin', 'ProductSpec', 'ProductOptions', 'IsTaxFree', 'QuantityPerCarton', 'ShippingFeeIndividual', 'ShippingFeeCarton', 'remark']

                const rows = sortedProducts.map(p => [
                    p.id,
                    `"${(p.brand || '').replace(/"/g, '""')}"`,
                    `"${(p.model_name || '').replace(/"/g, '""')}"`,
                    `"${(p.model_no || '').replace(/"/g, '""')}"`,
                    `"${(p.category_name || '').replace(/"/g, '""')}"`,
                    `"${(p.description || '').replace(/"/g, '""')}"`,
                    parseInt(p.b2b_price || 0),
                    parseInt(p.supply_price || 0),
                    parseInt(p.consumer_price || 0),
                    parseInt(p.stock_quantity || 0),
                    `"${(p.image_url || '').replace(/"/g, '""')}"`,
                    `"${(p.detail_url || '').replace(/"/g, '""')}"`,
                    `"${(p.manufacturer || '').replace(/"/g, '""')}"`,
                    `"${(p.origin || '').replace(/"/g, '""')}"`,
                    `"${(p.product_spec || '').replace(/"/g, '""')}"`,
                    `"${(p.product_options || '').replace(/"/g, '""')}"`,
                    p.is_tax_free ? 'TRUE' : 'FALSE',
                    parseInt(p.quantity_per_carton || 1),
                    parseInt(p.shipping_fee_individual || 0),
                    parseInt(p.shipping_fee_carton || 0),
                    `"${(p.remarks || '').replace(/"/g, '""')}"`
                ]);

                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement('a')
                const url = URL.createObjectURL(blob)
                link.setAttribute('href', url)
                link.setAttribute('download', 'all_products.csv')
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } catch (error) {
                console.error('Download error:', error)
                alert('다운로드 중 오류가 발생했습니다.')
            } finally {
                setIsDownloading(false)
            }
        }, 100)
    }

    const handleDeleteRecent = async () => {
        const hours = prompt('최근 몇 시간 내에 등록된 상품을 삭제하시겠습니까? (숫자만 입력)', '1')
        if (!hours) return

        if (!confirm(`정말 최근 ${hours}시간 내에 등록된 모든 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/recent?hours=${hours}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await res.json()

            if (res.ok) {
                alert(data.message)
                fetchProducts()
            } else {
                alert('삭제 실패: ' + (data.error || '알 수 없는 오류'))
            }
        } catch (error) {
            console.error('Delete recent error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const handleDeleteRange = async () => {
        const startId = prompt('삭제할 시작 순번(ID)을 입력하세요:')
        if (!startId) return
        const endId = prompt('삭제할 끝 순번(ID)을 입력하세요:')
        if (!endId) return

        if (!confirm(`정말 순번 ${startId}번부터 ${endId}번까지의 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return

        try {
            // Use /api/excel/range to bypass auth issues if any, or /api/products/range if auth is working
            // Using /api/excel/range as it was recently added for this purpose
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/excel/range?startId=${startId}&endId=${endId}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await res.json()

            if (res.ok) {
                alert(data.message)
                fetchProducts()
            } else {
                alert('삭제 실패: ' + (data.error || '알 수 없는 오류'))
            }
        } catch (error) {
            console.error('Delete range error:', error)
            alert('오류가 발생했습니다')
        }
    }

    return (
        <div className="dashboard">
            <Navbar user={user} isAdminMode={true} />

            <div className="dashboard-content container" style={{ maxWidth: '100%' }}>
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1>상품 관리</h1>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="All">전체 카테고리</option>
                            {categories.map(cat => (
                                <option
                                    key={cat.id}
                                    value={cat.id}
                                    style={{
                                        backgroundColor: getCategoryColor(cat.name),
                                        color: '#fff'
                                    }}
                                >
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                            + 카테고리 추가
                        </button>

                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                setDownloadFilterType('all');
                                setDownloadTarget('');
                                setShowDownloadModal(true);
                            }}
                            className="btn btn-info"
                            style={{ color: 'white', background: isDownloading ? '#6c757d' : '#138496', border: 'none', cursor: isDownloading ? 'not-allowed' : 'pointer' }}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <><i className="fas fa-spinner fa-spin"></i> 다운로드 중...</>
                            ) : (
                                <><i className="fas fa-download"></i> 전체 상품 다운로드</>
                            )}
                        </button>
                        <button onClick={downloadTemplate} className="btn btn-secondary" style={{ background: '#28a745', border: 'none' }}>
                            <i className="fas fa-download"></i> 양식 다운로드
                        </button>

                        <button onClick={handleDeleteRange} className="btn btn-secondary" style={{ background: '#c82333', border: 'none' }}>
                            <i className="fas fa-eraser"></i> 구간 삭제
                        </button>
                        {isExcelUploading ? (
                            <button className="btn btn-secondary disabled" style={{ background: '#6c757d', border: 'none', margin: 0, display: 'flex', alignItems: 'center', cursor: 'not-allowed' }}>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: '5px' }}></i> 업로드 중...
                            </button>
                        ) : (
                            <button onClick={() => setShowUploadModal(true)} className="btn btn-info" style={{ background: '#17a2b8', border: 'none' }}>
                                <i className="fas fa-file-excel"></i> 엑셀 업로드
                            </button>
                        )}
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleExcelUpload}
                            style={{ display: 'none' }}
                            id="excel-upload-input"
                        />
                        <button onClick={openAddModal} className="btn btn-primary">
                            + 신규 상품 등록
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="table-responsive">
                        <table className="table" style={{ fontSize: '0.85rem', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center', width: '100px' }}>No.</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>IMG</th>
                                    <th style={{ minWidth: '100px' }}>브랜드</th>
                                    <th style={{ minWidth: '250px' }}>상품명/모델명/옵션</th>
                                    <th style={{ textAlign: 'right' }}>실판매가</th>
                                    <th style={{ textAlign: 'right', minWidth: '140px' }}>공급가</th>
                                    <th style={{ textAlign: 'right', minWidth: '120px' }}>재고</th>
                                    <th style={{ textAlign: 'right', minWidth: '100px' }}>배송비</th>
                                    <th>제조사/원산지/등록일</th>
                                    <th style={{ textAlign: 'center', minWidth: '120px' }}>상태/관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products
                                    .filter(p => selectedCategory === 'All' || p.category_id === parseInt(selectedCategory))
                                    .map(product => (
                                        <tr key={product.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ marginBottom: '4px' }}>{product.id}</div>
                                                <div
                                                    onClick={() => handleToggleNew(product.id, product.is_new)}
                                                    style={{
                                                        marginBottom: '5px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.7rem',
                                                        padding: '2px 4px',
                                                        borderRadius: '4px',
                                                        backgroundColor: product.is_new ? '#ff4444' : '#e0e0e0',
                                                        color: 'white',
                                                        display: 'inline-block',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    NEW
                                                </div>
                                                <select
                                                    value={product.display_order || 0}
                                                    onChange={(e) => handleDisplayOrderChange(product.id, e.target.value)}
                                                    style={{
                                                        padding: '0.1rem',
                                                        fontSize: '0.7rem',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ddd',
                                                        width: '100%'
                                                    }}
                                                >
                                                    {rankingOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                    {/* If current value is not in options, show it as custom */}
                                                    {!rankingOptions.some(o => o.value === (product.display_order || 0)) && (
                                                        <option value={product.display_order || 0}>
                                                            {product.display_order || 0}
                                                        </option>
                                                    )}
                                                </select>
                                            </td>
                                            <td style={{ padding: 0, width: '100px' }}>
                                                {product.image_url ? (
                                                    <img src={getImageUrl(product.image_url)} alt={product.model_name} style={{ width: '100%', height: '100px', objectFit: 'contain', display: 'block', backgroundColor: '#fff' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>No Img</div>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: product.brand.length > 6 ? '0.75rem' : 'inherit'
                                                }}>
                                                    {product.brand}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: getCategoryColor(product.category_name), marginTop: '4px' }}>
                                                    {product.category_name}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>
                                                    {product.model_name}
                                                </div>
                                                {product.model_no && (
                                                    <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '2px' }}>
                                                        {product.model_no}
                                                    </div>
                                                )}
                                                {product.product_options && (
                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                                        {product.product_options}
                                                    </div>
                                                )}
                                                {product.remarks && (
                                                    <div style={{
                                                        marginTop: '4px',
                                                        color: '#d63384',
                                                        fontSize: '0.7rem',
                                                        lineHeight: '1.2',
                                                        fontWeight: 'normal',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {product.remarks}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: '#007bff', fontSize: '1.1rem' }}>
                                                    {parseInt(product.b2b_price).toLocaleString()}
                                                </div>
                                                <div style={{ marginTop: '2px' }}>
                                                    <span className={`badge ${product.is_tax_free ? 'badge-info' : 'badge-secondary'} `} style={{ background: product.is_tax_free ? '#17a2b8' : '#6c757d', fontSize: '0.7rem', padding: '2px 4px' }}>
                                                        {product.is_tax_free ? '면세' : '과세'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                                                    <span>소가</span>
                                                    <span style={{ textDecoration: 'line-through' }}>{product.consumer_price ? parseInt(product.consumer_price).toLocaleString() : '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>공급</span>
                                                    <span>{product.supply_price ? parseInt(product.supply_price).toLocaleString() : '-'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>재고</span>
                                                    <span>{parseInt(product.stock_quantity).toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>카톤</span>
                                                    <span>{product.quantity_per_carton || '-'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>개별</span>
                                                    <span>{product.shipping_fee_individual ? parseInt(product.shipping_fee_individual).toLocaleString() : (product.shipping_fee ? parseInt(product.shipping_fee).toLocaleString() : '0')}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>카톤</span>
                                                    <span>{product.shipping_fee_carton ? parseInt(product.shipping_fee_carton).toLocaleString() : '0'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{
                                                    fontSize: product.manufacturer && product.manufacturer.length > 8 ? '0.75rem' : '0.85rem',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    <span style={{ color: '#666', marginRight: '4px' }}>제조사:</span>
                                                    {product.manufacturer}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                                    <span style={{ marginRight: '4px' }}>원산지:</span>
                                                    {product.origin}
                                                </div>
                                                <div style={{ color: '#999', fontSize: '0.75rem' }}>
                                                    <span style={{ marginRight: '4px' }}>등록일:</span>
                                                    {new Date(product.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <span
                                                        className={`badge ${product.is_available ? 'badge-success' : 'badge-danger'} `}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleToggleAvailability(product)}
                                                        title="클릭하여 상태 변경"
                                                    >
                                                        {product.is_available ? '판매중' : '중지'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <button onClick={() => openEditModal(product)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                                        수정
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#dc3545', border: 'none', color: 'white', borderRadius: '4px' }}>
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

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2>{editingProduct ? '상품 수정' : '신규 상품 등록'}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>카테고리</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="">선택하세요</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>브랜드</label>
                                <input
                                    type="text"
                                    list="brand-list"
                                    value={formData.brand}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    required
                                    placeholder="브랜드를 선택하거나 직접 입력하세요"
                                />
                                <datalist id="brand-list">
                                    {brands.map((brand, index) => (
                                        <option key={index} value={brand} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>상품명</label>
                                <input
                                    type="text"
                                    value={formData.modelName}
                                    onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>모델명</label>
                                <input
                                    type="text"
                                    value={formData.modelNo}
                                    onChange={e => setFormData({ ...formData, modelNo: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>상세 설명</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>제품규격</label>
                                <textarea
                                    value={formData.productSpec}
                                    onChange={e => setFormData({ ...formData, productSpec: e.target.value })}
                                    rows="3"
                                    placeholder="제품 규격을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label>옵션 (선택사항)</label>
                                <textarea
                                    value={formData.productOptions}
                                    onChange={e => setFormData({ ...formData, productOptions: e.target.value })}
                                    rows="2"
                                    placeholder="예: 블랙, 화이트, 레드 (쉼표로 구분)"
                                />
                            </div>

                            <div className="form-group">
                                <label>카톤별 수량</label>
                                <input
                                    type="number"
                                    value={formData.quantityPerCarton}
                                    onChange={e => setFormData({ ...formData, quantityPerCarton: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>제조사</label>
                                <input
                                    type="text"
                                    list="manufacturer-list"
                                    value={formData.manufacturer}
                                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                                    placeholder="예: Samsung, LG..."
                                />
                                <datalist id="manufacturer-list">
                                    {manufacturers.map((item, index) => (
                                        <option key={index} value={item} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>원산지</label>
                                <input
                                    type="text"
                                    list="origin-list"
                                    value={formData.origin}
                                    onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                    placeholder="예: Korea, China..."
                                />
                                <datalist id="origin-list">
                                    {origins.map((item, index) => (
                                        <option key={index} value={item} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>소비자가</label>
                                <input
                                    type="text"
                                    value={formData.consumerPrice}
                                    onChange={e => handlePriceChange('consumerPrice', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>공급가</label>
                                <input
                                    type="text"
                                    value={formData.supplyPrice}
                                    onChange={e => handlePriceChange('supplyPrice', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>실판매가 (B2B)</label>
                                <input
                                    type="text"
                                    value={formData.b2bPrice}
                                    onChange={e => handlePriceChange('b2bPrice', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>재고 수량</label>
                                <input
                                    type="text"
                                    value={formData.stockQuantity}
                                    onChange={e => handlePriceChange('stockQuantity', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>배송비 (개별)</label>
                                <input
                                    type="text"
                                    value={formData.shippingFeeIndividual}
                                    onChange={e => handlePriceChange('shippingFeeIndividual', e.target.value)}
                                    placeholder="개별 배송비"
                                />
                            </div>

                            <div className="form-group">
                                <label>배송비 (카톤)</label>
                                <input
                                    type="text"
                                    value={formData.shippingFeeCarton}
                                    onChange={e => handlePriceChange('shippingFeeCarton', e.target.value)}
                                    placeholder="카톤 배송비"
                                />
                            </div>

                            <div className="form-group">
                                <label>이미지 URL</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                        style={{ flex: 1 }}
                                        onBlur={async (e) => {
                                            const url = e.target.value
                                            // Check for <img src="..."> tag
                                            const imgTagMatch = url.match(/<img[^>]+src=['"]([^'"]+)['"]/i)
                                            if (imgTagMatch && imgTagMatch[1]) {
                                                setFormData(prev => ({ ...prev, imageUrl: imgTagMatch[1] }))
                                                alert('이미지 태그에서 URL을 추출했습니다.')
                                                return
                                            }

                                            const extractedUrl = await extractImageFromHtml(url)
                                            if (extractedUrl) {
                                                setFormData(prev => ({ ...prev, imageUrl: extractedUrl }))
                                                alert('HTML에서 이미지 URL을 추출했습니다.')
                                            }
                                        }}
                                    />
                                    <label className={`btn btn-secondary ${isUploading ? 'disabled' : ''}`} style={{ cursor: isUploading ? 'not-allowed' : 'pointer', margin: 0, display: 'flex', alignItems: 'center', opacity: isUploading ? 0.6 : 1 }}>
                                        {isUploading ? '업로드 중...' : '파일 선택'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'imageUrl')}
                                            style={{ display: 'none' }}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>상세페이지 URL</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={formData.detailUrl}
                                        onChange={e => setFormData({ ...formData, detailUrl: e.target.value })}
                                        placeholder="https://example.com/product/123"
                                        style={{ flex: 1 }}
                                        onBlur={async (e) => {
                                            const url = e.target.value
                                            const extractedHtml = await extractAllImagesFromHtml(url)
                                            if (extractedHtml) {
                                                setFormData(prev => ({ ...prev, detailUrl: extractedHtml }))
                                                const count = (extractedHtml.match(/<img/g) || []).length
                                                alert(`HTML에서 ${count}장의 이미지를 추출하여 태그로 변환했습니다.`)
                                            }
                                        }}
                                    />
                                    <label className={`btn btn-secondary ${isUploading ? 'disabled' : ''}`} style={{ cursor: isUploading ? 'not-allowed' : 'pointer', margin: 0, display: 'flex', alignItems: 'center', opacity: isUploading ? 0.6 : 1 }}>
                                        {isUploading ? '업로드 중...' : '파일 선택'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'detailUrl')}
                                            style={{ display: 'none' }}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>비고</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    rows="2"
                                    placeholder="비고 사항을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label>노출 순위 (높을수록 상단 노출)</label>
                                <input
                                    type="number"
                                    value={formData.displayOrder}
                                    onChange={e => setFormData({ ...formData, displayOrder: e.target.value })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        style={{ width: 'auto', margin: 0 }}
                                    />
                                    <span>판매 가능 여부</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>과세 여부</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="taxStatus"
                                            checked={!formData.isTaxFree}
                                            onChange={() => setFormData({ ...formData, isTaxFree: false })}
                                            style={{ width: 'auto', margin: 0 }}
                                        />
                                        <span>과세</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="taxStatus"
                                            checked={formData.isTaxFree}
                                            onChange={() => setFormData({ ...formData, isTaxFree: true })}
                                            style={{ width: 'auto', margin: 0 }}
                                        />
                                        <span>면세</span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                                    {isSubmitting ? '저장 중...' : '저장'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }} disabled={isSubmitting}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCategoryModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px'
                    }}>
                        <h3>새 카테고리 추가</h3>
                        <form onSubmit={handleAddCategory} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>카테고리명</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    required
                                    placeholder="예: Audio, Living..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>추가</button>
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDownloadModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px'
                    }}>
                        <h3>상품 다운로드 옵션</h3>
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="downloadType"
                                    checked={downloadFilterType === 'all'}
                                    onChange={() => setDownloadFilterType('all')}
                                />
                                전체 다운로드
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="downloadType"
                                    checked={downloadFilterType === 'category'}
                                    onChange={() => {
                                        setDownloadFilterType('category');
                                        setDownloadTarget(categories.length > 0 ? categories[0].id : '');
                                    }}
                                />
                                카테고리별 다운로드
                            </label>
                            {downloadFilterType === 'category' && (
                                <select
                                    value={downloadTarget}
                                    onChange={(e) => setDownloadTarget(e.target.value)}
                                    style={{ marginLeft: '1.5rem', padding: '0.3rem', width: 'calc(100% - 1.5rem)' }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="downloadType"
                                    checked={downloadFilterType === 'brand'}
                                    onChange={() => {
                                        setDownloadFilterType('brand');
                                        setDownloadTarget(brands.length > 0 ? brands[0] : '');
                                    }}
                                />
                                브랜드별 다운로드
                            </label>
                            {downloadFilterType === 'brand' && (
                                <select
                                    value={downloadTarget}
                                    onChange={(e) => setDownloadTarget(e.target.value)}
                                    style={{ marginLeft: '1.5rem', padding: '0.3rem', width: 'calc(100% - 1.5rem)' }}
                                >
                                    {brands.map((brand, idx) => (
                                        <option key={idx} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={downloadAllProducts} className="btn btn-primary" style={{ flex: 1 }}>다운로드</button>
                            <button onClick={() => setShowDownloadModal(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }}>취소</button>
                        </div>
                    </div>
                </div>
            )}
            {showUploadModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px'
                    }}>
                        <h3>엑셀 업로드 옵션</h3>
                        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            <p style={{ margin: '0 0 0.5rem 0' }}><strong><i className="fas fa-info-circle"></i> 업로드 안내</strong></p>
                            <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                <li><strong>신규 상품 등록:</strong> 모델명/모델번호가 일치하는 상품이 <u>없는 경우에만</u> 등록합니다.</li>
                                <li><strong>기존 상품 수정:</strong> 모델명/모델번호가 일치하는 상품이 <u>있는 경우에만</u> 정보를 업데이트합니다.</li>
                                <li><strong>전체:</strong> 신규 상품은 등록하고, 기존 상품은 업데이트합니다.</li>
                            </ul>
                            <p style={{ margin: '0.5rem 0 0 0', color: '#dc3545', fontSize: '0.85rem' }}>
                                * 엑셀 파일의 첫 번째 시트만 처리됩니다.<br />
                                * '양식 다운로드'를 통해 최신 양식을 사용해 주세요.
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="uploadMode"
                                    checked={uploadMode === 'new'}
                                    onChange={() => setUploadMode('new')}
                                />
                                신규 상품 등록 (기존 상품 건너뜀)
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="uploadMode"
                                    checked={uploadMode === 'update'}
                                    onChange={() => setUploadMode('update')}
                                />
                                기존 상품 수정 (신규 상품 건너뜀)
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="uploadMode"
                                    checked={uploadMode === 'all'}
                                    onChange={() => setUploadMode('all')}
                                />
                                전체 (신규 등록 + 수정)
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <label className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, cursor: 'pointer' }}>
                                파일 선택
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => {
                                        setShowUploadModal(false);
                                        handleExcelUpload(e);
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <button onClick={() => setShowUploadModal(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }}>취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminProducts

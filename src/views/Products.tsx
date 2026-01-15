import { useEffect, useState } from 'react';
import { productsService } from '../services/productsService';
import type { Product } from '../services/productsService';
import { currencyService } from '../services/currencyService';

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newProduct, setNewProduct] = useState({
        product_name: '',
        description: '',
        base_price_usd: '',
        current_stock: ''
    });

    const fetchProducts = async () => {
        try {
            const data = await productsService.getProducts();
            if (Array.isArray(data)) {
                setProducts(data);
            } else if ((data as any).products && Array.isArray((data as any).products)) {
                setProducts((data as any).products);
            } else {
                setProducts([]);
            }

            // Fetch exchange rate
            try {
                const rateData = await currencyService.getExchangeRate('USD');
                setExchangeRate(rateData.rate);
            } catch (rateErr) {
                console.error("Error fetching exchange rate:", rateErr);
                // Non-critical error, simply don't show Bs. price
            }
        } catch (err: any) {
            console.error("Error fetching products:", err);
            setError('Failed to load products. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productToCreate = {
                ...newProduct,
                base_price_usd: newProduct.base_price_usd === '' ? 0 : parseFloat(newProduct.base_price_usd as string),
                current_stock: newProduct.current_stock === '' ? 0 : parseInt(newProduct.current_stock as string)
            };
            await productsService.createProduct(productToCreate);
            setShowModal(false);
            setNewProduct({
                product_name: '',
                description: '',
                base_price_usd: '',
                current_stock: ''
            });
            // Refresh product list
            setLoading(true);
            await fetchProducts();
        } catch (err) {
            console.error("Error creating product:", err);
            alert("Failed to create product");
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setShowEditModal(true);
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            await productsService.updateProduct(editingProduct.product_id, {
                product_name: editingProduct.product_name,
                description: editingProduct.description,
                base_price_usd: editingProduct.base_price_usd,
                current_stock: editingProduct.current_stock
            });
            setShowEditModal(false);
            setEditingProduct(null);
            // Refresh product list
            setLoading(true);
            await fetchProducts();
        } catch (err) {
            console.error("Error updating product:", err);
            alert("Failed to update product");
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Products</h2>
                <button className="button-primary" onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem' }}>+ Add Product</button>
            </div>

            {products.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <p>No products found in your store.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                                <th style={tableHeaderStyle}>ID</th>
                                <th style={tableHeaderStyle}>Name</th>
                                <th style={tableHeaderStyle}>Price</th>
                                <th style={tableHeaderStyle}>Stock</th>
                                <th style={tableHeaderStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.product_id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tableCellStyle}>{product.product_id}</td>
                                    <td style={tableCellStyle}>{product.product_name}</td>
                                    <td style={tableCellStyle}>
                                        <div>${product.base_price_usd}</div>
                                        {exchangeRate && (
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                Bs. {(product.base_price_usd * exchangeRate).toFixed(2)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={tableCellStyle}>{product.current_stock}</td>
                                    <td style={tableCellStyle}>
                                        <button
                                            onClick={() => handleEditClick(product)}
                                            style={{ marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#3498db' }}
                                        >
                                            Edit
                                        </button>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Product Modal */}
            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>Add New Product</h3>
                        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Product Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newProduct.product_name}
                                    onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Description (Optional)</label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '60px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Unit Price</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={newProduct.base_price_usd}
                                        onChange={(e) => setNewProduct({ ...newProduct, base_price_usd: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Current Stock</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={newProduct.current_stock}
                                        onChange={(e) => setNewProduct({ ...newProduct, current_stock: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={cancelButtonStyle}>Cancel</button>
                                <button type="submit" style={submitButtonStyle}>Create Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditModal && editingProduct && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>Edit Product</h3>
                        <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Product Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct.product_name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Description (Optional)</label>
                                <textarea
                                    value={editingProduct.description || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '60px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Unit Price</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={editingProduct.base_price_usd}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, base_price_usd: parseFloat(e.target.value) })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Current Stock</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={editingProduct.current_stock}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, current_stock: parseInt(e.target.value) })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingProduct(null);
                                    }}
                                    style={cancelButtonStyle}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={submitButtonStyle}>Update Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#333'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
};

const cancelButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#666'
};

const submitButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: 'none',
    backgroundColor: '#646cff',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer'
};

const tableHeaderStyle = {
    padding: '1rem',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#2c3e50'
};

const tableCellStyle = {
    padding: '1rem',
    color: '#333'
};

export default Products;

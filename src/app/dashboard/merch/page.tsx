'use client'

import { useState, useEffect, useCallback } from 'react'

interface MerchItem {
  id: string
  name: string
  price: number
  stock: number
  startingStock: number
  cost: number
  category: 'apparel' | 'music' | 'accessories' | 'poster' | 'other'
}

interface Sale {
  id: string
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  venue: string
  date: string
  splitPercent: number
  paymentMethod: 'cash' | 'card' | 'mixed'
}

const INV_KEY = 'tourhq_merch_inventory'
const SALES_KEY = 'tourhq_merch_sales'

const categoryLabels: Record<MerchItem['category'], string> = {
  apparel: 'Apparel',
  music: 'Music (Vinyl/CD)',
  accessories: 'Accessories',
  poster: 'Posters',
  other: 'Other',
}

export default function MerchPage() {
  const [inventory, setInventory] = useState<MerchItem[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory')
  const [invModal, setInvModal] = useState(false)
  const [saleModal, setSaleModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  // Load data
  useEffect(() => {
    try {
      const inv = localStorage.getItem(INV_KEY)
      const sal = localStorage.getItem(SALES_KEY)
      if (inv) setInventory(JSON.parse(inv))
      if (sal) setSales(JSON.parse(sal))
    } catch {}
    setLoading(false)
  }, [])

  const saveInventory = useCallback((items: MerchItem[]) => {
    setInventory(items)
    localStorage.setItem(INV_KEY, JSON.stringify(items))
  }, [])

  const saveSales = useCallback((items: Sale[]) => {
    setSales(items)
    localStorage.setItem(SALES_KEY, JSON.stringify(items))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  // Stats
  const totalRevenue = sales.reduce((s, sale) => s + sale.quantity * sale.unitPrice, 0)
  const totalSold = sales.reduce((s, sale) => s + sale.quantity, 0)
  const afterSplits = sales.reduce(
    (s, sale) => s + sale.quantity * sale.unitPrice * (1 - sale.splitPercent / 100),
    0
  )

  const getItemSoldCount = (itemId: string) =>
    sales.filter((s) => s.itemId === itemId).reduce((s, sale) => s + sale.quantity, 0)

  const getItemRevenue = (itemId: string) => {
    const itemSales = sales.filter((s) => s.itemId === itemId)
    return itemSales.reduce(
      (s, sale) => s + sale.quantity * sale.unitPrice * (1 - sale.splitPercent / 100),
      0
    )
  }

  // Add item
  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const item: MerchItem = {
      id: Date.now().toString(),
      name: fd.get('name') as string,
      price: parseFloat(fd.get('price') as string) || 0,
      stock: parseInt(fd.get('stock') as string) || 0,
      startingStock: parseInt(fd.get('stock') as string) || 0,
      cost: parseFloat(fd.get('cost') as string) || 0,
      category: fd.get('category') as MerchItem['category'],
    }
    saveInventory([...inventory, item])
    setInvModal(false)
    e.currentTarget.reset()
    showToast('Item added')
  }

  // Delete item
  const handleDeleteItem = (id: string) => {
    saveInventory(inventory.filter((i) => i.id !== id))
    saveSales(sales.filter((s) => s.itemId !== id))
    setExpandedId(null)
    showToast('Item deleted')
  }

  // Adjust stock
  const handleAdjustStock = (id: string, delta: number) => {
    saveInventory(
      inventory.map((i) => (i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i))
    )
  }

  const handleStockInput = (id: string, val: string) => {
    const n = parseInt(val)
    if (!isNaN(n) && n >= 0) {
      saveInventory(inventory.map((i) => (i.id === id ? { ...i, stock: n } : i)))
    }
  }

  // Record sale
  const handleRecordSale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const itemId = fd.get('itemId') as string
    const qty = parseInt(fd.get('quantity') as string) || 1
    const item = inventory.find((i) => i.id === itemId)
    if (!item) return

    const sale: Sale = {
      id: Date.now().toString(),
      itemId,
      itemName: item.name,
      quantity: qty,
      unitPrice: item.price,
      venue: fd.get('venue') as string,
      date: fd.get('date') as string,
      splitPercent: parseFloat(fd.get('splitPercent') as string) || 0,
      paymentMethod: fd.get('paymentMethod') as Sale['paymentMethod'],
    }

    // Deduct stock
    const newStock = Math.max(0, item.stock - qty)
    saveInventory(inventory.map((i) => (i.id === itemId ? { ...i, stock: newStock } : i)))
    saveSales([...sales, sale])
    setSaleModal(false)
    e.currentTarget.reset()
    showToast('Sale recorded')
  }

  // Delete sale
  const handleDeleteSale = (id: string) => {
    const sale = sales.find((s) => s.id === id)
    if (sale) {
      // Restore stock
      saveInventory(
        inventory.map((i) =>
          i.id === sale.itemId ? { ...i, stock: i.stock + sale.quantity } : i
        )
      )
    }
    saveSales(sales.filter((s) => s.id !== id))
    showToast('Sale deleted')
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Item', 'Quantity', 'Unit Price', 'Venue', 'Split %', 'Net Revenue']
    const rows = sales.map((s) => [
      s.date,
      s.itemName,
      s.quantity.toString(),
      s.unitPrice.toString(),
      s.venue,
      s.splitPercent.toString(),
      (s.quantity * s.unitPrice * (1 - s.splitPercent / 100)).toFixed(2),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'merch-sales.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported')
  }

  const stockColor = (stock: number) => {
    if (stock === 0) return '#d90429'
    if (stock <= 10) return '#f59e0b'
    return '#22c55e'
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) return null

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #07070c; min-height: 100vh; color: #f0f0f5; font-family: Inter, system-ui, sans-serif; }
        .mono { font-family: 'JetBrains Mono', 'Fira Mono', monospace; }
        .header { padding: 1.5rem; border-bottom: 1px solid #1f1f2e; }
        .back-link { color: #8888a0; font-size: 0.85rem; text-decoration: none; display: inline-block; margin-bottom: 0.5rem; }
        .back-link:hover { color: #f0f0f5; }
        .title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
        .subtitle { color: #8888a0; font-size: 0.85rem; }
        .stats-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 1rem 1.5rem; border-bottom: 1px solid #1f1f2e; text-align: center; }
        .stat-label { font-size: 0.7rem; color: #555570; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
        .stat-value { font-size: 1rem; font-weight: 700; }
        .tab-bar { display: flex; border-bottom: 1px solid #1f1f2e; }
        .tab { flex: 1; text-align: center; padding: 0.75rem; cursor: pointer; font-size: 0.9rem; color: #555570; transition: color 0.2s; border-bottom: 2px solid transparent; }
        .tab.active { color: #d90429; border-bottom-color: #d90429; }
        .tab-content { padding-bottom: 100px; }
        .fab { position: fixed; bottom: 80px; right: 1rem; width: 56px; height: 56px; border-radius: 50%; background: #d90429; border: none; color: white; font-size: 1.75rem; cursor: pointer; z-index: 50; display: flex; align-items: center; justify-content: center; line-height: 1; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .modal { background: #101018; border: 1px solid #1f1f2e; border-radius: 16px; max-width: 400px; width: 100%; max-height: 90vh; overflow-y: auto; }
        .modal-handle { width: 40px; height: 4px; background: #1f1f2e; border-radius: 2px; margin: 1rem auto 0; }
        .modal-title { text-align: center; font-size: 1.1rem; font-weight: 700; padding: 1rem; border-bottom: 1px solid #1f1f2e; }
        .modal-body { padding: 1rem; }
        .form-group { margin-bottom: 0.75rem; }
        .form-label { display: block; font-size: 0.8rem; color: #8888a0; margin-bottom: 0.35rem; }
        .form-input, .form-select { width: 100%; background: #181822; border: 1px solid #1f1f2e; border-radius: 8px; color: #f0f0f5; padding: 0.6rem 0.75rem; font-size: 0.9rem; outline: none; }
        .form-input:focus, .form-select:focus { border-color: #d90429; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .btn-primary { width: 100%; background: #d90429; color: white; border: none; border-radius: 8px; padding: 0.75rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
        .btn-secondary { width: 100%; background: #181822; border: 1px solid #1f1f2e; color: #f0f0f5; border-radius: 8px; padding: 0.75rem; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; }
        .item-card { background: #101018; border: 1px solid #1f1f2e; border-radius: 12px; margin: 0.75rem 1rem; overflow: hidden; }
        .item-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; cursor: pointer; }
        .item-name { font-weight: 500; font-size: 0.95rem; }
        .item-price { font-size: 0.85rem; color: #22d3ee; }
        .item-stock { font-size: 0.9rem; font-weight: 700; }
        .item-detail { max-height: 0; overflow: hidden; transition: max-height 0.2s ease; }
        .item-detail.open { max-height: 400px; }
        .item-detail-inner { padding: 0 1rem 1rem; }
        .stock-control { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
        .stock-btn { width: 36px; height: 36px; background: #181822; border: 1px solid #1f1f2e; border-radius: 8px; color: #f0f0f5; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .stock-btn:hover { border-color: #d90429; }
        .stock-input { flex: 1; text-align: center; background: #181822; border: 1px solid #1f1f2e; border-radius: 8px; color: #f0f0f5; padding: 0.4rem; font-size: 1.1rem; font-family: 'JetBrains Mono', monospace; outline: none; }
        .stat-row { display: flex; justify-content: space-between; font-size: 0.8rem; padding: 0.25rem 0; color: #8888a0; }
        .stat-row span:last-child { color: #f0f0f5; font-family: 'JetBrains Mono', monospace; }
        .delete-btn { width: 100%; background: transparent; border: 1px dashed #1f1f2e; color: #8888a0; font-size: 0.8rem; padding: 0.5rem; border-radius: 8px; cursor: pointer; margin-top: 0.75rem; }
        .delete-btn:hover { border-color: #d90429; color: #d90429; }
        .empty-state { text-align: center; padding: 3rem 1rem; color: #555570; }
        .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; display: block; }
        .empty-title { font-size: 1rem; color: #8888a0; margin-bottom: 0.25rem; }
        .empty-sub { font-size: 0.85rem; }
        .sale-card { display: flex; align-items: center; gap: 0.75rem; background: #101018; border: 1px solid #1f1f2e; border-radius: 10px; margin: 0.4rem 1rem; padding: 0.75rem 1rem; position: relative; }
        .sale-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(34,197,94,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sale-info { flex: 1; min-width: 0; }
        .sale-name { font-size: 0.85rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sale-meta { font-size: 0.7rem; color: #555570; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sale-amount { font-size: 0.9rem; font-weight: 700; color: #22c55e; flex-shrink: 0; }
        .sale-delete { position: absolute; top: 0.4rem; right: 0.4rem; background: none; border: none; color: #555570; font-size: 0.9rem; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
        .sale-card:hover .sale-delete { opacity: 1; }
        .sale-delete:hover { color: #d90429; }
        .export-bar { padding: 0.75rem 1rem; border-top: 1px solid #1f1f2e; }
        .export-btn { width: 100%; background: #181822; border: 1px solid #1f1f2e; border-radius: 8px; color: #f0f0f5; padding: 0.6rem; font-size: 0.85rem; cursor: pointer; }
        .export-btn:hover { border-color: #d90429; color: #d90429; }
        .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: #181822; border: 1px solid #22c55e; color: #22c55e; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; z-index: 200; white-space: nowrap; }
        .chevron { color: #555570; font-size: 0.8rem; transition: transform 0.2s; }
        .chevron.open { transform: rotate(180deg); }
      `}</style>

      <div className="page">
        {/* Header */}
        <div className="header">
          <a href="/dashboard/more" className="back-link">← Back to More</a>
          <div className="title">👕 Merch Tracker</div>
          <div className="subtitle">Track inventory, sales & venue splits</div>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div>
            <div className="stat-label">Revenue</div>
            <div className="stat-value mono" style={{ color: '#22c55e' }}>
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="stat-label">Items Sold</div>
            <div className="stat-value mono" style={{ color: '#22d3ee' }}>
              {totalSold}
            </div>
          </div>
          <div>
            <div className="stat-label">After Splits</div>
            <div className="stat-value mono" style={{ color: '#f59e0b' }}>
              ${afterSplits.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="tab-bar">
          <div
            className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory
          </div>
          <div
            className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            💰 Sales Log
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'inventory' && (
            <div id="tab-inventory">
              {inventory.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <div className="empty-title">No merch items yet</div>
                  <div className="empty-sub">Tap + to add your first item</div>
                </div>
              ) : (
                inventory.map((item) => {
                  const sold = getItemSoldCount(item.id)
                  const remaining = item.stock
                  const revenue = getItemRevenue(item.id)
                  const open = expandedId === item.id
                  return (
                    <div key={item.id} className="item-card">
                      <div className="item-header" onClick={() => setExpandedId(open ? null : item.id)}>
                        <div>
                          <div className="item-name">{item.name}</div>
                          <div className="item-price mono">${item.price.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="item-stock mono" style={{ color: stockColor(item.stock) }}>
                            {item.stock}
                          </div>
                          <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
                        </div>
                      </div>
                      <div className={`item-detail ${open ? 'open' : ''}`}>
                        <div className="item-detail-inner">
                          <div className="stock-control">
                            <button
                              className="stock-btn"
                              onClick={(e) => { e.stopPropagation(); handleAdjustStock(item.id, -1) }}
                            >
                              −
                            </button>
                            <input
                              className="stock-input"
                              type="number"
                              value={item.stock}
                              min={0}
                              onChange={(e) => { e.stopPropagation(); handleStockInput(item.id, e.target.value) }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              className="stock-btn"
                              onClick={(e) => { e.stopPropagation(); handleAdjustStock(item.id, 1) }}
                            >
                              +
                            </button>
                          </div>
                          <div className="stat-row">
                            <span>Starting Stock</span>
                            <span>{item.startingStock}</span>
                          </div>
                          <div className="stat-row">
                            <span>Sold</span>
                            <span>{sold}</span>
                          </div>
                          <div className="stat-row">
                            <span>Remaining</span>
                            <span>{remaining}</span>
                          </div>
                          <div className="stat-row">
                            <span>Revenue (after splits)</span>
                            <span>${revenue.toFixed(2)}</span>
                          </div>
                          <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>
                            Delete item
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div id="tab-sales">
              {sales.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">💰</span>
                  <div className="empty-title">No sales recorded yet</div>
                </div>
              ) : (
                [...sales].reverse().map((sale) => (
                  <div key={sale.id} className="sale-card">
                    <div className="sale-icon">💰</div>
                    <div className="sale-info">
                      <div className="sale-name">{sale.itemName}</div>
                      <div className="sale-meta">
                        {sale.venue} · {sale.date}
                      </div>
                    </div>
                    <div className="sale-amount mono">
                      ${(sale.quantity * sale.unitPrice * (1 - sale.splitPercent / 100)).toFixed(2)}
                    </div>
                    <button className="sale-delete" onClick={() => handleDeleteSale(sale.id)}>
                      ×
                    </button>
                  </div>
                ))
              )}
              <div className="export-bar">
                <button className="export-btn" onClick={handleExportCSV}>
                  Export CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FAB */}
        {activeTab === 'inventory' && (
          <button className="fab" onClick={() => setInvModal(true)}>+</button>
        )}
        {activeTab === 'sales' && (
          <button className="fab" onClick={() => setSaleModal(true)}>+</button>
        )}

        {/* Add Item Modal */}
        {invModal && (
          <div className="modal-overlay" onClick={() => setInvModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="modal-title">Add Merch Item</div>
              <form onSubmit={handleAddItem}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Item Name</label>
                    <input
                      className="form-input"
                      name="name"
                      placeholder="Tour T-Shirt (Black)"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Price ($)</label>
                      <input
                        className="form-input"
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="35.00"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Starting Stock</label>
                      <input
                        className="form-input"
                        name="stock"
                        type="number"
                        placeholder="100"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cost Per Unit ($)</label>
                      <input
                        className="form-input"
                        name="cost"
                        type="number"
                        step="0.01"
                        placeholder="12.00"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" name="category">
                        <option value="apparel">Apparel</option>
                        <option value="music">Music (Vinyl/CD)</option>
                        <option value="accessories">Accessories</option>
                        <option value="poster">Posters</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">Add Item</button>
                  <button type="button" className="btn-secondary" onClick={() => setInvModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Sale Modal */}
        {saleModal && (
          <div className="modal-overlay" onClick={() => setSaleModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="modal-title">Record Sale</div>
              <form onSubmit={handleRecordSale}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Item</label>
                    <select className="form-select" name="itemId" required>
                      <option value="">-- Select item --</option>
                      {inventory
                        .filter((i) => i.stock > 0)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} — ${i.price.toFixed(2)} (stock: {i.stock})
                          </option>
                        ))}
                      {inventory.filter((i) => i.stock > 0).length === 0 && (
                        <option value="" disabled>-- Add inventory items first --</option>
                      )}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Quantity Sold</label>
                      <input
                        className="form-input"
                        name="quantity"
                        type="number"
                        min={1}
                        defaultValue={1}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Venue</label>
                      <input
                        className="form-input"
                        name="venue"
                        placeholder="The Masquerade"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        className="form-input"
                        name="date"
                        type="date"
                        defaultValue={today}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Venue Split %</label>
                      <input
                        className="form-input"
                        name="splitPercent"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={0}
                        step={0.1}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" name="paymentMethod">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Record Sale</button>
                  <button type="button" className="btn-secondary" onClick={() => setSaleModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  )
}

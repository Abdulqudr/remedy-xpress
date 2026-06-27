import { useState, useEffect } from 'react'
import { supabase, Order, Rider, ORDER_STATUSES, generateOrderId } from '../lib/supabase'

export default function DispatcherPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'orders' | 'create'>('orders')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    pickup_address: '',
    delivery_address: '',
    rider_id: '',
  })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchOrders()
    fetchRiders()
  }, [])

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, riders(name)')
      .order('created_at', { ascending: false })
    if (error) showToast('Failed to load orders', 'error')
    else setOrders(data || [])
  }

  const fetchRiders = async () => {
    const { data, error } = await supabase
      .from('riders')
      .select('id, name, phone, status')
      .order('name')
    if (error) showToast('Failed to load riders', 'error')
    else setRiders(data || [])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.rider_id) { showToast('Please select a rider', 'error'); return }
    setLoading(true)
    const newOrder = {
      order_id: generateOrderId(),
      ...form,
      status: 'Order Received',
      progress: 0,
      live_updates: ['Order created and rider assigned'],
    }
    const { error } = await supabase.from('orders').insert([newOrder])
    if (error) {
      showToast('Error creating order: ' + error.message, 'error')
    } else {
      showToast(`Order created! ID: ${newOrder.order_id}`)
      setForm({ customer_name: '', customer_phone: '', pickup_address: '', delivery_address: '', rider_id: '' })
      setActiveTab('orders')
      fetchOrders()
    }
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    await supabase.from('orders').update({ status: newStatus }).eq('order_id', orderId)
    await fetchOrders()
    setUpdatingId(null)
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm(`Delete order ${orderId}?`)) return
    await supabase.from('orders').delete().eq('order_id', orderId)
    showToast('Order deleted')
    fetchOrders()
  }

  const filtered = orders.filter(o =>
    o.order_id?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    'Order Received': 'bg-blue-100 text-blue-700',
    'Rider Assigned': 'bg-purple-100 text-purple-700',
    'Rider Picked Up Item': 'bg-yellow-100 text-yellow-700',
    'Rider In Transit': 'bg-orange-100 text-orange-700',
    'Rider Arriving': 'bg-amber-100 text-amber-700',
    'Delivered': 'bg-green-100 text-green-700',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-green-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">D</div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-none">Dispatcher</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Remedy Xpress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{orders.filter(o => o.status !== 'Delivered').length} active</span>
            <button onClick={fetchOrders} className="text-xs text-primary hover:underline">Refresh</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-4 border-t border-border">
          {(['orders', 'create'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'orders' ? `Orders (${orders.length})` : 'Create Order'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'orders' && (
          <div>
            <div className="mb-4">
              <input
                type="search"
                placeholder="Search by order ID or customer name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full max-w-sm px-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-medium text-foreground">No orders yet</p>
                <p className="text-sm mt-1">Create your first order using the tab above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(order => (
                  <div key={order.order_id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-foreground text-sm">{order.order_id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                            {order.status}
                          </span>
                          {updatingId === order.order_id && (
                            <span className="text-xs text-muted-foreground">Updating...</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {order.pickup_address} → {order.delivery_address}
                        </p>
                        {order.riders && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Rider: <span className="text-foreground">{(order.riders as { name: string }).name}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.order_id, e.target.value)}
                          disabled={updatingId === order.order_id}
                          className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          onClick={() => deleteOrder(order.order_id)}
                          className="text-xs text-destructive hover:underline px-2 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-lg">
            <h2 className="text-lg font-bold text-foreground mb-6">Create New Order</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { id: 'customer_name', label: 'Customer Name', placeholder: 'Full name', type: 'text' },
                { id: 'customer_phone', label: 'Customer Phone', placeholder: '+234 000 000 0000', type: 'tel' },
                { id: 'pickup_address', label: 'Pickup Address', placeholder: 'Where to pick up from', type: 'text' },
                { id: 'delivery_address', label: 'Delivery Address', placeholder: 'Where to deliver to', type: 'text' },
              ].map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.id as keyof typeof form]}
                    onChange={e => setForm({ ...form, [field.id]: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Assign Rider</label>
                <select
                  value={form.rider_id}
                  onChange={e => setForm({ ...form, rider_id: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Select a rider --</option>
                  {riders.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.phone} · {r.status || 'available'}
                    </option>
                  ))}
                </select>
                {riders.length === 0 && (
                  <p className="text-xs text-destructive mt-1">No riders found. Add riders to your database first.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

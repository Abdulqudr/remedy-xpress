import { useState, useEffect } from 'react'
import { supabase, Order, Rider, ORDER_STATUSES, generateOrderId } from '../lib/supabase'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Order Received':      { bg: 'bg-blue-100',   text: 'text-blue-700' },
  'Rider Assigned':      { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Rider Picked Up Item':{ bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Rider In Transit':    { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Rider Arriving':      { bg: 'bg-amber-100',  text: 'text-amber-700' },
  'Delivered':           { bg: 'bg-green-100',  text: 'text-green-700' },
}

export default function DispatcherPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [tab, setTab] = useState<'orders' | 'create'>('orders')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    customer_name: '', customer_phone: '',
    pickup_address: '', delivery_address: '',
    rider_id: '', estimated_delivery: '',
  })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchOrders(); fetchRiders()
    // Real-time subscription
    const sub = supabase.channel('dispatcher-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, riders(name, phone)')
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  const fetchRiders = async () => {
    const { data } = await supabase.from('riders').select('id, name, phone, status').order('name')
    if (data) setRiders(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.rider_id) { showToast('Please select a rider', 'error'); return }
    setLoading(true)
    const order_id = generateOrderId()
    const { error } = await supabase.from('orders').insert([{
      order_id,
      ...form,
      status: 'Order Received',
      progress: 0,
      live_updates: ['Order created and rider assigned'],
    }])
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(`Order ${order_id} created!`)
      setForm({ customer_name: '', customer_phone: '', pickup_address: '', delivery_address: '', rider_id: '', estimated_delivery: '' })
      setTab('orders')
      fetchOrders()
    }
    setLoading(false)
  }

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    await supabase.from('orders').update({ status }).eq('order_id', orderId)
    await fetchOrders()
    setUpdatingId(null)
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm(`Delete order ${orderId}? This cannot be undone.`)) return
    await supabase.from('orders').delete().eq('order_id', orderId)
    showToast('Order deleted')
    fetchOrders()
  }

  const getTrackingLink = (orderId: string) => {
    return `${window.location.origin}${import.meta.env.BASE_URL || '/'}track?id=${orderId}`
  }

  const copyLink = (orderId: string) => {
    navigator.clipboard.writeText(getTrackingLink(orderId))
    showToast('Tracking link copied!')
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search)
    const matchStatus = !filterStatus || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status !== 'Delivered').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    today: orders.filter(o => {
      const d = new Date(o.created_at)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length,
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-4 shrink-0 hidden md:flex">
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-xs">RX</div>
          <div>
            <p className="font-bold text-sm text-white leading-none">Remedy Xpress</p>
            <p className="text-xs text-gray-500">Dispatcher</p>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { id: 'orders', icon: '📋', label: 'All Orders' },
            { id: 'create', icon: '➕', label: 'New Order' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as 'orders' | 'create')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === item.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="pt-4 border-t border-gray-800 space-y-1">
          <p className="text-xs text-gray-600 px-3 mb-2 uppercase tracking-wide font-semibold">Quick stats</p>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Delivered', value: stats.delivered },
            { label: 'Today', value: stats.today },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between px-3 py-1">
              <span className="text-xs text-gray-500">{s.label}</span>
              <span className="text-xs font-bold text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-white text-lg">
              {tab === 'orders' ? 'Order Management' : 'Create New Order'}
            </h1>
            <p className="text-gray-400 text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile tabs */}
            <div className="flex md:hidden gap-1 bg-gray-800 rounded-lg p-1">
              {(['orders', 'create'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
                  {t === 'orders' ? 'Orders' : 'Create'}
                </button>
              ))}
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live updates active" />
          </div>
        </div>

        <div className="flex-1 bg-gray-950 p-6">
          {tab === 'orders' && (
            <div>
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Orders', value: stats.total, icon: '📦', color: 'text-white' },
                  { label: 'Active', value: stats.active, icon: '🏍️', color: 'text-orange-400' },
                  { label: 'Delivered Today', value: stats.today, icon: '✅', color: 'text-green-400' },
                  { label: 'Riders', value: riders.length, icon: '👥', color: 'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                      <span className="text-base">{s.icon}</span>
                    </div>
                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <input
                  type="search"
                  placeholder="Search orders, customers, phones..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 text-sm rounded-xl bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-4 py-2 text-sm rounded-xl bg-gray-900 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All statuses</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={fetchOrders}
                  className="px-4 py-2 text-sm rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors font-medium"
                >
                  ↺ Refresh
                </button>
              </div>

              {/* Orders table */}
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="font-semibold text-gray-400">No orders found</p>
                  <p className="text-sm mt-1">Try adjusting your search or create a new order</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(order => {
                    const sc = STATUS_COLORS[order.status] || { bg: 'bg-gray-100', text: 'text-gray-700' }
                    const isExpanded = expandedId === order.order_id
                    return (
                      <div key={order.order_id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        {/* Row */}
                        <div
                          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-800 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-sm text-white">{order.order_id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mt-0.5 font-medium">{order.customer_name} · {order.customer_phone}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{order.pickup_address} → {order.delivery_address}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t border-gray-800 px-5 py-4 bg-gray-950 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Rider</p>
                                <p className="text-sm font-semibold text-white">
                                  {order.riders ? (order.riders as { name: string }).name : 'Unassigned'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Customer Phone</p>
                                <a href={`tel:${order.customer_phone}`} className="text-sm text-orange-400 hover:underline font-semibold">
                                  {order.customer_phone}
                                </a>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <select
                                value={order.status}
                                onChange={e => updateStatus(order.order_id, e.target.value)}
                                disabled={updatingId === order.order_id}
                                className="text-xs px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
                              >
                                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button
                                onClick={() => copyLink(order.order_id)}
                                className="text-xs px-3 py-2 bg-blue-900 hover:bg-blue-800 text-blue-300 border border-blue-800 rounded-lg font-semibold transition-colors"
                              >
                                🔗 Copy Tracking Link
                              </button>
                              <button
                                onClick={() => deleteOrder(order.order_id)}
                                className="text-xs px-3 py-2 bg-red-900 hover:bg-red-800 text-red-300 border border-red-800 rounded-lg font-semibold transition-colors"
                              >
                                🗑 Delete
                              </button>
                            </div>

                            {updatingId === order.order_id && (
                              <p className="text-xs text-orange-400">Updating status…</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'create' && (
            <div className="max-w-xl">
              <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                <h2 className="text-base font-bold text-white">Order Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'customer_name', label: 'Customer Name', placeholder: 'Full name', type: 'text' },
                    { id: 'customer_phone', label: 'Customer Phone', placeholder: '+234 000 000 0000', type: 'tel' },
                  ].map(f => (
                    <div key={f.id}>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.id as keyof typeof form]}
                        onChange={e => setForm({ ...form, [f.id]: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
                {[
                  { id: 'pickup_address', label: 'Pickup Address', placeholder: 'Where to pick up from' },
                  { id: 'delivery_address', label: 'Delivery Address', placeholder: 'Where to deliver to' },
                ].map(f => (
                  <div key={f.id}>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={form[f.id as keyof typeof form]}
                      onChange={e => setForm({ ...form, [f.id]: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Assign Rider</label>
                    <select
                      value={form.rider_id}
                      onChange={e => setForm({ ...form, rider_id: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- Select rider --</option>
                      {riders.map(r => (
                        <option key={r.id} value={r.id}>{r.name} · {r.phone}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Est. Delivery Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 30-45 mins"
                      value={form.estimated_delivery}
                      onChange={e => setForm({ ...form, estimated_delivery: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating order…' : 'Create Order'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

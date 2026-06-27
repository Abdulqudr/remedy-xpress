import { useState, useEffect } from 'react'
import { supabase, Order, Rider, ORDER_STATUSES, generateOrderId } from '../lib/supabase'
import { Logo } from './home'

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Order Received':       { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400' },
  'Rider Assigned':       { bg: 'bg-violet-100',  text: 'text-violet-800',  dot: 'bg-violet-400' },
  'Rider Picked Up Item': { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-400' },
  'Rider In Transit':     { bg: 'bg-blue-100',    text: 'text-blue-900',    dot: 'bg-blue-600' },
  'Rider Arriving':       { bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-400' },
  'Delivered':            { bg: 'bg-green-100',   text: 'text-green-800',   dot: 'bg-green-500' },
}

export default function DispatcherPage() {
  const [orders, setOrders]     = useState<Order[]>([])
  const [riders, setRiders]     = useState<Rider[]>([])
  const [tab, setTab]           = useState<'orders' | 'create'>('orders')
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading]   = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [form, setForm]         = useState({
    customer_name: '', customer_phone: '', pickup_address: '',
    delivery_address: '', rider_id: '', estimated_delivery: '',
  })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchOrders(); fetchRiders()
    const sub = supabase.channel('dispatcher-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, riders(name,phone)').order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  const fetchRiders = async () => {
    const { data } = await supabase.from('riders').select('id,name,phone,status').order('name')
    if (data) setRiders(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.rider_id) { showToast('Please select a rider', 'error'); return }
    setLoading(true)
    const order_id = generateOrderId()
    const { error } = await supabase.from('orders').insert([{
      order_id, ...form, status: 'Order Received', progress: 0,
      live_updates: [`📥 Order ${order_id} created and rider assigned`],
    }])
    if (error) { showToast('Error: ' + error.message, 'error') }
    else {
      showToast(`Order ${order_id} created!`)
      setForm({ customer_name: '', customer_phone: '', pickup_address: '', delivery_address: '', rider_id: '', estimated_delivery: '' })
      setTab('orders'); fetchOrders()
    }
    setLoading(false)
  }

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    await supabase.from('orders').update({ status }).eq('order_id', orderId)
    await fetchOrders(); setUpdatingId(null)
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm(`Delete order ${orderId}?`)) return
    await supabase.from('orders').delete().eq('order_id', orderId)
    showToast('Order deleted'); fetchOrders()
  }

  const copyTrackLink = (orderId: string) => {
    const base = window.location.origin + (import.meta.env.BASE_URL || '/')
    navigator.clipboard.writeText(`${base}track?id=${orderId}`)
    showToast('Tracking link copied!')
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search || [o.order_id, o.customer_name, o.customer_phone]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchSearch && (!filterStatus || o.status === filterStatus)
  })

  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status !== 'Delivered').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    today: orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length,
  }

  return (
    <div className="min-h-screen bg-[#080e1f] text-white flex">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold ${toast.type === 'error' ? 'bg-red-600' : 'bg-blue-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-60 bg-[#0b1526] border-r border-blue-950/80 flex flex-col py-6 px-4 shrink-0 hidden md:flex">
        <div className="mb-8 px-1">
          <Logo size="sm" />
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { id: 'orders', icon: '📋', label: 'All Orders', badge: stats.active > 0 ? stats.active : null },
            { id: 'create', icon: '➕', label: 'New Order', badge: null },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === item.id ? 'bg-amber-400 text-gray-900' : 'text-blue-300/60 hover:bg-blue-950 hover:text-white'
              }`}>
              <span>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && <span className="w-5 h-5 rounded-full bg-blue-700 text-blue-200 text-xs flex items-center justify-center font-bold">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-blue-950/60 space-y-0.5">
          <p className="text-[10px] text-blue-300/30 px-3 mb-2 uppercase tracking-widest font-bold">Stats</p>
          {[
            { label: 'Total Orders', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Delivered', value: stats.delivered },
            { label: 'Today', value: stats.today },
            { label: 'Riders', value: riders.length },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between px-3 py-1">
              <span className="text-xs text-blue-300/40">{s.label}</span>
              <span className="text-xs font-black text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#0b1526] border-b border-blue-950/80 px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-white text-lg">
              {tab === 'orders' ? 'Order Management' : 'Create New Order'}
            </h1>
            <p className="text-blue-300/40 text-xs">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile tab buttons */}
            <div className="flex md:hidden gap-1 bg-blue-950/60 rounded-xl p-1">
              {(['orders','create'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${tab === t ? 'bg-amber-400 text-gray-900' : 'text-blue-300/60'}`}>
                  {t === 'orders' ? 'Orders' : 'Create'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#0d1629] p-5 overflow-y-auto">

          {/* ─── ORDERS TAB ─── */}
          {tab === 'orders' && (
            <div className="max-w-4xl">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Orders', value: stats.total, icon: '📦', color: 'text-white' },
                  { label: 'Active', value: stats.active, icon: '🏍️', color: 'text-amber-400' },
                  { label: 'Delivered', value: stats.delivered, icon: '✅', color: 'text-green-400' },
                  { label: 'Riders', value: riders.length, icon: '👥', color: 'text-blue-300' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0b1526] border border-blue-900/40 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-blue-300/40 font-medium">{s.label}</p>
                      <span>{s.icon}</span>
                    </div>
                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Search + filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                <input
                  type="search" placeholder="Search by order ID, name, phone..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-[180px] px-4 py-2.5 text-sm rounded-xl bg-[#0b1526] border border-blue-900/50 text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl bg-[#0b1526] border border-blue-900/50 text-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">All statuses</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={fetchOrders} className="px-4 py-2.5 text-sm rounded-xl bg-[#0b1526] border border-blue-900/50 text-blue-300/60 hover:text-white hover:border-blue-700 transition-colors font-medium">↺ Refresh</button>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20 text-blue-300/30">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="font-bold text-blue-200/40">No orders found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(order => {
                    const sc = STATUS_COLORS[order.status] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' }
                    const isExpanded = expandedId === order.order_id
                    const riderName = order.riders ? (order.riders as { name: string }).name : 'Unassigned'

                    return (
                      <div key={order.order_id} className="bg-[#0b1526] border border-blue-900/40 rounded-2xl overflow-hidden hover:border-blue-800/60 transition-colors">
                        {/* Row */}
                        <div
                          className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-mono font-black text-sm text-white">{order.order_id}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} inline-block`} />
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-blue-200/80 font-medium truncate">{order.customer_name} · {order.customer_phone}</p>
                            <p className="text-xs text-blue-300/40 truncate mt-0.5">{order.pickup_address} → {order.delivery_address}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-blue-300/40">{riderName}</p>
                            <p className="text-blue-300/30 text-xs mt-1">{isExpanded ? '▲' : '▼'}</p>
                          </div>
                        </div>

                        {/* Expanded */}
                        {isExpanded && (
                          <div className="border-t border-blue-900/40 px-5 py-4 bg-[#091020] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] text-blue-300/40 uppercase font-bold mb-1">Rider</p>
                                <p className="text-sm font-bold text-white">{riderName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-blue-300/40 uppercase font-bold mb-1">Customer Phone</p>
                                <a href={`tel:${order.customer_phone}`} className="text-sm font-bold text-amber-400 hover:underline">{order.customer_phone}</a>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <select
                                value={order.status}
                                onChange={e => updateStatus(order.order_id, e.target.value)}
                                disabled={updatingId === order.order_id}
                                className="text-xs px-3 py-2 rounded-lg bg-[#0b1526] border border-blue-800/50 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50">
                                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button onClick={() => copyTrackLink(order.order_id)}
                                className="text-xs px-3 py-2 bg-blue-900/60 hover:bg-blue-800/60 text-blue-300 border border-blue-800/50 rounded-lg font-bold transition-colors">
                                🔗 Copy Tracking Link
                              </button>
                              <button onClick={() => deleteOrder(order.order_id)}
                                className="text-xs px-3 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-lg font-bold transition-colors">
                                🗑 Delete
                              </button>
                            </div>
                            {updatingId === order.order_id && <p className="text-xs text-amber-400">Updating…</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── CREATE TAB ─── */}
          {tab === 'create' && (
            <div className="max-w-lg">
              <form onSubmit={handleCreate} className="bg-[#0b1526] border border-blue-900/40 rounded-2xl p-6 space-y-5">
                <h2 className="text-base font-black text-white">New Order Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'customer_name',  label: 'Customer Name',  placeholder: 'Full name',       type: 'text' },
                    { id: 'customer_phone', label: 'Phone Number',   placeholder: '+234 000 000 000', type: 'tel' },
                  ].map(f => (
                    <div key={f.id}>
                      <label className="block text-xs font-bold text-blue-300/50 uppercase tracking-widest mb-1.5">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} required
                        value={form[f.id as keyof typeof form]}
                        onChange={e => setForm({ ...form, [f.id]: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#091020] border border-blue-900/50 text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                  ))}
                </div>
                {[
                  { id: 'pickup_address',   label: 'Pickup Address',   placeholder: 'Where to collect the parcel' },
                  { id: 'delivery_address', label: 'Delivery Address', placeholder: 'Where to deliver to' },
                ].map(f => (
                  <div key={f.id}>
                    <label className="block text-xs font-bold text-blue-300/50 uppercase tracking-widest mb-1.5">{f.label}</label>
                    <input type="text" placeholder={f.placeholder} required
                      value={form[f.id as keyof typeof form]}
                      onChange={e => setForm({ ...form, [f.id]: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#091020] border border-blue-900/50 text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-300/50 uppercase tracking-widest mb-1.5">Assign Rider</label>
                    <select value={form.rider_id} onChange={e => setForm({ ...form, rider_id: e.target.value })} required
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#091020] border border-blue-900/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <option value="">-- Select rider --</option>
                      {riders.map(r => <option key={r.id} value={r.id}>{r.name} · {r.phone}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-300/50 uppercase tracking-widest mb-1.5">Est. Delivery</label>
                    <input type="text" placeholder="e.g. 30–45 mins"
                      value={form.estimated_delivery}
                      onChange={e => setForm({ ...form, estimated_delivery: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#091020] border border-blue-900/50 text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-black text-sm rounded-xl disabled:opacity-50 transition-all active:scale-95">
                  {loading ? 'Creating…' : 'Create Order →'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

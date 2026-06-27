import { useState, useEffect } from 'react'
import { supabase, Order, ORDER_STATUSES } from '../lib/supabase'

const WORKFLOW = [
  { status: 'Order Received',       icon: '📥', action: 'Accept Order',     color: 'bg-blue-600',   next: 'Rider Assigned' },
  { status: 'Rider Assigned',       icon: '🧑‍💼', action: 'Confirm Pickup',   color: 'bg-violet-600', next: 'Rider Picked Up Item' },
  { status: 'Rider Picked Up Item', icon: '📦', action: 'Start Transit',    color: 'bg-amber-500',  next: 'Rider In Transit' },
  { status: 'Rider In Transit',     icon: '🏍️', action: 'Mark Arriving',    color: 'bg-blue-700',   next: 'Rider Arriving' },
  { status: 'Rider Arriving',       icon: '📍', action: 'Confirm Delivery', color: 'bg-green-600',  next: 'Delivered' },
  { status: 'Delivered',            icon: '✅', action: '',                  color: 'bg-green-700',  next: null },
]

function getNextStatus(current: string): string | null {
  const idx = ORDER_STATUSES.indexOf(current as typeof ORDER_STATUSES[number])
  return idx === -1 || idx >= ORDER_STATUSES.length - 1 ? null : ORDER_STATUSES[idx + 1]
}

function getWorkflowStep(status: string) {
  return WORKFLOW.find(w => w.status === status) || WORKFLOW[0]
}

export default function RiderPage() {
  const [riderId, setRiderId]       = useState('')
  const [riderName, setRiderName]   = useState('')
  const [inputVal, setInputVal]     = useState('')
  const [orders, setOrders]         = useState<Order[]>([])
  const [loginLoading, setLoginLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [copiedId, setCopiedId]     = useState<string | null>(null)
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loginError, setLoginError] = useState('')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const login = async () => {
    const id = inputVal.trim()
    if (!id) return
    setLoginLoading(true); setLoginError('')
    const { data } = await supabase.from('riders').select('id,name').eq('id', id).single()
    if (!data) {
      setLoginError('Rider ID not found. Ask your dispatcher for the correct ID.')
    } else {
      setRiderId(data.id); setRiderName(data.name)
      fetchOrders(data.id)
    }
    setLoginLoading(false)
  }

  const fetchOrders = async (rider: string) => {
    const { data } = await supabase.from('orders').select('*').eq('rider_id', rider).order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  const advanceStatus = async (order: Order) => {
    const next = getNextStatus(order.status)
    if (!next) return
    setUpdatingId(order.order_id)
    const step = getWorkflowStep(next)
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const updates = [...(order.live_updates || []), `${step.icon} ${step.status} — ${ts}`]
    await supabase.from('orders').update({ status: next, live_updates: updates }).eq('order_id', order.order_id)
    await fetchOrders(riderId)
    showToast(`✓ Updated to: ${next}`)
    setUpdatingId(null)
  }

  const shareGPS = async () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const active = orders.filter(o => o.status === 'Rider In Transit' || o.status === 'Rider Arriving')
        for (const o of active) {
          const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const updates = [...(o.live_updates || []), `📍 Location updated — ${ts}`]
          await supabase.from('orders').update({
            current_location_lat: pos.coords.latitude,
            current_location_lng: pos.coords.longitude,
            live_updates: updates,
          }).eq('order_id', o.order_id)
        }
        await fetchOrders(riderId)
        showToast('📍 Location shared!')
        setGpsLoading(false)
      },
      err => { showToast('Location error: ' + err.message, 'error'); setGpsLoading(false) }
    )
  }

  const copyTrackLink = (orderId: string) => {
    const base = window.location.origin + (import.meta.env.BASE_URL || '/')
    navigator.clipboard.writeText(`${base}track?id=${orderId}`)
    setCopiedId(orderId); showToast('Tracking link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const active = orders.filter(o => o.status !== 'Delivered')
  const done   = orders.filter(o => o.status === 'Delivered')

  /* ─── Login screen ─── */
  if (!riderId) {
    return (
      <div className="min-h-screen bg-[#080e1f] flex flex-col">
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold whitespace-nowrap ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="px-5 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center font-black text-sm text-gray-900">RX</div>
            <p className="font-black text-white text-base">Remedy<span className="text-amber-400">Xpress</span></p>
          </div>
        </div>

        {/* Login card centred */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm">
            {/* Icon */}
            <div className="w-20 h-20 rounded-3xl bg-blue-950 border border-blue-800/50 flex items-center justify-center text-4xl mx-auto mb-6">🏍️</div>
            <h1 className="text-2xl font-black text-white text-center mb-1">Rider Portal</h1>
            <p className="text-blue-300/50 text-sm text-center mb-8">Enter your Rider ID to view your deliveries</p>

            <div className="bg-[#0d1f3c] border border-blue-900/50 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div>
                <label className="block text-xs font-bold text-blue-300/70 uppercase tracking-widest mb-2">Rider ID</label>
                <input
                  type="text"
                  placeholder="Paste your UUID here..."
                  value={inputVal}
                  onChange={e => { setInputVal(e.target.value); setLoginError('') }}
                  onKeyDown={e => e.key === 'Enter' && login()}
                  className={`w-full px-4 py-3.5 text-sm rounded-xl bg-[#172554]/50 border text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono transition-colors ${loginError ? 'border-red-500' : 'border-blue-800/50'}`}
                />
                {loginError && <p className="text-red-400 text-xs mt-2">{loginError}</p>}
              </div>
              <button
                onClick={login}
                disabled={loginLoading || !inputVal.trim()}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-900 text-sm font-black rounded-xl disabled:opacity-50 transition-all active:scale-95"
              >
                {loginLoading ? 'Verifying…' : 'Log In →'}
              </button>
            </div>

            <p className="text-center text-blue-300/30 text-xs mt-6">
              Don't have an ID? Contact your dispatcher.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ─── Dashboard ─── */
  return (
    <div className="min-h-screen bg-[#f5f7ff] flex flex-col">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold whitespace-nowrap ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-700 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0f1d3c] text-white">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center font-black text-sm text-gray-900 shrink-0">RX</div>
            <div>
              <p className="font-bold text-sm leading-tight">{riderName}</p>
              <p className="text-blue-300/50 text-xs">Rider Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={shareGPS} disabled={gpsLoading}
              className="text-xs px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50 transition-colors">
              {gpsLoading ? '…' : '📍 GPS'}
            </button>
            <button onClick={() => fetchOrders(riderId)}
              className="text-xs px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold transition-colors">↺</button>
            <button onClick={() => { setRiderId(''); setRiderName(''); setOrders([]) }}
              className="text-xs text-blue-300/40 hover:text-white px-2 transition-colors">Out</button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="max-w-xl mx-auto px-4 pb-5 grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: orders.length, color: 'text-white' },
            { label: 'Active', value: active.length, color: 'text-amber-400' },
            { label: 'Done', value: done.length, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-blue-950/50 border border-blue-800/30 rounded-xl py-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-blue-300/50 text-[10px] uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-5 space-y-5">
        {/* Active */}
        {active.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Active Deliveries</p>
            <div className="space-y-4">
              {active.map(order => {
                const step = getWorkflowStep(order.status)
                const next = getNextStatus(order.status)
                const nextStep = next ? getWorkflowStep(next) : null
                const isUpdating = updatingId === order.order_id
                const statusIdx = ORDER_STATUSES.indexOf(order.status as typeof ORDER_STATUSES[number])

                return (
                  <div key={order.order_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Colour header */}
                    <div className={`${step.color} px-5 py-3.5 flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{step.icon}</span>
                        <div>
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-wide">Status</p>
                          <p className="text-white font-black text-sm leading-tight">{step.status}</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-white/90 text-sm">{order.order_id}</span>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Customer */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm shrink-0">
                          {order.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{order.customer_name}</p>
                          <a href={`tel:${order.customer_phone}`} className="text-amber-600 text-xs hover:underline">{order.customer_phone}</a>
                        </div>
                        <a href={`tel:${order.customer_phone}`} className="w-9 h-9 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-base hover:bg-green-100 shrink-0">📞</a>
                      </div>

                      {/* Route */}
                      <div className="flex gap-3 bg-slate-50 rounded-xl p-3">
                        <div className="flex flex-col items-center gap-1 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
                          <div className="w-px flex-1 bg-slate-200 min-h-[18px]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Pickup</p>
                            <p className="text-xs font-semibold text-slate-800 truncate">{order.pickup_address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Drop-off</p>
                            <p className="text-xs font-semibold text-slate-800 truncate">{order.delivery_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex gap-1">
                        {ORDER_STATUSES.map((_, i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= statusIdx ? 'bg-blue-700' : 'bg-slate-100'}`} />
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {nextStep && (
                          <button
                            onClick={() => advanceStatus(order)}
                            disabled={isUpdating}
                            className={`flex-1 py-3 ${nextStep.color} hover:opacity-90 text-white text-sm font-black rounded-xl disabled:opacity-50 transition-all active:scale-95`}
                          >
                            {isUpdating ? 'Updating…' : nextStep.action}
                          </button>
                        )}
                        {order.status === 'Delivered' && (
                          <div className="flex-1 py-3 bg-green-100 text-green-700 text-sm font-black rounded-xl text-center">Completed ✓</div>
                        )}
                        <button
                          onClick={() => copyTrackLink(order.order_id)}
                          title="Copy tracking link for customer"
                          className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${copiedId === order.order_id ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {copiedId === order.order_id ? '✓' : '🔗'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Completed</p>
            <div className="space-y-2">
              {done.map(o => (
                <div key={o.order_id} className="bg-white rounded-xl border border-slate-100 px-4 py-3.5 flex items-center justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-sm text-slate-800">{o.order_id}</p>
                    <p className="text-xs text-slate-400 truncate">{o.customer_name} · {o.delivery_address}</p>
                  </div>
                  <span className="ml-3 shrink-0 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Delivered ✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🏍️</p>
            <p className="font-bold text-slate-700">No orders yet</p>
            <p className="text-sm text-slate-400 mt-1">Your dispatcher will assign orders to you shortly</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { supabase, Order, ORDER_STATUSES } from '../lib/supabase'

const WORKFLOW: { status: string; label: string; icon: string; action: string; color: string }[] = [
  { status: 'Order Received',      label: 'Order Received',   icon: '📥', action: 'Accept Order',       color: 'bg-blue-500' },
  { status: 'Rider Assigned',      label: 'Rider Assigned',   icon: '🧑‍💼', action: 'Confirm Pickup',     color: 'bg-purple-500' },
  { status: 'Rider Picked Up Item',label: 'Item Picked Up',   icon: '📦', action: 'Start Transit',      color: 'bg-yellow-500' },
  { status: 'Rider In Transit',    label: 'In Transit',       icon: '🏍️', action: 'Mark Arriving',      color: 'bg-orange-500' },
  { status: 'Rider Arriving',      label: 'Arriving',         icon: '📍', action: 'Confirm Delivery',   color: 'bg-amber-500' },
  { status: 'Delivered',           label: 'Delivered',        icon: '✅', action: '',                   color: 'bg-green-500' },
]

function getNextStatus(current: string): string | null {
  const idx = ORDER_STATUSES.indexOf(current as typeof ORDER_STATUSES[number])
  if (idx === -1 || idx >= ORDER_STATUSES.length - 1) return null
  return ORDER_STATUSES[idx + 1]
}

function getStep(status: string) {
  return WORKFLOW.find(w => w.status === status) || WORKFLOW[0]
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

export default function RiderPage() {
  const [riderId, setRiderId] = useState('')
  const [riderName, setRiderName] = useState('')
  const [riderInput, setRiderInput] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loginLoading, setLoginLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const login = async () => {
    const id = riderInput.trim()
    if (!id) return
    setLoginLoading(true)
    const { data, error } = await supabase
      .from('riders')
      .select('id, name')
      .eq('id', id)
      .single()
    if (error || !data) {
      showToast('Rider ID not found. Please check and try again.', 'error')
    } else {
      setRiderId(data.id)
      setRiderName(data.name)
      fetchOrders(data.id)
    }
    setLoginLoading(false)
  }

  const fetchOrders = async (rider: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', rider)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  const advanceStatus = async (order: Order) => {
    const next = getNextStatus(order.status)
    if (!next) return
    setUpdatingId(order.order_id)
    const step = getStep(next)
    const updates: string[] = [...(order.live_updates || []), `${step.icon} ${step.label} — ${new Date().toLocaleTimeString()}`]
    await supabase.from('orders').update({ status: next, live_updates: updates }).eq('order_id', order.order_id)
    await fetchOrders(riderId)
    showToast(`Updated: ${next}`)
    setUpdatingId(null)
  }

  const shareLocation = async () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const active = orders.filter(o => o.status === 'Rider In Transit' || o.status === 'Rider Arriving')
        for (const o of active) {
          const updates = [...(o.live_updates || []), `📍 Location shared at ${new Date().toLocaleTimeString()}`]
          await supabase.from('orders').update({
            current_location_lat: pos.coords.latitude,
            current_location_lng: pos.coords.longitude,
            live_updates: updates,
          }).eq('order_id', o.order_id)
        }
        await fetchOrders(riderId)
        showToast('Location shared with customers!')
        setGpsLoading(false)
      },
      (err) => { showToast('Could not get location: ' + err.message, 'error'); setGpsLoading(false) }
    )
  }

  const getTrackingLink = (orderId: string) => {
    const base = window.location.origin + (import.meta.env.BASE_URL || '/')
    return `${base}track?id=${orderId}`
  }

  const handleCopyLink = (orderId: string) => {
    copyToClipboard(getTrackingLink(orderId))
    setCopiedId(orderId)
    showToast('Tracking link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Auto-load tracking ID from URL on customer page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) setRiderInput(id)
  }, [])

  const active = orders.filter(o => o.status !== 'Delivered')
  const done = orders.filter(o => o.status === 'Delivered')

  if (!riderId) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.msg}
          </div>
        )}
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl mx-auto mb-4">RX</div>
            <h1 className="text-2xl font-extrabold text-white">Rider Portal</h1>
            <p className="text-gray-400 text-sm mt-2">Log in with your unique Rider ID</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Rider ID</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Paste your UUID..."
                value={riderInput}
                onChange={e => setRiderInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()}
                className="w-full px-4 py-3 text-sm rounded-xl bg-gray-700 border border-gray-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>
            <button
              onClick={login}
              disabled={loginLoading || !riderInput.trim()}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {loginLoading ? 'Logging in…' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-sm">RX</div>
            <div>
              <p className="font-bold text-sm">{riderName}</p>
              <p className="text-gray-400 text-xs">Rider Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shareLocation}
              disabled={gpsLoading}
              className="text-xs px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
            >
              {gpsLoading ? '…' : '📍 Share GPS'}
            </button>
            <button
              onClick={() => fetchOrders(riderId)}
              className="text-xs px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => { setRiderId(''); setRiderName(''); setOrders([]) }}
              className="text-xs text-gray-400 hover:text-white px-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-900 pb-6 px-4">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3">
          {[
            { label: 'Total Orders', value: orders.length, color: 'text-white' },
            { label: 'Active', value: active.length, color: 'text-orange-400' },
            { label: 'Delivered', value: done.length, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-2xl p-4 text-center border border-gray-700">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Active orders */}
        {active.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Active Deliveries</h2>
            <div className="space-y-4">
              {active.map(order => {
                const step = getStep(order.status)
                const next = getNextStatus(order.status)
                const nextStep = next ? getStep(next) : null
                const isUpdating = updatingId === order.order_id

                return (
                  <div key={order.order_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Status header */}
                    <div className={`${step.color} px-5 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{step.icon}</span>
                        <div>
                          <p className="text-white text-xs font-semibold uppercase tracking-wide opacity-80">Current status</p>
                          <p className="text-white font-bold text-sm">{step.label}</p>
                        </div>
                      </div>
                      <span className="text-white font-black text-sm font-mono">{order.order_id}</span>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Customer */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
                          {order.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{order.customer_name}</p>
                          <a href={`tel:${order.customer_phone}`} className="text-orange-500 text-xs hover:underline">{order.customer_phone}</a>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="flex flex-col items-center gap-1 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
                          <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Pickup</p>
                            <p className="text-xs font-semibold text-gray-800">{order.pickup_address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Deliver to</p>
                            <p className="text-xs font-semibold text-gray-800">{order.delivery_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Mini progress */}
                      <div className="flex gap-1">
                        {ORDER_STATUSES.map((s, i) => {
                          const idx = ORDER_STATUSES.indexOf(order.status as typeof ORDER_STATUSES[number])
                          return (
                            <div
                              key={s}
                              className={`h-1.5 flex-1 rounded-full transition-all ${i <= idx ? 'bg-orange-500' : 'bg-gray-100'}`}
                            />
                          )
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        {nextStep && (
                          <button
                            onClick={() => advanceStatus(order)}
                            disabled={isUpdating}
                            className={`flex-1 py-3 ${nextStep.color} hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all`}
                          >
                            {isUpdating ? 'Updating…' : nextStep.action}
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyLink(order.order_id)}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${copiedId === order.order_id ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                          title="Copy tracking link for customer"
                        >
                          {copiedId === order.order_id ? '✓ Copied' : '🔗 Share'}
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
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Completed</h2>
            <div className="space-y-2">
              {done.map(order => (
                <div key={order.order_id} className="bg-white rounded-xl border border-gray-100 px-5 py-3.5 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-mono font-bold text-sm text-gray-900">{order.order_id}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{order.customer_name} · {order.delivery_address}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Delivered ✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏍️</p>
            <p className="font-bold text-gray-700">No orders assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Your dispatcher will assign orders to you shortly</p>
          </div>
        )}
      </div>
    </div>
  )
}

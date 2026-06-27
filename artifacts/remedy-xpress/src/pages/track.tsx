import { useState, useEffect } from 'react'
import { supabase, Order, ORDER_STATUSES, getStatusIndex } from '../lib/supabase'

const STEPS = [
  { label: 'Received', icon: '📥', desc: 'Order confirmed' },
  { label: 'Assigned', icon: '🧑‍💼', desc: 'Rider assigned' },
  { label: 'Picked Up', icon: '📦', desc: 'Item collected' },
  { label: 'In Transit', icon: '🏍️', desc: 'On the way' },
  { label: 'Arriving', icon: '📍', desc: 'Almost there' },
  { label: 'Delivered', icon: '✅', desc: 'Delivered' },
]

export default function TrackPage() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const fetchOrder = async (id: string) => {
    setLoading(true)
    setError('')
    setSearched(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, riders(name, phone)')
      .eq('order_id', id.toUpperCase())
      .single()
    if (error || !data) {
      setError('No order found with that ID. Please check and try again.')
      setOrder(null)
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!order) return
    const sub = supabase
      .channel(`track-${order.order_id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `order_id=eq.${order.order_id}`,
      }, (payload) => setOrder(payload.new as Order))
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [order?.order_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderId.trim()) fetchOrder(orderId.trim())
  }

  const statusIdx = order ? getStatusIndex(order.status) : -1
  const isDelivered = order?.status === 'Delivered'

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">RX</span>
          </div>
          <div>
            <span className="font-bold text-gray-900 text-base">Remedy Xpress</span>
            <p className="text-xs text-gray-400 leading-none">Delivery Tracking</p>
          </div>
        </div>
      </header>

      {/* Hero search */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Real-time tracking</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Where is my delivery?</h1>
          <p className="text-gray-400 text-sm mb-8">Enter your order ID to get live status updates</p>

          <form onSubmit={handleSubmit} className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-2xl max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Enter order ID  (e.g. RX-A3B4C)"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="flex-1 px-4 py-2.5 text-gray-900 text-sm rounded-xl focus:outline-none placeholder:text-gray-400 font-medium bg-transparent"
            />
            <button
              type="submit"
              disabled={loading || !orderId.trim()}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {loading ? 'Searching…' : 'Track'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-red-500 text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-red-800 text-sm">Order not found</p>
              <p className="text-red-600 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {order && (
          <>
            {/* Status banner */}
            <div className={`rounded-2xl p-5 flex items-center justify-between ${isDelivered ? 'bg-green-600' : 'bg-orange-500'} text-white`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Order ID</p>
                <p className="text-2xl font-black mt-0.5">{order.order_id}</p>
                <p className="text-sm font-medium opacity-90 mt-1">{order.status}</p>
              </div>
              <div className="text-4xl">{isDelivered ? '✅' : '🏍️'}</div>
            </div>

            {/* Progress timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6">Delivery Progress</h2>
              <div className="space-y-0">
                {STEPS.map((step, i) => {
                  const done = i <= statusIdx
                  const active = i === statusIdx
                  const isLast = i === STEPS.length - 1
                  return (
                    <div key={step.label} className="flex gap-4">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 border-2 transition-all duration-300 ${
                          done
                            ? active
                              ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                              : 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          {done && !active ? '✓' : step.icon}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-8 mt-1 mb-1 ${done && i < statusIdx ? 'bg-green-400' : 'bg-gray-100'}`} />
                        )}
                      </div>
                      {/* Text */}
                      <div className="pb-6 flex-1 pt-2">
                        <p className={`text-sm font-bold ${done ? active ? 'text-orange-600' : 'text-green-600' : 'text-gray-300'}`}>
                          {step.label}
                          {active && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                            Current
                          </span>}
                        </p>
                        <p className={`text-xs mt-0.5 ${done ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rider info */}
            {order.riders ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Your Rider</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-black text-orange-600">
                    {order.riders.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base">{order.riders.name}</p>
                    <a href={`tel:${order.riders.phone}`} className="text-orange-500 text-sm hover:underline font-medium">
                      {order.riders.phone}
                    </a>
                  </div>
                  <a
                    href={`tel:${order.riders.phone}`}
                    className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-xl hover:bg-green-100 transition-colors"
                    title="Call rider"
                  >
                    📞
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3 text-gray-400">
                <span className="text-2xl">🏍️</span>
                <p className="text-sm">Rider not yet assigned — you'll be notified soon.</p>
              </div>
            )}

            {/* Route */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Route</p>
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
                  <div className="w-px flex-1 bg-gray-100 min-h-[28px]" />
                  <div className="w-3 h-3 rounded-full bg-orange-400 shrink-0" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Pickup</p>
                    <p className="text-sm font-semibold text-gray-900">{order.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Destination</p>
                    <p className="text-sm font-semibold text-gray-900">{order.delivery_address}</p>
                  </div>
                </div>
              </div>
              {order.estimated_delivery && (
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Estimated delivery</span>
                  <span className="text-sm font-bold text-gray-900">{order.estimated_delivery}</span>
                </div>
              )}
            </div>

            {/* Live updates */}
            {order.live_updates && order.live_updates.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Live Updates</p>
                </div>
                <div className="space-y-3">
                  {[...order.live_updates].reverse().map((msg, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-1.5 shrink-0" />
                      <p className="text-sm text-gray-600">{msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p className="font-semibold text-gray-600">Track your delivery</p>
            <p className="text-sm mt-1">Enter your order ID above to get started</p>
          </div>
        )}
      </div>

      <footer className="text-center py-6 border-t border-gray-100 text-xs text-gray-400 bg-white">
        © 2025 Remedy Xpress · Fast, reliable deliveries
      </footer>
    </div>
  )
}

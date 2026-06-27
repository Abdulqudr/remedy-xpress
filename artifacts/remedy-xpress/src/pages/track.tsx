import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase, Order, ORDER_STATUSES, getStatusIndex } from '../lib/supabase'
import { Logo } from './home'

const STEPS = [
  { label: 'Order Received',  icon: '📥', desc: 'Your order has been confirmed' },
  { label: 'Rider Assigned',  icon: '🧑‍💼', desc: 'A rider has been assigned' },
  { label: 'Item Picked Up',  icon: '📦', desc: 'Rider collected your package' },
  { label: 'In Transit',      icon: '🏍️', desc: 'Your order is on the way' },
  { label: 'Arriving Soon',   icon: '📍', desc: 'Almost at your location' },
  { label: 'Delivered',       icon: '✅', desc: 'Package delivered!' },
]

export default function TrackPage() {
  const [location] = useLocation()
  const [orderId, setOrderId] = useState('')
  const [input, setInput] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // Auto-fill from ?id= URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) { setInput(id); fetchOrder(id) }
  }, [])

  const fetchOrder = async (id: string) => {
    setLoading(true); setError(''); setSearched(true)
    const { data, error } = await supabase
      .from('orders').select('*, riders(name, phone)')
      .eq('order_id', id.toUpperCase()).single()
    if (error || !data) {
      setError('No order found with that ID. Please double-check and try again.')
      setOrder(null)
    } else {
      setOrder(data); setOrderId(data.order_id)
    }
    setLoading(false)
  }

  // Real-time subscription
  useEffect(() => {
    if (!orderId) return
    const sub = supabase.channel(`track-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `order_id=eq.${orderId}`,
      }, payload => setOrder(payload.new as Order))
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [orderId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) fetchOrder(input.trim())
  }

  const statusIdx = order ? getStatusIndex(order.status) : -1
  const isDelivered = order?.status === 'Delivered'

  return (
    <div className="min-h-screen bg-[#f5f7ff] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Logo size="sm" />
        </div>
      </header>

      {/* Search hero */}
      <div className="bg-gradient-to-br from-[#0f1d3c] to-[#172554] text-white px-4 py-12">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Real-time tracking</p>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Where is my delivery?</h1>
          <p className="text-blue-200/60 text-sm mb-8">Enter your order ID to see live status updates</p>
          <form onSubmit={handleSubmit} className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-2xl">
            <input
              type="text"
              placeholder="Enter order ID (e.g. RX-A3B4C)"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-gray-900 text-sm rounded-xl focus:outline-none placeholder:text-gray-400 font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-900 text-sm font-black rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {loading ? '…' : 'Track'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 max-w-xl w-full mx-auto px-4 py-7 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-bold text-red-800 text-sm">Order not found</p>
              <p className="text-red-500 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {order && (
          <>
            {/* Status card */}
            <div className={`rounded-2xl p-5 flex items-center justify-between ${isDelivered ? 'bg-green-600' : 'bg-[#1e40af]'} text-white shadow-lg`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Order ID</p>
                <p className="text-2xl font-black mt-0.5 font-mono">{order.order_id}</p>
                <p className="text-sm font-semibold opacity-90 mt-1">{order.status}</p>
              </div>
              <span className="text-4xl">{isDelivered ? '✅' : '🏍️'}</span>
            </div>

            {/* Progress timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Delivery Progress</h2>
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Live
                </span>
              </div>
              <div>
                {STEPS.map((step, i) => {
                  const done = i <= statusIdx
                  const active = i === statusIdx
                  const isLast = i === STEPS.length - 1
                  return (
                    <div key={step.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 border-2 transition-all ${
                          active ? 'bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-200'
                          : done ? 'bg-blue-700 border-blue-700 text-white'
                          : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                          {done && !active ? '✓' : step.icon}
                        </div>
                        {!isLast && <div className={`w-0.5 h-8 mt-1 mb-1 ${done && i < statusIdx ? 'bg-blue-500' : 'bg-slate-100'}`} />}
                      </div>
                      <div className="pb-5 flex-1 pt-2">
                        <p className={`text-sm font-bold ${active ? 'text-amber-600' : done ? 'text-blue-700' : 'text-slate-300'}`}>
                          {step.label}
                          {active && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" /> Current
                            </span>
                          )}
                        </p>
                        <p className={`text-xs mt-0.5 ${done ? 'text-slate-500' : 'text-slate-300'}`}>{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rider info */}
            {order.riders ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Your Rider</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-black text-blue-700">
                    {order.riders.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{order.riders.name}</p>
                    <a href={`tel:${order.riders.phone}`} className="text-amber-600 text-sm hover:underline font-medium">{order.riders.phone}</a>
                  </div>
                  <a href={`tel:${order.riders.phone}`} className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-xl hover:bg-green-100 transition-colors">📞</a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-3 text-slate-400">
                <span className="text-2xl">🏍️</span>
                <p className="text-sm">Rider not yet assigned — you'll be notified soon.</p>
              </div>
            )}

            {/* Route */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Route</p>
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
                  <div className="w-px flex-1 bg-slate-100 min-h-[28px]" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Pickup</p>
                    <p className="text-sm font-semibold text-slate-900">{order.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Destination</p>
                    <p className="text-sm font-semibold text-slate-900">{order.delivery_address}</p>
                  </div>
                </div>
              </div>
              {order.estimated_delivery && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Estimated delivery</span>
                  <span className="text-sm font-black text-slate-900">{order.estimated_delivery}</span>
                </div>
              )}
            </div>

            {/* Live updates */}
            {order.live_updates && order.live_updates.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Live Updates</p>
                </div>
                <div className="space-y-3">
                  {[...order.live_updates].reverse().map((msg, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <p className="text-sm text-slate-600">{msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-14 text-slate-400">
            <p className="text-5xl mb-4">📦</p>
            <p className="font-bold text-slate-600">Track your delivery</p>
            <p className="text-sm mt-1">Enter your order ID above to get started</p>
          </div>
        )}
      </div>

      <footer className="text-center py-5 border-t border-slate-100 text-xs text-slate-400 bg-white">
        © 2025 Remedy Xpress · Fast, reliable deliveries
      </footer>
    </div>
  )
}

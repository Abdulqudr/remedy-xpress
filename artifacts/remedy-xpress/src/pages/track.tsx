import { useState, useEffect } from 'react'
import { supabase, Order, ORDER_STATUSES, getStatusIndex } from '../lib/supabase'

export default function TrackPage() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchOrder = async (id: string) => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('orders')
      .select('*, riders(name, phone)')
      .eq('order_id', id)
      .single()
    if (error) {
      setError('Order not found. Please check the ID and try again.')
      setOrder(null)
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!order) return
    const subscription = supabase
      .channel(`order-${order.order_id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `order_id=eq.${order.order_id}`,
      }, (payload) => setOrder(payload.new as Order))
      .subscribe()
    return () => { supabase.removeChannel(subscription) }
  }, [order?.order_id])

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderId.trim()) fetchOrder(orderId.trim())
  }

  const statusIndex = order ? getStatusIndex(order.status) : -1

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-orange-50 border-b border-border px-4 py-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
          Live tracking
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Delivery</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">Enter your order ID to see real-time delivery status</p>

        <form onSubmit={handleTrack} className="mt-6 flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder="e.g. RX-A3F9K"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-4">
            {/* Order Header */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Order ID</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{order.order_id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'Delivered'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-5">Delivery Progress</h2>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
                  style={{ width: `${statusIndex > 0 ? (statusIndex / (ORDER_STATUSES.length - 1)) * 100 : 0}%`, right: 'auto', maxWidth: 'calc(100% - 2rem)' }}
                />
                <div className="relative flex justify-between">
                  {ORDER_STATUSES.map((step, i) => {
                    const done = i <= statusIndex
                    const active = i === statusIndex
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 w-12">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          done
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-card border-border text-muted-foreground'
                        } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-center text-[10px] leading-tight ${done ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          {step.replace('Rider ', '').replace('Order ', '')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Rider Info */}
            {order.riders && (
              <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {order.riders.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Your Rider</p>
                  <p className="font-semibold text-foreground">{order.riders.name}</p>
                  <a href={`tel:${order.riders.phone}`} className="text-sm text-primary hover:underline">{order.riders.phone}</a>
                </div>
                <a
                  href={`tel:${order.riders.phone}`}
                  className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg hover:bg-green-200 transition-colors"
                >
                  📞
                </a>
              </div>
            )}
            {!order.riders && (
              <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">🏍️</div>
                <div>
                  <p className="text-xs text-muted-foreground">Rider</p>
                  <p className="text-sm text-foreground font-medium">Not yet assigned</p>
                </div>
              </div>
            )}

            {/* Addresses */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Delivery Details</h2>
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="w-0.5 h-8 bg-border" />
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Pickup</p>
                    <p className="text-sm text-foreground font-medium">{order.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Delivery</p>
                    <p className="text-sm text-foreground font-medium">{order.delivery_address}</p>
                  </div>
                </div>
              </div>
              {order.estimated_delivery && (
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Estimated delivery</p>
                  <p className="text-sm font-semibold text-foreground">{order.estimated_delivery}</p>
                </div>
              )}
            </div>

            {/* Live Updates */}
            {order.live_updates && order.live_updates.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-sm font-semibold text-foreground">Live Updates</h2>
                </div>
                <div className="space-y-2.5">
                  {[...order.live_updates].reverse().map((msg, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-muted-foreground mt-0.5 text-xs">•</span>
                      <span className="text-foreground">{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!order && !loading && !error && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-medium text-foreground">Enter your order ID above</p>
            <p className="text-sm mt-1">Your order ID was sent to you when the order was created</p>
          </div>
        )}
      </div>
    </div>
  )
}

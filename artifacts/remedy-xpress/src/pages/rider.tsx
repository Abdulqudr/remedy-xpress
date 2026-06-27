import { useState, useEffect, useRef } from 'react'
import { supabase, Order, ORDER_STATUSES } from '../lib/supabase'

export default function RiderPage() {
  const [riderId, setRiderId] = useState('')
  const [riderInput, setRiderInput] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const login = async (id: string) => {
    if (!id.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('riders')
      .select('id, name')
      .eq('id', id.trim())
      .single()
    if (error || !data) {
      showToast('Rider ID not found. Check your ID and try again.', 'error')
    } else {
      setRiderId(id.trim())
      fetchOrders(id.trim())
    }
    setLoading(false)
  }

  const fetchOrders = async (rider: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', rider)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('order_id', orderId)
    fetchOrders(riderId)
    showToast(`Status updated to: ${newStatus}`)
  }

  const shareLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const time = new Date().toLocaleTimeString()
        // Update all active orders for this rider
        const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Order Received')
        await Promise.all(activeOrders.map(o =>
          supabase.from('orders').update({
            current_location_lat: pos.coords.latitude,
            current_location_lng: pos.coords.longitude,
          }).eq('order_id', o.order_id)
        ))
        // Append a live update message
        if (activeOrders.length > 0) {
          const o = activeOrders[0]
          const currentUpdates: string[] = o.live_updates || []
          await supabase.from('orders').update({
            live_updates: [...currentUpdates, `📍 Location shared at ${time}`],
          }).eq('order_id', o.order_id)
        }
        showToast('Location shared successfully!')
        fetchOrders(riderId)
        setGpsLoading(false)
      },
      (err) => {
        showToast('Could not get location: ' + err.message, 'error')
        setGpsLoading(false)
      }
    )
  }

  const getNextStatus = (current: string): string | null => {
    const idx = ORDER_STATUSES.indexOf(current as typeof ORDER_STATUSES[number])
    if (idx === -1 || idx >= ORDER_STATUSES.length - 1) return null
    return ORDER_STATUSES[idx + 1]
  }

  const statusColors: Record<string, string> = {
    'Order Received': 'bg-blue-100 text-blue-700',
    'Rider Assigned': 'bg-purple-100 text-purple-700',
    'Rider Picked Up Item': 'bg-yellow-100 text-yellow-700',
    'Rider In Transit': 'bg-orange-100 text-orange-700',
    'Rider Arriving': 'bg-amber-100 text-amber-700',
    'Delivered': 'bg-green-100 text-green-700',
  }

  if (!riderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-green-600 text-white'
          }`}>
            {toast.msg}
          </div>
        )}
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-4">🏍️</div>
            <h1 className="text-2xl font-bold text-foreground">Rider Login</h1>
            <p className="text-muted-foreground text-sm mt-2">Enter your rider UUID to access your deliveries</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Rider ID</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Paste your UUID here..."
                value={riderInput}
                onChange={e => setRiderInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login(riderInput)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>
            <button
              onClick={() => login(riderInput)}
              disabled={loading || !riderInput.trim()}
              className="w-full py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="text-xs text-center text-muted-foreground">
              Your Rider ID is the UUID from the riders table
            </p>
          </div>
        </div>
      </div>
    )
  }

  const activeOrders = orders.filter(o => o.status !== 'Delivered')
  const completedOrders = orders.filter(o => o.status === 'Delivered')

  return (
    <div className="min-h-screen bg-background">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-green-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">R</div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-none">Rider Dashboard</h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate max-w-[160px]">{riderId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shareLocation}
              disabled={gpsLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {gpsLoading ? 'Sharing...' : '📍 Share GPS'}
            </button>
            <button
              onClick={() => fetchOrders(riderId)}
              className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-medium hover:opacity-80 transition-opacity"
            >
              Refresh
            </button>
            <button
              onClick={() => { setRiderId(''); setOrders([]) }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: orders.length, color: 'text-foreground' },
            { label: 'Active', value: activeOrders.length, color: 'text-primary' },
            { label: 'Delivered', value: completedOrders.length, color: 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Active Orders</h2>
            <div className="space-y-3">
              {activeOrders.map(order => {
                const next = getNextStatus(order.status)
                return (
                  <div key={order.order_id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="font-mono font-bold text-sm text-foreground">{order.order_id}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-sm mb-3">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <div className="w-0.5 h-5 bg-border" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup</p>
                          <p className="text-sm text-foreground font-medium">{order.pickup_address}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Delivery</p>
                          <p className="text-sm text-foreground font-medium">{order.delivery_address}</p>
                        </div>
                      </div>
                    </div>
                    {next && (
                      <button
                        onClick={() => updateStatus(order.order_id, next)}
                        className="w-full py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Mark as: {next}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Completed</h2>
            <div className="space-y-2">
              {completedOrders.map(order => (
                <div key={order.order_id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-medium text-foreground">{order.order_id}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{order.delivery_address}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Delivered</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🏍️</div>
            <p className="font-medium text-foreground">No orders assigned</p>
            <p className="text-sm mt-1">Your dispatcher will assign orders to you shortly</p>
          </div>
        )}
      </div>
    </div>
  )
}

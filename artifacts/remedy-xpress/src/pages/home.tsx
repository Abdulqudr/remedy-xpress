import { Link } from 'wouter'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">RX</span>
            </div>
            <span className="font-bold text-foreground text-lg">Remedy Xpress</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/track" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Track Order</Link>
            <Link href="/dispatcher" className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              Dispatcher
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
          Fast, reliable delivery
        </div>
        <h1 className="text-5xl font-extrabold text-foreground leading-tight max-w-xl mb-4">
          Deliveries,<br/>
          <span className="text-primary">tracked live.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mb-10">
          Real-time order tracking for dispatchers, riders, and customers — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/track"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Track an Order
          </Link>
          <Link
            href="/dispatcher"
            className="px-6 py-3 bg-card border border-border text-foreground rounded-xl font-semibold text-sm hover:bg-secondary transition-colors"
          >
            Dispatcher Dashboard
          </Link>
          <Link
            href="/rider"
            className="px-6 py-3 bg-card border border-border text-foreground rounded-xl font-semibold text-sm hover:bg-secondary transition-colors"
          >
            Rider Dashboard
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-card border-t border-border py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: '📦',
              title: 'Order Tracking',
              desc: 'Customers get a live progress view from pickup to delivery with every status update.',
            },
            {
              icon: '📋',
              title: 'Dispatcher Control',
              desc: 'Create orders, assign riders, and manage all deliveries from a clean dashboard.',
            },
            {
              icon: '🏍️',
              title: 'Rider Dashboard',
              desc: 'Riders see their assigned orders and update status in one tap. GPS sharing built in.',
            },
          ].map(f => (
            <div key={f.title} className="p-5 rounded-xl border border-border bg-background">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-border px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2025 Remedy Xpress. Built for fast, reliable deliveries.</p>
      </footer>
    </div>
  )
}

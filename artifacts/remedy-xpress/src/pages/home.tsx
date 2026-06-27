import { useLocation } from 'wouter'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 48 : size === 'sm' ? 28 : 38
  const textSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <div className="flex items-center gap-3">
      <svg width={dims} height={dims} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#F59E0B"/>
        <path d="M10 13h15c3.9 0 7 3.1 7 7s-3.1 7-7 7H10V13z" fill="white"/>
        <path d="M10 27h13l7 8H10v-8z" fill="white" fillOpacity="0.75"/>
        <circle cx="36" cy="34" r="3.5" fill="white"/>
        <path d="M22 38 Q28 28 36 30" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
      <div>
        <p className={`font-black text-white ${textSize} leading-none tracking-tight`}>
          Remedy<span className="text-amber-400">Xpress</span>
        </p>
        <p className="text-blue-300/50 text-[9px] leading-none tracking-widest uppercase mt-0.5">Express Delivery</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [, nav] = useLocation()

  return (
    <div className="min-h-screen bg-[#080e1f] flex flex-col overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-14 py-5 z-10 relative">
        <Logo />
        <button
          onClick={() => nav('/track')}
          className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          Track Order →
        </button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center relative pt-2 pb-10">
        {/* Glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-blue-700/10 blur-3xl" />
          <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-amber-500/6 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl w-full">
          <span className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Real-time delivery tracking
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4">
            Fast Deliveries,
            <br />
            <span className="text-amber-400">Tracked Live.</span>
          </h1>
          <p className="text-blue-200/60 text-base md:text-lg max-w-xl mx-auto mb-8">
            Connecting customers, riders, and dispatchers — every step of the journey visible in real time.
          </p>

          {/* Animated delivery scene */}
          <DeliveryScene />

          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
            <button
              onClick={() => nav('/track')}
              className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-black text-sm rounded-2xl transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 active:scale-100"
            >
              📦 Track My Order
            </button>
            <p className="text-blue-300/40 text-xs">Enter your order ID on the tracking page</p>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="border-t border-white/5 bg-[#0b1526] py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '⚡', title: 'Instant Updates', desc: 'Status changes appear on the tracking page the moment a rider taps a button.' },
            { icon: '📍', title: 'Live Location', desc: 'Riders share GPS so customers always know where their parcel is.' },
            { icon: '🔒', title: 'Role Separated', desc: 'Customers, riders, and dispatchers each have their own private link.' },
          ].map(f => (
            <div key={f.title} className="bg-blue-950/30 border border-blue-900/40 rounded-2xl p-5 text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
              <p className="text-blue-200/50 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-4 border-t border-white/5 text-xs text-blue-300/25">
        © 2025 Remedy Xpress · Express Delivery
      </footer>
    </div>
  )
}

function DeliveryScene() {
  return (
    <div className="w-full max-w-2xl mx-auto" style={{ height: '240px' }}>
      <svg viewBox="0 0 700 260" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f1d3a"/>
            <stop offset="100%" stopColor="#0a1225"/>
          </linearGradient>
        </defs>

        {/* Stars */}
        {[[50,18],[130,8],[220,25],[340,10],[470,22],[560,8],[640,18],[80,42],[400,5],[290,38]].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="1.2" fill="white" opacity="0.35">
            <animate attributeName="opacity" values="0.15;0.6;0.15" dur={`${2.2+i*0.25}s`} repeatCount="indefinite"/>
          </circle>
        ))}

        {/* Ground */}
        <rect x="0" y="210" width="700" height="50" fill="url(#groundGrad)"/>
        <rect x="0" y="209" width="700" height="2.5" fill="#1e40af" opacity="0.5"/>

        {/* Dashed road lines */}
        {[0,1,2,3,4,5,6,7].map(i=>(
          <rect key={i} x={i*100-20} y="232" width="60" height="3.5" rx="2" fill="#f59e0b" opacity="0.22">
            <animateTransform attributeName="transform" type="translate" from="0,0" to="-100,0" dur="1.8s" repeatCount="indefinite" begin={`${-i*0.225}s`}/>
          </rect>
        ))}

        {/* ── BUILDING LEFT ── */}
        <rect x="18" y="90" width="90" height="120" rx="5" fill="#0d1e3a" stroke="#1e3a8a" strokeWidth="1.5"/>
        {[[24,97,36,22],[65,97,36,22],[24,128,36,18],[65,128,36,18],[24,158,36,20],[65,158,36,20]].map(([x,y,w,h],i)=>(
          <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#1d4ed8" opacity={0.25+i*0.07}/>
        ))}
        <rect x="20" y="78" width="86" height="18" rx="4" fill="#1e40af"/>
        <text x="63" y="91" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="sans-serif">SHOP</text>
        <rect x="42" y="170" width="34" height="40" rx="3" fill="#0a1628"/>
        <rect x="44" y="172" width="30" height="38" rx="2" fill="#1e3a8a" opacity="0.4"/>

        {/* ── CUSTOMER (left person) ── */}
        <g transform="translate(148,100)">
          {/* Shadow */}
          <ellipse cx="0" cy="112" rx="20" ry="5" fill="#000" opacity="0.25"/>
          {/* Legs */}
          <rect x="-11" y="72" width="10" height="38" rx="5" fill="#1e40af"/>
          <rect x="2" y="72" width="10" height="38" rx="5" fill="#1e40af"/>
          <ellipse cx="-6" cy="110" rx="9" ry="4" fill="#0f172a"/>
          <ellipse cx="7" cy="110" rx="9" ry="4" fill="#0f172a"/>
          {/* Body */}
          <rect x="-14" y="22" width="28" height="52" rx="7" fill="#2563eb"/>
          {/* Head */}
          <circle cx="0" cy="11" r="17" fill="#fbbf24"/>
          {/* Hair */}
          <path d="M-17 6 Q-14-9 0-11 Q14-9 17 6" fill="#1e3a8a"/>
          {/* Eyes */}
          <circle cx="-5.5" cy="9" r="2.5" fill="#0a1628"/>
          <circle cx="5.5" cy="9" r="2.5" fill="#0a1628"/>
          <circle cx="-4" cy="8" r="1" fill="white" opacity="0.6"/>
          <circle cx="7" cy="8" r="1" fill="white" opacity="0.6"/>
          {/* Smile */}
          <path d="M-5 17 Q0 22 5 17" stroke="#0a1628" strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* RIGHT arm (static) */}
          <rect x="-23" y="24" width="9" height="34" rx="4" fill="#2563eb"/>
          {/* LEFT arm (extended, animated) */}
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0 14 28;-18 14 28;0 14 28" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
            <rect x="14" y="24" width="9" height="38" rx="4" fill="#2563eb"/>
            {/* Package in hand */}
            <g transform="translate(12,60)">
              <rect x="0" y="0" width="30" height="25" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5"/>
              <line x1="15" y1="0" x2="15" y2="25" stroke="#d97706" strokeWidth="1.5"/>
              <line x1="0" y1="12" x2="30" y2="12" stroke="#d97706" strokeWidth="1.5"/>
              <text x="7" y="10" fill="#0a1628" fontSize="7" fontWeight="bold" fontFamily="sans-serif">RX</text>
            </g>
          </g>
        </g>

        {/* ── FLYING PACKAGE (transfer) ── */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.82;1" dur="2.5s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate"
            values="172,182; 260,152; 340,162"
            keyTimes="0;0.5;1" dur="2.5s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          <rect x="0" y="0" width="26" height="22" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5"/>
          <line x1="13" y1="0" x2="13" y2="22" stroke="#d97706" strokeWidth="1.5"/>
          <line x1="0" y1="11" x2="26" y2="11" stroke="#d97706" strokeWidth="1.5"/>
        </g>

        {/* ── BIKE GROUP (bounces) ── */}
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,-2; 0,2; 0,-2" dur="0.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>

          {/* Wheels */}
          {/* Rear wheel at (390,210) */}
          <circle cx="390" cy="210" r="30" fill="none" stroke="#1e40af" strokeWidth="5"/>
          <circle cx="390" cy="210" r="12" fill="none" stroke="#1e40af" strokeWidth="2.5" opacity="0.5"/>
          <circle cx="390" cy="210" r="4.5" fill="#3b82f6"/>
          {/* Rear spokes */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 390 210" to="360 390 210" dur="0.55s" repeatCount="indefinite"/>
            <line x1="390" y1="180" x2="390" y2="240" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
            <line x1="360" y1="210" x2="420" y2="210" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
            <line x1="369" y1="189" x2="411" y2="231" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
            <line x1="411" y1="189" x2="369" y2="231" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
          </g>

          {/* Front wheel at (530,210) */}
          <circle cx="530" cy="210" r="30" fill="none" stroke="#1e40af" strokeWidth="5"/>
          <circle cx="530" cy="210" r="12" fill="none" stroke="#1e40af" strokeWidth="2.5" opacity="0.5"/>
          <circle cx="530" cy="210" r="4.5" fill="#3b82f6"/>
          {/* Front spokes */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 530 210" to="360 530 210" dur="0.55s" repeatCount="indefinite"/>
            <line x1="530" y1="180" x2="530" y2="240" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
            <line x1="500" y1="210" x2="560" y2="210" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
            <line x1="509" y1="189" x2="551" y2="231" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
            <line x1="551" y1="189" x2="509" y2="231" stroke="#3b82f6" strokeWidth="2" opacity="0.55"/>
          </g>

          {/* Frame */}
          <path d="M390 210 L450 160 L530 210" stroke="#3b82f6" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M450 160 L470 130 L520 128 L522 160" stroke="#3b82f6" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Engine body */}
          <rect x="420" y="163" width="95" height="42" rx="10" fill="#172554" stroke="#3b82f6" strokeWidth="2"/>
          <rect x="430" y="170" width="75" height="28" rx="6" fill="#1d4ed8" opacity="0.4"/>

          {/* Cargo box (back) */}
          <rect x="382" y="132" width="52" height="40" rx="5" fill="#f59e0b" stroke="#d97706" strokeWidth="2"/>
          <line x1="408" y1="132" x2="408" y2="172" stroke="#d97706" strokeWidth="2"/>
          <line x1="382" y1="152" x2="434" y2="152" stroke="#d97706" strokeWidth="2"/>
          <text x="396" y="148" fill="#0a1628" fontSize="9" fontWeight="bold" fontFamily="sans-serif">RX</text>

          {/* Exhaust pipe */}
          <path d="M393 205 Q378 212 360 200" stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round"/>
          {/* Exhaust smoke */}
          {[0,1,2].map(i=>(
            <circle key={i} cx="358" cy="198" r={4+i*2} fill="#1e3a8a" opacity="0">
              <animate attributeName="cx" values={`358;${330-i*12};${302-i*18}`} dur={`${0.9+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.25}s`}/>
              <animate attributeName="cy" values="198;192;185" dur={`${0.9+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.25}s`}/>
              <animate attributeName="r" values={`${4+i*2};${8+i*3};${12+i*4}`} dur={`${0.9+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.25}s`}/>
              <animate attributeName="opacity" values="0.5;0.2;0" dur={`${0.9+i*0.3}s`} repeatCount="indefinite" begin={`${i*0.25}s`}/>
            </circle>
          ))}

          {/* Handle bars */}
          <path d="M520 128 L508 116 M520 128 L535 118" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round"/>
          {/* Headlight */}
          <ellipse cx="537" cy="138" rx="9" ry="7" fill="#fbbf24"/>
          <ellipse cx="537" cy="138" rx="6" ry="4.5" fill="#fef3c7"/>

          {/* ── RIDER ── */}
          <g transform="translate(455,80)">
            {/* Body */}
            <rect x="-16" y="22" width="32" height="50" rx="9" fill="#1e3a8a"/>
            {/* Head + helmet */}
            <circle cx="0" cy="11" r="18" fill="#1e3a8a"/>
            <circle cx="0" cy="11" r="14" fill="#fbbf24"/>
            <rect x="-19" y="3" width="38" height="16" rx="8" fill="#1e3a8a"/>
            {/* Visor */}
            <rect x="-11" y="6" width="22" height="9" rx="4.5" fill="#3b82f6" opacity="0.85"/>
            <rect x="-9" y="7" width="18" height="6" rx="3" fill="#60a5fa" opacity="0.4"/>
            {/* Arms */}
            <rect x="-32" y="24" width="16" height="32" rx="7" fill="#1e3a8a"/>
            <rect x="16" y="24" width="16" height="32" rx="7" fill="#1e3a8a"/>
          </g>
        </g>

        {/* Headlight beam */}
        <g opacity="0.12">
          <animateTransform attributeName="transform" type="translate" values="0,-2;0,2;0,-2" dur="0.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          <path d="M540 136 L620 118 L620 155 Z" fill="#fef3c7"/>
        </g>

        {/* Speed lines */}
        {[0,1,2,3,4].map(i=>(
          <line key={i} x1="280" y1={178+i*10} x2="330" y2={178+i*10} stroke="#3b82f6" strokeWidth="1.5" opacity="0.25" strokeLinecap="round">
            <animate attributeName="x1" values={`${320-i*6};${250-i*6};${320-i*6}`} dur={`${0.45+i*0.07}s`} repeatCount="indefinite"/>
            <animate attributeName="x2" values={`${370-i*6};${300-i*6};${370-i*6}`} dur={`${0.45+i*0.07}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.25;0;0.25" dur={`${0.45+i*0.07}s`} repeatCount="indefinite"/>
          </line>
        ))}

        {/* Ground shadow for bike */}
        <ellipse cx="460" cy="215" rx="100" ry="5" fill="#000" opacity="0.2">
          <animateTransform attributeName="transform" type="translate" values="0,-2;0,2;0,-2" dur="0.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
        </ellipse>
      </svg>
    </div>
  )
}

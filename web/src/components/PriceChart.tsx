"use client"

interface PriceChartProps {
  history: { date: string, price: number }[];
}

export default function PriceChart({ history }: PriceChartProps) {
  if (!history || history.length < 2) return null;

  const maxPrice = Math.max(...history.map(h => h.price));
  const minPrice = Math.min(...history.map(h => h.price));
  const range = maxPrice - minPrice || 1;
  const padding = range * 0.2;
  
  const width = 800;
  const height = 200;
  
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((h.price - minPrice + padding/2) / (range + padding)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', marginTop: '40px' }}>
      <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Price History</h3>
      <div className="glass" style={{ padding: '30px', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          
          {/* Area */}
          <path
            d={`M 0,${height} ${points} V ${height} Z`}
            fill="url(#areaGradient)"
          />
          
          {/* Line */}
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data Points */}
          {history.map((h, i) => {
             const x = (i / (history.length - 1)) * width;
             const y = height - ((h.price - minPrice + padding/2) / (range + padding)) * height;
             return (
               <g key={i}>
                 <circle cx={x} cy={y} r="5" fill="white" />
                 <text x={x} y={y - 15} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">₹{h.price.toLocaleString()}</text>
                 <text x={x} y={height + 20} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">{new Date(h.date).toLocaleDateString(undefined, { month: 'short' })}</text>
               </g>
             );
          })}
        </svg>
      </div>
    </div>
  );
}

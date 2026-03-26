import { T1_COLOR, T2_COLOR, WIN_L, WIN_R } from '../constants/gameData';

function Fig({ x, y, color, flip, pulling }) {
  const anim = pulling
    ? `${flip ? 'maPullR' : 'maPullL'} 0.4s ease-in-out infinite`
    : 'none';
  return (
    <g style={{ transformOrigin: `${x}px ${y}px`, animation: anim }}>
      <g transform={`translate(${x},${y}) scale(${flip ? -1 : 1},1)`}>
        <circle cx="0" cy="-30" r="8.5" fill={color} />
        <line x1="0"  y1="-22" x2="-5" y2="4"   stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="-2" y1="-12" x2="14" y2="-7"  stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="-2" y1="-12" x2="-13" y2="-4" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="-5" y1="4"   x2="9"  y2="27"  stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="-5" y1="4"   x2="-12" y2="27" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </g>
  );
}

export default function TugArena({ ropePos, lastW }) {
  const W = 900, H = 170, GY = 132, RY = 88;
  const X1 = 150, X2 = 750;
  const kx   = X1 + (ropePos / 100) * (X2 - X1);
  const lbX  = X1 + (WIN_L  / 100) * (X2 - X1);
  const rbX  = X1 + (WIN_R  / 100) * (X2 - X1);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="gndG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0d2a10"/>
            <stop offset="100%" stopColor="#061508"/>
          </linearGradient>
          <linearGradient id="ropeG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e0c07a"/>
            <stop offset="60%"  stopColor="#c8a96e"/>
            <stop offset="100%" stopColor="#8b6914"/>
          </linearGradient>
          <radialGradient id="knotG" cx="35%" cy="35%">
            <stop offset="0%"   stopColor="#ffe566"/>
            <stop offset="100%" stopColor="#c8960c"/>
          </radialGradient>
          <filter id="fglow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* BG */}
        <rect width={W} height={H} fill="#060f1e"/>
        {[30,100,175,265,350,440,530,620,700,785,860].map((cx,i) =>
          <circle key={i} cx={cx} cy={8+(i%4)*7} r="1.3" fill="rgba(255,255,255,.3)" />
        )}

        {/* Ground */}
        <rect x="0" y={GY} width={W} height={H - GY} fill="url(#gndG)"/>
        <line x1="0" y1={GY} x2={W} y2={GY} stroke="#1e6020" strokeWidth="2"/>
        {[0,1,2,3,4,5,6,7,8,9].map(i =>
          <line key={i} x1={i*100} y1={GY} x2={i*100-20} y2={H} stroke="rgba(0,70,0,.25)" strokeWidth="1"/>
        )}

        {/* WIN lines */}
        <g filter="url(#fglow)">
          <line x1={lbX} y1={GY-62} x2={lbX} y2={GY+3}
            stroke={T1_COLOR} strokeWidth="2.5"
            opacity={ropePos <= 28 ? 1 : .55}
            strokeDasharray={ropePos <= 28 ? 'none' : '6,3'}/>
          <polygon points={`${lbX-7},${GY-62} ${lbX+7},${GY-62} ${lbX},${GY-72}`} fill={T1_COLOR} opacity={ropePos<=28?1:.55}/>
          <text x={lbX} y={GY-76} textAnchor="middle" fill={T1_COLOR} fontSize="8.5" fontFamily="Exo 2" fontWeight="bold">WIN</text>
        </g>
        <g filter="url(#fglow)">
          <line x1={rbX} y1={GY-62} x2={rbX} y2={GY+3}
            stroke={T2_COLOR} strokeWidth="2.5"
            opacity={ropePos >= 72 ? 1 : .55}
            strokeDasharray={ropePos >= 72 ? 'none' : '6,3'}/>
          <polygon points={`${rbX-7},${GY-62} ${rbX+7},${GY-62} ${rbX},${GY-72}`} fill={T2_COLOR} opacity={ropePos>=72?1:.55}/>
          <text x={rbX} y={GY-76} textAnchor="middle" fill={T2_COLOR} fontSize="8.5" fontFamily="Exo 2" fontWeight="bold">WIN</text>
        </g>

        {/* Center */}
        <line x1={W/2} y1={GY-55} x2={W/2} y2={GY} stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="5,3"/>
        <text x={W/2} y={GY-58} textAnchor="middle" fill="rgba(255,255,255,.2)" fontSize="8" fontFamily="Exo 2">CENTER</text>

        {/* Rope */}
        <path d={`M ${X1-30} ${RY} Q ${(X1+kx)/2} ${RY+12} ${kx} ${RY}`}
          stroke="url(#ropeG)" strokeWidth="8.5" fill="none" strokeLinecap="round"/>
        <path d={`M ${kx} ${RY} Q ${(kx+X2+30)/2} ${RY+12} ${X2+30} ${RY}`}
          stroke="url(#ropeG)" strokeWidth="8.5" fill="none" strokeLinecap="round"/>
        {[...Array(22)].map((_,i) => {
          const rx = (X1-30) + (i+.5)/22*(X2+60-(X1-30));
          return <line key={i} x1={rx} y1={RY-3} x2={rx+5} y2={RY+3} stroke="rgba(0,0,0,.28)" strokeWidth="1.5"/>;
        })}

        {/* Knot (CSS-transitioned) */}
        <g style={{ transform:`translateX(${kx}px)`, transition:'transform 0.65s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <line x1="0" y1={RY-28} x2="0" y2={RY-10} stroke="#bbb" strokeWidth="3" strokeLinecap="round"/>
          <polygon points="-1,-28 18,-21 -1,-14" transform={`translate(0,${RY})`} fill="#ff4081"/>
          <circle cx="0" cy={RY} r="11" fill="url(#knotG)" stroke="#b8860b" strokeWidth="2.5"/>
          <circle cx="-3" cy={RY-3} r="3" fill="rgba(255,255,255,.35)"/>
        </g>

        {/* Team 1 figures */}
        {[0,1,2].map(i => <Fig key={i} x={60-i*32} y={RY} color={T1_COLOR} flip={false} pulling={lastW===1}/>)}
        {[0,1,2].map(i => <ellipse key={i} cx={60-i*32} cy={GY+2} rx={10} ry={3} fill="rgba(0,0,0,.3)"/>)}

        {/* Team 2 figures */}
        {[0,1,2].map(i => <Fig key={i} x={W-60+i*32} y={RY} color={T2_COLOR} flip={true} pulling={lastW===2}/>)}
        {[0,1,2].map(i => <ellipse key={i} cx={W-60+i*32} cy={GY+2} rx={10} ry={3} fill="rgba(0,0,0,.3)"/>)}
      </svg>
    </div>
  );
}

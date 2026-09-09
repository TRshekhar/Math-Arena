import { T1_COLOR, T2_COLOR, WIN_L, WIN_R } from '../constants/gameData';

const ANIM_CSS = `
/* Baseline Taut Lean-Back Idle (Continuous Strain) */
@keyframes idleTension { 
  0%, 100% { transform: rotate(-16deg) translateY(0px); } 
  50%      { transform: rotate(-19deg) translateY(1px); } 
}

/* Deep Pull Action (Digging feet in) */
@keyframes plBody { 
  0%   { transform: rotate(-16deg); } 
  40%  { transform: rotate(-34deg) translateX(-8px); } 
  100% { transform: rotate(-16deg); } 
}

/* Stumble Action (Pulled forward against tension) */
@keyframes stBody { 
  0%   { transform: rotate(-16deg); } 
  40%  { transform: rotate(18deg) translateX(10px); } 
  100% { transform: rotate(-16deg); } 
}
`;

let cssReady = false;
function ensureCSS() {
  if (cssReady || typeof document === 'undefined') return;
  cssReady = true;
  const s = document.createElement('style');
  s.textContent = ANIM_CSS;
  document.head.appendChild(s);
}

function StickFigure({ x, y, color, flip, mode = 'idle', delay = 0 }) {
  ensureCSS();

  const sw  = 3.8;
  const shY = -24;
  
  const isAction = mode === 'pull' || mode === 'stumble';
  const dur  = isAction ? '0.55s' : '1.8s';
  const iter = isAction ? '1 ease-out' : 'infinite ease-in-out';
  const d    = `${delay}s`;

  const TM  = `0px 0px`; // Pivot around feet for realistic ground leverage

  const p = mode === 'pull';
  const s = mode === 'stumble';

  const bodyS = p ? { animation:`plBody ${dur} ${iter} ${d}`, transformOrigin:TM }
              : s ? { animation:`stBody ${dur} ${iter} ${d}`, transformOrigin:TM }
              : { animation:`idleTension ${dur} ${iter} ${d}`, transformOrigin:TM };

  return (
    <g transform={`translate(${x},${y})`}>
      <g transform={`scale(${flip ? -1 : 1},1)`}>
        <g style={bodyS}>
          {/* Head & Torso */}
          <circle cx={-4} cy={-38} r={11} fill={color}/>
          <line x1={0} y1={shY} x2={0} y2={0} stroke={color} strokeWidth={sw} strokeLinecap="round"/>
          
          {/* Arms stretched forward reaching for the rope line */}
          <line x1={0} y1={shY} x2={18} y2={shY-6} stroke={color} strokeWidth={sw-0.8} strokeLinecap="round"/>
          <line x1={0} y1={shY+4} x2={14} y2={shY-4} stroke={color} strokeWidth={sw-0.8} strokeLinecap="round"/>
          
          {/* Planted Leg Stance (Wide base for leverage) */}
          <line x1={0} y1={0} x2={-16} y2={30} stroke={color} strokeWidth={sw} strokeLinecap="round"/>
          <line x1={0} y1={0} x2={12}  y2={30} stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        </g>
      </g>
    </g>
  );
}

export default function TugArena({ ropePos, lastW }) {
  const W = 900, H = 180, GY = 140, RY = 66; // Raised rope line to align with hands
  const ropeX1 = 158, ropeX2 = 742;
  
  const shiftX = (ropePos - 50) * 3.2;
  const currentRopeX1 = ropeX1 + shiftX;
  const currentRopeX2 = ropeX2 + shiftX;

  const kx   = ropeX1 + (ropePos / 100) * (ropeX2 - ropeX1);
  const lbX  = ropeX1 + (WIN_L  / 100) * (ropeX2 - ropeX1);
  const rbX  = ropeX1 + (WIN_R  / 100) * (ropeX2 - ropeX1);
  const figY = GY - 30;

  const t1X = [currentRopeX1 - 2, currentRopeX1 - 38, currentRopeX1 - 74];
  const t2X = [currentRopeX2 + 2, currentRopeX2 + 38, currentRopeX2 + 74];

  const t1Mode = lastW === 1 ? 'pull' : lastW === 2 ? 'stumble' : 'idle';
  const t2Mode = lastW === 2 ? 'pull' : lastW === 1 ? 'stumble' : 'idle';

  // Rope flattens straight during pull (high tension) and sags slightly when idle
  const leftSag  = lastW === 1 ? RY + 1 : RY + 6;
  const rightSag = lastW === 2 ? RY + 1 : RY + 6;

  const springStyle = { transition: 'transform 0.65s cubic-bezier(0.34,1.56,0.64,1)' };

  return (
    <div style={{ position:'relative', width:'100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display:'block' }}>
        <defs>
          <linearGradient id="ta_gnd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0e2e12"/>
            <stop offset="100%" stopColor="#071609"/>
          </linearGradient>
          <linearGradient id="ta_rope" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e8cc82"/>
            <stop offset="55%"  stopColor="#c9aa6e"/>
            <stop offset="100%" stopColor="#8c6a14"/>
          </linearGradient>
          <radialGradient id="ta_knot" cx="35%" cy="35%">
            <stop offset="0%"   stopColor="#ffe96a"/>
            <stop offset="100%" stopColor="#ca9a0d"/>
          </radialGradient>
          <filter id="ta_glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect width={W} height={H} fill="#060f1e"/>

        {/* Ground */}
        <rect x="0" y={GY} width={W} height={H-GY} fill="url(#ta_gnd)"/>
        <line x1="0" y1={GY} x2={W} y2={GY} stroke="#22712a" strokeWidth="2.5"/>

        {/* WIN Markers */}
        <g filter="url(#ta_glow)">
          <line x1={lbX} y1={GY-70} x2={lbX} y2={GY+2} stroke={T1_COLOR} strokeWidth="2.5" opacity={ropePos<=28?1:.5}/>
          <polygon points={`${lbX-7},${GY-70} ${lbX+7},${GY-70} ${lbX},${GY-81}`} fill={T1_COLOR} opacity={ropePos<=28?1:.5}/>
          <text x={lbX} y={GY-85} textAnchor="middle" fill={T1_COLOR} fontSize="9" fontFamily="Exo 2" fontWeight="bold">WIN</text>
        </g>
        <g filter="url(#ta_glow)">
          <line x1={rbX} y1={GY-70} x2={rbX} y2={GY+2} stroke={T2_COLOR} strokeWidth="2.5" opacity={ropePos>=72?1:.5}/>
          <polygon points={`${rbX-7},${GY-70} ${rbX+7},${GY-70} ${rbX},${GY-81}`} fill={T2_COLOR} opacity={ropePos>=72?1:.5}/>
          <text x={rbX} y={GY-85} textAnchor="middle" fill={T2_COLOR} fontSize="9" fontFamily="Exo 2" fontWeight="bold">WIN</text>
        </g>

        {/* Rope Paths (Taut Alignment) */}
        <path d={`M ${currentRopeX1-38} ${RY} Q ${(currentRopeX1+kx)/2} ${leftSag} ${kx} ${RY}`}
          stroke="url(#ta_rope)" strokeWidth="8" fill="none" strokeLinecap="round" style={springStyle}/>
        <path d={`M ${kx} ${RY} Q ${(kx+currentRopeX2+38)/2} ${rightSag} ${currentRopeX2+38} ${RY}`}
          stroke="url(#ta_rope)" strokeWidth="8" fill="none" strokeLinecap="round" style={springStyle}/>

        {/* Center Knot Flag */}
        <g style={{ transform:`translateX(${kx}px)`, ...springStyle }}>
          <line x1="0" y1={RY-28} x2="0" y2={RY-8} stroke="#c8c8c8" strokeWidth="3" strokeLinecap="round"/>
          <polygon points={`0,${RY-28} 18,${RY-20} 0,${RY-12}`} fill="#ff4081"/>
          <circle cx="0" cy={RY} r="11" fill="url(#ta_knot)" stroke="#b8860b" strokeWidth="2.5"/>
        </g>

        {/* Team 1 Group */}
        <g style={{ transform: `translateX(${shiftX}px)`, ...springStyle }}>
          {t1X.map((fx,i) => <StickFigure key={`t1-${i}`} x={fx - shiftX} y={figY} color={T1_COLOR} flip={false} mode={t1Mode} delay={i*0.1}/>)}
          {t1X.map((fx,i) => <ellipse key={`t1s-${i}`} cx={fx - shiftX} cy={GY+1} rx={11} ry={3} fill="rgba(0,0,0,.28)"/>)}
        </g>

        {/* Team 2 Group */}
        <g style={{ transform: `translateX(${shiftX}px)`, ...springStyle }}>
          {t2X.map((fx,i) => <StickFigure key={`t2-${i}`} x={fx - shiftX} y={figY} color={T2_COLOR} flip={true} mode={t2Mode} delay={i*0.1}/>)}
          {t2X.map((fx,i) => <ellipse key={`t2s-${i}`} cx={fx - shiftX} cy={GY+1} rx={11} ry={3} fill="rgba(0,0,0,.28)"/>)}
        </g>
      </svg>
    </div>
  );
}
import { useCSS } from '../hooks/useCSS';
import TugArena from './TugArena';
import { T1_COLOR, T2_COLOR, AC_COLOR } from '../constants/gameData';

export default function ResultScreen({ result, teams, onPlayAgain, onHome }) {
  useCSS();
  const isT1Win = result.winner === 'team1';
  const wColor  = isT1Win ? T1_COLOR : T2_COLOR;
  const wName   = result.name;

  return (
    <div className="ma" style={{
      alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Confetti */}
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${5 + i*4.7}%`, top: `${-10 - i*2}%`,
          width: 8, height: 8,
          background: [T1_COLOR,T2_COLOR,AC_COLOR,'#ffd700','#a78bfa'][i%5],
          borderRadius: i%2===0 ? '50%' : '2px',
          animation: `maFall ${1.5+i*.14}s ease ${i*.07}s infinite`,
          opacity: .8,
        }}/>
      ))}

      {/* Back to home */}
      <div style={{ position:'absolute', top:16, left:16 }}>
        <button className="ma-btn" onClick={onHome} style={{
          background:'rgba(255,255,255,.07)', color:'#7a9cc6',
          border:'1px solid rgba(255,255,255,.12)', padding:'8px 16px', fontSize:13,
        }}>🏠 Home</button>
      </div>

      {/* Trophy */}
      <div style={{ textAlign:'center', animation:'maVictory 1s ease infinite' }}>
        <div style={{ fontSize:64, marginBottom:6 }}>🏆</div>
        <div style={{ fontWeight:900, fontSize:40, color:wColor, letterSpacing:2, textShadow:`0 0 40px ${wColor}` }}>
          {wName}
        </div>
        <div style={{ fontWeight:700, fontSize:18, color:'rgba(255,255,255,.7)', marginTop:4 }}>
          WINS THE CONTEST!
        </div>
      </div>

      {/* Arena replay */}
      <div style={{ width:'100%', maxWidth:680, animation:'maIn .5s ease .3s both' }}>
        <TugArena ropePos={result.ropePos} lastW={isT1Win?1:2}/>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'3px 10px', fontSize:10, color:'#7a9cc6' }}>
          <span style={{ color:T1_COLOR }}>← {teams.t1} side</span>
          <span style={{ color:T2_COLOR }}>{teams.t2} side →</span>
        </div>
      </div>

      {/* Scores */}
      <div style={{ display:'flex', gap:14, animation:'maIn .5s ease .4s both' }}>
        {[
          { n:teams.t1, s:result.scores?.t1||0, c:T1_COLOR },
          { n:teams.t2, s:result.scores?.t2||0, c:T2_COLOR },
        ].map((t,i) => (
          <div key={i} className="ma-card" style={{
            textAlign:'center', padding:'14px 30px',
            border:`2px solid ${t.c}44`, minWidth:130,
          }}>
            <div style={{ fontWeight:800, color:t.c, fontSize:13, marginBottom:5 }}>{t.n}</div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:34, fontWeight:700, color:'#fff' }}>{t.s}</div>
            <div style={{ fontSize:10, color:'#7a9cc6', marginTop:2 }}>questions won</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10 }}>
        <button className="ma-btn" onClick={onHome} style={{
          background:'transparent', color:'#7a9cc6',
          border:'1px solid rgba(255,255,255,.15)', padding:'11px 22px', fontSize:14,
        }}>🏠 Main Menu</button>
        <button className="ma-btn" onClick={onPlayAgain} style={{
          background:`linear-gradient(135deg,${wColor},${isT1Win?'#00b44a':'#c0001a'})`,
          color: isT1Win?'#050d1a':'#fff', padding:'12px 34px', fontSize:15,
        }}>
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}

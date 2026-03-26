import { useState } from 'react';
import { useCSS } from '../hooks/useCSS';
import { T1_COLOR, T2_COLOR, AC_COLOR, BG_MID, BG_CARD } from '../constants/gameData';

export default function SetupScreen({ questions, onBack, onBegin }) {
  useCSS();
  const [t1,     setT1]     = useState('Team Alpha');
  const [t2,     setT2]     = useState('Team Beta');
  const [mode,   setMode]   = useState('same');
  const [qCount, setQCount] = useState(Math.min(8, questions.length));

  return (
    <div className="ma" style={{
      alignItems: 'center', justifyContent: 'flex-start',
      gap: 16, padding: '16px 24px', overflowY: 'auto', height: '100vh',
    }}>
      {/* Header */}
      <div style={{ textAlign:'center', animation:'maIn .4s ease', width:'100%' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button className="ma-btn" onClick={onBack} style={{
            background: 'rgba(255,255,255,.07)', color: '#7a9cc6',
            border: '1px solid rgba(255,255,255,.12)', padding: '8px 16px', fontSize: 13,
          }}>
            ← Back
          </button>
          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontSize:28 }}>🏆</div>
            <div style={{
              fontWeight:900, fontSize:28, letterSpacing:2,
              background:`linear-gradient(90deg,${T1_COLOR},${AC_COLOR},${T2_COLOR})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>
              CONTEST SETUP
            </div>
          </div>
          <div style={{ width: 80 }}/> {/* spacer */}
        </div>
      </div>

      {/* Team names */}
      <div style={{ display:'flex', gap:18, width:'100%', maxWidth:660, animation:'maIn .4s ease .1s both' }}>
        {/* Team 1 */}
        <div className="ma-card" style={{ flex:1, border:`2px solid ${T1_COLOR}33` }}>
          <div style={{ fontWeight:800, fontSize:12, color:T1_COLOR, letterSpacing:2, marginBottom:10, textTransform:'uppercase' }}>🟢 Team 1</div>
          <input className="ma-input" value={t1} onChange={e=>setT1(e.target.value)}
            placeholder="Team 1 name…" style={{ width:'100%', borderColor:`${T1_COLOR}44` }}/>
          <div style={{ marginTop:8, padding:'6px 10px', background:`${T1_COLOR}12`, borderRadius:7, fontSize:11, color:T1_COLOR }}>
            📍 Left side of screen
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', fontWeight:900, fontSize:22, color:'#333' }}>VS</div>

        {/* Team 2 */}
        <div className="ma-card" style={{ flex:1, border:`2px solid ${T2_COLOR}33` }}>
          <div style={{ fontWeight:800, fontSize:12, color:T2_COLOR, letterSpacing:2, marginBottom:10, textTransform:'uppercase' }}>🔴 Team 2</div>
          <input className="ma-input" value={t2} onChange={e=>setT2(e.target.value)}
            placeholder="Team 2 name…" style={{ width:'100%', borderColor:`${T2_COLOR}44` }}/>
          <div style={{ marginTop:8, padding:'6px 10px', background:`${T2_COLOR}12`, borderRadius:7, fontSize:11, color:T2_COLOR }}>
            📍 Right side of screen
          </div>
        </div>
      </div>

      {/* Play Mode */}
      <div style={{ width:'100%', maxWidth:660, animation:'maIn .4s ease .2s both' }}>
        <div className="ma-card">
          <div style={{ fontWeight:700, fontSize:12, color:AC_COLOR, letterSpacing:2, marginBottom:12, textTransform:'uppercase' }}>🎮 Play Mode</div>
          <div style={{ display:'flex', gap:10 }}>
            {[
              { key:'same', icon:'🖥️', title:'Same Screen', desc:'Both teams on one device — split screen' },
              { key:'qr',   icon:'📱', title:'Multi-Device (QR)', desc:'Each team scans QR to join on own device' },
            ].map(m => (
              <button key={m.key} className="ma-btn" onClick={() => setMode(m.key)} style={{
                flex:1, padding:'14px', fontSize:13,
                background:   mode===m.key ? `linear-gradient(135deg,${AC_COLOR}22,${AC_COLOR}11)` : BG_CARD,
                border:       `2px solid ${mode===m.key ? AC_COLOR : 'rgba(255,255,255,.1)'}`,
                color:        mode===m.key ? AC_COLOR : '#7a9cc6',
                borderRadius: 10, textAlign:'left',
              }}>
                <div style={{ fontSize:20, marginBottom:5 }}>{m.icon}</div>
                <div style={{ fontWeight:700 }}>{m.title}</div>
                <div style={{ fontSize:11, marginTop:3, fontWeight:400 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question count */}
      <div style={{ width:'100%', maxWidth:660, animation:'maIn .4s ease .25s both' }}>
        <div className="ma-card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, color:AC_COLOR, fontSize:12, letterSpacing:1, textTransform:'uppercase' }}>📚 Questions per Contest</div>
            <div style={{ fontSize:11, color:'#7a9cc6', marginTop:3 }}>{questions.length} questions in bank</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="ma-btn" onClick={() => setQCount(q => Math.max(3,q-1))} style={{ width:32,height:32,padding:0,background:BG_CARD,color:'#fff',border:'1px solid rgba(255,255,255,.15)',fontSize:16 }}>-</button>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:22, fontWeight:700, color:'#fff', minWidth:32, textAlign:'center' }}>{qCount}</span>
            <button className="ma-btn" onClick={() => setQCount(q => Math.min(questions.length,q+1))} style={{ width:32,height:32,padding:0,background:BG_CARD,color:'#fff',border:'1px solid rgba(255,255,255,.15)',fontSize:16 }}>+</button>
          </div>
        </div>
      </div>

      {/* Start */}
      <div style={{ display:'flex', gap:10, paddingBottom:20 }}>
        <button className="ma-btn" onClick={() => onBegin({ t1:t1||'Team Alpha', t2:t2||'Team Beta', mode, qCount })} style={{
          background: `linear-gradient(135deg,${T1_COLOR},#00b44a)`,
          color:'#050d1a', padding:'13px 36px', fontSize:16,
        }}>
          {mode === 'qr' ? '📱 Connect Teams →' : '⚔️ Start Battle!'}
        </button>
      </div>
    </div>
  );
}

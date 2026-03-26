import { useState, useEffect } from 'react';
import { T1_COLOR, T2_COLOR, BG_CARD, BG_MID } from '../constants/gameData';

export default function SubjectivePanel({ team, color, onAnswer, status, disabled }) {
  const [val, setVal] = useState('');

  const isCorrect = status === 'correct';
  const isWrong   = status === 'wrong';

  useEffect(() => {
    if (status === 'wrong')   setTimeout(() => setVal(''), 650);
    if (status === 'correct') setVal('');
    if (!status)              setVal('');   // question reset
  }, [status]);

  // Reset when component remounts for new question
  useEffect(() => { setVal(''); }, []);

  const press = (k) => {
    // Blocked only while isCorrect (waiting for next question) or externally disabled
    if (isCorrect || disabled) return;
    if (k === '⌫')       setVal(v => v.slice(0, -1));
    else if (k === 'SUB') { if (val.trim()) onAnswer(val.trim()); }
    else if (val.length < 12) setVal(v => v + k);
  };

  const canSubmit = val.trim().length > 0 && !isCorrect && !disabled;
  const keys = [['7','8','9'],['4','5','6'],['1','2','3'],['.','0','⌫']];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: '6px 10px', gap: 4,
      background: isCorrect
        ? `linear-gradient(180deg,${color}18,transparent)`
        : isWrong ? 'rgba(255,23,68,.06)' : BG_MID,
      borderRadius: 12,
      border: `1px solid ${isCorrect ? color+'55' : isWrong ? '#ff174444' : 'rgba(255,255,255,.07)'}`,
      animation: isWrong ? 'maShake .4s ease' : 'none',
      overflow: 'hidden', transition: 'background .3s',
    }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }}/>
        <span style={{ fontWeight:800, fontSize:13, color, letterSpacing:1 }}>TEAM {team}</span>
        {isCorrect && <span style={{ fontSize:12, color:T1_COLOR, fontWeight:700, marginLeft:'auto', animation:'maPop .3s ease' }}>✅ CORRECT! +1</span>}
        {isWrong   && <span style={{ fontSize:12, color:T2_COLOR, fontWeight:700, marginLeft:'auto' }}>❌ Try again!</span>}
      </div>

      {/* Display */}
      <div style={{
        flexShrink: 0,
        background: BG_CARD,
        border: `2px solid ${isCorrect ? color : isWrong ? T2_COLOR : 'rgba(255,255,255,.12)'}`,
        borderRadius: 8, padding: '6px 12px', minHeight: 38,
        display: 'flex', alignItems: 'center',
        fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 20,
        color: isWrong ? T2_COLOR : '#fff',
        transition: 'border-color .2s',
      }}>
        {val || <span style={{ color:'#334', fontSize:13, fontWeight:400 }}>Type your answer…</span>}
      </div>

      {/* Keypad */}
      <div style={{ flex:1, display:'grid', gridTemplateRows:'repeat(4,1fr)', gap:4, minHeight:0 }}>
        {keys.map((row, ri) => (
          <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4, minHeight:0 }}>
            {row.map(k => (
              <button key={k} className="ma-btn"
                onClick={() => press(k)}
                style={{
                  fontFamily: 'JetBrains Mono', fontWeight: 700,
                  fontSize: k === '⌫' ? 13 : 14,
                  background: k === '⌫' ? 'rgba(255,23,68,.15)' : BG_CARD,
                  color:      k === '⌫' ? T2_COLOR : '#fff',
                  border:     `1px solid ${k === '⌫' ? 'rgba(255,23,68,.2)' : 'rgba(255,255,255,.1)'}`,
                  borderRadius: 7, padding: 0,
                  width: '100%', height: '100%',
                  opacity: (isCorrect || disabled) && k !== '⌫' ? 0.35 : 1,
                  cursor:  (isCorrect || disabled) ? 'default' : 'pointer',
                }}>
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Submit */}
      <button className="ma-btn"
        onClick={() => press('SUB')}
        style={{
          flexShrink: 0,
          background: canSubmit ? `linear-gradient(135deg,${color},${color}bb)` : 'rgba(255,255,255,.05)',
          color:  canSubmit ? (team === 1 ? '#050d1a' : '#fff') : '#444',
          padding: '7px', fontSize: 13, fontWeight: 800,
          border: `1px solid ${canSubmit ? color : 'rgba(255,255,255,.08)'}`,
          cursor: canSubmit ? 'pointer' : 'default',
          transition: 'all .2s',
        }}>
        SUBMIT ✓
      </button>
    </div>
  );
}
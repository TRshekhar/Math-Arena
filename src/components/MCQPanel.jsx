import { useState, useEffect } from 'react';
import { T1_COLOR, T2_COLOR, BG_CARD, BG_MID } from '../constants/gameData';

export default function MCQPanel({ q, team, color, onAnswer, status, disabled }) {
  const [selected, setSelected] = useState(null);

  const isCorrect = status === 'correct';
  const isWrong   = status === 'wrong';
  const isLeft    = team === 1;

  // Clear selection on wrong so player can retry; keep on correct for visual confirmation
  useEffect(() => {
    if (status === 'wrong')   setTimeout(() => setSelected(null), 700);
    if (status === 'correct') { /* keep selected */ }
    if (!status)              setSelected(null);   // question reset
  }, [status]);

  // Reset when question changes
  useEffect(() => { setSelected(null); }, [q]);

  const handleClick = (opt) => {
    if (disabled || isCorrect) return;   // locked only on correct or phase change
    setSelected(opt);
    onAnswer(opt);
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
      padding: '10px 12px',
      background: isCorrect
        ? `linear-gradient(180deg,${color}18,transparent)`
        : isWrong ? 'rgba(255,23,68,.06)' : BG_MID,
      borderRadius: 12,
      border: `1px solid ${isCorrect ? color+'55' : isWrong ? '#ff174444' : 'rgba(255,255,255,.07)'}`,
      borderRight: isLeft  ? `3px solid ${isCorrect ? color : isWrong ? T2_COLOR : 'rgba(255,255,255,.1)'}` : undefined,
      borderLeft:  !isLeft ? `3px solid ${isCorrect ? color : isWrong ? T2_COLOR : 'rgba(255,255,255,.1)'}` : undefined,
      animation: isWrong ? 'maShake .4s ease' : 'none',
      position: 'relative', overflow: 'hidden',
      transition: 'background .3s, border-color .3s',
    }}>
      {isCorrect && <div style={{ position:'absolute', inset:0, animation:'maFlashG .6s ease', pointerEvents:'none' }}/>}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }}/>
        <span style={{ fontWeight:800, fontSize:13, color, letterSpacing:1 }}>TEAM {team}</span>
        {isCorrect && <span style={{ fontSize:12, color:T1_COLOR, fontWeight:700, marginLeft:'auto', animation:'maPop .3s ease' }}>✅ CORRECT! +1</span>}
        {isWrong   && <span style={{ fontSize:12, color:T2_COLOR, fontWeight:700, marginLeft:'auto' }}>❌ Wrong — try again!</span>}
        {!isCorrect && !isWrong && disabled && <span style={{ fontSize:11, color:'#7a9cc6', marginLeft:'auto' }}>Locked</span>}
      </div>

      {/* Options */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, flex:1 }}>
        {q.opts.map((opt, i) => {
          const labelLetter = ['A','B','C','D'][i];
          const isThisAns   = opt === q.ans;
          const isThisSel   = opt === selected;

          // Colour logic
          let bg     = BG_CARD;
          let border = 'rgba(255,255,255,.1)';
          let txtCol = '#ddd';

          if (isCorrect && isThisAns)   { bg = `${color}33`;           border = `${color}66`;        txtCol = color; }
          else if (isCorrect)           { bg = BG_CARD;                 border = 'rgba(255,255,255,.05)'; txtCol = '#555'; }
          else if (isWrong && isThisSel){ bg = 'rgba(255,23,68,.18)';   border = '#ff174477';          txtCol = T2_COLOR; }
          else if (!isWrong && isThisSel){ bg = `${color}22`;           border = `${color}88`;         txtCol = color; }

          return (
            <button key={i}
              onClick={() => handleClick(opt)}
              style={{
                padding: '0 8px', minHeight: 40, fontSize: 13, fontWeight: 700,
                background: bg, color: txtCol, border: `1.5px solid ${border}`,
                borderRadius: 8, textAlign: 'left', cursor: disabled || isCorrect ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .15s',
                opacity: isCorrect && !isThisAns ? 0.35 : 1,
              }}>
              <span style={{ fontFamily:'JetBrains Mono', fontWeight:700, color: isThisSel ? txtCol : color, opacity:.8, fontSize:11, flexShrink:0 }}>{labelLetter}</span>
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{opt}</span>
              {isCorrect && isThisAns && <span style={{ flexShrink:0 }}>✓</span>}
              {isWrong && isThisSel   && <span style={{ flexShrink:0 }}>✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
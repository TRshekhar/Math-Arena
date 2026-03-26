import { useState, useEffect } from 'react';
import { T1_COLOR, T2_COLOR, AC_COLOR, BG_MID, BG_CARD, Q_TIME } from '../constants/gameData';

const T2R = '#ff1744';

export default function InGameAdmin({
  socketGame, session, teams, questions, allQuestions,
  onAddQuestions, onClose,
}) {
  const [tab,        setTab]        = useState('players');   // players | limits | questions
  const [maxT1,      setMaxT1]      = useState('');
  const [maxT2,      setMaxT2]      = useState('');
  const [minT1,      setMinT1]      = useState('1');
  const [minT2,      setMinT2]      = useState('1');
  const [limMsg,     setLimMsg]     = useState(null);
  const [removing,   setRemoving]   = useState(null);
  const [extraCount, setExtraCount] = useState(3);

  const players  = socketGame?.players || { t1: [], t2: [] };
  const allPlayers = [...(players.t1 || []), ...(players.t2 || [])];

  const handleRemove = async (playerId, name) => {
    if (!confirm(`Remove "${name}" from the game?`)) return;
    setRemoving(playerId);
    await socketGame.removePlayer(session, playerId);
    setRemoving(null);
  };

  const handleSetLimits = async () => {
    const max1 = maxT1 ? parseInt(maxT1) : null;
    const max2 = maxT2 ? parseInt(maxT2) : null;
    // For simplicity use the same min/max for both teams
    const res = await socketGame.setLimits(session, max1 || max2 || null, parseInt(minT1) || 1);
    setLimMsg(res?.ok ? { ok: true, text: '✅ Limits updated' } : { ok: false, text: '❌ Failed' });
    setTimeout(() => setLimMsg(null), 3000);
  };

  const handleAddExtra = () => {
    // Pick random questions not already in the current game set
    const current = new Set(questions.map(q => q.id));
    const pool    = allQuestions.filter(q => !current.has(q.id));
    const extra   = pool.sort(() => Math.random() - .5).slice(0, extraCount);
    if (extra.length === 0) {
      alert('No additional questions available in the question bank.');
      return;
    }
    onAddQuestions(extra);
    setLimMsg({ ok: true, text: `✅ Added ${extra.length} question${extra.length !== 1 ? 's' : ''} to this game` });
    setTimeout(() => setLimMsg(null), 3000);
  };

  const ib = { background: BG_CARD, border: '1px solid rgba(64,196,255,.2)', color: '#fff', padding: '7px 10px', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(3,10,20,.92)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#0a1830', border: '1px solid rgba(64,196,255,.2)',
        borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(64,196,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: AC_COLOR, letterSpacing: 1 }}>⚙️ Admin Controls</div>
          <button onClick={onClose} style={{ background: 'rgba(255,23,68,.12)', color: T2R, border: '1px solid rgba(255,23,68,.25)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Exo 2' }}>✕ Close</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(64,196,255,.1)', flexShrink: 0 }}>
          {[['players', '👥 Players'], ['limits', '🔒 Limits'], ['questions', '➕ Questions']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontFamily: 'Exo 2', fontSize: 13, fontWeight: 700,
              background: tab === id ? 'rgba(64,196,255,.12)' : 'transparent',
              color: tab === id ? AC_COLOR : '#7a9cc6',
              borderBottom: tab === id ? `2px solid ${AC_COLOR}` : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* ── PLAYERS TAB ── */}
          {tab === 'players' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                {[
                  { key: 't1', color: T1_COLOR, name: teams.t1 },
                  { key: 't2', color: T2_COLOR, name: teams.t2 },
                ].map(tm => (
                  <div key={tm.key} style={{ flex: 1, minWidth: 120, padding: '6px 12px', background: `${tm.color}11`, border: `1px solid ${tm.color}33`, borderRadius: 8, fontSize: 12, color: tm.color, fontWeight: 700, textAlign: 'center' }}>
                    {tm.name}: {(players[tm.key] || []).length} player{(players[tm.key] || []).length !== 1 ? 's' : ''}
                  </div>
                ))}
              </div>

              {allPlayers.length === 0 && (
                <div style={{ textAlign: 'center', color: '#7a9cc6', padding: 24, fontSize: 13 }}>No players connected yet</div>
              )}

              {[
                { key: 't1', color: T1_COLOR, name: teams.t1 },
                { key: 't2', color: T2_COLOR, name: teams.t2 },
              ].map(tm => (
                <div key={tm.key}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: tm.color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 }}>{tm.name}</div>
                  {(players[tm.key] || []).length === 0 && (
                    <div style={{ fontSize: 12, color: '#7a9cc6', padding: '8px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, textAlign: 'center' }}>No players on this team</div>
                  )}
                  {(players[tm.key] || []).map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      background: BG_CARD, border: `1px solid rgba(255,255,255,.07)`,
                      borderRadius: 10, marginBottom: 5,
                    }}>
                      {/* Avatar */}
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${tm.color}22`, border: `2px solid ${tm.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: tm.color, flexShrink: 0 }}>
                        {p.name[0]?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: T1_COLOR }}>✅ {p.correct} correct</span>
                          <span style={{ fontSize: 11, color: T2R   }}>❌ {p.wrong} wrong</span>
                          <span style={{ fontSize: 11, color: '#7a9cc6' }}>Total: {p.correct + p.wrong}</span>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(p.id, p.name)}
                        disabled={removing === p.id}
                        style={{ padding: '4px 10px', background: 'rgba(255,23,68,.12)', color: T2R, border: `1px solid ${T2R}33`, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'Exo 2', fontWeight: 700, flexShrink: 0 }}>
                        {removing === p.id ? '…' : '✕ Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ── LIMITS TAB ── */}
          {tab === 'limits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: '#7a9cc6', lineHeight: 1.6 }}>
                Set the maximum and minimum players per team. Changes take effect immediately for new connections.
              </div>

              {[
                { key: 't1', name: teams.t1, color: T1_COLOR, maxVal: maxT1, setMax: setMaxT1, minVal: minT1, setMin: setMinT1 },
                { key: 't2', name: teams.t2, color: T2_COLOR, maxVal: maxT2, setMax: setMaxT2, minVal: minT2, setMin: setMinT2 },
              ].map(tm => (
                <div key={tm.key} style={{ background: BG_CARD, border: `1px solid ${tm.color}22`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800, color: tm.color, fontSize: 13, marginBottom: 10 }}>{tm.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#7a9cc6', marginBottom: 4, fontWeight: 700 }}>MIN PLAYERS</div>
                      <input type="number" min={1} max={50} value={tm.minVal}
                        onChange={e => tm.setMin(e.target.value)}
                        style={ib} placeholder="1"/>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#7a9cc6', marginBottom: 4, fontWeight: 700 }}>MAX PLAYERS (blank = unlimited)</div>
                      <input type="number" min={1} max={50} value={tm.maxVal}
                        onChange={e => tm.setMax(e.target.value)}
                        style={ib} placeholder="Unlimited"/>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={handleSetLimits} style={{ padding: '11px', background: `linear-gradient(135deg,${AC_COLOR},#0099d4)`, color: '#050d1a', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'Exo 2' }}>
                Apply Limits
              </button>

              {limMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, background: limMsg.ok ? 'rgba(0,230,118,.1)' : 'rgba(255,23,68,.1)', color: limMsg.ok ? T1_COLOR : T2R, border: `1px solid ${limMsg.ok ? T1_COLOR : T2R}33` }}>
                  {limMsg.text}
                </div>
              )}
            </div>
          )}

          {/* ── QUESTIONS TAB ── */}
          {tab === 'questions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: '#7a9cc6', lineHeight: 1.6 }}>
                Add more questions from the question bank to the current game. They'll appear after the current queue runs out.
              </div>

              <div style={{ background: BG_CARD, border: '1px solid rgba(64,196,255,.15)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: '#7a9cc6', marginBottom: 6 }}>Questions in current game: <strong style={{ color: '#fff' }}>{questions.length}</strong></div>
                <div style={{ fontSize: 12, color: '#7a9cc6', marginBottom: 12 }}>Questions available in bank: <strong style={{ color: '#fff' }}>{allQuestions.filter(q => !questions.find(x => x.id === q.id)).length}</strong></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#7a9cc6', whiteSpace: 'nowrap' }}>Add</div>
                  <input type="number" min={1} max={20} value={extraCount}
                    onChange={e => setExtraCount(parseInt(e.target.value) || 1)}
                    style={{ ...ib, width: 60, textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: 700, color: AC_COLOR, fontSize: 18 }}/>
                  <div style={{ fontSize: 12, color: '#7a9cc6', whiteSpace: 'nowrap' }}>random question(s)</div>
                </div>

                <button onClick={handleAddExtra} style={{ width: '100%', padding: '10px', background: `linear-gradient(135deg,${T1_COLOR},#00b44a)`, color: '#050d1a', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'Exo 2' }}>
                  ➕ Add to Current Game
                </button>
              </div>

              {limMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, background: limMsg.ok ? 'rgba(0,230,118,.1)' : 'rgba(255,23,68,.1)', color: limMsg.ok ? T1_COLOR : T2R, border: `1px solid ${limMsg.ok ? T1_COLOR : T2R}33` }}>
                  {limMsg.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

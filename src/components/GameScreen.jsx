import { useState, useEffect, useRef, useCallback } from 'react';
import { useCSS } from '../hooks/useCSS';
import TugArena from './TugArena';
import MCQPanel from './MCQPanel';
import SubjectivePanel from './SubjectivePanel';
import InGameAdmin from './InGameAdmin';
import {
  T1_COLOR, T2_COLOR, AC_COLOR, BG_MID, BG_CARD,
  ROPE_STEP, WIN_L, WIN_R, Q_TIME, DIFF_COL, shuffle,
} from '../constants/gameData';

function PauseOverlay({ onResume, onQuit }) {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:100, background:'rgba(3,10,20,.9)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:'40px 52px', background:'rgba(15,32,64,.97)', border:'1px solid rgba(64,196,255,.25)', borderRadius:22, display:'flex', flexDirection:'column', alignItems:'center', gap:22 }}>
        <div style={{ fontSize:56 }}>⏸️</div>
        <div style={{ fontWeight:900, fontSize:30, color:'#fff', letterSpacing:3 }}>PAUSED</div>
        <div style={{ fontSize:13, color:'#7a9cc6' }}>Timer stopped · Mobile players notified</div>
        <div style={{ display:'flex', gap:12, marginTop:6 }}>
          <button className="ma-btn" onClick={onQuit}   style={{ background:'rgba(255,23,68,.15)', color:T2_COLOR, border:`1px solid ${T2_COLOR}44`, padding:'12px 28px', fontSize:14 }}>🚪 Quit</button>
          <button className="ma-btn" onClick={onResume} style={{ background:`linear-gradient(135deg,${T1_COLOR},#00b44a)`, color:'#050d1a', padding:'12px 36px', fontSize:14 }}>▶ Resume</button>
        </div>
      </div>
    </div>
  );
}

function NextQOverlay({ countdown, winnerName, winnerColor }) {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:90, background:'rgba(3,10,20,.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      {winnerName && <div style={{ fontWeight:900, fontSize:22, color:winnerColor, animation:'maPop .4s ease' }}>🎉 {winnerName} got it!</div>}
      <div style={{ fontSize:14, color:'#7a9cc6' }}>Next question in</div>
      <div style={{ fontFamily:'JetBrains Mono', fontSize:72, fontWeight:900, color:AC_COLOR, lineHeight:1, textShadow:`0 0 30px ${AC_COLOR}66` }}>{countdown}</div>
    </div>
  );
}

function GameMenu({ onSkip, onReveal, onAdmin, isOpen, setOpen }) {
  if (!isOpen) return null;
  const btn = (icon, label, action, color='#fff') => (
    <button onClick={() => { action(); setOpen(false); }} style={{
      width:'100%', padding:'10px 16px', background:'transparent', border:'none',
      display:'flex', alignItems:'center', gap:10, cursor:'pointer', color,
      fontFamily:'Exo 2', fontSize:14, fontWeight:600, borderRadius:8,
    }}
    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.07)'}
    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <span style={{ fontSize:18, width:24 }}>{icon}</span>{label}
    </button>
  );
  return (
    <div style={{ position:'absolute', top:48, right:0, zIndex:200, background:'rgba(10,24,48,.98)', border:'1px solid rgba(64,196,255,.2)', borderRadius:12, padding:'8px', minWidth:210, boxShadow:'0 8px 32px rgba(0,0,0,.6)', animation:'maIn .2s ease' }}>
      {btn('⏭', 'Skip Question', onSkip, '#ffab40')}
      {btn('👁', 'Reveal Answer', onReveal, AC_COLOR)}
      {btn('⚙️', 'Admin Controls', onAdmin, '#c084fc')}
    </div>
  );
}

export default function GameScreen({ teams, questions: initialQuestions, allQuestions, onEnd, onBack, socketGame, session }) {
  useCSS();
  const isNetworked = Boolean(socketGame && session);

  // Questions can be extended by admin mid-game
  const [gameQuestions, setGameQuestions] = useState(() => shuffle(initialQuestions));
  const gameQ = useRef(shuffle(initialQuestions));

  // When admin adds questions, append them
  const handleAddQuestions = useCallback((extra) => {
    setGameQuestions(prev => {
      const updated = [...prev, ...extra];
      gameQ.current = updated;
      return updated;
    });
  }, []);

  const [qIdx,       setQIdx]       = useState(0);
  const [ropePos,    setRopePos]    = useState(50);
  const [phase,      setPhase]      = useState('playing');
  const [paused,     setPaused]     = useState(false);
  const [lastW,      setLastW]      = useState(null);
  const [statuses,   setStatuses]   = useState({ t1: null, t2: null });
  const [scores,     setScores]     = useState({ t1: 0, t2: 0 });
  const [streak,     setStreak]     = useState({ t1: 0, t2: 0 });
  const [roundMsg,   setRoundMsg]   = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [adminOpen,  setAdminOpen]  = useState(false);
  const [betweenCD,  setBetweenCD]  = useState(0);
  const [revealAns,  setRevealAns]  = useState(false);
  const [playerCount,setPlayerCount]= useState({ t1: 0, t2: 0 });

  const qTimer = (idx) => gameQ.current[idx]?.timer || Q_TIME;

  const [timeLeft,   setTimeLeft]   = useState(() => qTimer(0));
  const [timerTotal, setTimerTotal] = useState(() => qTimer(0));

  const timerRef     = useRef(null);
  const betweenRef   = useRef(null);
  const ropeRef      = useRef(50);
  const pausedRef    = useRef(false);
  const scoresRef    = useRef({ t1: 0, t2: 0 });
  const timeRef      = useRef(qTimer(0));
  const answeredRef  = useRef(false);
  const teamLockedRef= useRef({ t1: false, t2: false });
  const qIdxRef      = useRef(0);

  const q = gameQ.current[qIdx] || gameQ.current[0];

  useEffect(() => { qIdxRef.current = qIdx; }, [qIdx]);

  // Sync playerCount from socketGame
  useEffect(() => {
    if (isNetworked) setPlayerCount(socketGame.playerCount);
  }, [socketGame?.playerCount, isNetworked]);

  // Send question to mobile
  useEffect(() => {
    if (!isNetworked) return;
    answeredRef.current = false;
    const t = qTimer(qIdx);
    const doSend = () => socketGame.sendQuestion(session, gameQ.current[qIdx], t);
    doSend();
    const retry = setTimeout(doSend, 800);
    return () => clearTimeout(retry);
  }, [qIdx]); // eslint-disable-line

  // Register mobile answer listener
  useEffect(() => {
    if (!isNetworked) return;
    socketGame.onPlayerAnswer(({ team, answer, socketId }) => {
      handleAnswer(team === 't1' ? 1 : 2, answer, socketId);
    });
  });

  const handlePauseToggle = useCallback(() => {
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
    if (isNetworked) {
      if (next) socketGame.sendPause(session);
      else      socketGame.sendResume(session);
    }
  }, [paused, isNetworked, socketGame, session]);

  const doNextQRef = useRef(null);
  doNextQRef.current = (newRope, newScores) => {
    const ns   = newScores || scoresRef.current;
    const next = qIdxRef.current + 1;
    if (next >= gameQ.current.length) {
      const winner     = newRope <= 50 ? 'team1' : 'team2';
      const winnerName = newRope <= 50 ? teams.t1 : teams.t2;
      if (isNetworked) socketGame.sendGameEnd(session, winner, winnerName);
      onEnd({ winner, name: winnerName, ropePos: newRope, scores: ns });
      return;
    }
    const nextTimer = qTimer(next);
    answeredRef.current = false;
    teamLockedRef.current = { t1: false, t2: false };
    setQIdx(next);
    setTimeLeft(nextTimer);
    setTimerTotal(nextTimer);
    timeRef.current = nextTimer;
    setStatuses({ t1: null, t2: null });
    setPhase('playing');
    setRoundMsg(null);
    setRevealAns(false);
  };

  const startBetween = useCallback((newRope, newScores) => {
    setPhase('between');
    setBetweenCD(3);
    let cd = 3;
    clearInterval(betweenRef.current);
    if (isNetworked) socketGame.sendBetween(session, cd);
    betweenRef.current = setInterval(() => {
      cd -= 1;
      setBetweenCD(cd);
      if (isNetworked) socketGame.sendBetween(session, cd);
      if (cd <= 0) {
        clearInterval(betweenRef.current);
        doNextQRef.current(newRope, newScores);
      }
    }, 1000);
  }, [isNetworked, socketGame, session]);

  useEffect(() => {
    if (phase !== 'playing') return;
    answeredRef.current = false;
    teamLockedRef.current = { t1: false, t2: false };
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        clearInterval(timerRef.current);
        setPhase('timeout');
        setRoundMsg('⏰ Time\'s Up!');
        if (isNetworked) socketGame.sendQuestionOver(session, null, q.ans);
        startBetween(ropeRef.current, scoresRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIdx]); // eslint-disable-line

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (ropePos <= WIN_L) {
      clearInterval(timerRef.current); clearInterval(betweenRef.current);
      if (isNetworked) socketGame.sendGameEnd(session, 'team1', teams.t1);
      onEnd({ winner:'team1', name:teams.t1, ropePos, scores });
    }
    if (ropePos >= WIN_R) {
      clearInterval(timerRef.current); clearInterval(betweenRef.current);
      if (isNetworked) socketGame.sendGameEnd(session, 'team2', teams.t2);
      onEnd({ winner:'team2', name:teams.t2, ropePos, scores });
    }
  }, [ropePos]); // eslint-disable-line

  const handleQuit = useCallback(() => {
    clearInterval(timerRef.current); clearInterval(betweenRef.current);
    if (isNetworked) socketGame.sendGameQuit(session);
    onBack();
  }, [isNetworked, socketGame, session, onBack]);

  const handleSkip = useCallback(() => {
    clearInterval(timerRef.current);
    setRoundMsg('⏭ Skipped');
    if (isNetworked) { socketGame.sendSkip(session); socketGame.sendQuestionOver(session, null, q.ans); }
    startBetween(ropeRef.current, scoresRef.current);
  }, [isNetworked, socketGame, session, q, startBetween]);

  const handleReveal = useCallback(() => { setRevealAns(true); setTimeout(() => setRevealAns(false), 4000); }, []);

  const adjustTimer = (delta) => {
    if (phase !== 'playing') return;
    const newTime = Math.max(3, Math.min(300, timeRef.current + delta));
    timeRef.current = newTime;
    setTimeLeft(newTime);
    if (newTime > timerTotal) setTimerTotal(newTime);
    if (isNetworked) socketGame.adjustTimer(session, newTime);
  };

  const handleAnswer = (team, answer, socketId) => {
    if (phase !== 'playing' || paused) return;
    const key     = team === 1 ? 't1' : 't2';
    if (teamLockedRef.current[key]) return;
    teamLockedRef.current[key] = true;

    const correct = answer.trim().toLowerCase() === q.ans.trim().toLowerCase();

    // Update player stats (networked mode)
    if (isNetworked && socketId) {
      socketGame.updatePlayerStat(session, socketId, correct);
    }

    if (correct) {
      if (answeredRef.current) return;
      answeredRef.current = true;
      clearInterval(timerRef.current);
      const newRope   = team === 1 ? Math.max(0, ropeRef.current - ROPE_STEP) : Math.min(100, ropeRef.current + ROPE_STEP);
      const newScores = { ...scoresRef.current, [key]: scoresRef.current[key] + 1 };
      ropeRef.current = newRope; scoresRef.current = newScores;
      setStatuses(s => ({ ...s, [key]: 'correct' }));
      setLastW(team); setScores(newScores);
      setStreak(s => ({ t1: team===1?s.t1+1:0, t2: team===2?s.t2+1:0 }));
      setRoundMsg(`${team===1?teams.t1:teams.t2} got it! 💪`);
      if (isNetworked) {
        socketGame.sendAnswerFeedback(session, key, true);
        socketGame.sendQuestionOver(session, key, q.ans);
        socketGame.sendState(session, { ropePos: newRope, scores: newScores, phase:'feedback', lastWinner: key });
      }
      setTimeout(() => setRopePos(newRope), 100);
      startBetween(newRope, newScores);
    } else {
      setStatuses(s => ({ ...s, [key]: 'wrong' }));
      if (isNetworked) socketGame.sendAnswerFeedback(session, key, false);
      setTimeout(() => setStatuses(s => ({ ...s, [key]: null })), 700);
    }
  };

  const timerPct   = Math.min(1, timeLeft / Math.max(1, timerTotal));
  const timerColor = timeLeft <= 5 ? T2_COLOR : timeLeft <= 10 ? '#ffab40' : AC_COLOR;
  const circumf    = 88;
  const winnerColor= lastW === 1 ? T1_COLOR : T2_COLOR;
  const winnerName = lastW === 1 ? teams.t1 : lastW === 2 ? teams.t2 : null;

  return (
    <div className="ma" style={{ height:'100vh', overflow:'hidden', position:'relative' }}
      onClick={() => menuOpen && setMenuOpen(false)}>

      {adminOpen && (
        <InGameAdmin
          socketGame={socketGame} session={session} teams={teams}
          questions={gameQ.current} allQuestions={allQuestions || []}
          onAddQuestions={handleAddQuestions}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {paused && phase !== 'between' && (
        <PauseOverlay onResume={handlePauseToggle} onQuit={handleQuit}/>
      )}
      {phase === 'between' && (
        <NextQOverlay countdown={betweenCD} winnerName={winnerName} winnerColor={winnerColor}/>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', padding:'5px 10px', background:BG_MID, borderBottom:'1px solid rgba(64,196,255,.1)', gap:6, flexShrink:0 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:6, overflow:'hidden' }}>
          <div style={{ fontWeight:900, fontSize:14, color:T1_COLOR, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{teams.t1}</div>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:22, fontWeight:700, color:T1_COLOR, flexShrink:0, animation:lastW===1?'maGlowT1 .6s ease':undefined }}>{scores.t1}</div>
          {streak.t1 > 1 && <div style={{ background:`${T1_COLOR}22`, color:T1_COLOR, padding:'1px 6px', borderRadius:12, fontSize:10, fontWeight:700, flexShrink:0 }}>🔥×{streak.t1}</div>}
          {isNetworked && <div style={{ fontSize:10, color:'#7a9cc6', background:BG_CARD, padding:'2px 6px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>📱{playerCount.t1}</div>}
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button className="ma-btn" onClick={handlePauseToggle} style={{ width:28, height:28, padding:0, fontSize:13, background:paused?`${T1_COLOR}22`:'rgba(255,255,255,.07)', color:paused?T1_COLOR:'#7a9cc6', border:`1px solid ${paused?T1_COLOR+'44':'rgba(255,255,255,.12)'}`, borderRadius:7 }}>
              {paused ? '▶' : '⏸'}
            </button>
            <button className="ma-btn" onClick={() => adjustTimer(-10)} style={{ width:26, height:26, padding:0, fontSize:10, background:'rgba(255,23,68,.12)', color:T2_COLOR, border:'1px solid rgba(255,23,68,.25)', borderRadius:7, fontWeight:800 }}>−10</button>
            <svg width="36" height="36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke={timerColor} strokeWidth="3"
                strokeDasharray={circumf} strokeDashoffset={circumf*(1-timerPct)} strokeLinecap="round"
                style={{ transform:'rotate(-90deg)', transformOrigin:'18px 18px', transition:'stroke-dashoffset 1s linear, stroke .5s' }}/>
              <text x="18" y="22" textAnchor="middle" fill={timerColor} fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">{timeLeft}</text>
            </svg>
            <button className="ma-btn" onClick={() => adjustTimer(+10)} style={{ width:26, height:26, padding:0, fontSize:10, background:`${T1_COLOR}18`, color:T1_COLOR, border:`1px solid ${T1_COLOR}44`, borderRadius:7, fontWeight:800 }}>+10</button>

            <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
              <button className="ma-btn" onClick={() => setMenuOpen(o => !o)} style={{ width:28, height:28, padding:0, fontSize:16, background:menuOpen?'rgba(64,196,255,.15)':'rgba(255,255,255,.07)', color:menuOpen?AC_COLOR:'#7a9cc6', border:`1px solid ${menuOpen?AC_COLOR+'44':'rgba(255,255,255,.12)'}`, borderRadius:7 }}>⋮</button>
              <GameMenu onSkip={handleSkip} onReveal={handleReveal} onAdmin={() => setAdminOpen(true)} isOpen={menuOpen} setOpen={setMenuOpen}/>
            </div>

            <button className="ma-btn" onClick={handleQuit} style={{ width:28, height:28, padding:0, fontSize:12, background:'rgba(255,23,68,.1)', color:T2_COLOR, border:'1px solid rgba(255,23,68,.2)', borderRadius:7 }} title="Quit">✕</button>
          </div>
          <div style={{ fontSize:9, color:'#7a9cc6', letterSpacing:1, fontWeight:600 }}>Q {qIdx+1}/{gameQ.current.length} · {qTimer(qIdx)}s</div>
        </div>

        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6, overflow:'hidden' }}>
          {isNetworked && <div style={{ fontSize:10, color:'#7a9cc6', background:BG_CARD, padding:'2px 6px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>📱{playerCount.t2}</div>}
          {streak.t2 > 1 && <div style={{ background:`${T2_COLOR}22`, color:T2_COLOR, padding:'1px 6px', borderRadius:12, fontSize:10, fontWeight:700, flexShrink:0 }}>🔥×{streak.t2}</div>}
          <div style={{ fontFamily:'JetBrains Mono', fontSize:22, fontWeight:700, color:T2_COLOR, flexShrink:0, animation:lastW===2?'maGlowT2 .6s ease':undefined }}>{scores.t2}</div>
          <div style={{ fontWeight:900, fontSize:14, color:T2_COLOR, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{teams.t2}</div>
        </div>
      </div>

      <div style={{ flexShrink:0, padding:'2px 0' }}><TugArena ropePos={ropePos} lastW={lastW}/></div>

      <div style={{ height:5, background:BG_CARD, position:'relative', margin:'0 12px', borderRadius:3 }}>
        <div style={{ position:'absolute', left:`${WIN_L}%`, right:`${100-WIN_R}%`, top:0, bottom:0, background:'rgba(255,255,255,.04)', borderRadius:3 }}/>
        <div style={{ position:'absolute', left:`${ropePos}%`, top:-3.5, width:12, height:12, borderRadius:'50%', background:'#ffd700', transform:'translateX(-50%)', boxShadow:'0 0 12px rgba(255,215,0,.8)', transition:'left .6s cubic-bezier(0.34,1.56,0.64,1)' }}/>
        <div style={{ position:'absolute', left:`${WIN_L}%`, top:0, bottom:0, width:2, background:T1_COLOR, opacity:.5 }}/>
        <div style={{ position:'absolute', left:`${WIN_R}%`, top:0, bottom:0, width:2, background:T2_COLOR, opacity:.5 }}/>
      </div>

      {/* Question */}
      <div style={{ padding:'8px 14px', flexShrink:0 }}>
        <div style={{ background:BG_CARD, border:'1px solid rgba(64,196,255,.15)', borderRadius:12, padding:'14px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' }}>
            <span className="ma-tag" style={{ background:`${DIFF_COL[q.diff]}18`, color:DIFF_COL[q.diff], border:`1px solid ${DIFF_COL[q.diff]}33` }}>{q.diff}</span>
            <span className="ma-tag" style={{ background:'rgba(64,196,255,.1)', color:AC_COLOR, border:'1px solid rgba(64,196,255,.2)' }}>{q.cat}</span>
            {q.type==='mcq' && <span className="ma-tag" style={{ background:'rgba(180,100,255,.1)', color:'#c084fc', border:'1px solid rgba(180,100,255,.2)' }}>MCQ</span>}
            <span className="ma-tag" style={{ background:'rgba(64,196,255,.07)', color:'#7a9cc6', border:'1px solid rgba(64,196,255,.12)' }}>⏱ {q.timer||Q_TIME}s</span>
            {isNetworked && <span className="ma-tag" style={{ background:'rgba(64,196,255,.07)', color:'#7a9cc6', border:'1px solid rgba(64,196,255,.12)' }}>📱 Multi-device</span>}
            {roundMsg && <span style={{ fontSize:12, fontWeight:700, color:lastW===1?T1_COLOR:lastW===2?T2_COLOR:'#ffab40', marginLeft:'auto', animation:'maPop .3s ease' }}>{roundMsg}</span>}
          </div>
          <div style={{ textAlign:'center', fontWeight:800, fontSize:22, lineHeight:1.45, color:'#f0f4ff', padding:'6px 0' }}>{q.q}</div>
          {revealAns && (
            <div style={{ marginTop:10, textAlign:'center', padding:'8px 16px', background:`${T1_COLOR}18`, border:`1px solid ${T1_COLOR}44`, borderRadius:8 }}>
              <span style={{ fontSize:12, color:'#7a9cc6' }}>Answer: </span>
              <span style={{ fontWeight:900, fontSize:18, color:T1_COLOR, fontFamily:'JetBrains Mono' }}>{q.ans}</span>
            </div>
          )}
        </div>
      </div>

      {/* Answer area */}
      {!isNetworked ? (
        <div style={{ display:'flex', gap:7, padding:'0 10px 6px', flex:1, overflow:'hidden', minHeight:0 }}>
          {q.type === 'mcq' ? (
            <>
              <MCQPanel q={q} team={1} color={T1_COLOR} onAnswer={a=>handleAnswer(1,a,null)} status={statuses.t1} disabled={phase!=='playing'||paused||teamLockedRef.current.t1}/>
              <div style={{ width:1, background:'rgba(255,255,255,.06)', flexShrink:0 }}/>
              <MCQPanel q={q} team={2} color={T2_COLOR} onAnswer={a=>handleAnswer(2,a,null)} status={statuses.t2} disabled={phase!=='playing'||paused||teamLockedRef.current.t2}/>
            </>
          ) : (
            <>
              <SubjectivePanel team={1} color={T1_COLOR} onAnswer={a=>handleAnswer(1,a,null)} status={statuses.t1} disabled={phase!=='playing'||paused||teamLockedRef.current.t1}/>
              <div style={{ width:1, background:'rgba(255,255,255,.06)', flexShrink:0 }}/>
              <SubjectivePanel team={2} color={T2_COLOR} onAnswer={a=>handleAnswer(2,a,null)} status={statuses.t2} disabled={phase!=='playing'||paused||teamLockedRef.current.t2}/>
            </>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', padding:'0 10px 6px', flex:1, overflow:'hidden', minHeight:0, gap:8 }}>
          {q.type === 'mcq' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, flexShrink:0 }}>
              {q.opts.map((opt, i) => {
                const label  = ['A','B','C','D'][i];
                const isAns  = opt === q.ans;
                const anyWin = statuses.t1==='correct'||statuses.t2==='correct';
                return (
                  <div key={i} style={{ padding:'10px 14px', borderRadius:10, display:'flex', alignItems:'center', gap:10, background:anyWin&&isAns?`${T1_COLOR}22`:BG_CARD, border:`1.5px solid ${anyWin&&isAns?T1_COLOR+'66':'rgba(255,255,255,.1)'}`, transition:'all .3s' }}>
                    <span style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:anyWin&&isAns?T1_COLOR:AC_COLOR, opacity:.8 }}>{label}</span>
                    <span style={{ fontSize:14, fontWeight:600, color:anyWin&&isAns?T1_COLOR:'#ddd', flex:1 }}>{opt}</span>
                    {anyWin&&isAns && <span>✓</span>}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display:'flex', gap:8, flex:1, minHeight:0 }}>
            {[{t:1,k:'t1',color:T1_COLOR,name:teams.t1,count:playerCount.t1},{t:2,k:'t2',color:T2_COLOR,name:teams.t2,count:playerCount.t2}].map(tm => (
              <div key={tm.k} style={{ flex:1, borderRadius:10, border:`1px solid ${statuses[tm.k]==='correct'?tm.color+'55':statuses[tm.k]==='wrong'?'#ff174455':'rgba(255,255,255,.07)'}`, background:statuses[tm.k]==='correct'?`${tm.color}12`:statuses[tm.k]==='wrong'?'rgba(255,23,68,.07)':'rgba(255,255,255,.02)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, animation:statuses[tm.k]==='wrong'?'maShake .4s ease':'none', padding:'10px 8px', transition:'all .3s' }}>
                <div style={{ fontSize:24 }}>{statuses[tm.k]==='correct'?'✅':statuses[tm.k]==='wrong'?'❌':'📱'}</div>
                <div style={{ fontWeight:800, fontSize:13, color:tm.color }}>{tm.name}</div>
                <div style={{ fontSize:10, color:'#7a9cc6' }}>📱 {tm.count} player{tm.count!==1?'s':''}</div>
                <div style={{ fontSize:11, color:'#7a9cc6', textAlign:'center' }}>{statuses[tm.k]==='correct'?'✅ Correct!':statuses[tm.k]==='wrong'?'❌ Wrong…':phase==='playing'?'Answering…':phase==='between'?'⏳ Get ready…':'Waiting…'}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:26, fontWeight:700, color:tm.color }}>{scores[tm.k]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
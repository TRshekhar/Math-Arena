import { useEffect, useRef, useState } from 'react';
import { useCSS } from '../hooks/useCSS';
import { T1_COLOR, T2_COLOR, AC_COLOR, BG_MID, BG_CARD } from '../constants/gameData';

/* ── Real QR Code using canvas + qrcode library ───────────────────────────
   Requires: npm install qrcode
   The canvas renders a scannable QR containing the full join URL.
────────────────────────────────────────────────────────────────────────── */
function QRCode({ data, size = 150 }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    setError(false);

    // Dynamically import qrcode to avoid SSR issues
    import('qrcode')
      .then((QRLib) => {
        const lib = QRLib.default || QRLib;
        lib.toCanvas(canvasRef.current, data, {
          width:  size,
          margin: 2,
          color:  { dark: '#111111', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        }).catch((err) => {
          console.error('[QRCode] render failed:', err);
          setError(true);
        });
      })
      .catch(() => setError(true));
  }, [data, size]);

  if (error) {
    return (
      <div style={{ width: size, height: size, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, padding: 10 }}>
        <div style={{ fontSize: 24 }}>⚠️</div>
        <div style={{ fontSize: 10, color: '#333', textAlign: 'center', wordBreak: 'break-all' }}>
          QR error — type URL manually
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ borderRadius: 12, display: 'block' }}
    />
  );
}

function StatusDot({ on }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: on ? T1_COLOR : '#444',
      boxShadow: on ? `0 0 8px ${T1_COLOR}` : 'none',
      marginRight: 6, flexShrink: 0,
      transition: 'all .3s',
    }}/>
  );
}

/**
 * QRLobby receives `socketGame` as prop from App.jsx (never unmounts the socket).
 */
export default function QRLobby({ teams, socketGame, onStartGame, onBack }) {
  useCSS();

  const [phase,      setPhase]      = useState('connecting');
  const [sessionURL, setSessionURL] = useState({ t1: '', t2: '' });
  const [errorMsg,   setErrorMsg]   = useState('');
  const [serverInfo, setServerInfo] = useState(null);

  // ── Create session on mount ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPhase('connecting');
    setSessionURL({ t1: '', t2: '' });
    setServerInfo(null);
    setErrorMsg('');

    socketGame.createSession({ t1: teams.t1, t2: teams.t2 })
      .then(({ code, ip, port }) => {
        if (cancelled) return;
        console.log('[QRLobby] Session ready:', code, ip, port);
        setServerInfo({ code, ip, port });
        setSessionURL({
          t1: `http://${ip}:${port}/mobile?session=${code}&team=1`,
          t2: `http://${ip}:${port}/mobile?session=${code}&team=2`,
        });
        setPhase('lobby');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[QRLobby] createSession failed:', err.message);
        setErrorMsg(err.message);
        setPhase('error');
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bothJoined = socketGame.teamsJoined.t1 && socketGame.teamsJoined.t2;

  /* ── Error ── */
  if (phase === 'error') return (
    <div className="ma" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
      <div style={{ fontSize: 52 }}>🔌</div>
      <div style={{ fontWeight: 900, fontSize: 22, color: '#ff5252' }}>Server Not Running</div>
      <div style={{ background: 'rgba(255,23,68,.08)', border: '1px solid rgba(255,23,68,.2)', borderRadius: 12, padding: '16px 20px', maxWidth: 420, fontSize: 13, color: '#ffb3b3', lineHeight: 1.8 }}>
        <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap' }}>{errorMsg}</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, background: 'rgba(0,0,0,.4)', padding: '10px 14px', borderRadius: 7, color: AC_COLOR }}>
          cd server<br/>npm install<br/>node server.js
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="ma-btn" onClick={onBack} style={{ background: 'transparent', color: '#7a9cc6', border: '1px solid rgba(255,255,255,.15)', padding: '10px 22px', fontSize: 13 }}>← Back</button>
        <button className="ma-btn" onClick={() => {
          setPhase('connecting');
          setErrorMsg('');
          socketGame.createSession({ t1: teams.t1, t2: teams.t2 })
            .then(({ code, ip, port }) => {
              setServerInfo({ code, ip, port });
              setSessionURL({ t1: `http://${ip}:${port}/mobile?session=${code}&team=1`, t2: `http://${ip}:${port}/mobile?session=${code}&team=2` });
              setPhase('lobby');
            })
            .catch(err => { setErrorMsg(err.message); setPhase('error'); });
        }} style={{ background: `linear-gradient(135deg,${AC_COLOR},#0099d4)`, color: '#050d1a', padding: '10px 22px', fontSize: 13 }}>
          🔄 Retry
        </button>
      </div>
    </div>
  );

  /* ── Connecting spinner ── */
  if (phase === 'connecting') return (
    <div className="ma" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 50, height: 50, border: `3px solid rgba(64,196,255,.15)`, borderTopColor: AC_COLOR, borderRadius: '50%', animation: 'maRotate 1s linear infinite' }}/>
      <div style={{ fontWeight: 700, fontSize: 18, color: AC_COLOR }}>Connecting to Server…</div>
      <div style={{ fontSize: 12, color: '#7a9cc6' }}>Make sure the game server is running</div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, background: BG_CARD, padding: '10px 16px', borderRadius: 8, color: AC_COLOR, border: '1px solid rgba(64,196,255,.15)' }}>
        cd server &amp;&amp; npm install &amp;&amp; node server.js
      </div>
      <button className="ma-btn" onClick={onBack} style={{ background: 'transparent', color: '#7a9cc6', border: '1px solid rgba(255,255,255,.15)', padding: '9px 20px', fontSize: 13, marginTop: 8 }}>← Cancel</button>
    </div>
  );

  /* ── Main lobby ── */
  return (
    <div className="ma" style={{ alignItems: 'center', justifyContent: 'center', gap: 18, padding: 18, overflowY: 'auto' }}>

      {/* Back */}
      <div style={{ position: 'absolute', top: 14, left: 14 }}>
        <button className="ma-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,.07)', color: '#7a9cc6', border: '1px solid rgba(255,255,255,.12)', padding: '7px 14px', fontSize: 12 }}>← Back</button>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: AC_COLOR, letterSpacing: 2 }}>📱 SCAN TO JOIN</div>
        <div style={{ color: '#7a9cc6', fontSize: 12, marginTop: 4 }}>
          Both teams must be on the <strong style={{ color: '#fff' }}>same WiFi</strong>
        </div>
      </div>

      {/* Session info bar */}
      {serverInfo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center', background: BG_CARD, border: '1px solid rgba(64,196,255,.15)', borderRadius: 10, padding: '9px 18px' }}>
          <div style={{ fontSize: 12, color: '#7a9cc6' }}>
            Code: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#fff', letterSpacing: 4, fontSize: 16 }}>{serverInfo.code}</span>
          </div>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,.1)' }}/>
          <div style={{ fontSize: 12, color: '#7a9cc6' }}>
            Host: <span style={{ fontFamily: 'JetBrains Mono', color: AC_COLOR, fontSize: 12 }}>{serverInfo.ip}:{serverInfo.port}</span>
          </div>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,.1)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#7a9cc6' }}>
            <StatusDot on={socketGame.connected}/>{socketGame.connected ? 'Server Online' : 'Reconnecting…'}
          </div>
        </div>
      )}

      {/* QR Cards */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { key: 't1', name: teams.t1, color: T1_COLOR, joined: socketGame.teamsJoined.t1, url: sessionURL.t1 },
          { key: 't2', name: teams.t2, color: T2_COLOR, joined: socketGame.teamsJoined.t2, url: sessionURL.t2 },
        ].map(p => (
          <div key={p.key} style={{
            background: BG_MID,
            border: `2px solid ${p.joined ? p.color : p.color + '33'}`,
            borderRadius: 16, padding: 18, textAlign: 'center', minWidth: 200,
            transition: 'all .35s',
            boxShadow: p.joined ? `0 0 28px ${p.color}33` : 'none',
          }}>
            <div style={{ fontWeight: 800, color: p.color, marginBottom: 12, fontSize: 12, letterSpacing: 1 }}>
              {p.name.toUpperCase()}
            </div>

            {/* Real QR code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, position: 'relative' }}>
              {p.url
                ? <QRCode data={p.url} size={150}/>
                : <div style={{ width: 150, height: 150, background: 'rgba(255,255,255,.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 32, height: 32, border: `3px solid ${AC_COLOR}44`, borderTopColor: AC_COLOR, borderRadius: '50%', animation: 'maRotate 1s linear infinite' }}/>
                  </div>
              }
              {p.joined && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,230,118,.94)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 32 }}>✅</div>
                  <div style={{ fontWeight: 900, color: '#050d1a', fontSize: 14 }}>CONNECTED!</div>
                  <div style={{ fontWeight: 600, color: 'rgba(5,13,26,.7)', fontSize: 11 }}>{p.name}</div>
                </div>
              )}
            </div>

            {/* Fallback URL for manual entry */}
            <div style={{ fontSize: 9, color: '#7a9cc6', fontFamily: 'JetBrains Mono', wordBreak: 'break-all', lineHeight: 1.5, padding: '4px 8px', background: 'rgba(0,0,0,.3)', borderRadius: 6, marginBottom: 8 }}>
              {p.url || 'Generating…'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12 }}>
              <StatusDot on={p.joined}/>
              <span style={{ color: p.joined ? T1_COLOR : '#7a9cc6', fontWeight: 700 }}>
                {p.joined ? 'Ready!' : 'Waiting for scan…'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Open phone camera', 'Point at QR code', 'Tap the link', 'Select your team'].map((step, i) => (
          <div key={i} style={{ background: BG_CARD, border: '1px solid rgba(64,196,255,.1)', borderRadius: 8, padding: '6px 12px', fontSize: 11, color: '#7a9cc6', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: AC_COLOR, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{i + 1}.</span>{step}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="ma-btn" onClick={onBack} style={{ background: 'transparent', color: '#7a9cc6', border: '1px solid rgba(255,255,255,.15)', padding: '10px 20px', fontSize: 13 }}>← Back</button>
        <button className="ma-btn"
          disabled={!bothJoined}
          onClick={onStartGame}
          style={{
            background: bothJoined ? `linear-gradient(135deg,${T1_COLOR},#00b44a)` : 'rgba(255,255,255,.05)',
            color: bothJoined ? '#050d1a' : '#444',
            padding: '11px 28px', fontSize: 14,
            border: `1px solid ${bothJoined ? 'transparent' : 'rgba(255,255,255,.08)'}`,
            transition: 'all .3s',
          }}>
          {bothJoined
            ? '⚔️ Start Battle!'
            : `T1:${socketGame.teamsJoined.t1 ? '✅' : '⭕'} T2:${socketGame.teamsJoined.t2 ? '✅' : '⭕'} Waiting…`}
        </button>
      </div>
    </div>
  );
}
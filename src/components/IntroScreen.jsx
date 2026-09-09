import { useState, useEffect } from 'react';
import { useCSS } from '../hooks/useCSS';
import { T1_COLOR, T2_COLOR, AC_COLOR, BG_MID, BG_CARD } from '../constants/gameData';

// const game_title = "Math Arena - Multiplayer Math Battle";
const game_title = "BRAIN BLITZ";

/* ── Animated stars background ── */
function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: 0.5 + Math.random() * 1.5,
    delay: Math.random() * 4,
    dur: 2 + Math.random() * 3,
  }));
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.r*2, height: s.r*2,
          borderRadius: '50%',
          background: '#fff',
          animation: `maStarTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }}/>
      ))}
    </div>
  );
}

/* ── Animated rope decoration ── */
function RopeDecor() {
  return (
    <svg width="100%" height="60" viewBox="0 0 900 60" preserveAspectRatio="none"
      style={{ position:'absolute', bottom:0, left:0, opacity:.3 }}>
      <defs>
        <linearGradient id="rd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={T1_COLOR}/>
          <stop offset="50%"  stopColor="#ffd700"/>
          <stop offset="100%" stopColor={T2_COLOR}/>
        </linearGradient>
      </defs>
      <path d="M0,30 Q225,10 450,30 Q675,50 900,30" stroke="url(#rd)" strokeWidth="4" fill="none"/>
    </svg>
  );
}

export default function IntroScreen({ onQuickPlay, onCustomContest }) {
  useCSS();
  const [phase, setPhase] = useState('loading'); // loading → intro

  useEffect(() => {
    const t = setTimeout(() => setPhase('intro'), 2200);
    return () => clearTimeout(t);
  }, []);

  /* ── Loading splash ── */
  if (phase === 'loading') {
    return (
      <div className="ma" style={{
        alignItems: 'center', justifyContent: 'center',
        background: '#030a14', position: 'relative', overflow: 'hidden',
      }}>
        <Stars/>

        {/* Pulsing ring */}
        <div style={{
          position: 'absolute',
          width: 320, height: 320,
          borderRadius: '50%',
          border: `1px solid ${AC_COLOR}22`,
          animation: 'maFloat 3s ease-in-out infinite',
        }}/>
        <div style={{
          position: 'absolute',
          width: 220, height: 220,
          borderRadius: '50%',
          border: `1px solid ${AC_COLOR}44`,
          animation: 'maFloat 2.5s ease-in-out .3s infinite',
        }}/>

        {/* Logo */}
        <div style={{ zIndex:1, textAlign:'center', animation:'maFadeIn .8s ease' }}>
          <div style={{ fontSize: 72, marginBottom: 16, animation: 'maFloat 2s ease-in-out infinite' }}>🧮</div>
          <div style={{
            fontWeight: 900, fontSize: 44, letterSpacing: 4,
            background: `linear-gradient(90deg, ${T1_COLOR}, ${AC_COLOR}, ${T2_COLOR})`,
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'maGradient 3s linear infinite',
          }}>
            {game_title}
          </div>

          {/* Loading bar */}
          <div style={{ margin: '0 auto', width: 220, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: `linear-gradient(90deg,${T1_COLOR},${AC_COLOR})`,
              animation: 'maBeam 2s ease forwards',
            }}/>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#7a9cc6', letterSpacing: 3, fontWeight: 600 }}>
            LOADING…
          </div>
        </div>
      </div>
    );
  }

  /* ── Main intro / landing ── */
  return (
    <div className="ma" style={{
      alignItems: 'center', justifyContent: 'center', gap: 0,
      background: 'radial-gradient(ellipse at 30% 40%, #071828 0%, #030a14 60%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <Stars/>
      <RopeDecor/>

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', left: '-10%', top: '20%',
        width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${T1_COLOR}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', right: '-10%', top: '30%',
        width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${T2_COLOR}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>

      {/* Header */}
      <div style={{ zIndex:1, textAlign:'center', padding: '0 0 20px', animation:'maIn .6s ease' }}>
        <div style={{ fontSize: 56, marginBottom: 8, animation: 'maFloat 3s ease-in-out infinite' }}>🧮</div>
        <div style={{
          fontWeight: 900, fontSize: 52, letterSpacing: 4,
          background: `linear-gradient(90deg, ${T1_COLOR}, ${AC_COLOR}, ${T2_COLOR})`,
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'maGradient 4s linear infinite',
          lineHeight: 1,
        }}>
          {game_title}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#7a9cc6', letterSpacing: 4, fontWeight: 600 }}>
          MULTIPLAYER MATH BATTLE
        </div>
      </div>

      {/* VS banner */}
      <div style={{
        zIndex:1, display:'flex', alignItems:'center', gap: 20, marginBottom: 24,
        animation: 'maSlideDown .6s ease .2s both',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{ fontSize: 28 }}>🟢</div>
          <span style={{ fontWeight: 900, fontSize: 18, color: T1_COLOR }}>TEAM 1</span>
        </div>
        <div style={{
          background: BG_CARD, border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 30, padding: '6px 18px',
          fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: 2,
        }}>
          VS
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: T2_COLOR }}>TEAM 2</span>
          <div style={{ fontSize: 28 }}>🔴</div>
        </div>
      </div>

      {/* Mode cards */}
      <div style={{
        zIndex:1, display:'flex', gap: 20, padding: '0 24px',
        animation: 'maIn .6s ease .35s both',
      }}>
        {/* Quick Play */}
        <button
          className="ma-btn"
          onClick={onQuickPlay}
          style={{
            width: 240, padding: '28px 20px', textAlign: 'left',
            background: `linear-gradient(135deg, ${T1_COLOR}18, ${T1_COLOR}08)`,
            border: `2px solid ${T1_COLOR}55`,
            borderRadius: 18, cursor: 'pointer', color: '#fff',
            transition: 'all .2s',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${T1_COLOR}30, ${T1_COLOR}15)`; e.currentTarget.style.borderColor = T1_COLOR; e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${T1_COLOR}18, ${T1_COLOR}08)`; e.currentTarget.style.borderColor = `${T1_COLOR}55`; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ fontSize: 36 }}>⚡</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: T1_COLOR }}>Quick Play</div>
          <div style={{ fontSize: 13, color: '#aac8aa', lineHeight: 1.5, fontWeight: 400 }}>
            Jump straight in with our pre-loaded question bank. Ready to battle instantly!
          </div>
          <div style={{
            marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${T1_COLOR}22`, borderRadius: 20, padding: '5px 12px',
            color: T1_COLOR, fontWeight: 700, fontSize: 12,
          }}>
            15 questions ready ✓
          </div>
        </button>

        {/* Custom Contest */}
        <button
          className="ma-btn"
          onClick={onCustomContest}
          style={{
            width: 240, padding: '28px 20px', textAlign: 'left',
            background: `linear-gradient(135deg, ${AC_COLOR}18, ${AC_COLOR}08)`,
            border: `2px solid ${AC_COLOR}55`,
            borderRadius: 18, cursor: 'pointer', color: '#fff',
            transition: 'all .2s',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${AC_COLOR}30, ${AC_COLOR}15)`; e.currentTarget.style.borderColor = AC_COLOR; e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${AC_COLOR}18, ${AC_COLOR}08)`; e.currentTarget.style.borderColor = `${AC_COLOR}55`; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ fontSize: 36 }}>🛠️</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: AC_COLOR }}>Custom Contest</div>
          <div style={{ fontSize: 13, color: '#aac8cc', lineHeight: 1.5, fontWeight: 400 }}>
            Create your own question bank. Add MCQ or subjective questions and organise your contest.
          </div>
          <div style={{
            marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${AC_COLOR}22`, borderRadius: 20, padding: '5px 12px',
            color: AC_COLOR, fontWeight: 700, fontSize: 12,
          }}>
            Open Admin Panel →
          </div>
        </button>
      </div>

      {/* Feature pills */}
      <div style={{
        zIndex:1, display:'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center',
        animation: 'maFadeIn .6s ease .5s both',
      }}>
        {['🏆 Tug-of-War', '⏱️ Live Timer', '📱 Multi-Device', '🔥 Streaks', '📊 Score Tracking'].map(f => (
          <div key={f} style={{
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#7a9cc6', fontWeight: 600,
          }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

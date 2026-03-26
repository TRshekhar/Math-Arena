import { useEffect } from 'react';
import { T1_COLOR, T2_COLOR, AC_COLOR, BG_DARK, BG_MID, BG_CARD } from '../constants/gameData';

export function useCSS() {
  useEffect(() => {
    if (document.getElementById('ma-css')) return;
    const s = document.createElement('style');
    s.id = 'ma-css';
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,600;0,700;0,900;1,700&family=JetBrains+Mono:wght@400;700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; overflow: hidden; }

      .ma {
        font-family: 'Exo 2', sans-serif;
        background: ${BG_DARK};
        color: #fff;
        height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        user-select: none;
      }
      input, textarea, select { font-family: 'Exo 2', sans-serif; }

      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: ${BG_MID}; }
      ::-webkit-scrollbar-thumb { background: #0099d4; border-radius: 3px; }

      /* ── Keyframes ── */
      @keyframes maIn        { from { transform: scale(.88) translateY(-10px); opacity:0 } to { transform: scale(1); opacity:1 } }
      @keyframes maShake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-9px)} 75%{transform:translateX(9px)} }
      @keyframes maPop       { 0%{transform:scale(.88)} 60%{transform:scale(1.08)} 100%{transform:scale(1)} }
      @keyframes maFlashG    { 0%{box-shadow:inset 0 0 0 9999px rgba(0,230,118,.35)} 100%{box-shadow:none} }
      @keyframes maFlashR    { 0%{box-shadow:inset 0 0 0 9999px rgba(255,23,68,.35)} 100%{box-shadow:none} }
      @keyframes maVictory   { 0%,100%{transform:scale(1) rotate(-3deg)} 50%{transform:scale(1.06) rotate(3deg)} }
      @keyframes maPullL     { 0%,100%{transform:rotate(-8deg) translateX(0)} 50%{transform:rotate(-15deg) translateX(-4px)} }
      @keyframes maPullR     { 0%,100%{transform:rotate(8deg) translateX(0)} 50%{transform:rotate(15deg) translateX(4px)} }
      @keyframes maSlideUp   { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
      @keyframes maSlideDown { from{transform:translateY(-18px);opacity:0} to{transform:translateY(0);opacity:1} }
      @keyframes maGlowT1    { 0%,100%{box-shadow:0 0 8px ${T1_COLOR}} 50%{box-shadow:0 0 30px ${T1_COLOR},0 0 60px ${T1_COLOR}} }
      @keyframes maGlowT2    { 0%,100%{box-shadow:0 0 8px ${T2_COLOR}} 50%{box-shadow:0 0 30px ${T2_COLOR},0 0 60px ${T2_COLOR}} }
      @keyframes maBlink     { 0%,100%{opacity:1} 50%{opacity:.3} }
      @keyframes maFall      { 0%{transform:translateY(-5px) rotate(0deg);opacity:1} 100%{transform:translateY(90px) rotate(540deg);opacity:0} }
      @keyframes maFloat     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      @keyframes maRotate    { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      @keyframes maFadeIn    { from{opacity:0} to{opacity:1} }
      @keyframes maScaleIn   { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes maGradient  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes maBeam      { 0%{opacity:0;transform:scaleX(0)} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0;transform:scaleX(1)} }
      @keyframes maStarTwinkle { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
      @keyframes maPauseIn   { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }

      /* ── Shared Classes ── */
      .ma-btn {
        font-family: 'Exo 2', sans-serif;
        font-weight: 700;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all .15s ease;
        letter-spacing: .5px;
      }
      .ma-btn:hover  { transform: translateY(-2px) scale(1.02); }
      .ma-btn:active { transform: translateY(0) scale(.97); }
      .ma-btn:disabled { opacity: .4; cursor: not-allowed; transform: none !important; }

      .ma-input {
        background: ${BG_CARD};
        border: 2px solid rgba(64,196,255,.2);
        color: #fff;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 15px;
        outline: none;
        transition: border .2s, box-shadow .2s;
      }
      .ma-input:focus {
        border-color: ${AC_COLOR};
        box-shadow: 0 0 14px rgba(64,196,255,.25);
      }

      .ma-card {
        background: ${BG_MID};
        border: 1px solid rgba(64,196,255,.12);
        border-radius: 14px;
        padding: 18px;
      }

      .ma-tag {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .6px;
        text-transform: uppercase;
      }

      .ma-glass {
        background: rgba(15,32,64,.7);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(64,196,255,.15);
        border-radius: 16px;
      }
    `;
    document.head.appendChild(s);
  }, []);
}

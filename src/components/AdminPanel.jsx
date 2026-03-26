import { useState, useRef, useEffect } from 'react';
import { useCSS } from '../hooks/useCSS';
import { uid, AC_COLOR, T1_COLOR, T2_COLOR, BG_MID, BG_CARD, DIFF_COL, Q_TIME, DEFAULT_Q } from '../constants/gameData';

const CATS  = ['Arithmetic','Algebra','Geometry','Calculus','Logarithms','Trigonometry','Number Theory','Combinatorics','Statistics'];
const EMPTY = { type:'mcq', q:'', opts:['','','',''], ans:'', diff:'easy', cat:'Arithmetic', timer: Q_TIME };
const LS_KEY = 'mathArena_questions';

/* ── Local storage helpers ── */
function loadSavedQuestions() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

function saveQuestions(qs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(qs)); } catch {}
}

/* ── CSV / Excel parser ── */
function normalise(v = '') { return v.toString().trim(); }

function rowToQuestion(row) {
  const type = normalise(row.type||row.Type||'mcq').toLowerCase().startsWith('s') ? 'sub' : 'mcq';
  const q    = normalise(row.question||row.Question||row.q||'');
  const ans  = normalise(row.answer||row.Answer||row.ans||'');
  const diff = normalise(row.difficulty||row.Difficulty||row.diff||'easy').toLowerCase();
  const cat  = normalise(row.category||row.Category||row.cat||'Arithmetic');
  const timer= parseInt(row.timer||row.Timer||Q_TIME) || Q_TIME;
  if (!q || !ans) return null;
  const opts = type==='mcq' ? [
    normalise(row.opt1||row.Opt1||row.option1||''),
    normalise(row.opt2||row.Opt2||row.option2||''),
    normalise(row.opt3||row.Opt3||row.option3||''),
    normalise(row.opt4||row.Opt4||row.option4||''),
  ].filter(Boolean) : [];
  if (type==='mcq' && opts.length < 2) return null;
  return { id:uid(), type, q, ans, opts:type==='mcq'?opts:[], diff:['easy','medium','hard'].includes(diff)?diff:'easy', cat:CATS.includes(cat)?cat:'Arithmetic', timer };
}

async function parseCSV(text) {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,'').replace(/\r/g,''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g,'').replace(/\r/g,''));
    const row = {}; headers.forEach((h,i) => { row[h] = vals[i]||''; }); return row;
  });
}

async function parseExcel(buffer) {
  // Load SheetJS from CDN if not already loaded
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load xlsx library'));
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;
  const wb   = XLSX.read(buffer, { type: 'array' });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

const lbl = (txt) => (
  <div style={{ fontSize:11, color:'#7a9cc6', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>{txt}</div>
);

export default function AdminPanel({ questions, setQuestions, onStart, onBack }) {
  useCSS();
  const [form,      setForm]      = useState({ ...EMPTY });
  const [editId,    setEditId]    = useState(null);
  const [filter,    setFilter]    = useState('all');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [saveMsg,   setSaveMsg]   = useState(null);
  const fileRef = useRef(null);

  // Load from localStorage on first mount
  useEffect(() => {
    const saved = loadSavedQuestions();
    if (saved && saved.length > 0) {
      setQuestions(saved);
    }
  }, []); // eslint-disable-line

  // Auto-save whenever questions change
  useEffect(() => {
    if (questions.length > 0) {
      saveQuestions(questions);
    }
  }, [questions]);

  const inputStyle = { background:BG_CARD, border:'1.5px solid rgba(64,196,255,.18)', color:'#fff', padding:'9px 12px', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none', width:'100%' };
  const selStyle   = { ...inputStyle, cursor:'pointer' };

  const save = () => {
    if (!form.q.trim() || !form.ans.trim()) return alert('Fill in question and answer');
    if (form.type==='mcq' && form.opts.some(o => !o.trim())) return alert('Fill all 4 options');
    if (form.type==='mcq' && !form.opts.includes(form.ans)) return alert('Correct answer must match one of the options');
    if (editId) {
      setQuestions(q => q.map(x => x.id===editId ? { ...form, id:editId } : x));
      setEditId(null);
    } else {
      setQuestions(q => [...q, { ...form, id:uid() }]);
    }
    setForm({ ...EMPTY });
    showSaveMsg('✅ Question saved to local storage');
  };

  const edit   = (q) => { setForm({ ...q }); setEditId(q.id); window.scrollTo(0,0); };
  const del    = (id) => { setQuestions(q => q.filter(x => x.id !== id)); showSaveMsg('🗑 Deleted'); };
  const cancel = () => { setEditId(null); setForm({ ...EMPTY }); };

  const showSaveMsg = (text) => {
    setSaveMsg(text);
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const handleResetToDefaults = () => {
    if (!confirm('Reset to default questions? Your custom questions will be lost.')) return;
    setQuestions(DEFAULT_Q);
    localStorage.removeItem(LS_KEY);
    showSaveMsg('✅ Reset to defaults');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    setImportMsg(null);
    try {
      let rows = [];
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext==='csv'||ext==='txt') rows = await parseCSV(await file.text());
      else if (ext==='xlsx'||ext==='xls') rows = await parseExcel(await file.arrayBuffer());
      else throw new Error('Unsupported file type. Use .csv or .xlsx');
      const imported = rows.map(rowToQuestion).filter(Boolean);
      if (imported.length===0) throw new Error('No valid questions found. Check column headers.');
      setQuestions(prev => [...prev, ...imported]);
      setImportMsg({ ok:true, text:`✅ Imported ${imported.length} question${imported.length!==1?'s':''} from ${file.name}` });
      showSaveMsg(`✅ ${imported.length} questions imported & saved`);
    } catch(err) {
      setImportMsg({ ok:false, text:`❌ ${err.message}` });
    } finally {
      setImporting(false);
    }
  };

  const filtered = filter==='all' ? questions : questions.filter(q => q.diff===filter);

  return (
    <div className="ma" style={{ overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${BG_MID},${BG_CARD})`, borderBottom:'1px solid rgba(64,196,255,.15)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="ma-btn" onClick={onBack} style={{ background:'rgba(255,255,255,.07)', color:'#7a9cc6', border:'1px solid rgba(255,255,255,.12)', padding:'8px 14px', fontSize:13 }}>← Back</button>
          <div style={{ fontSize:26 }}>🧮</div>
          <div>
            <div style={{ fontWeight:900, fontSize:20, letterSpacing:1, background:`linear-gradient(90deg,${AC_COLOR},#a78bfa)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>MATH ARENA</div>
            <div style={{ fontSize:10, color:'#7a9cc6', letterSpacing:2, fontWeight:600 }}>ADMIN — QUESTION BANK</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize:12, color:'#7a9cc6' }}>{questions.length} questions</div>
          {saveMsg && <div style={{ fontSize:12, color:T1_COLOR, fontWeight:700 }}>{saveMsg}</div>}
          <button className="ma-btn" onClick={handleResetToDefaults} style={{ background:'rgba(255,23,68,.1)', color:T2_COLOR, border:`1px solid ${T2_COLOR}33`, padding:'8px 14px', fontSize:12 }}>↺ Reset</button>
          <button className="ma-btn" onClick={onStart} style={{ background:`linear-gradient(135deg,${T1_COLOR},#00b44a)`, color:'#050d1a', padding:'9px 20px', fontSize:13, fontWeight:800 }}>▶ Use These Questions</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', gap:20, minHeight:0 }}>
        {/* LEFT: form */}
        <div style={{ width:340, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>

          {/* Storage status */}
          <div style={{ background:BG_MID, border:'1px solid rgba(0,230,118,.2)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:18 }}>💾</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:T1_COLOR }}>Auto-Save Active</div>
              <div style={{ fontSize:11, color:'#7a9cc6' }}>Questions saved locally — persist across sessions</div>
            </div>
          </div>

          {/* Import */}
          <div style={{ background:BG_MID, border:'1px solid rgba(64,196,255,.15)', borderRadius:14, padding:16 }}>
            <div style={{ fontWeight:800, fontSize:13, color:AC_COLOR, marginBottom:10 }}>📂 Import from File</div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" style={{ display:'none' }} onChange={handleImport}/>
            <button className="ma-btn" onClick={() => fileRef.current.click()} disabled={importing}
              style={{ background:'rgba(64,196,255,.12)', color:AC_COLOR, border:`1px solid ${AC_COLOR}44`, padding:'9px', fontSize:13, marginBottom:8, width:'100%' }}>
              {importing ? '⏳ Importing…' : '📂 Choose CSV or Excel File'}
            </button>
            {importMsg && (
              <div style={{ fontSize:12, padding:'7px 10px', borderRadius:7, background:importMsg.ok?'rgba(0,230,118,.1)':'rgba(255,23,68,.1)', color:importMsg.ok?T1_COLOR:T2_COLOR, border:`1px solid ${importMsg.ok?T1_COLOR:T2_COLOR}33` }}>
                {importMsg.text}
              </div>
            )}
            <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(0,0,0,.25)', borderRadius:8, border:'1px solid rgba(64,196,255,.1)' }}>
              <div style={{ fontSize:10, color:AC_COLOR, fontWeight:700, marginBottom:4 }}>CSV/Excel column headers:</div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'#7a9cc6', lineHeight:1.8 }}>
                type, question, opt1, opt2, opt3, opt4,<br/>
                answer, difficulty, category, timer<br/>
                <span style={{ color:'#40c4ff88' }}>type: "mcq" or "sub"</span>
              </div>
            </div>
          </div>

          {/* Manual form */}
          <div style={{ background:BG_MID, border:`1px solid ${editId?AC_COLOR+'44':'rgba(64,196,255,.12)'}`, borderRadius:14, padding:18 }}>
            <div style={{ fontWeight:800, fontSize:14, color:editId?AC_COLOR:'#fff', marginBottom:14 }}>
              {editId ? '✏️ Edit Question' : '➕ Add Manually'}
            </div>

            <div style={{ marginBottom:12 }}>
              {lbl('Type')}
              <div style={{ display:'flex', gap:6 }}>
                {['mcq','sub'].map(t => (
                  <button key={t} className="ma-btn" onClick={() => setForm(f => ({ ...f, type:t }))}
                    style={{ flex:1, padding:'7px', fontSize:12, background:form.type===t?'rgba(64,196,255,.15)':BG_CARD, color:form.type===t?AC_COLOR:'#7a9cc6', border:`1.5px solid ${form.type===t?AC_COLOR+'55':'rgba(255,255,255,.08)'}` }}>
                    {t==='mcq'?'🔘 Multiple Choice':'🔢 Subjective'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:10 }}>
              {lbl('Question')}
              <textarea value={form.q} onChange={e => setForm(f => ({ ...f, q:e.target.value }))} rows={2} style={{ ...inputStyle, resize:'none', lineHeight:1.5 }} placeholder="Type your question…"/>
            </div>

            {form.type==='mcq' && (
              <div style={{ marginBottom:10 }}>
                {lbl('Options')}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {['A','B','C','D'].map((lb2,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:form.opts[i]===form.ans?T1_COLOR:'#7a9cc6', width:14 }}>{lb2}</span>
                      <input value={form.opts[i]} onChange={e => setForm(f => { const o=[...f.opts]; o[i]=e.target.value; return {...f,opts:o}; })} style={{ ...inputStyle, flex:1 }} placeholder={`Option ${lb2}`}/>
                      {form.opts[i] && (
                        <button onClick={() => setForm(f => ({ ...f, ans:f.opts[i] }))} style={{ background:form.opts[i]===form.ans?'rgba(0,230,118,.2)':'rgba(255,255,255,.07)', border:`1px solid ${form.opts[i]===form.ans?T1_COLOR+'44':'rgba(255,255,255,.12)'}`, color:form.opts[i]===form.ans?T1_COLOR:'#7a9cc6', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>
                          {form.opts[i]===form.ans?'✓':'○'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {form.ans && <div style={{ fontSize:11, color:T1_COLOR, marginTop:5 }}>✓ Correct: <strong>{form.ans}</strong></div>}
              </div>
            )}

            {form.type==='sub' && (
              <div style={{ marginBottom:10 }}>
                {lbl('Correct Answer')}
                <input value={form.ans} onChange={e => setForm(f => ({ ...f, ans:e.target.value }))} style={inputStyle} placeholder="Exact answer"/>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div>
                {lbl('Difficulty')}
                <select value={form.diff} onChange={e => setForm(f => ({ ...f, diff:e.target.value }))} style={selStyle}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>
              <div>
                {lbl('Category')}
                <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat:e.target.value }))} style={selStyle}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              {lbl('Time Limit')}
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                {[10,15,20,25,30,45,60].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, timer:t }))} style={{ padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', background:form.timer===t?'rgba(64,196,255,.2)':BG_CARD, color:form.timer===t?AC_COLOR:'#7a9cc6', border:`1px solid ${form.timer===t?AC_COLOR+'55':'rgba(255,255,255,.08)'}` }}>{t}s</button>
                ))}
                <input type="number" min={5} max={300} value={form.timer} onChange={e => setForm(f => ({ ...f, timer:Math.max(5,Math.min(300,parseInt(e.target.value)||Q_TIME)) }))} style={{ ...inputStyle, width:60, textAlign:'center', fontFamily:'JetBrains Mono', fontWeight:700, color:AC_COLOR, fontSize:16 }}/>
              </div>
              <input type="range" min={5} max={120} value={form.timer} onChange={e => setForm(f => ({ ...f, timer:parseInt(e.target.value) }))} style={{ width:'100%', accentColor:AC_COLOR }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#7a9cc6', marginTop:2 }}>
                <span>5s</span><span style={{ color:AC_COLOR, fontWeight:700 }}>{form.timer}s</span><span>120s</span>
              </div>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              {editId && <button className="ma-btn" onClick={cancel} style={{ flex:1, background:'rgba(255,255,255,.06)', color:'#7a9cc6', border:'1px solid rgba(255,255,255,.12)', padding:'9px', fontSize:13 }}>Cancel</button>}
              <button className="ma-btn" onClick={save} style={{ flex:2, background:`linear-gradient(135deg,${T1_COLOR},#00b44a)`, color:'#050d1a', padding:'10px', fontSize:14, fontWeight:800 }}>
                {editId ? '💾 Save Changes' : '➕ Add Question'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: list */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {['all','easy','medium','hard'].map(f => (
              <button key={f} className="ma-btn" onClick={() => setFilter(f)} style={{ padding:'5px 14px', fontSize:12, background:filter===f?`${DIFF_COL[f]||AC_COLOR}20`:'rgba(255,255,255,.05)', color:filter===f?(DIFF_COL[f]||AC_COLOR):'#7a9cc6', border:`1px solid ${filter===f?(DIFF_COL[f]||AC_COLOR)+'44':'rgba(255,255,255,.08)'}`, fontWeight:700 }}>
                {f.charAt(0).toUpperCase()+f.slice(1)} ({f==='all'?questions.length:questions.filter(q=>q.diff===f).length})
              </button>
            ))}
          </div>

          {filtered.length===0 && <div style={{ textAlign:'center', color:'#7a9cc6', padding:40, fontSize:14 }}>No questions. Add manually or import a CSV/Excel file.</div>}

          {filtered.map((q,i) => {
            const dc = DIFF_COL[q.diff];
            return (
              <div key={q.id} style={{ background:BG_MID, border:`1px solid ${q.id===editId?AC_COLOR+'55':'rgba(255,255,255,.07)'}`, borderRadius:12, padding:'12px 16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'#7a9cc6', minWidth:22, paddingTop:2 }}>#{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:5 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:`${dc}18`, color:dc, border:`1px solid ${dc}33` }}>{q.diff}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:'rgba(64,196,255,.1)', color:AC_COLOR, border:'1px solid rgba(64,196,255,.2)' }}>{q.cat}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:'rgba(180,100,255,.1)', color:'#c084fc', border:'1px solid rgba(180,100,255,.2)' }}>{q.type==='mcq'?'MCQ':'SUBJ'}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background:'rgba(64,196,255,.1)', color:AC_COLOR, border:'1px solid rgba(64,196,255,.2)' }}>⏱ {q.timer||Q_TIME}s</span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#f0f4ff', marginBottom:4, lineHeight:1.4 }}>{q.q}</div>
                    <div style={{ fontSize:12, color:T1_COLOR }}>✓ {q.ans}{q.type==='mcq'&&<span style={{ color:'#7a9cc6', marginLeft:8 }}>{q.opts.filter(Boolean).join(' · ')}</span>}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="ma-btn" onClick={() => edit(q)} style={{ padding:'5px 12px', fontSize:12, background:'rgba(64,196,255,.1)', color:AC_COLOR, border:`1px solid ${AC_COLOR}33` }}>✏️</button>
                    <button className="ma-btn" onClick={() => del(q.id)} style={{ padding:'5px 12px', fontSize:12, background:'rgba(255,23,68,.1)', color:T2_COLOR, border:`1px solid ${T2_COLOR}33` }}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
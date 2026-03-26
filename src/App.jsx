import { useState } from 'react';
import { useCSS } from './hooks/useCSS';
import { useSocketGame } from './hooks/useSocketGame';
import { DEFAULT_Q, shuffle } from './constants/gameData';

import IntroScreen  from './components/IntroScreen';
import AdminPanel   from './components/AdminPanel';
import SetupScreen  from './components/SetupScreen';
import QRLobby      from './components/QRLobby';
import GameScreen   from './components/GameScreen';
import ResultScreen from './components/ResultScreen';

export default function App() {
  useCSS();

  // Socket lives here — never unmounts, never disconnects on screen change
  const socketGame = useSocketGame();

  const [screen,     setScreen]     = useState('intro');
  const [questions,  setQuestions]  = useState(DEFAULT_Q);
  const [gameConfig, setGameConfig] = useState(null);
  const [result,     setResult]     = useState(null);
  // Unique key incremented each new game so GameScreen fully resets
  const [gameKey,    setGameKey]    = useState(0);

  const getGameQ = (count) => shuffle(questions).slice(0, count);

  const handleBegin = (cfg) => {
    setGameConfig(cfg);
    setScreen(cfg.mode === 'qr' ? 'qrlobby' : 'game');
  };

  const handleQRStart = () => {
    const code = socketGame.getSessionCode();
    setGameConfig(prev => ({ ...prev, sessionCode: code }));
    setScreen('game');
  };

  const handleGameEnd = (res) => {
    setResult(res);
    setScreen('result');
  };

  // Play Again: increment key so GameScreen fully resets, keep same session alive
  const handlePlayAgain = () => {
    setGameKey(k => k + 1);
    setScreen('game');
  };

  // Home: end session if networked, then go home
  const handleHome = () => {
    if (gameConfig?.mode === 'qr' && socketGame.sessionCode) {
      socketGame.endSession(socketGame.sessionCode);
    }
    setScreen('intro');
  };

  /* ── Screens ── */
  if (screen === 'intro') return (
    <IntroScreen onQuickPlay={() => setScreen('setup')} onCustomContest={() => setScreen('admin')}/>
  );

  if (screen === 'admin') return (
    <AdminPanel questions={questions} setQuestions={setQuestions} onStart={() => setScreen('setup')} onBack={() => setScreen('intro')}/>
  );

  if (screen === 'setup') return (
    <SetupScreen questions={questions} onBack={() => setScreen('intro')} onBegin={handleBegin}/>
  );

  if (screen === 'qrlobby') return (
    <QRLobby
      teams={{ t1: gameConfig.t1, t2: gameConfig.t2 }}
      socketGame={socketGame}
      onStartGame={handleQRStart}
      onBack={() => setScreen('setup')}
    />
  );

  if (screen === 'game') return (
    <GameScreen
      key={gameKey}
      teams={{ t1: gameConfig.t1, t2: gameConfig.t2 }}
      questions={getGameQ(gameConfig.qCount)}
      allQuestions={questions}  // full bank for in-game admin "add questions"
      onEnd={handleGameEnd}
      onBack={() => setScreen('setup')}
      socketGame={gameConfig?.mode === 'qr' ? socketGame : null}
      session={gameConfig?.mode === 'qr' ? gameConfig.sessionCode : null}
    />
  );

  if (screen === 'result') return (
    <ResultScreen
      result={result}
      teams={{ t1: gameConfig.t1, t2: gameConfig.t2 }}
      onPlayAgain={handlePlayAgain}
      onHome={handleHome}
    />
  );

  return null;
}
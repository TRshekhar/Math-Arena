import { useEffect, useRef, useCallback, useState } from 'react';

const SERVER_URL = 'http://localhost:3002';

let ioClient = null;
async function getIO() {
  if (!ioClient) {
    const mod = await import('socket.io-client');
    ioClient = mod.default || mod.io;
  }
  return ioClient;
}

export function useSocketGame() {
  const socketRef      = useRef(null);
  const sessionCodeRef = useRef(null);
  const listenersRef   = useRef({});

  const [connected,    setConnected]    = useState(false);
  const [sessionCode,  setSessionCode]  = useState(null);
  const [serverIP,     setServerIP]     = useState(null);
  const [playerCount,  setPlayerCount]  = useState({ t1: 0, t2: 0 });
  const [teamsJoined,  setTeamsJoined]  = useState({ t1: false, t2: false });
  // Full player list with names and stats
  const [players,      setPlayers]      = useState({ t1: [], t2: [] });

  const createSession = useCallback(async (teamNames) => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    sessionCodeRef.current = null;
    setSessionCode(null);
    setTeamsJoined({ t1: false, t2: false });
    setPlayerCount({ t1: 0, t2: 0 });
    setPlayers({ t1: [], t2: [] });

    const io     = await getIO();
    const socket = io(SERVER_URL, { transports: ['websocket'], reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 1000 });
    socketRef.current = socket;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Cannot reach game server.\n\nRun:  npm run dev`));
      }, 8000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        setConnected(true);
        console.log('[socket] Host connected:', socket.id);
        socket.emit('create-session', { teamNames }, (res) => {
          if (res?.code) {
            sessionCodeRef.current = res.code;
            setSessionCode(res.code);
            setServerIP(res.ip);
            resolve({ code: res.code, ip: res.ip, port: res.port || 3001 });
          } else {
            reject(new Error('Server failed to create session'));
          }
        });
      });

      socket.on('reconnect', () => {
        setConnected(true);
        if (sessionCodeRef.current)
          socket.emit('register-host', { session: sessionCodeRef.current });
      });

      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', () => {
        if (!sessionCodeRef.current) {
          clearTimeout(timeout);
          reject(new Error(`Cannot reach game server.\n\nRun:  npm run dev`));
        }
      });

      // Player join
      socket.on('team-joined', ({ team, playerCount: pc, players: pl }) => {
        setPlayerCount(pc);
        setTeamsJoined({ t1: pc.t1 > 0, t2: pc.t2 > 0 });
        if (pl) setPlayers(pl);
      });

      // Player leave
      socket.on('team-player-left', ({ playerCount: pc, players: pl }) => {
        setPlayerCount(pc);
        setTeamsJoined({ t1: pc.t1 > 0, t2: pc.t2 > 0 });
        if (pl) setPlayers(pl);
      });

      // Player removed by admin
      socket.on('player-removed-ack', ({ playerCount: pc, players: pl }) => {
        setPlayerCount(pc);
        setTeamsJoined({ t1: pc.t1 > 0, t2: pc.t2 > 0 });
        if (pl) setPlayers(pl);
        listenersRef.current.onPlayerRemoved?.();
      });

      // Stats updated
      socket.on('players-updated', ({ players: pl }) => {
        if (pl) setPlayers(pl);
      });

      socket.on('player-answer', ({ team, answer, socketId, playerName }) => {
        listenersRef.current.onPlayerAnswer?.({ team, answer, socketId, playerName });
      });
    });
  }, []);

  const getSessionCode = useCallback(() => sessionCodeRef.current, []);

  const emit = useCallback((event, payload) => {
    const code = payload?.session || sessionCodeRef.current;
    if (!code)                         { console.warn(`[socket] ${event}: no session`); return; }
    if (!socketRef.current?.connected) { console.warn(`[socket] ${event}: not connected`); return; }
    socketRef.current.emit(event, { ...payload, session: code });
  }, []);

  // ── Question / game events ────────────────────────────────────────────
  const sendQuestion       = useCallback((session, question, timeLeft = 25) => { console.log('[socket] sendQ →', question?.q); emit('send-question',   { session, question, timeLeft }); }, [emit]);
  const sendState          = useCallback((session, p)            => emit('update-state',    { session, ...p }),                             [emit]);
  const sendAnswerFeedback = useCallback((session, team, correct) => emit('answer-feedback', { session, team, correct }),                   [emit]);
  const sendQuestionOver   = useCallback((session, ct, ca)       => emit('question-over',   { session, correctTeam: ct, correctAnswer: ca }),[emit]);
  const sendGameEnd        = useCallback((session, w, wn)        => emit('end-game',         { session, winner: w, winnerName: wn }),        [emit]);
  const sendGameQuit       = useCallback((session)               => emit('game-quit',        { session }),                                  [emit]);
  const sendBetween        = useCallback((session, countdown)    => emit('between-countdown',{ session, countdown }),                       [emit]);
  const adjustTimer        = useCallback((session, newTime)      => emit('adjust-timer',     { session, newTime }),                         [emit]);
  const sendPause          = useCallback((session)               => emit('game-pause',       { session }),                                  [emit]);
  const sendResume         = useCallback((session)               => emit('game-resume',      { session }),                                  [emit]);
  const sendSkip           = useCallback((session)               => emit('question-skip',    { session }),                                  [emit]);

  // ── Admin control events ──────────────────────────────────────────────
  const endSession = useCallback((session) => emit('end-session', { session }), [emit]);

  const setLimits = useCallback((session, maxPerTeam, minPerTeam) => {
    return new Promise((resolve) => {
      const code = session || sessionCodeRef.current;
      if (!code || !socketRef.current?.connected) return resolve({ ok: false });
      socketRef.current.emit('admin-set-limits', { session: code, maxPerTeam, minPerTeam }, resolve);
    });
  }, []);

  const removePlayer = useCallback((session, playerId) => {
    return new Promise((resolve) => {
      const code = session || sessionCodeRef.current;
      if (!code || !socketRef.current?.connected) return resolve({ ok: false });
      socketRef.current.emit('remove-player', { session: code, playerId }, resolve);
    });
  }, []);

  const updatePlayerStat = useCallback((session, socketId, correct) => {
    emit('update-player-stat', { session, socketId, correct });
  }, [emit]);

  const onPlayerAnswer   = useCallback((handler) => { listenersRef.current.onPlayerAnswer   = handler; }, []);
  const onPlayerRemoved  = useCallback((handler) => { listenersRef.current.onPlayerRemoved  = handler; }, []);

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  return {
    connected, sessionCode, getSessionCode, serverIP,
    teamsJoined, playerCount, players,
    createSession,
    sendQuestion, sendState, sendAnswerFeedback, sendQuestionOver,
    sendGameEnd, sendGameQuit, sendBetween, adjustTimer,
    sendPause, sendResume, sendSkip,
    endSession, setLimits, removePlayer, updatePlayerStat,
    onPlayerAnswer, onPlayerRemoved,
  };
}
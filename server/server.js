const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const os         = require('os');
const path       = require('path');
const dotenv     = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3002;

function getLocalIP() {
  for (const nets of Object.values(os.networkInterfaces()))
    for (const n of nets)
      if (n.family === 'IPv4' && !n.internal) return n.address;
  return '127.0.0.1';
}

// Sessions persist until admin explicitly calls end-session
const sessions = {};
const makeCode  = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// Helper: build player list snapshot for host
function playerSnapshot(sess) {
  return {
    t1: [...sess.playerMap.values()].filter(p => p.team === 't1').map(p => ({
      id: p.socketId, name: p.name, team: 't1',
      correct: p.correct, wrong: p.wrong,
    })),
    t2: [...sess.playerMap.values()].filter(p => p.team === 't2').map(p => ({
      id: p.socketId, name: p.name, team: 't2',
      correct: p.correct, wrong: p.wrong,
    })),
  };
}

function startServer() {
  const app    = express();
  const server = http.createServer(app);
  const io     = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/mobile', (_, res) => res.sendFile(path.join(__dirname, 'public', 'mobile.html')));
  app.get('/health', (_, res) => res.json({ ok: true, sessions: Object.keys(sessions) }));

  io.on('connection', (socket) => {
    console.log(`[+] ${socket.id}`);

    // ── HOST: create session ───────────────────────────────────────────
    socket.on('create-session', ({ teamNames }, cb) => {
      const code = makeCode();
      sessions[code] = {
        code,
        hostSocketIds:   new Set([socket.id]),
        teamNames:       teamNames || { t1: 'Team Alpha', t2: 'Team Beta' },
        currentQuestion: null,
        gamePhase:       'lobby',
        scores:          { t1: 0, t2: 0 },
        paused:          false,
        teamAnswered:    { t1: false, t2: false },
        // Player registry: socketId → { socketId, name, team, correct, wrong, connected }
        playerMap:       new Map(),
        // Admin settings
        maxPerTeam:      null,   // null = unlimited
        minPerTeam:      1,
        extraQuestions:  0,      // bonus questions added during game
      };
      socket.join(`session:${code}`);
      socket.join(`host:${code}`);
      socket.data = { role: 'host', session: code };
      console.log(`[Session] Created: ${code}`);
      cb({ code, ip: getLocalIP(), port: PORT });
    });

    socket.on('register-host', ({ session }, cb) => {
      const sess = sessions[session];
      if (!sess) return cb?.({ ok: false });
      sess.hostSocketIds.add(socket.id);
      socket.join(`session:${session}`);
      socket.join(`host:${session}`);
      socket.data = { role: 'host', session };
      cb?.({ ok: true });
    });

    // ── MOBILE: join team ──────────────────────────────────────────────
    socket.on('join-team', ({ session, team, playerName }, cb) => {
      const sess = sessions[session];
      if (!sess) return cb({ ok: false, error: 'Session not found' });

      const key = `t${team}`;

      // Check max cap
      const currentCount = [...sess.playerMap.values()].filter(p => p.team === key && p.connected).length;
      if (sess.maxPerTeam && currentCount >= sess.maxPerTeam) {
        return cb({ ok: false, error: `${sess.teamNames[key]} is full (max ${sess.maxPerTeam})` });
      }

      const name = (playerName || '').trim() || `Player ${sess.playerMap.size + 1}`;

      sess.playerMap.set(socket.id, {
        socketId: socket.id, name, team: key,
        correct: 0, wrong: 0, connected: true,
      });

      socket.join(`session:${session}`);
      socket.join(`player:${session}:${key}`);
      socket.data = { role: 'player', session, team: key, name };

      const counts = {
        t1: [...sess.playerMap.values()].filter(p => p.team === 't1' && p.connected).length,
        t2: [...sess.playerMap.values()].filter(p => p.team === 't2' && p.connected).length,
      };

      console.log(`[Join] "${name}" → ${key} in ${session}`);

      io.to(`host:${session}`).emit('team-joined', {
        team: key, socketId: socket.id, name,
        playerCount: counts,
        players: playerSnapshot(sess),
      });

      if (sess.currentQuestion) {
        socket.emit('new-question', {
          question: sess.currentQuestion, timeLeft: 25,
          scores: sess.scores, paused: sess.paused,
        });
      }

      cb({
        ok: true,
        teamName:    sess.teamNames[key],
        otherTeam:   sess.teamNames[key === 't1' ? 't2' : 't1'],
        playerCount: counts[key],
        playerName:  name,
      });
    });

    socket.on('get-current-question', ({ session }) => {
      const sess = sessions[session];
      if (sess?.currentQuestion)
        socket.emit('new-question', { question: sess.currentQuestion, timeLeft: 25, scores: sess.scores, paused: sess.paused });
    });

    // ── HOST: send question ────────────────────────────────────────────
    socket.on('send-question', ({ session, question, timeLeft }) => {
      const sess = sessions[session];
      if (!sess) return;
      sess.currentQuestion = question;
      sess.gamePhase = 'playing';
      sess.paused = false;
      sess.teamAnswered = { t1: false, t2: false };
      const room = `session:${session}`;
      console.log(`[Q] "${question?.q}" → ${io.sockets.adapter.rooms.get(room)?.size ?? 0} sockets`);
      socket.to(room).emit('new-question', { question, timeLeft: timeLeft ?? 25, scores: sess.scores, paused: false });
    });

    // ── HOST: pause / resume ───────────────────────────────────────────
    socket.on('game-pause',  ({ session }) => {
      const sess = sessions[session];
      if (!sess) return;
      sess.paused = true; sess.gamePhase = 'paused';
      socket.to(`session:${session}`).emit('game-paused');
    });
    socket.on('game-resume', ({ session }) => {
      const sess = sessions[session];
      if (!sess) return;
      sess.paused = false; sess.gamePhase = 'playing';
      socket.to(`session:${session}`).emit('game-resumed');
    });

    socket.on('question-skip',    ({ session }) => { socket.to(`session:${session}`).emit('question-skipped'); });
    socket.on('between-countdown',({ session, countdown }) => { socket.to(`session:${session}`).emit('between-countdown', { countdown }); });
    socket.on('adjust-timer',     ({ session, newTime }) => { socket.to(`session:${session}`).emit('timer-adjusted', { newTime }); });

    socket.on('update-state', ({ session, ropePos, scores, phase, lastWinner }) => {
      const sess = sessions[session];
      if (!sess) return;
      if (scores) sess.scores = scores;
      if (phase)  sess.gamePhase = phase;
      socket.to(`session:${session}`).emit('state-update', { ropePos, scores: sess.scores, phase, lastWinner });
    });

    socket.on('question-over', ({ session, correctTeam, correctAnswer }) => {
      socket.to(`session:${session}`).emit('question-result', { correctTeam, correctAnswer });
    });

    // ── HOST: end game (keep session alive for next round) ─────────────
    socket.on('end-game', ({ session, winner, winnerName }) => {
      const sess = sessions[session];
      if (!sess) return;
      socket.to(`session:${session}`).emit('game-over', { winner, winnerName });
      // DO NOT delete session — admin must call end-session explicitly
      sess.gamePhase = 'ended';
      console.log(`[Game] Ended in session ${session}, session kept alive`);
    });

    // ── HOST: quit game (session stays) ───────────────────────────────
    socket.on('game-quit', ({ session }) => {
      const sess = sessions[session];
      if (!sess) return;
      socket.to(`session:${session}`).emit('game-quit');
      sess.gamePhase = 'lobby';
      console.log(`[Game] Quit in session ${session}, session kept alive`);
    });

    // ── HOST: explicitly end session ───────────────────────────────────
    socket.on('end-session', ({ session }) => {
      socket.to(`session:${session}`).emit('session-ended');
      delete sessions[session];
      console.log(`[Session] Permanently ended: ${session}`);
    });

    // ── HOST: admin settings ───────────────────────────────────────────
    socket.on('admin-set-limits', ({ session, maxPerTeam, minPerTeam }, cb) => {
      const sess = sessions[session];
      if (!sess) return cb?.({ ok: false });
      sess.maxPerTeam = maxPerTeam ?? null;
      sess.minPerTeam = minPerTeam ?? 1;
      console.log(`[Admin] Limits set: max=${maxPerTeam} min=${minPerTeam} in ${session}`);
      cb?.({ ok: true });
    });

    // ── HOST: remove a player ──────────────────────────────────────────
    socket.on('remove-player', ({ session, playerId }, cb) => {
      const sess = sessions[session];
      if (!sess) return cb?.({ ok: false });

      const player = sess.playerMap.get(playerId);
      if (!player) return cb?.({ ok: false, error: 'Player not found' });

      // Tell the player they've been removed
      io.to(playerId).emit('player-removed', { reason: 'Removed by host' });
      // Kick from rooms
      const sock = io.sockets.sockets.get(playerId);
      if (sock) {
        sock.leave(`session:${session}`);
        sock.leave(`player:${session}:${player.team}`);
      }
      sess.playerMap.delete(playerId);

      const counts = {
        t1: [...sess.playerMap.values()].filter(p => p.team === 't1' && p.connected).length,
        t2: [...sess.playerMap.values()].filter(p => p.team === 't2' && p.connected).length,
      };

      // Notify host of updated list
      io.to(`host:${session}`).emit('player-removed-ack', {
        playerId, playerCount: counts, players: playerSnapshot(sess),
      });

      console.log(`[Admin] Removed player ${playerId} (${player.name}) from ${session}`);
      cb?.({ ok: true });
    });

    // ── HOST: update player stats (called after answer evaluated) ─────
    socket.on('update-player-stat', ({ session, socketId, correct }) => {
      const sess = sessions[session];
      if (!sess) return;
      const player = sess.playerMap.get(socketId);
      if (!player) return;
      if (correct) player.correct++;
      else         player.wrong++;
      io.to(`host:${session}`).emit('players-updated', { players: playerSnapshot(sess) });
    });

    // ── MOBILE: submit answer ──────────────────────────────────────────
    socket.on('submit-answer', ({ session, team, answer }) => {
      const sess = sessions[session];
      if (!sess) return;

      if (sess.teamAnswered[team]) {
        socket.emit('answer-feedback', { correct: false, locked: true });
        return;
      }
      sess.teamAnswered[team] = true;

      console.log(`[Answer] ${team} (${socket.id}): "${answer}" in ${session}`);
      io.to(`host:${session}`).emit('player-answer', {
        team, answer, socketId: socket.id,
        playerName: sess.playerMap.get(socket.id)?.name || '?',
      });
    });

    socket.on('answer-feedback', ({ session, team, correct }) => {
      io.to(`player:${session}:${team}`).emit('answer-feedback', { correct });
    });

    // ── Disconnect ─────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { role, session, team, name } = socket.data || {};
      if (role === 'player' && session && sessions[session]) {
        const player = sessions[session].playerMap.get(socket.id);
        if (player) player.connected = false;

        const counts = {
          t1: [...sessions[session].playerMap.values()].filter(p => p.team === 't1' && p.connected).length,
          t2: [...sessions[session].playerMap.values()].filter(p => p.team === 't2' && p.connected).length,
        };
        io.to(`host:${session}`).emit('team-player-left', {
          team, socketId: socket.id, name,
          playerCount: counts,
          players: playerSnapshot(sessions[session]),
        });
      }
      console.log(`[-] ${socket.id} (${role || '?'} ${name || ''})`);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║       Math Arena — Game Server       ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  Local:   http://localhost:${PORT}      ║`);
    console.log(`║  Network: http://${ip}:${PORT}   ║`);
    console.log('╚══════════════════════════════════════╝\n');
  });

  return { server, io };
}

if (require.main === module) startServer();
module.exports = { startServer, PORT, getLocalIP };
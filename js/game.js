/**
 * ROOT DUEL - Game Engine & State Machine
 * Coordinates players, question cycling, timing, scoring, touch controls, and TV duel dynamics.
 */

class RootDuelGame {
    constructor() {
        this.state = 'MENU'; // 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'ANSWERING' | 'REVEAL' | 'GAME_OVER'
        
        // Configuration
        this.mode = '2p'; // '1p' or '2p'
        this.category = 'roots_sq'; // 'roots_sq' | 'roots_cb' | 'powers' | 'expressions' | 'mixed'
        this.difficulty = 'normal'; // 'easy' | 'normal' | 'hard'
        this.totalRounds = 10;
        this.player2Rotated = true; // 180° inversion for Player 2 so 2 people face each other

        // Current Match State
        this.currentRound = 0;
        this.currentQuestion = null;
        this.activePlayer = null; // 1 or 2
        this.roundPoints = 50; // Decaying round points (50 down to 10)
        this.roundScoreTimer = null;
        this.answerCountdown = 0;
        this.answerTimer = null;
        this.roundStartTime = 0;
        this.reboundAvailable = true;

        // Players State
        this.players = {
            1: {
                id: 1,
                name: 'ИГРОК 1',
                score: 0,
                input: '',
                correctCount: 0,
                wrongCount: 0,
                buzzTimes: []
            },
            2: {
                id: 2,
                name: 'ИГРОК 2',
                score: 0,
                input: '',
                correctCount: 0,
                wrongCount: 0,
                buzzTimes: []
            }
        };

        // Engines
        this.ai = new AIOpponent(this);
        this.audio = window.soundEngine;
        this.questionMgr = window.questionManager;

        // Load persisted settings
        this.loadSettings();

        // UI references cache
        this.dom = {};
    }

    init() {
        this.cacheDom();
        this.bindEvents();
        this.applySettingsToUI();
        this.renderState('MENU');
    }

    cacheDom() {
        // Screens
        this.dom.screenMenu = document.getElementById('screen-menu');
        this.dom.screenGame = document.getElementById('screen-game');
        this.dom.screenCountdown = document.getElementById('screen-countdown');
        this.dom.screenGameOver = document.getElementById('screen-game-over');
        this.dom.modalSettings = document.getElementById('modal-settings');

        // Header controls
        this.dom.btnMute = document.getElementById('btn-mute');
        this.dom.btnFullscreen = document.getElementById('btn-fullscreen');
        this.dom.btnRotateP2 = document.getElementById('btn-rotate-p2');
        this.dom.btnSettings = document.getElementById('btn-open-settings');
        this.dom.btnBackMenu = document.getElementById('btn-back-menu');

        // Duel Arena elements
        this.dom.arena = document.getElementById('duel-arena');
        this.dom.p1Zone = document.getElementById('player-1-zone');
        this.dom.p2Zone = document.getElementById('player-2-zone');
        this.dom.p1Score = document.getElementById('p1-score-val');
        this.dom.p2Score = document.getElementById('p2-score-val');
        this.dom.p1Name = document.getElementById('p1-name-display');
        this.dom.p2Name = document.getElementById('p2-name-display');
        this.dom.p1Input = document.getElementById('p1-input-display');
        this.dom.p2Input = document.getElementById('p2-input-display');
        this.dom.p1BuzzBtn = document.getElementById('p1-buzz-btn');
        this.dom.p2BuzzBtn = document.getElementById('p2-buzz-btn');
        this.dom.p1Keypad = document.getElementById('p1-keypad');
        this.dom.p2Keypad = document.getElementById('p2-keypad');
        this.dom.p1Status = document.getElementById('p1-status-msg');
        this.dom.p2Status = document.getElementById('p2-status-msg');
        this.dom.p1TimerBar = document.getElementById('p1-timer-bar');
        this.dom.p2TimerBar = document.getElementById('p2-timer-bar');

        // Central TV Board
        this.dom.mathBoard = document.getElementById('math-board');
        this.dom.mathFormula = document.getElementById('math-formula');
        this.dom.roundBadge = document.getElementById('round-badge');
        this.dom.pointsTicker = document.getElementById('points-ticker');
        this.dom.boardFeedback = document.getElementById('board-feedback');
        this.dom.boardHint = document.getElementById('board-hint');

        // Countdown element
        this.dom.countdownNumber = document.getElementById('countdown-number');

        // Game Over elements
        this.dom.winnerText = document.getElementById('winner-text');
        this.dom.winnerSubtitle = document.getElementById('winner-subtitle');
        this.dom.p1FinalScore = document.getElementById('stats-p1-score');
        this.dom.p2FinalScore = document.getElementById('stats-p2-score');
        this.dom.p1FinalCorrect = document.getElementById('stats-p1-correct');
        this.dom.p2FinalCorrect = document.getElementById('stats-p2-correct');
        this.dom.p1FinalErrors = document.getElementById('stats-p1-errors');
        this.dom.p2FinalErrors = document.getElementById('stats-p2-errors');
        this.dom.p1FinalReaction = document.getElementById('stats-p1-reaction');
        this.dom.p2FinalReaction = document.getElementById('stats-p2-reaction');
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('root_duel_settings');
            if (raw) {
                const s = JSON.parse(raw);
                if (s.mode) this.mode = s.mode;
                if (s.category) this.category = s.category;
                if (s.difficulty) this.difficulty = s.difficulty;
                if (s.totalRounds) this.totalRounds = parseInt(s.totalRounds, 10);
                if (s.player2Rotated !== undefined) this.player2Rotated = s.player2Rotated;
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }

    saveSettings() {
        const s = {
            mode: this.mode,
            category: this.category,
            difficulty: this.difficulty,
            totalRounds: this.totalRounds,
            player2Rotated: this.player2Rotated
        };
        localStorage.setItem('root_duel_settings', JSON.stringify(s));
    }

    applySettingsToUI() {
        // Rotate Player 2 UI if enabled
        if (this.dom.p2Zone) {
            if (this.player2Rotated) {
                this.dom.p2Zone.classList.add('rotated-180');
                this.dom.btnRotateP2.classList.add('active');
            } else {
                this.dom.p2Zone.classList.remove('rotated-180');
                this.dom.btnRotateP2.classList.remove('active');
            }
        }

        // Audio mute icon
        this.updateAudioIcon();

        // Update menu selections
        this.updateMenuOptionHighlight('mode', this.mode);
        this.updateMenuOptionHighlight('category', this.category);
        this.updateMenuOptionHighlight('difficulty', this.difficulty);
        this.updateMenuOptionHighlight('rounds', this.totalRounds.toString());

        // Update player 2 name if 1P
        this.players[2].name = this.mode === '1p' ? `ИИ (${this.difficulty.toUpperCase()})` : 'ИГРОК 2';
        if (this.dom.p2Name) this.dom.p2Name.textContent = this.players[2].name;
    }

    updateMenuOptionHighlight(group, value) {
        document.querySelectorAll(`[data-setting="${group}"]`).forEach(btn => {
            if (btn.dataset.val === value) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    updateAudioIcon() {
        if (!this.dom.btnMute) return;
        this.dom.btnMute.innerHTML = this.audio.muted ? '🔇' : '🔊';
        this.dom.btnMute.title = this.audio.muted ? 'Включить звук' : 'Выключить звук';
    }

    bindEvents() {
        // Mode & Settings buttons in menu
        document.querySelectorAll('[data-setting]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const setting = btn.dataset.setting;
                const val = btn.dataset.val;
                this.audio.playClick();

                if (setting === 'mode') {
                    this.mode = val;
                    this.players[2].name = this.mode === '1p' ? `ИИ (${this.difficulty.toUpperCase()})` : 'ИГРОК 2';
                } else if (setting === 'category') {
                    this.category = val;
                } else if (setting === 'difficulty') {
                    this.difficulty = val;
                    if (this.mode === '1p') {
                        this.players[2].name = `ИИ (${this.difficulty.toUpperCase()})`;
                    }
                } else if (setting === 'rounds') {
                    this.totalRounds = parseInt(val, 10);
                }

                this.saveSettings();
                this.applySettingsToUI();
            });
        });

        // Start Match Button
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.audio.playClick();
            this.startNewMatch();
        });

        // Sound Mute Toggle
        this.dom.btnMute.addEventListener('click', () => {
            this.audio.toggleMute();
            this.updateAudioIcon();
            this.audio.playClick();
        });

        // Fullscreen Toggle
        this.dom.btnFullscreen.addEventListener('click', () => {
            this.audio.playClick();
            this.toggleFullscreen();
        });

        // Player 2 180-deg Flip Toggle
        this.dom.btnRotateP2.addEventListener('click', () => {
            this.player2Rotated = !this.player2Rotated;
            this.audio.playClick();
            this.saveSettings();
            this.applySettingsToUI();
        });

        // Back to Menu button during game
        this.dom.btnBackMenu.addEventListener('click', () => {
            this.audio.playClick();
            if (confirm('Вы уверены, что хотите завершить текущую дуэль и выйти в меню?')) {
                this.endMatchEarly();
            }
        });

        // Rematch & Return buttons on Game Over
        document.getElementById('btn-rematch').addEventListener('click', () => {
            this.audio.playClick();
            this.startNewMatch();
        });

        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            this.audio.playClick();
            this.renderState('MENU');
        });

        // Quick Settings Modal
        this.dom.btnSettings.addEventListener('click', () => {
            this.audio.playClick();
            this.dom.modalSettings.classList.toggle('active');
        });

        document.getElementById('btn-close-modal').addEventListener('click', () => {
            this.audio.playClick();
            this.dom.modalSettings.classList.remove('active');
        });

        // Player Buzz Buttons (Touch & Click)
        this.setupBuzzButton(this.dom.p1BuzzBtn, 1);
        this.setupBuzzButton(this.dom.p2BuzzBtn, 2);

        // Player Keypads & Inputs
        this.setupKeypad(1, this.dom.p1Zone);
        this.setupKeypad(2, this.dom.p2Zone);

        // Desktop Keyboard Controls
        window.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
    }

    setupBuzzButton(btn, playerId) {
        const handler = (e) => {
            e.preventDefault();
            if (playerId === 2 && this.mode === '1p') return; // AI controls P2 in 1P mode
            this.onPlayerBuzz(playerId);
        };

        btn.addEventListener('pointerdown', handler);
    }

    setupKeypad(playerId, keypadEl) {
        if (!keypadEl) return;

        keypadEl.querySelectorAll('[data-key]').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (playerId === 2 && this.mode === '1p') return; // Ignore user touch for AI
                if (this.state !== 'ANSWERING' || this.activePlayer !== playerId) return;

                const key = btn.dataset.key;
                if (key === 'submit') {
                    this.submitPlayerAnswer(playerId);
                } else if (key === 'backspace') {
                    this.backspacePlayerInput(playerId);
                } else {
                    this.appendPlayerInput(playerId, key);
                }
            });
        });
    }

    handleKeyboardInput(e) {
        // Don't intercept if inside a regular text input or menu
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Spacebar to buzz in 1P mode
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.state === 'PLAYING') {
                this.onPlayerBuzz(1);
                return;
            }
        }

        // Player 1 Keyboard: 'A' to buzz in
        if (e.code === 'KeyA') {
            if (this.state === 'PLAYING') {
                this.onPlayerBuzz(1);
                return;
            }
        }

        // Player 2 Keyboard: 'L' or 'Enter' to buzz in (only in 2P mode)
        if (e.code === 'KeyL' && this.mode === '2p') {
            if (this.state === 'PLAYING') {
                this.onPlayerBuzz(2);
                return;
            }
        }

        // Input handling during ANSWERING phase
        if (this.state === 'ANSWERING') {
            const p = this.activePlayer;

            // Prevent typing for AI
            if (p === 2 && this.mode === '1p') return;

            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                this.appendPlayerInput(p, e.key);
            } else if (e.key === '-' || e.key === 'Minus') {
                e.preventDefault();
                this.appendPlayerInput(p, '-');
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.backspacePlayerInput(p);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.submitPlayerAnswer(p);
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        }
    }

    /* -------------------------------------------------------------
     * MATCH LIFECYCLE & ROUND MANAGEMENT
     * ------------------------------------------------------------- */

    startNewMatch() {
        // Reset player scores & stats
        for (let i = 1; i <= 2; i++) {
            this.players[i].score = 0;
            this.players[i].input = '';
            this.players[i].correctCount = 0;
            this.players[i].wrongCount = 0;
            this.players[i].buzzTimes = [];
        }

        this.currentRound = 0;
        this.questionMgr.resetSession();
        this.ai.setDifficulty(this.difficulty);

        this.updateScoresUI();
        this.renderState('COUNTDOWN');
        this.startMatchCountdown();
    }

    startMatchCountdown() {
        let count = 3;
        this.dom.countdownNumber.textContent = count;
        this.dom.countdownNumber.className = 'countdown-num pop';
        this.audio.playCountdown(false);

        const step = () => {
            count--;
            if (count > 0) {
                this.dom.countdownNumber.textContent = count;
                this.dom.countdownNumber.className = 'countdown-num pop';
                this.audio.playCountdown(false);
                setTimeout(step, 900);
            } else if (count === 0) {
                this.dom.countdownNumber.textContent = 'ДУЭЛЬ!';
                this.dom.countdownNumber.className = 'countdown-num pop final';
                this.audio.playCountdown(true);
                setTimeout(() => {
                    this.renderState('PLAYING');
                    this.nextRound();
                }, 800);
            }
        };

        setTimeout(step, 900);
    }

    nextRound() {
        this.currentRound++;
        if (this.currentRound > this.totalRounds) {
            this.finishMatch();
            return;
        }

        this.state = 'PLAYING';
        this.activePlayer = null;
        this.reboundAvailable = true;
        if (this.dom.arena) this.dom.arena.classList.remove('has-active-player');

        // Reset player inputs & keypad UI
        for (let i = 1; i <= 2; i++) {
            this.updatePlayerInput(i, '');
            this.setPlayerKeypadActive(i, false);
            this.setPlayerStatus(i, 'ЖМИ КНОПКУ!', 'idle');
        }

        // Enable buzz buttons
        this.dom.p1BuzzBtn.disabled = false;
        this.dom.p2BuzzBtn.disabled = this.mode === '1p'; // In 1P, P2 buzz is automated
        this.dom.p1BuzzBtn.classList.add('pulse');
        this.dom.p2BuzzBtn.classList.toggle('pulse', this.mode === '2p');

        // Generate Question
        this.currentQuestion = this.questionMgr.generateQuestion(this.category, this.difficulty);
        this.renderQuestion(this.currentQuestion);

        // Update Round Badge
        this.dom.roundBadge.textContent = `РАУНД ${this.currentRound} / ${this.totalRounds}`;

        // Reset Points Ticker (Starts at 50, drops down to 10)
        this.roundPoints = 50;
        this.dom.pointsTicker.textContent = `+${this.roundPoints} ОЧКОВ`;
        this.dom.pointsTicker.className = 'points-ticker active';

        // Clear feedback banner
        this.dom.boardFeedback.textContent = '';
        this.dom.boardFeedback.className = 'board-feedback hidden';
        this.dom.boardHint.textContent = '';

        // Start decaying points timer & timestamp
        this.roundStartTime = performance.now();
        this.startPointsDecay();

        // Notify AI
        if (this.mode === '1p') {
            this.ai.onRoundStart(this.currentQuestion);
        }
    }

    startPointsDecay() {
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);

        this.roundScoreTimer = setInterval(() => {
            if (this.state !== 'PLAYING') {
                clearInterval(this.roundScoreTimer);
                return;
            }

            // Decrease points every 280ms until 10
            if (this.roundPoints > 10) {
                this.roundPoints--;
                this.dom.pointsTicker.textContent = `+${this.roundPoints} ОЧКОВ`;
            } else {
                // If points reached minimum and exceeded 18s without buzz, round times out
                const elapsed = (performance.now() - this.roundStartTime) / 1000;
                if (elapsed >= 18) {
                    clearInterval(this.roundScoreTimer);
                    this.onRoundTimeout();
                }
            }
        }, 280);
    }

    renderQuestion(q) {
        if (!this.dom.mathFormula) return;

        // Try KaTeX if available
        let renderedWithKaTeX = false;
        if (window.katex && q.latex) {
            try {
                window.katex.render(q.latex, this.dom.mathFormula, {
                    displayMode: true,
                    throwOnError: false
                });
                renderedWithKaTeX = true;
            } catch (e) {
                console.warn('KaTeX render error:', e);
            }
        }

        // Fallback to unicode
        if (!renderedWithKaTeX) {
            this.dom.mathFormula.innerHTML = `<span class="unicode-math">${q.unicode}</span>`;
        }

        // Board pop animation
        this.dom.mathBoard.classList.remove('pulse-in');
        void this.dom.mathBoard.offsetWidth; // Force reflow
        this.dom.mathBoard.classList.add('pulse-in');
    }

    /* -------------------------------------------------------------
     * BUZZ & ANSWER PHASE
     * ------------------------------------------------------------- */

    onPlayerBuzz(playerId) {
        if (this.state !== 'PLAYING') return false;

        // Record reaction time
        const reactionTime = (performance.now() - this.roundStartTime) / 1000;
        this.players[playerId].buzzTimes.push(reactionTime);

        this.state = 'ANSWERING';
        this.activePlayer = playerId;
        if (this.dom.arena) this.dom.arena.classList.add('has-active-player');

        // Stop point decay, points locked for this answer attempt!
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);

        // Buzz sound
        this.audio.playBuzzIn(playerId);

        // Lock both buzz buttons
        this.dom.p1BuzzBtn.disabled = true;
        this.dom.p2BuzzBtn.disabled = true;
        this.dom.p1BuzzBtn.classList.remove('pulse');
        this.dom.p2BuzzBtn.classList.remove('pulse');

        // Unlock active player's keypad, lock other player
        const otherPlayer = playerId === 1 ? 2 : 1;
        this.setPlayerKeypadActive(playerId, true);
        this.setPlayerKeypadActive(otherPlayer, false);

        this.setPlayerStatus(playerId, 'ВВЕДИ ОТВЕТ!', 'answering');
        this.setPlayerStatus(otherPlayer, `ОТВЕЧАЕТ ${this.players[playerId].name}...`, 'locked');

        // Start answer countdown bar (6 seconds)
        this.startAnswerCountdown(playerId, 6);
        return true;
    }

    startAnswerCountdown(playerId, seconds) {
        if (this.answerTimer) clearInterval(this.answerTimer);

        const timerBar = playerId === 1 ? this.dom.p1TimerBar : this.dom.p2TimerBar;
        const totalMs = seconds * 1000;
        const startTime = performance.now();

        if (timerBar) {
            timerBar.style.width = '100%';
            timerBar.classList.add('active');
        }

        this.answerTimer = setInterval(() => {
            const elapsed = performance.now() - startTime;
            const remainingRatio = Math.max(0, 1 - (elapsed / totalMs));

            if (timerBar) {
                timerBar.style.width = `${(remainingRatio * 100).toFixed(1)}%`;
            }

            if (remainingRatio <= 0) {
                clearInterval(this.answerTimer);
                if (this.state === 'ANSWERING' && this.activePlayer === playerId) {
                    this.onAnswerTimeout(playerId);
                }
            }
        }, 50);
    }

    stopAnswerCountdown() {
        if (this.answerTimer) {
            clearInterval(this.answerTimer);
            this.answerTimer = null;
        }
        if (this.dom.p1TimerBar) {
            this.dom.p1TimerBar.style.width = '0%';
            this.dom.p1TimerBar.classList.remove('active');
        }
        if (this.dom.p2TimerBar) {
            this.dom.p2TimerBar.style.width = '0%';
            this.dom.p2TimerBar.classList.remove('active');
        }
    }

    setPlayerKeypadActive(playerId, active) {
        const keypad = playerId === 1 ? this.dom.p1Keypad : this.dom.p2Keypad;
        const zone = playerId === 1 ? this.dom.p1Zone : this.dom.p2Zone;

        if (keypad) {
            if (active) {
                keypad.classList.add('active');
                keypad.classList.remove('locked');
            } else {
                keypad.classList.remove('active');
                keypad.classList.add('locked');
            }
        }

        if (zone) {
            if (active) {
                zone.classList.add('turn-active');
            } else {
                zone.classList.remove('turn-active');
            }
        }
    }

    setPlayerStatus(playerId, msg, stateClass) {
        const statusEl = playerId === 1 ? this.dom.p1Status : this.dom.p2Status;
        if (!statusEl) return;

        statusEl.textContent = msg;
        statusEl.className = `player-status-badge ${stateClass}`;
    }

    appendPlayerInput(playerId, char) {
        if (this.state !== 'ANSWERING' || this.activePlayer !== playerId) return;

        let cur = this.players[playerId].input;
        if (char === '-') {
            // Negative toggle or leading minus
            if (cur.startsWith('-')) {
                cur = cur.substring(1);
            } else {
                cur = '-' + cur;
            }
        } else {
            // Max 6 digits
            if (cur.length < 6) {
                // If 0 alone, replace unless another digit
                if (cur === '0') cur = char;
                else cur += char;
            }
        }

        this.updatePlayerInput(playerId, cur);
        this.audio.playKeyTap(parseInt(char, 10) || 5);
    }

    backspacePlayerInput(playerId) {
        if (this.state !== 'ANSWERING' || this.activePlayer !== playerId) return;

        let cur = this.players[playerId].input;
        if (cur.length > 0) {
            cur = cur.slice(0, -1);
            this.updatePlayerInput(playerId, cur);
            this.audio.playClick();
        }
    }

    updatePlayerInput(playerId, val) {
        this.players[playerId].input = val;
        const displayEl = playerId === 1 ? this.dom.p1Input : this.dom.p2Input;
        if (displayEl) {
            displayEl.textContent = val || '?';
            if (val) displayEl.classList.add('has-val');
            else displayEl.classList.remove('has-val');
        }
    }

    submitPlayerAnswer(playerId) {
        if (this.state !== 'ANSWERING' || this.activePlayer !== playerId) return;

        const raw = this.players[playerId].input.trim();
        if (raw === '' || raw === '-') {
            // Shake input box if empty
            this.shakeInput(playerId);
            return;
        }

        this.stopAnswerCountdown();
        const userNum = parseInt(raw, 10);
        const correctNum = this.currentQuestion.answer;

        if (userNum === correctNum) {
            this.handleCorrectAnswer(playerId);
        } else {
            this.handleWrongAnswer(playerId, false);
        }
    }

    onAnswerTimeout(playerId) {
        this.stopAnswerCountdown();
        this.handleWrongAnswer(playerId, true);
    }

    handleCorrectAnswer(playerId) {
        this.state = 'REVEAL';
        this.audio.playCorrect();

        const earned = this.roundPoints;
        this.players[playerId].score += earned;
        this.players[playerId].correctCount++;

        this.updateScoresUI();
        this.setPlayerStatus(playerId, `ВЕРНО! +${earned}`, 'correct');
        this.flashZone(playerId, 'success');

        // Board Announcement
        this.dom.boardFeedback.textContent = `ПРАВИЛЬНО! ${this.players[playerId].name} +${earned}`;
        this.dom.boardFeedback.className = 'board-feedback correct';
        this.dom.boardHint.textContent = `Ответ: ${this.currentQuestion.answer} (${this.currentQuestion.hint})`;

        // Wait then next question
        setTimeout(() => {
            this.nextRound();
        }, 2200);
    }

    handleWrongAnswer(playerId, isTimeout) {
        this.audio.playWrong();
        this.players[playerId].wrongCount++;

        // Penalty (-5 points)
        const penalty = 5;
        this.players[playerId].score = Math.max(0, this.players[playerId].score - penalty);
        this.updateScoresUI();

        this.setPlayerStatus(playerId, isTimeout ? 'ВРЕМЯ ВЫШЛО! -5' : 'НЕВЕРНО! -5', 'wrong');
        this.shakeZone(playerId);

        // Check for rebound chance for opponent
        const otherPlayer = playerId === 1 ? 2 : 1;
        if (this.reboundAvailable) {
            this.reboundAvailable = false; // Only 1 rebound allowed per question
            this.state = 'PLAYING';
            this.activePlayer = null;

            // Opponent now gets a chance
            this.setPlayerKeypadActive(playerId, false);
            this.setPlayerStatus(playerId, 'ОШИБКА!', 'locked');

            this.dom.boardFeedback.textContent = `ОШИБКА! ШАНС ДЛЯ ${this.players[otherPlayer].name}!`;
            this.dom.boardFeedback.className = 'board-feedback warning';

            // Unlock other player buzz
            const otherBtn = otherPlayer === 1 ? this.dom.p1BuzzBtn : this.dom.p2BuzzBtn;
            otherBtn.disabled = (otherPlayer === 2 && this.mode === '1p');
            otherBtn.classList.add('pulse');
            this.setPlayerStatus(otherPlayer, 'ТВОЙ ШАНС! ЖМИ!', 'rebound');

            // If AI is opponent, trigger AI rebound
            if (otherPlayer === 2 && this.mode === '1p') {
                this.ai.onRebound(this.currentQuestion);
            }

            // Start short window for rebound (8 seconds)
            this.roundStartTime = performance.now();
            this.startPointsDecay();
        } else {
            // Both failed or no rebound
            this.revealAnswerAfterFailure();
        }
    }

    onRoundTimeout() {
        this.audio.playTimeout();
        this.revealAnswerAfterFailure();
    }

    revealAnswerAfterFailure() {
        this.state = 'REVEAL';
        this.stopAnswerCountdown();

        for (let i = 1; i <= 2; i++) {
            this.setPlayerKeypadActive(i, false);
            this.setPlayerStatus(i, 'РАУНД ОКОНЧЕН', 'idle');
        }

        this.dom.boardFeedback.textContent = `ПРАВИЛЬНЫЙ ОТВЕТ: ${this.currentQuestion.answer}`;
        this.dom.boardFeedback.className = 'board-feedback neutral';
        this.dom.boardHint.textContent = this.currentQuestion.hint;

        setTimeout(() => {
            this.nextRound();
        }, 2500);
    }

    /* -------------------------------------------------------------
     * VISUAL EFFECTS & ANIMATIONS
     * ------------------------------------------------------------- */

    shakeInput(playerId) {
        const inputEl = playerId === 1 ? this.dom.p1Input : this.dom.p2Input;
        if (inputEl) {
            inputEl.classList.remove('shake');
            void inputEl.offsetWidth;
            inputEl.classList.add('shake');
        }
    }

    shakeZone(playerId) {
        const zone = playerId === 1 ? this.dom.p1Zone : this.dom.p2Zone;
        if (zone) {
            zone.classList.remove('shake');
            void zone.offsetWidth;
            zone.classList.add('shake');
        }
    }

    flashZone(playerId, type) {
        const zone = playerId === 1 ? this.dom.p1Zone : this.dom.p2Zone;
        if (zone) {
            zone.classList.remove('flash-' + type);
            void zone.offsetWidth;
            zone.classList.add('flash-' + type);
        }
    }

    updateScoresUI() {
        if (this.dom.p1Score) {
            this.dom.p1Score.textContent = this.players[1].score;
        }
        if (this.dom.p2Score) {
            this.dom.p2Score.textContent = this.players[2].score;
        }
    }

    /* -------------------------------------------------------------
     * FINISH MATCH & STATISTICS
     * ------------------------------------------------------------- */

    finishMatch() {
        this.state = 'GAME_OVER';
        this.audio.playVictory();

        const s1 = this.players[1].score;
        const s2 = this.players[2].score;

        let winnerName, winnerSub;
        if (s1 > s2) {
            winnerName = `ПОБЕДИТЕЛЬ: ${this.players[1].name}!`;
            winnerSub = `С преимуществом в ${s1 - s2} очков`;
        } else if (s2 > s1) {
            winnerName = `ПОБЕДИТЕЛЬ: ${this.players[2].name}!`;
            winnerSub = `С преимуществом в ${s2 - s1} очков`;
        } else {
            winnerName = 'НИЧЬЯ!';
            winnerSub = `Оба участника набрали по ${s1} очков!`;
        }

        this.dom.winnerText.textContent = winnerName;
        this.dom.winnerSubtitle.textContent = winnerSub;

        // Statistics
        const calcAvgReact = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) + 'с' : '—';

        this.dom.p1FinalScore.textContent = s1;
        this.dom.p2FinalScore.textContent = s2;
        this.dom.p1FinalCorrect.textContent = this.players[1].correctCount;
        this.dom.p2FinalCorrect.textContent = this.players[2].correctCount;
        this.dom.p1FinalErrors.textContent = this.players[1].wrongCount;
        this.dom.p2FinalErrors.textContent = this.players[2].wrongCount;
        this.dom.p1FinalReaction.textContent = calcAvgReact(this.players[1].buzzTimes);
        this.dom.p2FinalReaction.textContent = calcAvgReact(this.players[2].buzzTimes);

        this.renderState('GAME_OVER');
    }

    endMatchEarly() {
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);
        this.stopAnswerCountdown();
        this.ai.cancel();
        this.renderState('MENU');
    }

    renderState(newState) {
        this.state = newState;

        this.dom.screenMenu.classList.toggle('active', newState === 'MENU');
        this.dom.screenCountdown.classList.toggle('active', newState === 'COUNTDOWN');
        this.dom.screenGame.classList.toggle('active', newState === 'PLAYING' || newState === 'ANSWERING' || newState === 'REVEAL');
        this.dom.screenGameOver.classList.toggle('active', newState === 'GAME_OVER');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new RootDuelGame();
    window.game.init();
});

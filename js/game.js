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
        this.isPaused = false;
        this.pausedState = null;

        // QoL Features: Haptic, Series Tracker, High Score
        this.hapticEnabled = true;
        this.seriesScore = { 1: 0, 2: 0 };
        this.highScore = 0;

        // Players State
        this.players = {
            1: {
                id: 1,
                name: 'ИГРОК 1',
                score: 0,
                input: '',
                correctCount: 0,
                wrongCount: 0,
                buzzTimes: [],
                streak: 0,
                maxStreak: 0
            },
            2: {
                id: 2,
                name: 'ИГРОК 2',
                score: 0,
                input: '',
                correctCount: 0,
                wrongCount: 0,
                buzzTimes: [],
                streak: 0,
                maxStreak: 0
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
        // Version
        this.version = '1.3.0';
    }

    init() {
        console.log(`[ROOT DUEL] Initialized version ${this.version}`);
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
        this.dom.modalPause = document.getElementById('modal-pause');

        // Header controls
        this.dom.btnMute = document.getElementById('btn-mute');
        this.dom.btnFullscreen = document.getElementById('btn-fullscreen');
        this.dom.btnRotateP2 = document.getElementById('btn-rotate-p2');
        this.dom.btnPause = document.getElementById('btn-pause');
        this.dom.btnSettings = document.getElementById('btn-open-settings');
        this.dom.btnBackMenu = document.getElementById('btn-back-menu');

        // Pause Modal elements
        this.dom.btnResumeGame = document.getElementById('btn-resume-game');
        this.dom.btnFinishEarly = document.getElementById('btn-finish-early');
        this.dom.btnPauseMenu = document.getElementById('btn-pause-menu');
        this.dom.pauseRoundText = document.getElementById('pause-round-text');
        this.dom.pauseScoreText = document.getElementById('pause-score-text');
        this.dom.pauseSeriesText = document.getElementById('pause-series-text');

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
        this.dom.p1ComboBadge = document.getElementById('p1-combo-badge');
        this.dom.p2ComboBadge = document.getElementById('p2-combo-badge');

        // Central TV Board (Dual View Support)
        this.dom.mathBoard = document.getElementById('math-board');
        this.dom.mathFormulaP1 = document.getElementById('math-formula-p1');
        this.dom.mathFormulaP2 = document.getElementById('math-formula-p2');
        this.dom.mathFormula = this.dom.mathFormulaP1 || document.getElementById('math-formula');
        this.dom.roundBadge = document.getElementById('round-badge');
        this.dom.seriesBadge = document.getElementById('series-badge');
        this.dom.pointsTicker = document.getElementById('points-ticker');
        this.dom.boardFeedbackP1 = document.getElementById('board-feedback-p1');
        this.dom.boardFeedbackP2 = document.getElementById('board-feedback-p2');
        this.dom.boardFeedback = document.getElementById('board-feedback');
        this.dom.boardHint = document.getElementById('board-hint');

        // Countdown element
        this.dom.countdownNumber = document.getElementById('countdown-number');

        // Game Over elements
        this.dom.winnerText = document.getElementById('winner-text');
        this.dom.winnerSubtitle = document.getElementById('winner-subtitle');
        this.dom.statsSeriesBanner = document.getElementById('stats-series-banner');
        this.dom.btnResetSeries = document.getElementById('btn-reset-series');
        this.dom.p1FinalScore = document.getElementById('stats-p1-score');
        this.dom.p2FinalScore = document.getElementById('stats-p2-score');
        this.dom.p1FinalStreak = document.getElementById('stats-p1-streak');
        this.dom.p2FinalStreak = document.getElementById('stats-p2-streak');
        this.dom.p1FinalCorrect = document.getElementById('stats-p1-correct');
        this.dom.p2FinalCorrect = document.getElementById('stats-p2-correct');
        this.dom.p1FinalErrors = document.getElementById('stats-p1-errors');
        this.dom.p2FinalErrors = document.getElementById('stats-p2-errors');
        this.dom.p1FinalReaction = document.getElementById('stats-p1-reaction');
        this.dom.p2FinalReaction = document.getElementById('stats-p2-reaction');

        // Settings toggle
        this.dom.chkHaptic = document.getElementById('chk-haptic');
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem('root_duel_settings');
            if (raw) {
                const s = JSON.parse(raw);
                if (s.mode) this.mode = s.mode;
                if (s.category) this.category = s.category;
                if (s.difficulty) this.difficulty = s.difficulty;
                if (s.totalRounds) this.totalRounds = s.totalRounds === 'infinite' ? 'infinite' : parseInt(s.totalRounds, 10);
                if (s.player2Rotated !== undefined) this.player2Rotated = s.player2Rotated;
            }
            const ser = localStorage.getItem('root_duel_series');
            if (ser) this.seriesScore = JSON.parse(ser);
            const hap = localStorage.getItem('root_duel_haptic');
            if (hap !== null) this.hapticEnabled = hap !== 'false';
            this.highScore = parseInt(localStorage.getItem('root_duel_high_score') || '0', 10);
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
        localStorage.setItem('root_duel_haptic', this.hapticEnabled ? 'true' : 'false');
        localStorage.setItem('root_duel_series', JSON.stringify(this.seriesScore));
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

        // Haptic checkbox
        if (this.dom.chkHaptic) {
            this.dom.chkHaptic.checked = this.hapticEnabled;
        }

        // Series score badges
        this.updateSeriesUI();

        // Update menu selections
        this.updateMenuOptionHighlight('mode', this.mode);
        this.updateMenuOptionHighlight('category', this.category);
        this.updateMenuOptionHighlight('difficulty', this.difficulty);
        this.updateMenuOptionHighlight('rounds', this.totalRounds.toString());

        // Update player 2 name if 1P
        this.players[2].name = this.mode === '1p' ? `ИИ (${this.difficulty.toUpperCase()})` : 'ИГРОК 2';
        if (this.dom.p2Name) this.dom.p2Name.textContent = this.players[2].name;

        // Update dual orientation chalkboard view
        this.updateBoardDualView();
    }

    triggerHaptic(type) {
        if (!this.hapticEnabled || !navigator.vibrate) return;
        try {
            switch (type) {
                case 'tap': navigator.vibrate(15); break;
                case 'buzz': navigator.vibrate(45); break;
                case 'clear': navigator.vibrate([20, 20]); break;
                case 'correct': navigator.vibrate([35, 40, 55]); break;
                case 'wrong': navigator.vibrate([110, 50, 110]); break;
                case 'combo': navigator.vibrate([30, 30, 30, 30, 60]); break;
            }
        } catch (e) {}
    }

    updateSeriesUI() {
        if (this.dom.seriesBadge) {
            this.dom.seriesBadge.textContent = `СЕРИЯ [ ${this.seriesScore[1]} : ${this.seriesScore[2]} ]`;
        }
        if (this.dom.statsSeriesBanner) {
            const p2Title = this.mode === '1p' ? 'ИИ' : 'Игрок 2';
            this.dom.statsSeriesBanner.textContent = `Счёт серии матчей: Игрок 1 [ ${this.seriesScore[1]} : ${this.seriesScore[2]} ] ${p2Title}`;
        }
    }

    resetSeriesScore() {
        this.seriesScore = { 1: 0, 2: 0 };
        localStorage.setItem('root_duel_series', JSON.stringify(this.seriesScore));
        this.updateSeriesUI();
        this.audio.playClick();
        this.triggerHaptic('tap');
    }

    updateComboBadge(playerId, streak) {
        const badge = playerId === 1 ? this.dom.p1ComboBadge : this.dom.p2ComboBadge;
        if (!badge) return;
        if (streak >= 2) {
            badge.textContent = `🔥 x${streak}`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    updateBoardDualView() {
        const isDual = (this.mode === '2p' && this.player2Rotated);
        if (this.dom.mathBoard) {
            this.dom.mathBoard.classList.toggle('dual-active', isDual);
        }
    }

    setBoardFeedback(text, typeClass) {
        const setEl = (el, isP2 = false) => {
            if (!el) return;
            const extra = isP2 ? ' feedback-p2 rotated-180' : (el === this.dom.boardFeedbackP1 ? ' feedback-p1' : '');
            if (text) {
                el.textContent = text;
                el.className = `board-feedback ${typeClass}${extra}`;
                el.classList.remove('hidden');
                el.style.display = '';
            } else {
                el.textContent = '';
                el.className = `board-feedback hidden${extra}`;
                el.style.display = 'none';
            }
        };

        setEl(this.dom.boardFeedbackP1, false);
        setEl(this.dom.boardFeedbackP2, true);
        setEl(this.dom.boardFeedback, false);
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
                    this.totalRounds = val === 'infinite' ? 'infinite' : parseInt(val, 10);
                }

                this.saveSettings();
                this.applySettingsToUI();
            });
        });

        // Start Match Button
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.audio.playClick();
            this.triggerHaptic('tap');
            this.startNewMatch();
        });

        // Pause Button & Modal Actions
        if (this.dom.btnPause) {
            this.dom.btnPause.addEventListener('click', () => {
                this.togglePause();
            });
        }
        if (this.dom.btnResumeGame) {
            this.dom.btnResumeGame.addEventListener('click', () => {
                this.resumeGame();
            });
        }
        if (this.dom.btnFinishEarly) {
            this.dom.btnFinishEarly.addEventListener('click', () => {
                this.finishMatchEarly();
            });
        }
        if (this.dom.btnPauseMenu) {
            this.dom.btnPauseMenu.addEventListener('click', () => {
                if (this.dom.modalPause) this.dom.modalPause.classList.remove('active');
                this.isPaused = false;
                this.audio.playClick();
                this.endMatchEarly();
            });
        }

        // Reset Series Score Button
        if (this.dom.btnResetSeries) {
            this.dom.btnResetSeries.addEventListener('click', () => {
                this.resetSeriesScore();
            });
        }

        // Haptic Feedback Toggle in Settings
        if (this.dom.chkHaptic) {
            this.dom.chkHaptic.addEventListener('change', (e) => {
                this.hapticEnabled = e.target.checked;
                this.saveSettings();
                if (this.hapticEnabled) this.triggerHaptic('tap');
            });
        }

        // Sound Mute Toggle
        this.dom.btnMute.addEventListener('click', () => {
            this.audio.toggleMute();
            this.updateAudioIcon();
            this.audio.playClick();
            this.triggerHaptic('tap');
        });

        // Fullscreen Toggle
        this.dom.btnFullscreen.addEventListener('click', () => {
            this.audio.playClick();
            this.triggerHaptic('tap');
            this.toggleFullscreen();
        });

        // Player 2 180-deg Flip Toggle
        this.dom.btnRotateP2.addEventListener('click', () => {
            this.player2Rotated = !this.player2Rotated;
            this.audio.playClick();
            this.triggerHaptic('tap');
            this.saveSettings();
            this.applySettingsToUI();
        });

        // Back to Menu button during game
        this.dom.btnBackMenu.addEventListener('click', () => {
            this.audio.playClick();
            this.triggerHaptic('tap');
            if (confirm('Вы уверены, что хотите завершить текущую дуэль и выйти в меню?')) {
                this.endMatchEarly();
            }
        });

        // Rematch & Return buttons on Game Over
        document.getElementById('btn-rematch').addEventListener('click', () => {
            this.audio.playClick();
            this.triggerHaptic('tap');
            this.startNewMatch();
        });

        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            this.audio.playClick();
            this.triggerHaptic('tap');
            this.renderState('MENU');
        });

        // Quick Settings Modal
        this.dom.btnSettings.addEventListener('click', () => {
            this.audio.playClick();
            this.triggerHaptic('tap');
            this.dom.modalSettings.classList.toggle('active');
        });

        document.getElementById('btn-close-modal').addEventListener('click', () => {
            this.audio.playClick();
            this.triggerHaptic('tap');
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

        // Background / App Switch / Phone Lock Handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppPause();
            } else {
                this.onAppResume();
            }
        });
        window.addEventListener('pagehide', () => this.onAppPause());
        window.addEventListener('blur', () => {
            if (document.hidden) this.onAppPause();
        });
        window.addEventListener('focus', () => {
            if (!document.hidden) this.onAppResume();
        });
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else if (this.state === 'PLAYING' || this.state === 'ANSWERING') {
            this.pauseGame();
        }
    }

    pauseGame() {
        if (this.state !== 'PLAYING' && this.state !== 'ANSWERING') return;
        this.isPaused = true;
        this.pausedState = this.state;

        if (this.roundScoreTimer) {
            clearInterval(this.roundScoreTimer);
            this.roundScoreTimer = null;
        }
        if (this.answerTimer) {
            clearInterval(this.answerTimer);
            this.answerTimer = null;
        }
        if (this.ai) this.ai.cancel();
        if (this.audio) this.audio.suspend();

        const roundText = this.totalRounds === 'infinite' ? `РАУНД ${this.currentRound} (∞)` : `РАУНД ${this.currentRound} / ${this.totalRounds}`;
        if (this.dom.pauseRoundText) this.dom.pauseRoundText.textContent = roundText;
        if (this.dom.pauseScoreText) this.dom.pauseScoreText.textContent = `${this.players[1].name}: ${this.players[1].score} | ${this.players[2].name}: ${this.players[2].score}`;
        if (this.dom.pauseSeriesText) this.dom.pauseSeriesText.textContent = `Счёт серии матчей: ${this.seriesScore[1]} — ${this.seriesScore[2]}`;

        if (this.dom.modalPause) this.dom.modalPause.classList.add('active');
        this.audio.playClick();
        this.triggerHaptic('tap');
    }

    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        if (this.dom.modalPause) this.dom.modalPause.classList.remove('active');

        if (this.audio) this.audio.resume();
        this.audio.playClick();
        this.triggerHaptic('tap');

        if (this.pausedState === 'PLAYING') {
            this.startPointsDecay();
            if (this.mode === '1p' && this.currentQuestion) {
                this.ai.onRoundStart(this.currentQuestion);
            }
        } else if (this.pausedState === 'ANSWERING' && this.activePlayer) {
            this.startAnswerCountdown(this.activePlayer, 5);
        }
    }

    finishMatchEarly() {
        if (this.dom.modalPause) this.dom.modalPause.classList.remove('active');
        this.isPaused = false;
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);
        this.stopAnswerCountdown();
        if (this.ai) this.ai.cancel();
        this.finishMatch();
    }

    onAppPause() {
        this.isBackgroundPaused = true;
        if (this.roundScoreTimer) {
            clearInterval(this.roundScoreTimer);
            this.roundScoreTimer = null;
        }
        if (this.answerTimer) {
            clearInterval(this.answerTimer);
            this.answerTimer = null;
        }
        if (this.ai) {
            this.ai.cancel();
        }
        if (this.audio) {
            this.audio.suspend();
        }
    }

    onAppResume() {
        if (!this.isBackgroundPaused) return;
        this.isBackgroundPaused = false;

        if (this.audio) {
            this.audio.resume();
        }

        if (this.state === 'PLAYING') {
            this.startPointsDecay();
            if (this.mode === '1p' && this.currentQuestion) {
                this.ai.onRoundStart(this.currentQuestion);
            }
        } else if (this.state === 'ANSWERING' && this.activePlayer) {
            this.startAnswerCountdown(this.activePlayer, 5);
        }
    }

    setupBuzzButton(btn, playerId) {
        let lastBuzz = 0;
        const handler = (e) => {
            const now = Date.now();
            if (now - lastBuzz < 350) return;
            lastBuzz = now;
            if (e.cancelable) e.preventDefault();
            if (playerId === 2 && this.mode === '1p') return; // AI controls P2 in 1P mode
            this.triggerHaptic('buzz');
            this.onPlayerBuzz(playerId);
        };

        btn.addEventListener('pointerdown', handler);
        btn.addEventListener('touchstart', handler, { passive: false });
        btn.addEventListener('click', handler);
    }

    setupKeypad(playerId, keypadEl) {
        if (!keypadEl) return;

        keypadEl.querySelectorAll('[data-key]').forEach(btn => {
            let lastTap = 0;
            const handler = (e) => {
                const now = Date.now();
                if (now - lastTap < 100) return;
                lastTap = now;
                if (e.cancelable) e.preventDefault();
                if (playerId === 2 && this.mode === '1p') return; // Ignore user touch for AI
                if (this.state !== 'ANSWERING' || this.activePlayer !== playerId) return;

                const key = btn.dataset.key;
                if (key === 'submit') {
                    this.triggerHaptic('tap');
                    this.submitPlayerAnswer(playerId);
                } else if (key === 'backspace') {
                    this.triggerHaptic('tap');
                    this.backspacePlayerInput(playerId);
                } else if (key === 'clear') {
                    this.clearPlayerInput(playerId);
                } else {
                    this.triggerHaptic('tap');
                    this.appendPlayerInput(playerId, key);
                }
            };

            btn.addEventListener('pointerdown', handler);
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('click', handler);
        });
    }

    clearPlayerInput(playerId) {
        if (this.state !== 'ANSWERING' || this.activePlayer !== playerId) return;
        this.updatePlayerInput(playerId, '');
        this.audio.playClick();
        this.triggerHaptic('clear');
    }

    handleKeyboardInput(e) {
        // Don't intercept if inside a regular text input or menu
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Pause toggle hotkey
        if (e.code === 'KeyP' || e.code === 'Escape') {
            e.preventDefault();
            this.togglePause();
            return;
        }

        // Spacebar to buzz in 1P mode
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.state === 'PLAYING') {
                this.triggerHaptic('buzz');
                this.onPlayerBuzz(1);
                return;
            }
        }

        // Player 1 Keyboard: 'A' to buzz in
        if (e.code === 'KeyA') {
            if (this.state === 'PLAYING') {
                this.triggerHaptic('buzz');
                this.onPlayerBuzz(1);
                return;
            }
        }

        // Player 2 Keyboard: 'L' or 'Enter' to buzz in (only in 2P mode)
        if (e.code === 'KeyL' && this.mode === '2p') {
            if (this.state === 'PLAYING') {
                this.triggerHaptic('buzz');
                this.onPlayerBuzz(2);
                return;
            }
        }

        // Input handling during ANSWERING phase
        if (this.state === 'ANSWERING') {
            const p = this.activePlayer;

            // Prevent typing for AI
            if (p === 2 && this.mode === '1p') return;

            // Clear input hotkeys
            if (e.code === 'KeyC' || e.code === 'Delete') {
                e.preventDefault();
                this.clearPlayerInput(p);
                return;
            }

            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                this.triggerHaptic('tap');
                this.appendPlayerInput(p, e.key);
            } else if (e.key === '-' || e.key === 'Minus') {
                e.preventDefault();
                this.triggerHaptic('tap');
                this.appendPlayerInput(p, '-');
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this.triggerHaptic('tap');
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
            this.players[i].streak = 0;
            this.players[i].maxStreak = 0;
            this.updateComboBadge(i, 0);
        }

        this.currentRound = 0;
        this.questionMgr.resetSession();
        this.ai.setDifficulty(this.difficulty);

        this.updateScoresUI();
        this.updateSeriesUI();
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
        if (this.totalRounds !== 'infinite' && this.currentRound > this.totalRounds) {
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
            const statusMsg = (i === 2 && this.mode === '1p') ? 'БОТ ДУМАЕТ...' : 'ЖМИ КНОПКУ!';
            this.setPlayerStatus(i, statusMsg, 'idle');
        }

        // Enable buzz buttons
        this.dom.p1BuzzBtn.disabled = false;
        this.dom.p2BuzzBtn.disabled = this.mode === '1p'; // In 1P, P2 buzz is automated
        this.dom.p1BuzzBtn.classList.add('pulse');
        this.dom.p2BuzzBtn.classList.toggle('pulse', this.mode === '2p');

        // Generate Question
        this.currentQuestion = this.questionMgr.generateQuestion(this.category, this.difficulty);
        this.renderQuestion(this.currentQuestion);

        // Update Round Badge (handles endless mode)
        const roundStr = this.totalRounds === 'infinite' ? `РАУНД ${this.currentRound} (∞)` : `РАУНД ${this.currentRound} / ${this.totalRounds}`;
        this.dom.roundBadge.textContent = roundStr;

        // Reset Points Ticker (Starts at 50, drops down to 10)
        this.roundPoints = 50;
        this.dom.pointsTicker.textContent = `+${this.roundPoints} ОЧКОВ`;
        this.dom.pointsTicker.className = 'points-ticker active';
        this.dom.pointsTicker.classList.remove('tension-pulse');

        // Clear feedback banner
        this.setBoardFeedback('', 'hidden');
        this.dom.boardHint.textContent = '';

        // Start decaying points timer & timestamp
        this.roundStartTime = performance.now();
        this.lastTensionTickSec = -1;
        this.startPointsDecay();

        // Notify AI
        if (this.mode === '1p') {
            this.ai.onRoundStart(this.currentQuestion);
        }
    }

    startPointsDecay() {
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);

        this.roundScoreTimer = setInterval(() => {
            if (this.state !== 'PLAYING' || document.hidden || this.isPaused) {
                if (this.state !== 'PLAYING') clearInterval(this.roundScoreTimer);
                return;
            }

            // Decrease points every 280ms until 10
            if (this.roundPoints > 10) {
                this.roundPoints--;
                this.dom.pointsTicker.textContent = `+${this.roundPoints} ОЧКОВ`;
            }

            const elapsed = (performance.now() - this.roundStartTime) / 1000;

            // Tension mode in last 3 seconds (15s to 18s)
            if (elapsed >= 15 && elapsed < 18) {
                this.dom.pointsTicker.classList.add('tension-pulse');
                const remainingSec = Math.max(1, Math.ceil(18 - elapsed));
                if (remainingSec !== this.lastTensionTickSec) {
                    this.lastTensionTickSec = remainingSec;
                    const urgency = Math.min(3, 4 - remainingSec);
                    this.audio.playTensionTick(urgency);
                }
            } else if (elapsed < 15) {
                this.dom.pointsTicker.classList.remove('tension-pulse');
            }

            // Round timeout after 18 seconds
            if (elapsed >= 18) {
                clearInterval(this.roundScoreTimer);
                this.dom.pointsTicker.classList.remove('tension-pulse');
                this.onRoundTimeout();
            }
        }, 280);
    }

    renderQuestion(q) {
        this.updateBoardDualView();

        const targets = [this.dom.mathFormulaP1, this.dom.mathFormulaP2].filter(Boolean);
        if (targets.length === 0 && this.dom.mathFormula) targets.push(this.dom.mathFormula);

        targets.forEach(targetEl => {
            let renderedWithKaTeX = false;
            if (window.katex && q.latex) {
                try {
                    window.katex.render(q.latex, targetEl, {
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
                targetEl.innerHTML = `<span class="unicode-math">${q.unicode}</span>`;
            }
        });

        // Board pop animation
        if (this.dom.mathBoard) {
            this.dom.mathBoard.classList.remove('pulse-in');
            void this.dom.mathBoard.offsetWidth; // Force reflow
            this.dom.mathBoard.classList.add('pulse-in');
        }
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
            if (document.hidden) return;
            const elapsed = performance.now() - startTime;
            const remainingRatio = Math.max(0, 1 - (elapsed / totalMs));

            if (timerBar) {
                timerBar.style.width = `${(remainingRatio * 100).toFixed(1)}%`;
                if (remainingRatio <= 0.35) {
                    timerBar.classList.add('timer-danger');
                } else {
                    timerBar.classList.remove('timer-danger');
                }
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
            this.dom.p1TimerBar.classList.remove('active', 'timer-danger');
        }
        if (this.dom.p2TimerBar) {
            this.dom.p2TimerBar.style.width = '0%';
            this.dom.p2TimerBar.classList.remove('active', 'timer-danger');
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
        this.activePlayer = null;
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);
        this.stopAnswerCountdown();
        if (this.dom.arena) this.dom.arena.classList.remove('has-active-player');
        if (this.ai) this.ai.cancel();

        try {
            this.audio.playCorrect();
        } catch (e) {
            console.warn('Audio error:', e);
        }

        this.triggerHaptic('correct');

        // Streak & Combo Logic
        this.players[playerId].streak++;
        if (this.players[playerId].streak > this.players[playerId].maxStreak) {
            this.players[playerId].maxStreak = this.players[playerId].streak;
        }

        const streak = this.players[playerId].streak;
        let comboBonus = 0;
        if (streak >= 2) {
            comboBonus = 5;
            this.audio.playCombo(streak);
            this.triggerHaptic('combo');
            this.updateComboBadge(playerId, streak);
        }

        const earned = this.roundPoints;
        this.players[playerId].score += (earned + comboBonus);
        this.players[playerId].correctCount++;

        this.updateScoresUI();
        const statusBonus = comboBonus > 0 ? ` (+${earned}+${comboBonus}🔥)` : ` +${earned}`;
        this.setPlayerStatus(playerId, `ВЕРНО!${statusBonus}`, 'correct');
        this.flashZone(playerId, 'success');

        // Close keypads and disable buzzers during reveal
        for (let i = 1; i <= 2; i++) {
            this.setPlayerKeypadActive(i, false);
        }
        this.dom.p1BuzzBtn.disabled = true;
        this.dom.p2BuzzBtn.disabled = true;
        this.dom.p1BuzzBtn.classList.remove('pulse');
        this.dom.p2BuzzBtn.classList.remove('pulse');

        // Board Announcement
        const comboMsg = comboBonus > 0 ? ` (🔥 КОМБО x${streak}: +${comboBonus}!)` : '';
        this.setBoardFeedback(`ПРАВИЛЬНО! ${this.players[playerId].name} +${earned}${comboMsg}`, 'correct');
        this.dom.boardHint.textContent = `Ответ: ${this.currentQuestion.answer} (${this.currentQuestion.hint})`;

        // Wait then next question
        setTimeout(() => {
            if (this.state === 'REVEAL') {
                this.nextRound();
            }
        }, 1800);
    }

    handleWrongAnswer(playerId, isTimeout) {
        this.state = 'REVEAL';
        this.activePlayer = null;
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);
        this.stopAnswerCountdown();
        if (this.dom.arena) this.dom.arena.classList.remove('has-active-player');
        if (this.ai) this.ai.cancel();

        try {
            this.audio.playWrong();
        } catch (e) {
            console.warn('Audio error:', e);
        }

        this.triggerHaptic('wrong');
        this.players[playerId].wrongCount++;
        this.players[playerId].streak = 0;
        this.updateComboBadge(playerId, 0);

        // Penalty (-5 points)
        const penalty = 5;
        this.players[playerId].score = Math.max(0, this.players[playerId].score - penalty);
        this.updateScoresUI();

        this.setPlayerStatus(playerId, isTimeout ? 'ВРЕМЯ ВЫШЛО! -5' : 'НЕВЕРНО! -5', 'wrong');
        this.shakeZone(playerId);

        // Close keypads and disable buzzers during reveal
        for (let i = 1; i <= 2; i++) {
            this.setPlayerKeypadActive(i, false);
        }
        this.dom.p1BuzzBtn.disabled = true;
        this.dom.p2BuzzBtn.disabled = true;
        this.dom.p1BuzzBtn.classList.remove('pulse');
        this.dom.p2BuzzBtn.classList.remove('pulse');

        // Board Announcement with correct answer and hint
        this.setBoardFeedback(isTimeout ? 'ВРЕМЯ ВЫШЛО!' : `ОШИБКА ${this.players[playerId].name}! (-5)`, 'wrong');
        this.dom.boardHint.textContent = `Правильный ответ: ${this.currentQuestion.answer} (${this.currentQuestion.hint})`;

        // Automatically pass turn to next round
        setTimeout(() => {
            if (this.state === 'REVEAL') {
                this.nextRound();
            }
        }, 1800);
    }

    onRoundTimeout() {
        try {
            this.audio.playTimeout();
        } catch (e) {
            console.warn('Audio error:', e);
        }
        this.revealAnswerAfterFailure();
    }

    revealAnswerAfterFailure() {
        this.state = 'REVEAL';
        this.activePlayer = null;
        if (this.roundScoreTimer) clearInterval(this.roundScoreTimer);
        this.stopAnswerCountdown();
        if (this.dom.arena) this.dom.arena.classList.remove('has-active-player');
        if (this.ai) this.ai.cancel();

        this.players[1].streak = 0;
        this.players[2].streak = 0;
        this.updateComboBadge(1, 0);
        this.updateComboBadge(2, 0);

        for (let i = 1; i <= 2; i++) {
            this.setPlayerKeypadActive(i, false);
            this.setPlayerStatus(i, 'РАУНД ОКОНЧЕН', 'idle');
        }

        this.dom.p1BuzzBtn.disabled = true;
        this.dom.p2BuzzBtn.disabled = true;
        this.dom.p1BuzzBtn.classList.remove('pulse');
        this.dom.p2BuzzBtn.classList.remove('pulse');

        this.setBoardFeedback(`ПРАВИЛЬНЫЙ ОТВЕТ: ${this.currentQuestion.answer}`, 'neutral');
        this.dom.boardHint.textContent = this.currentQuestion.hint;

        setTimeout(() => {
            if (this.state === 'REVEAL') {
                this.nextRound();
            }
        }, 1800);
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
            this.seriesScore[1]++;
            winnerName = `ПОБЕДИТЕЛЬ: ${this.players[1].name}!`;
            winnerSub = `С преимуществом в ${s1 - s2} очков`;
        } else if (s2 > s1) {
            this.seriesScore[2]++;
            winnerName = `ПОБЕДИТЕЛЬ: ${this.players[2].name}!`;
            winnerSub = `С преимуществом в ${s2 - s1} очков`;
        } else {
            winnerName = 'НИЧЬЯ!';
            winnerSub = `Оба участника набрали по ${s1} очков!`;
        }

        // Save series score & update UI
        localStorage.setItem('root_duel_series', JSON.stringify(this.seriesScore));
        this.updateSeriesUI();

        // High score for 1P or endless
        if (s1 > this.highScore) {
            this.highScore = s1;
            localStorage.setItem('root_duel_high_score', this.highScore.toString());
            winnerSub += ` • 🏆 НОВЫЙ РЕКОРД: ${this.highScore}!`;
        }

        this.dom.winnerText.textContent = winnerName;
        this.dom.winnerSubtitle.textContent = winnerSub;

        // Statistics
        const calcAvgReact = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) + 'с' : '—';

        this.dom.p1FinalScore.textContent = s1;
        this.dom.p2FinalScore.textContent = s2;
        if (this.dom.p1FinalStreak) this.dom.p1FinalStreak.textContent = `x${this.players[1].maxStreak || 0}`;
        if (this.dom.p2FinalStreak) this.dom.p2FinalStreak.textContent = `x${this.players[2].maxStreak || 0}`;
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

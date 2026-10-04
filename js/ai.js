/**
 * ROOT DUEL - AI Opponent Engine
 * Simulates human-like reaction time, buzz decisions, typing speed, and realistic errors.
 */

class AIOpponent {
    constructor(game) {
        this.game = game;
        this.buzzTimer = null;
        this.typingTimer = null;
        this.difficulty = 'normal'; // 'easy' | 'normal' | 'hard'
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    // Schedule buzz attempt when a new round starts
    onRoundStart(question) {
        this.cancel();
        if (this.game.mode !== '1p') return;

        // Reaction delay based on difficulty
        let minDelay, maxDelay, accuracy;
        if (this.difficulty === 'easy') {
            minDelay = 3200;
            maxDelay = 6000;
            accuracy = 0.65;
        } else if (this.difficulty === 'normal') {
            minDelay = 2000;
            maxDelay = 3800;
            accuracy = 0.85;
        } else { // Hard
            minDelay = 950;
            maxDelay = 2200;
            accuracy = 0.96;
        }

        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        const willBeCorrect = Math.random() < accuracy;

        this.buzzTimer = setTimeout(() => {
            // Check if game is still in playing state
            if (this.game.state === 'PLAYING') {
                this.executeBuzz(question, willBeCorrect);
            }
        }, delay);
    }

    // AI buzzes in
    executeBuzz(question, willBeCorrect) {
        const buzzed = this.game.onPlayerBuzz(2); // Player 2 is AI
        if (!buzzed) return;

        // Decide answer
        let targetAnswer = question.answer;
        if (!willBeCorrect) {
            // Generate a plausible wrong answer (e.g. answer ± 1 or 2, or answer squared)
            const delta = Math.random() < 0.5 ? 1 : -1;
            targetAnswer = question.answer + delta;
            if (targetAnswer === question.answer) targetAnswer += 2;
        }

        // Simulate typing character by character
        const strAns = targetAnswer.toString();
        let currentIdx = 0;
        this.game.updatePlayerInput(2, '');

        const typeNextChar = () => {
            if (this.game.state !== 'ANSWERING' || this.game.activePlayer !== 2) return;

            if (currentIdx < strAns.length) {
                const char = strAns[currentIdx];
                this.game.appendPlayerInput(2, char);
                currentIdx++;
                this.typingTimer = setTimeout(typeNextChar, 180 + Math.random() * 140);
            } else {
                // Done typing, submit after short pause
                this.typingTimer = setTimeout(() => {
                    if (this.game.state === 'ANSWERING' && this.game.activePlayer === 2) {
                        this.game.submitPlayerAnswer(2);
                    }
                }, 250);
            }
        };

        // Delay slightly before starting to type
        this.typingTimer = setTimeout(typeNextChar, 350);
    }

    // If human failed, AI gets a rebound chance
    onRebound(question) {
        this.cancel();
        if (this.game.mode !== '1p') return;

        const delay = 1200 + Math.random() * 1500;
        this.buzzTimer = setTimeout(() => {
            if (this.game.state === 'PLAYING') {
                const willBeCorrect = Math.random() < 0.8;
                this.executeBuzz(question, willBeCorrect);
            }
        }, delay);
    }

    cancel() {
        if (this.buzzTimer) {
            clearTimeout(this.buzzTimer);
            this.buzzTimer = null;
        }
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }
}

window.AIOpponent = AIOpponent;

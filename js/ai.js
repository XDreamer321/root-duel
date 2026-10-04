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
        if (this.game.mode !== '1p' || document.hidden) return;

        // Extra cognitive calculation delay based on question complexity
        let complexityBonus = 0;
        if (question) {
            if (question.category === 'expressions') {
                complexityBonus = 600 + Math.random() * 800; // Expressions take extra thinking
            } else if (question.category === 'roots_cb') {
                complexityBonus = 300 + Math.random() * 500;
            } else if (question.difficulty === 'hard') {
                complexityBonus = 400 + Math.random() * 600;
            }
        }

        // Reaction delay based on difficulty
        let minDelay, maxDelay, accuracy;
        if (this.difficulty === 'easy') {
            minDelay = 4000;
            maxDelay = 6800;
            accuracy = 0.55;
        } else if (this.difficulty === 'normal') {
            minDelay = 2600;
            maxDelay = 4400;
            accuracy = 0.75;
        } else { // Hard (fair & challenging, giving human player real chance to solve)
            minDelay = 1900;
            maxDelay = 3200;
            accuracy = 0.85;
        }

        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay + Math.floor(complexityBonus);
        const willBeCorrect = Math.random() < accuracy;

        this.buzzTimer = setTimeout(() => {
            // Check if game is still in playing state and page is active
            if (this.game.state === 'PLAYING' && !document.hidden) {
                this.executeBuzz(question, willBeCorrect);
            }
        }, delay);
    }

    // AI buzzes in
    executeBuzz(question, willBeCorrect) {
        if (document.hidden) return;
        const buzzed = this.game.onPlayerBuzz(2); // Player 2 is AI
        if (!buzzed) return;

        // Decide answer
        let targetAnswer = question.answer;
        if (!willBeCorrect) {
            // Generate a plausible wrong answer (e.g. answer ± 1 or 2)
            const delta = Math.random() < 0.5 ? 1 : -1;
            targetAnswer = question.answer + delta;
            if (targetAnswer === question.answer) targetAnswer += 2;
        }

        // Simulate typing character by character with human pauses
        const strAns = targetAnswer.toString();
        let currentIdx = 0;
        this.game.updatePlayerInput(2, '');

        const typeNextChar = () => {
            if (this.game.state !== 'ANSWERING' || this.game.activePlayer !== 2 || document.hidden) return;

            if (currentIdx < strAns.length) {
                const char = strAns[currentIdx];
                this.game.appendPlayerInput(2, char);
                currentIdx++;
                this.typingTimer = setTimeout(typeNextChar, 220 + Math.random() * 160);
            } else {
                // Done typing, pause before pressing submit
                this.typingTimer = setTimeout(() => {
                    if (this.game.state === 'ANSWERING' && this.game.activePlayer === 2 && !document.hidden) {
                        this.game.submitPlayerAnswer(2);
                    }
                }, 320 + Math.random() * 180);
            }
        };

        // Delay before AI starts typing (human reading & keypad locating hesitation)
        this.typingTimer = setTimeout(typeNextChar, 420 + Math.random() * 200);
    }

    // If human failed, AI gets a rebound chance
    onRebound(question) {
        this.cancel();
        if (this.game.mode !== '1p' || document.hidden) return;

        const delay = 1600 + Math.random() * 1400;
        this.buzzTimer = setTimeout(() => {
            if (this.game.state === 'PLAYING' && !document.hidden) {
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

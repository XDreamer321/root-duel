/**
 * ROOT DUEL - Web Audio API Synthesizer
 * High-performance, zero-dependency procedural audio engine for TV studio effects.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 0.8;
        this.initialized = false;
        
        // Restore mute preference
        const savedMute = localStorage.getItem('root_duel_muted');
        if (savedMute !== null) {
            this.muted = savedMute === 'true';
        }

        // Handle page visibility and backgrounding on mobile/desktop
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.suspend();
            } else {
                this.resume();
            }
        });
        window.addEventListener('pagehide', () => this.suspend());
        window.addEventListener('freeze', () => this.suspend());
    }

    init() {
        if (document.hidden) return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended' && !document.hidden) {
            this.ctx.resume().catch(() => {});
        }
    }

    suspend() {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended' && !this.muted && !document.hidden) {
            this.ctx.resume().catch(() => {});
        }
    }

    setMuted(muted) {
        this.muted = muted;
        localStorage.setItem('root_duel_muted', muted);
        if (muted) {
            this.suspend();
        }
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    // Generic tone helper
    playTone(freq, duration, type = 'sine', gainVal = 0.3, delay = 0) {
        if (this.muted || document.hidden) return;
        try {
            this.init();
            if (!this.ctx || this.ctx.state !== 'running') return;

            const startTime = this.ctx.currentTime + delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(gainVal * this.volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch (e) {
            console.warn('Audio playTone error:', e);
        }
    }

    // UI Click sound (crisp tap)
    playClick() {
        if (this.muted || document.hidden) return;
        try {
            this.init();
            if (!this.ctx || this.ctx.state !== 'running') return;

            const startTime = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, startTime);
            osc.frequency.exponentialRampToValueAtTime(200, startTime + 0.04);

            gain.gain.setValueAtTime(0.2 * this.volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.04);
        } catch (e) {
            console.warn('Audio playClick error:', e);
        }
    }

    // Keypad number tap
    playKeyTap(num = 5) {
        if (this.muted || document.hidden) return;
        try {
            const baseFreq = 440 + (num * 30);
            this.playTone(baseFreq, 0.05, 'sine', 0.15);
        } catch (e) {
            console.warn('Audio playKeyTap error:', e);
        }
    }

    // Buzz-in sound (dramatic TV show buzz)
    playBuzzIn(player = 1) {
        if (this.muted || document.hidden) return;
        try {
            this.init();
            if (!this.ctx || this.ctx.state !== 'running') return;

            const startTime = this.ctx.currentTime;
            const freq = player === 1 ? 520 : 680;
            
            // Two-tone punch
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'triangle';

            osc1.frequency.setValueAtTime(freq, startTime);
            osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.12);

            osc2.frequency.setValueAtTime(freq * 1.25, startTime);
            osc2.frequency.exponentialRampToValueAtTime(freq * 1.8, startTime + 0.12);

            gain.gain.setValueAtTime(0.4 * this.volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(startTime);
            osc2.start(startTime);
            osc1.stop(startTime + 0.22);
            osc2.stop(startTime + 0.22);
        } catch (e) {
            console.warn('Audio playBuzzIn error:', e);
        }
    }

    // Countdown beeps (3, 2, 1, GO)
    playCountdown(isFinal = false) {
        if (this.muted || document.hidden) return;
        if (isFinal) {
            // High GO fanfare note
            this.playTone(880, 0.45, 'triangle', 0.4);
            this.playTone(1320, 0.45, 'sine', 0.25);
        } else {
            // Mid beep
            this.playTone(440, 0.15, 'sine', 0.3);
        }
    }

    // Timer tick (subtle studio clock)
    playTick() {
        if (this.muted || document.hidden) return;
        this.playTone(900, 0.03, 'sine', 0.05);
    }

    // Correct Answer - joyful TV arpeggio
    playCorrect() {
        if (this.muted || document.hidden) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            this.playTone(freq, 0.25, 'triangle', 0.25, idx * 0.07);
            this.playTone(freq * 2, 0.2, 'sine', 0.1, idx * 0.07);
        });
    }

    // Wrong Answer - TV error buzzer
    playWrong() {
        if (this.muted || document.hidden) return;
        try {
            this.init();
            if (!this.ctx || this.ctx.state !== 'running') return;

            const startTime = this.ctx.currentTime;
            const duration = 0.35;
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc2.type = 'sawtooth';

            osc.frequency.setValueAtTime(140, startTime);
            osc2.frequency.setValueAtTime(147, startTime); // dissonant minor second

            gain.gain.setValueAtTime(0.35 * this.volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc2.start(startTime);
            osc.stop(startTime + duration);
            osc2.stop(startTime + duration);
        } catch (e) {
            console.warn('Audio playWrong error:', e);
        }
    }

    // Time-out buzzer
    playTimeout() {
        if (this.muted || document.hidden) return;
        this.playWrong();
    }

    // Victory Fanfare
    playVictory() {
        if (this.muted || document.hidden) return;
        const melody = [
            { f: 523.25, d: 0.15, delay: 0.0 },   // C5
            { f: 659.25, d: 0.15, delay: 0.15 },  // E5
            { f: 783.99, d: 0.15, delay: 0.30 },  // G5
            { f: 1046.50, d: 0.45, delay: 0.45 }, // C6
            { f: 880.00, d: 0.20, delay: 0.90 },  // A5
            { f: 1046.50, d: 0.60, delay: 1.10 }  // C6 grand finale
        ];

        melody.forEach(note => {
            this.playTone(note.f, note.d, 'triangle', 0.3, note.delay);
            this.playTone(note.f * 1.5, note.d, 'sine', 0.15, note.delay);
        });
    }
}

// Global audio engine singleton
window.soundEngine = new SoundEngine();

// Sound and Music System using Web Audio API
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        this.musicOscillators = [];
        this.musicInterval = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            
            this.masterGain.connect(this.audioContext.destination);
            this.musicGain.connect(this.masterGain);
            
            this.masterGain.gain.value = this.soundEnabled ? 0.3 : 0;
            this.musicGain.gain.value = this.musicEnabled ? 0.15 : 0;
            
            this.initialized = true;
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // Jump sound - cheerful bounce
    playJump() {
        if (!this.soundEnabled || !this.initialized) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.type = 'sine';
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // Score sound - positive ping
    playScore() {
        if (!this.soundEnabled || !this.initialized) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc.type = 'sine';
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    // Game Over sound - descending tone
    playGameOver() {
        if (!this.soundEnabled || !this.initialized) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        osc.type = 'sawtooth';
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    // Background music - simple pleasant melody
    startMusic() {
        if (!this.musicEnabled || !this.initialized) return;
        
        this.stopMusic();
        
        const melody = [
            { freq: 523.25, duration: 0.4 }, // C5
            { freq: 587.33, duration: 0.4 }, // D5
            { freq: 659.25, duration: 0.4 }, // E5
            { freq: 587.33, duration: 0.4 }, // D5
            { freq: 523.25, duration: 0.4 }, // C5
            { freq: 392.00, duration: 0.4 }, // G4
            { freq: 440.00, duration: 0.4 }, // A4
            { freq: 493.88, duration: 0.4 }, // B4
        ];
        
        let noteIndex = 0;
        
        const playNote = () => {
            if (!this.musicEnabled) return;
            
            const note = melody[noteIndex % melody.length];
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.frequency.value = note.freq;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + note.duration);
            
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + note.duration);
            
            noteIndex++;
        };
        
        playNote();
        this.musicInterval = setInterval(playNote, 450);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.musicOscillators = [];
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('soundEnabled', this.soundEnabled);
        
        if (this.initialized) {
            this.masterGain.gain.value = this.soundEnabled ? 0.3 : 0;
        }
        
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('musicEnabled', this.musicEnabled);
        
        if (this.initialized) {
            this.musicGain.gain.value = this.musicEnabled ? 0.15 : 0;
        }
        
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        
        return this.musicEnabled;
    }

    isSoundEnabled() {
        return this.soundEnabled;
    }

    isMusicEnabled() {
        return this.musicEnabled;
    }
}

// Create global sound system instance
const soundSystem = new SoundSystem();


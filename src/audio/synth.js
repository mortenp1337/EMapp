class Synth {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.oscillators = new Map();
    this.masterGain = this.ctx.createGain();
    
    // Create analyzers
    this.waveformAnalyzer = this.ctx.createAnalyser();
    this.waveformAnalyzer.fftSize = 2048;
    
    this.spectrumAnalyzer = this.ctx.createAnalyser();
    this.spectrumAnalyzer.fftSize = 2048;
    
    this.spectrogramAnalyzer = this.ctx.createAnalyser();
    this.spectrogramAnalyzer.fftSize = 2048;
    
    this.phaseScopeAnalyzer = this.ctx.createAnalyser();
    this.phaseScopeAnalyzer.fftSize = 2048;
    
    // Connect analyzers in parallel
    this.masterGain.connect(this.waveformAnalyzer);
    this.masterGain.connect(this.spectrumAnalyzer);
    this.masterGain.connect(this.spectrogramAnalyzer);
    this.masterGain.connect(this.phaseScopeAnalyzer);
    this.masterGain.connect(this.ctx.destination);
    
    this.settings = {};
    
    // Create filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.connect(this.masterGain);
    
    // Create phaser
    this.createPhaser();

    // Set initial master volume
    this.masterGain.gain.value = 0.75;
  }

  createPhaser() {
    const allpass = this.ctx.createBiquadFilter();
    allpass.type = 'allpass';
    this.phaser = {
      oscillator: this.ctx.createOscillator(),
      gain: this.ctx.createGain(),
      filter: allpass
    };
    
    this.phaser.oscillator.connect(this.phaser.gain);
    this.phaser.gain.connect(this.phaser.filter.frequency);
    this.phaser.filter.connect(this.masterGain);
    
    this.phaser.oscillator.start();
  }

  updateSettings(settings) {
    this.settings = settings;
    
    // Update filter
    if (settings.filter) {
      this.filter.frequency.value = settings.filter.cutoff;
      this.filter.Q.value = settings.filter.resonance * 30;
    }
    
    // Update phaser
    if (settings.phaser) {
      this.phaser.oscillator.frequency.value = settings.phaser.rate;
      this.phaser.gain.gain.value = settings.phaser.depth * 1000;
      this.phaser.filter.Q.value = settings.phaser.feedback * 10;
    }
  }

  createOscillator(frequency, settings, envelope) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = settings.waveType;
    osc.frequency.value = frequency;
    gainNode.gain.value = 0;
    
    osc.connect(gainNode);
    gainNode.connect(this.filter);
    
    const now = this.ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(settings.gain, now + envelope.attack);
    gainNode.gain.linearRampToValueAtTime(settings.gain * envelope.sustain, now + envelope.attack + envelope.decay);
    
    osc.start();
    return { osc, gainNode };
  }

  noteOn(note) {
    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    
    const osc1 = this.createOscillator(frequency, this.settings.osc1, this.settings.osc1.envelope);
    const osc2 = this.createOscillator(frequency, this.settings.osc2, this.settings.osc2.envelope);
    
    this.oscillators.set(note, { osc1, osc2 });
  }

  noteOff(note) {
    const oscillators = this.oscillators.get(note);
    if (!oscillators) return;

    const now = this.ctx.currentTime;
    const release1 = this.settings.osc1.envelope.release;
    const release2 = this.settings.osc2.envelope.release;
    
    oscillators.osc1.gainNode.gain.setValueAtTime(oscillators.osc1.gainNode.gain.value, now);
    oscillators.osc1.gainNode.gain.linearRampToValueAtTime(0, now + release1);
    oscillators.osc2.gainNode.gain.setValueAtTime(oscillators.osc2.gainNode.gain.value, now);
    oscillators.osc2.gainNode.gain.linearRampToValueAtTime(0, now + release2);
    
    setTimeout(() => {
      oscillators.osc1.osc.stop();
      oscillators.osc2.osc.stop();
      this.oscillators.delete(note);
    }, Math.max(release1, release2) * 1000);
  }

  dispose() {
    this.oscillators.forEach(osc => {
      osc.osc1.osc.stop();
      osc.osc2.osc.stop();
    });
    this.oscillators.clear();
    this.phaser.oscillator.stop();
  }

  setMasterVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }

  getAnalyzerData(analyzer, isWaveform = false) {
    const bufferLength = isWaveform ? 
      analyzer.frequencyBinCount : 
      analyzer.frequencyBinCount;
    
    const dataArray = isWaveform ?
      new Float32Array(bufferLength) :
      new Uint8Array(bufferLength);
    
    if (isWaveform) {
      analyzer.getFloatTimeDomainData(dataArray);
    } else {
      analyzer.getByteFrequencyData(dataArray);
    }
    
    return dataArray;
  }

  getWaveformData() {
    return this.getAnalyzerData(this.waveformAnalyzer, true);
  }

  getSpectrumData() {
    return this.getAnalyzerData(this.spectrumAnalyzer);
  }

  getSpectrogramData() {
    return this.getAnalyzerData(this.spectrogramAnalyzer);
  }

  getPhaseScopeData() {
    return this.getAnalyzerData(this.phaseScopeAnalyzer, true);
  }
}

export function createSynth(settings) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const synth = new Synth(audioContext);
  synth.updateSettings(settings);
  return synth;
}
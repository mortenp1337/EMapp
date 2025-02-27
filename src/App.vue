<template>
  <div class="synth">
    <div class="master-controls">
      <button class="mute-button" :class="{ muted: isMuted }" @click="toggleMute">
        {{ isMuted ? 'Unmute' : 'Mute' }}
      </button>
      <div class="volume-control">
        <label>Master Volume</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          v-model="masterVolume"
          :disabled="isMuted"
        >
        <span class="value">{{ Math.round(masterVolume * 100) }}%</span>
      </div>
    </div>
    <div class="main-content">
      <div class="left-panel">
        <div class="oscillators">
          <Oscillator :id="1" v-model="osc1Settings" />
          <Oscillator :id="2" v-model="osc2Settings" />
        </div>
        <div class="effects">
          <Filter v-model="filterSettings" />
          <Phaser v-model="phaserSettings" />
        </div>
      </div>
      <div class="right-panel">
        <div class="visualizer-group">
          <div class="visualizer">
            <h3>Waveform</h3>
            <canvas ref="waveformCanvas" class="analyzer-canvas"></canvas>
          </div>
          <div class="visualizer">
            <h3>Frequency Spectrum</h3>
            <canvas ref="spectrumCanvas" class="analyzer-canvas"></canvas>
          </div>
        </div>
        <div class="visualizer-group">
          <div class="visualizer">
            <h3>Spectrogram</h3>
            <canvas ref="spectrogramCanvas" class="analyzer-canvas"></canvas>
          </div>
          <div class="visualizer">
            <h3>Phase Scope</h3>
            <canvas ref="phaseScopeCanvas" class="analyzer-canvas"></canvas>
          </div>
        </div>
      </div>
    </div>
    <Keyboard @noteOn="handleNoteOn" @noteOff="handleNoteOff" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Oscillator from './components/Oscillator.vue'
import Filter from './components/Filter.vue'
import Phaser from './components/Phaser.vue'
import Keyboard from './components/Keyboard.vue'
import { createSynth } from './audio/synth'

const waveformCanvas = ref(null)
const spectrumCanvas = ref(null)
const spectrogramCanvas = ref(null)
const phaseScopeCanvas = ref(null)

const osc1Settings = ref({
  waveType: 'saw',
  gain: 0.5,
  envelope: {
    attack: 0.39,
    decay: 0.45,
    sustain: 0.22,
    release: 1.48
  }
})

const osc2Settings = ref({
  waveType: 'sine',
  gain: 0.5,
  envelope: {
    attack: 0.1,
    decay: 0.3,
    sustain: 0.7,
    release: 0.2
  }
})

const filterSettings = ref({
  cutoff: 5000,
  resonance: 0.7,
  enabled: true
})

const phaserSettings = ref({
  rate: 2,
  depth: 0.7,
  feedback: 0.5,
  enabled: true
})

const masterVolume = ref(0.75)
const isMuted = ref(false)
const previousVolume = ref(0.75)

let synth
let animationFrame

const initVisualizers = () => {
  const canvases = [waveformCanvas, spectrumCanvas, spectrogramCanvas, phaseScopeCanvas]
  canvases.forEach(canvas => {
    if (canvas.value) {
      canvas.value.width = canvas.value.clientWidth
      canvas.value.height = canvas.value.clientHeight
    }
  })
}

const drawWaveform = (ctx, data) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const sliceWidth = width / data.length

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, width, height)

  // Draw grid
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += width/10) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += height/10) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.strokeStyle = '#4CAF50'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  for (let i = 0; i < data.length; i++) {
    const x = i * sliceWidth
    const y = (data[i] + 1) / 2 * height
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  
  ctx.stroke()
}

const drawSpectrum = (ctx, data) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const barWidth = width / data.length

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, width, height)

  // Draw grid
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += width/10) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += height/10) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.fillStyle = '#4CAF50'
  for (let i = 0; i < data.length; i++) {
    const barHeight = (data[i] / 255) * height
    ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight)
  }
}

const spectrogramData = []
const drawSpectrogram = (ctx, data) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  
  spectrogramData.push(data)
  if (spectrogramData.length > width) {
    spectrogramData.shift()
  }

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, width, height)

  const binHeight = height / data.length
  spectrogramData.forEach((column, x) => {
    column.forEach((value, y) => {
      const intensity = value / 255
      const color = `hsl(${120 * (1 - intensity)}, 100%, ${intensity * 50}%)`
      ctx.fillStyle = color
      ctx.fillRect(x, y * binHeight, 1, binHeight)
    })
  })
}

const drawPhaseScope = (ctx, data) => {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, width, height)

  // Draw grid
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += width/10) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += height/10) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.strokeStyle = '#4CAF50'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  for (let i = 0; i < data.length - 1; i += 2) {
    const x = (data[i] + 1) / 2 * width
    const y = (data[i + 1] + 1) / 2 * height
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  
  ctx.stroke()
}

const toggleMute = () => {
  if (!isMuted.value) {
    previousVolume.value = masterVolume.value
    masterVolume.value = 0
  } else {
    masterVolume.value = previousVolume.value
  }
  isMuted.value = !isMuted.value
  synth?.setMasterVolume(masterVolume.value)
}

watch(masterVolume, (newValue) => {
  synth?.setMasterVolume(newValue)
})

const animate = () => {
  if (!synth) return
  
  const waveCtx = waveformCanvas.value?.getContext('2d')
  const specCtx = spectrumCanvas.value?.getContext('2d')
  const spectroCtx = spectrogramCanvas.value?.getContext('2d')
  const phaseCtx = phaseScopeCanvas.value?.getContext('2d')

  if (waveCtx) drawWaveform(waveCtx, synth.getWaveformData())
  if (specCtx) drawSpectrum(specCtx, synth.getSpectrumData())
  if (spectroCtx) drawSpectrogram(spectroCtx, synth.getSpectrogramData())
  if (phaseCtx) drawPhaseScope(phaseCtx, synth.getPhaseScopeData())
  
  animationFrame = requestAnimationFrame(animate)
}

onMounted(() => {
  synth = createSynth({
    osc1: osc1Settings.value,
    osc2: osc2Settings.value,
    filter: filterSettings.value,
    phaser: phaserSettings.value
  })
  synth.setMasterVolume(masterVolume.value)
  initVisualizers()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
  synth?.dispose()
})

const handleNoteOn = (note) => {
  synth?.noteOn(note)
}

const handleNoteOff = (note) => {
  synth?.noteOff(note)
}
</script>

<style>
.synth {
  background-color: #1e1e1e;
  padding: 20px;
  border-radius: 8px;
  color: white;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.main-content {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.left-panel {
  flex: 2;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.oscillators {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.effects {
  margin-bottom: 20px;
}

.visualizer-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.visualizer {
  background: #2c2c2c;
  padding: 15px;
  border-radius: 6px;
}

.analyzer-canvas {
  width: 100%;
  height: 150px;
  background: #1a1a1a;
  border: 1px solid #3c3c3c;
  margin-top: 10px;
}

h3 {
  font-size: 0.9em;
  font-weight: normal;
  margin: 0;
}

.master-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px;
  background: var(--secondary-bg);
  border-radius: 6px;
  margin-bottom: 20px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.volume-control label {
  min-width: 100px;
}

.volume-control .value {
  min-width: 45px;
  font-size: 0.9em;
}

.mute-button {
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.mute-button:hover {
  background: var(--accent-color-dark);
}

.mute-button.muted {
  background: #c62828;
}

.mute-button.muted:hover {
  background: #b71c1c;
}
</style>
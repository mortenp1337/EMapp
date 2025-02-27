<template>
  <div class="oscillator">
    <div class="header">
      <h3>OSC {{ id }}</h3>
      <label class="enable-control">
        <input type="checkbox" v-model="localSettings.enabled">
        Enabled
      </label>
    </div>
    <div class="controls">
      <div class="control-group">
        <div class="wave-type">
          <label>Wave Type</label>
          <select v-model="localSettings.waveType">
            <option value="saw">Saw</option>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>
        <div class="gain">
          <label>Gain</label>
          <input type="range" min="0" max="1" step="0.01" v-model="localSettings.gain">
          <span class="value">{{ localSettings.gain.toFixed(2) }}</span>
        </div>
      </div>
      <div class="adsr-envelope">
        <h4>ADSR Envelope {{ id }}</h4>
        <div class="envelope-graph" ref="envelopeGraph"></div>
        <div class="envelope-controls">
          <div class="env-control">
            <label>Attack (s)</label>
            <input type="range" min="0" max="2" step="0.01" v-model="localSettings.envelope.attack">
            <span class="value">{{ localSettings.envelope.attack }}s</span>
          </div>
          <div class="env-control">
            <label>Decay (s)</label>
            <input type="range" min="0" max="2" step="0.01" v-model="localSettings.envelope.decay">
            <span class="value">{{ localSettings.envelope.decay }}s</span>
          </div>
          <div class="env-control">
            <label>Sustain</label>
            <input type="range" min="0" max="1" step="0.01" v-model="localSettings.envelope.sustain">
            <span class="value">{{ localSettings.envelope.sustain.toFixed(2) }}</span>
          </div>
          <div class="env-control">
            <label>Release (s)</label>
            <input type="range" min="0" max="5" step="0.01" v-model="localSettings.envelope.release">
            <span class="value">{{ localSettings.envelope.release }}s</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  id: Number,
  modelValue: Object
})

const emit = defineEmits(['update:modelValue'])
const envelopeGraph = ref(null)
const localSettings = ref({ 
  enabled: true,
  ...props.modelValue 
})

const drawEnvelopeGraph = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const width = envelopeGraph.value.clientWidth
  const height = envelopeGraph.value.clientHeight
  
  canvas.width = width
  canvas.height = height
  
  // Draw grid
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = 1
  
  // Vertical grid lines
  for (let x = 0; x < width; x += width/10) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // Horizontal grid lines
  for (let y = 0; y < height; y += height/10) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // Draw envelope
  const env = localSettings.value.envelope
  const attackWidth = (env.attack / 2) * width * 0.2
  const decayWidth = (env.decay / 2) * width * 0.2
  const releaseWidth = (env.release / 5) * width * 0.4
  
  ctx.strokeStyle = '#4CAF50'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, height)
  
  // Attack
  ctx.lineTo(attackWidth, 0)
  
  // Decay
  ctx.lineTo(attackWidth + decayWidth, height * (1 - env.sustain))
  
  // Sustain
  ctx.lineTo(width - releaseWidth, height * (1 - env.sustain))
  
  // Release
  ctx.lineTo(width, height)
  
  ctx.stroke()
  
  if (envelopeGraph.value.firstChild) {
    envelopeGraph.value.removeChild(envelopeGraph.value.firstChild)
  }
  envelopeGraph.value.appendChild(canvas)
}

watch(localSettings, () => {
  drawEnvelopeGraph()
  emit('update:modelValue', localSettings.value)
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  localSettings.value = { 
    enabled: localSettings.value.enabled,
    ...newValue 
  }
}, { deep: true })

onMounted(() => {
  drawEnvelopeGraph()
})
</script>

<style scoped>
.oscillator {
  background: #2c2c2c;
  padding: 15px;
  border-radius: 6px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.enable-control {
  display: flex;
  align-items: center;
  gap: 5px;
}

.control-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.env-control {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.value {
  font-size: 0.8em;
  opacity: 0.8;
  min-width: 45px;
  text-align: right;
}

.envelope-graph {
  height: 120px;
  background: #1a1a1a;
  border: 1px solid #3c3c3c;
  margin: 10px 0;
  border-radius: 4px;
}

.envelope-controls {
  display: grid;
  gap: 10px;
}

h3, h4 {
  margin: 0;
  font-weight: normal;
}

label {
  font-size: 0.9em;
  opacity: 0.9;
}

input[type="range"] {
  width: 100%;
}

select {
  width: 100%;
  padding: 5px;
  background: #1a1a1a;
  color: white;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
}
</style>
<template>
  <div class="filter">
    <div class="header">
      <h3>Filter</h3>
      <label class="enable-control">
        <input type="checkbox" v-model="localSettings.enabled">
        Enabled
      </label>
    </div>
    <div class="filter-controls">
      <div class="control-group">
        <div class="control">
          <label>Cutoff Freq</label>
          <input type="range" min="20" max="20000" step="1" v-model="localSettings.cutoff">
          <span class="value">{{ localSettings.cutoff }}Hz</span>
        </div>
        <div class="control">
          <label>Resonance</label>
          <input type="range" min="0" max="1" step="0.01" v-model="localSettings.resonance">
          <span class="value">{{ localSettings.resonance.toFixed(2) }}</span>
        </div>
      </div>
    </div>
    <div class="filter-response" ref="filterResponse"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(['update:modelValue'])
const filterResponse = ref(null)
const localSettings = ref({ ...props.modelValue })

const drawFilterResponse = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const width = filterResponse.value.clientWidth
  const height = filterResponse.value.clientHeight
  
  canvas.width = width
  canvas.height = height
  
  // Draw grid
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = 1
  
  // Vertical grid lines (logarithmic for frequency)
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // Horizontal grid lines
  for (let i = 0; i <= 10; i++) {
    const y = (i / 10) * height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  if (!localSettings.value.enabled) return
  
  // Draw filter response curve
  ctx.strokeStyle = '#4CAF50'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  // Calculate frequency response
  for (let x = 0; x < width; x++) {
    const freq = Math.exp(Math.log(20) + (x / width) * Math.log(20000 / 20))
    let response = 1.0
    
    // Lowpass filter response approximation
    if (freq > localSettings.value.cutoff) {
      const octaves = Math.log2(freq / localSettings.value.cutoff)
      response = Math.pow(0.5, octaves + localSettings.value.resonance * 2)
    } else if (freq === localSettings.value.cutoff) {
      response = 1 + localSettings.value.resonance
    }
    
    const y = height - (response * height)
    if (x === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  
  ctx.stroke()
  
  // Draw cutoff frequency indicator
  const cutoffX = (Math.log(localSettings.value.cutoff / 20) / Math.log(1000)) * width
  ctx.strokeStyle = '#FF5252'
  ctx.beginPath()
  ctx.moveTo(cutoffX, 0)
  ctx.lineTo(cutoffX, height)
  ctx.stroke()
  
  if (filterResponse.value.firstChild) {
    filterResponse.value.removeChild(filterResponse.value.firstChild)
  }
  filterResponse.value.appendChild(canvas)
}

watch(localSettings, () => {
  drawFilterResponse()
  emit('update:modelValue', localSettings.value)
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  localSettings.value = { ...newValue }
}, { deep: true })

onMounted(() => {
  drawFilterResponse()
})
</script>

<style scoped>
.filter {
  background: #2c2c2c;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
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
  gap: 15px;
  margin-bottom: 15px;
}

.control {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.value {
  font-size: 0.8em;
  opacity: 0.8;
  min-width: 60px;
  text-align: right;
}

.filter-response {
  height: 150px;
  background: #1a1a1a;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
}

h3 {
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
</style>
<template>
  <div class="phaser">
    <div class="header">
      <h3>Phaser</h3>
      <label class="enable-control">
        <input type="checkbox" v-model="localSettings.enabled">
        Enabled
      </label>
    </div>
    <div class="phaser-controls">
      <div class="control">
        <label>Rate (Hz)</label>
        <input type="range" min="0.1" max="10" step="0.1" v-model="localSettings.rate">
        <span class="value">{{ localSettings.rate.toFixed(1) }}Hz</span>
      </div>
      <div class="control">
        <label>Depth</label>
        <input type="range" min="0" max="1" step="0.01" v-model="localSettings.depth">
        <span class="value">{{ localSettings.depth.toFixed(2) }}</span>
      </div>
      <div class="control">
        <label>Feedback</label>
        <input type="range" min="0" max="1" step="0.01" v-model="localSettings.feedback">
        <span class="value">{{ localSettings.feedback.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(['update:modelValue'])

const localSettings = ref({ ...props.modelValue })

watch(localSettings, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  localSettings.value = { ...newValue }
}, { deep: true })
</script>

<style scoped>
.phaser {
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

.phaser-controls {
  display: grid;
  gap: 15px;
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
  min-width: 45px;
  text-align: right;
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
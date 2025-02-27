<template>
  <div class="keyboard-container">
    <div class="keyboard-controls">
      <label>
        Octave Shift:
        <select v-model="octaveShift">
          <option v-for="n in 9" :key="n-4" :value="n-4">{{ n-4 }}</option>
        </select>
      </label>
    </div>
    <div class="keyboard" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
      <div 
        v-for="note in displayedNotes" 
        :key="note.midi"
        :class="['key', note.type, { active: activeNotes.has(note.midi) }]"
        @mousedown="handleNoteOn(note.midi)"
        @mouseenter="handleMouseEnter(note.midi)">
        <span class="note-label">{{ note.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['noteOn', 'noteOff'])
const activeNotes = ref(new Set())
const isMouseDown = ref(false)
const octaveShift = ref(0)

// Generate full piano range notes (A0 to C8)
const generateNotes = () => {
  const notes = []
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  // Start from A0 (MIDI note 21) to C8 (MIDI note 108)
  for (let midi = 21; midi <= 108; midi++) {
    const octave = Math.floor((midi - 12) / 12)
    const noteIndex = (midi - 12) % 12
    const noteName = noteNames[noteIndex]
    notes.push({
      midi,
      label: `${noteName}${octave}`,
      type: noteName.includes('#') ? 'black' : 'white'
    })
  }
  return notes
}

const allNotes = generateNotes()

// Show two octaves at a time, shifted by octaveShift
const displayedNotes = computed(() => {
  const startMidi = 60 + (octaveShift.value * 12) // Middle C (C4) + offset
  const endMidi = startMidi + 24 // Two octaves
  return allNotes.filter(note => note.midi >= startMidi && note.midi <= endMidi)
})

// Extended key mapping for two octaves
const keyMap = {
  // Lower octave
  'z': 0,  // C
  's': 1,  // C#
  'x': 2,  // D
  'd': 3,  // D#
  'c': 4,  // E
  'v': 5,  // F
  'g': 6,  // F#
  'b': 7,  // G
  'h': 8,  // G#
  'n': 9,  // A
  'j': 10, // A#
  'm': 11, // B
  // Upper octave
  ',': 12, // C
  'l': 13, // C#
  '.': 14, // D
  ';': 15, // D#
  '/': 16, // E
  // Upper keyboard row for black keys
  'q': 1,  // C#
  'w': 3,  // D#
  'e': 6,  // F#
  'r': 8,  // G#
  't': 10, // A#
  'y': 13, // C#
  'u': 15, // D#
}

const handleNoteOn = (midi) => {
  if (!activeNotes.value.has(midi)) {
    activeNotes.value.add(midi)
    emit('noteOn', midi)
    isMouseDown.value = true
  }
}

const handleNoteOff = (midi) => {
  if (activeNotes.value.has(midi)) {
    activeNotes.value.delete(midi)
    emit('noteOff', midi)
  }
}

const handleMouseEnter = (midi) => {
  if (isMouseDown.value) {
    handleNoteOn(midi)
  }
}

const handleMouseUp = () => {
  isMouseDown.value = false
  activeNotes.value.forEach(midi => {
    emit('noteOff', midi)
  })
  activeNotes.value.clear()
}

const handleKeyDown = (event) => {
  if (event.repeat) return
  const offset = keyMap[event.key]
  if (offset !== undefined) {
    const midi = 60 + (octaveShift.value * 12) + offset
    handleNoteOn(midi)
  }
}

const handleKeyUp = (event) => {
  const offset = keyMap[event.key]
  if (offset !== undefined) {
    const midi = 60 + (octaveShift.value * 12) + offset
    handleNoteOff(midi)
  }
}

const initMIDI = () => {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(
      (midiAccess) => {
        for (let input of midiAccess.inputs.values()) {
          input.onmidimessage = handleMIDIMessage
        }
      },
      (err) => {
        console.error('Failed to get MIDI access', err)
      }
    )
  } else {
    console.warn('MIDI not supported in this browser.')
  }
}

const handleMIDIMessage = (event) => {
  const [command, note, velocity] = event.data
  switch (command) {
    case 144: // Note on
      if (velocity > 0) {
        handleNoteOn(note)
      } else {
        handleNoteOff(note)
      }
      break
    case 128: // Note off
      handleNoteOff(note)
      break
    default:
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  initMIDI()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.keyboard-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.keyboard-controls {
  display: flex;
  gap: 20px;
  padding: 10px;
}

.keyboard-controls select {
  background: #2c2c2c;
  color: white;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  padding: 4px 8px;
}

.keyboard {
  display: flex;
  position: relative;
  height: 150px;
  margin: 20px 0;
  user-select: none;
  overflow-x: auto;
  padding-bottom: 20px;
}

.key {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  border: 1px solid #000;
  transition: background-color 0.1s;
}

.white {
  background: white;
  color: black;
  width: 40px;
  height: 100%;
  z-index: 1;
}

.black {
  background: black;
  color: white;
  width: 24px;
  height: 60%;
  margin: 0 -12px;
  z-index: 2;
}

.active {
  background: #4CAF50;
}

.note-label {
  font-size: 10px;
  pointer-events: none;
  position: absolute;
  bottom: 5px;
}

.white.active {
  background: #A5D6A7;
}

.black.active {
  background: #2E7D32;
}

/* Add scrollbar styling */
.keyboard::-webkit-scrollbar {
  height: 8px;
}

.keyboard::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

.keyboard::-webkit-scrollbar-thumb {
  background: #3c3c3c;
  border-radius: 4px;
}

.keyboard::-webkit-scrollbar-thumb:hover {
  background: #4c4c4c;
}
</style>

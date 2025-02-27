import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { initMIDI } from './components/Keyboard.vue'

createApp(App).mount('#app')

initMIDI()

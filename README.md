# EMapp - Web Synthesizer

A web-based synthesizer application built with Vue 3 and Web Audio API. This application provides an interactive audio synthesis experience directly in your browser.

## Features

- Interactive keyboard interface
- Oscillator with waveform control
- Audio filter manipulation
- Phaser effect
- Real-time sound synthesis

## Tech Stack

- Vue.js 3
- Vite
- Web Audio API

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

To run the development server:
```bash
npm run dev
```

### Building for Production

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Project Structure

- `src/` - Source code directory
  - `components/` - Vue components
    - `Keyboard.vue` - Piano keyboard interface
    - `Oscillator.vue` - Oscillator controls
    - `Filter.vue` - Audio filter controls
    - `Phaser.vue` - Phaser effect controls
  - `audio/` - Audio processing logic
    - `synth.js` - Core synthesizer functionality
  - `App.vue` - Main application component
  - `main.js` - Application entry point
# EMapp

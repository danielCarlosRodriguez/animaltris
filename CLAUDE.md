# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Vite project called "Animaltris" that features two main applications:

1. **Animaltris**: An AI-powered image generation game where users combine animal parts (head, body, accessory, place) to create hybrid creatures using Hugging Face models
2. **Ant Colony**: A simulation of ant colony optimization algorithm with desktop and mobile versions

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Architecture

### Entry Point & Navigation
- `src/main.jsx` renders the main `Menu` component
- `src/Menu.jsx` serves as the main navigation hub, detecting mobile vs desktop and routing to appropriate components
- The menu dynamically shows different options based on device type

### Main Applications

#### Animaltris (`src/components/animaltirs/`)
- `App.jsx` - Main component handling AI image generation with multiple Hugging Face models
- Uses environment variables `VITE_HF_TOKEN` and `VITE_HF_MODELS` for configuration
- Implements parallel image generation with error handling and retry logic for 503 responses
- Component structure: HeadSelector, BodySelector, AccessorySelector, PlaceSelector
- Data stored in `data/optionsData.js`

#### Ant Colony Simulation (`src/components/ant-colony/` and `src/components/ant-colony-mobile/`)
- Two versions: desktop (`ant-colony/`) and mobile-optimized (`ant-colony-mobile/`)
- Canvas-based simulation with configurable parameters
- Uses custom hooks (`useAntEngine.js`, `useAntEngineMobile.js`) for simulation logic
- Separate styling files for each version

### Technology Stack
- **React 19** with hooks-based architecture
- **Vite** for build tooling and dev server
- **Tailwind CSS v4** for styling
- **Canvas API** for ant colony visualization
- **Hugging Face Inference API** for AI image generation

### Code Style & Configuration
- ESLint configured with React hooks and refresh rules
- Custom rule: `no-unused-vars` ignores variables starting with uppercase (constants)
- Tailwind configured for content detection in HTML and JS/JSX files
- Uses system fonts and Google Fonts (Fredoka One for branding)

## Environment Setup

Create a `.env` file with:
```
VITE_HF_TOKEN=your_hugging_face_token
VITE_HF_MODELS=model1,model2,model3
```

## Key Features

- **Responsive Design**: Automatic mobile/desktop detection and appropriate component rendering
- **Multi-model AI Generation**: Parallel requests to multiple Hugging Face models with comparison results
- **Canvas Simulations**: Real-time ant colony algorithm visualization
- **Error Handling**: Comprehensive error states for API failures and network issues
- **Progressive Enhancement**: Graceful fallbacks for missing environment variables
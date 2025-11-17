# Setun - Balanced Ternary Computer Emulator

A faithful Electron-based emulator of the historic Setun computer, the world's first ternary (base-3) computer developed in the Soviet Union in 1958.

## Features

- **Program Editor**: Write programs using balanced ternary notation (-1, 0, +1)
- **Execution Controls**: Run, step, pause, and reset with adjustable execution speed
- **Real-time Visualization**: Watch registers and memory update as your program executes
- **Sample Programs**: Learn with built-in examples demonstrating ternary operations
- **Syntax Validation**: Immediate feedback on invalid ternary digits
- **Retro Aesthetic**: Amber and cyan color scheme inspired by classic computing terminals
- **Native Desktop App**: Cross-platform desktop application built with Electron
- **Keyboard Shortcuts**: Full menu system with keyboard shortcuts for quick access

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

### Install Dependencies

```bash
npm install
```

## Running the Application

### Development Mode
Run the app in development mode with DevTools open:

```bash
npm start
```

Or with the `--dev` flag for automatic DevTools:

```bash
npm run dev
```

### Web Version
You can also run it as a web app by opening `index.html` in a web browser, or serving it with a local HTTP server:

```bash
python3 -m http.server 8080
```

## Building the Application

Build standalone executables for your platform:

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win    # Windows (NSIS installer + portable)
npm run build:mac    # macOS (DMG + ZIP)
npm run build:linux  # Linux (AppImage + DEB)
```

Built applications will be in the `dist/` folder.

## Using the Application

### Loading Programs
1. Load an example program from the dropdown menu
2. Or write your own program in the editor

### Execution Controls
- **Run** (F5): Execute continuously at selected speed
- **Step** (F10): Execute one instruction at a time
- **Pause** (F6): Pause execution
- **Reset** (Ctrl/Cmd+R): Clear all state and start over

### Keyboard Shortcuts
- `Ctrl/Cmd+N`: New program
- `Ctrl/Cmd+S`: Save program
- `F5`: Run program
- `F10`: Step through program
- `F6`: Pause execution
- `Ctrl/Cmd+R`: Reset emulator
- `Ctrl/Cmd+Q`: Quit application

## Balanced Ternary

Setun uses balanced ternary digits:
- **-** or **−** represents -1
- **0** represents 0
- **+** or **1** represents +1

Example: `+0-` represents the values +1, 0, -1

## Architecture

The emulator includes:
- **Accumulator**: Main register for arithmetic operations
- **Program Counter**: Points to the current instruction
- **Instruction Register**: Holds the current instruction being executed
- **Memory**: 27 words of balanced ternary storage

## Example Programs

- **Addition**: Demonstrates adding ternary numbers
- **Multiplication**: Shows ternary multiplication
- **Conditional**: Illustrates conditional logic

## Technologies

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3 (with OKLCH color space)
- Google Fonts (JetBrains Mono, Inter)

## License

See LICENSE file for details.
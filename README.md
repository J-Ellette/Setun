# Setun - Balanced Ternary Computer Emulator

A faithful web-based emulator of the historic Setun computer, the world's first ternary (base-3) computer developed in the Soviet Union in 1958.

## Features

- **Program Editor**: Write programs using balanced ternary notation (-1, 0, +1)
- **Execution Controls**: Run, step, pause, and reset with adjustable execution speed
- **Real-time Visualization**: Watch registers and memory update as your program executes
- **Sample Programs**: Learn with built-in examples demonstrating ternary operations
- **Syntax Validation**: Immediate feedback on invalid ternary digits
- **Retro Aesthetic**: Amber and cyan color scheme inspired by classic computing terminals

## Getting Started

1. Open `index.html` in a web browser, or serve it with a local HTTP server:
   ```bash
   python3 -m http.server 8080
   ```

2. Load an example program from the dropdown or write your own

3. Use the controls:
   - **Run**: Execute continuously at selected speed
   - **Step**: Execute one instruction at a time
   - **Pause**: Pause execution
   - **Reset**: Clear all state and start over

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
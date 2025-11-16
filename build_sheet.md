# Build Sheet

A faithful emulator of the historic Setun computer, the world's first ternary (base-3) computer developed in the Soviet Union in 1958, allowing users to write, execute, and visualize balanced ternary programs.

**Experience Qualities**:
1. **Educational** - The interface should demystify ternary computing through clear visualizations and immediate feedback on how programs execute.
2. **Technical** - Honor the historical accuracy of Setun while providing modern tooling that computer scientists and enthusiasts expect from an emulator.
3. **Precise** - Every operation, register state, and memory value should be displayed with clarity, making the exotic balanced ternary system comprehensible.

**Complexity Level**: Light Application (multiple features with basic state)
  - This emulator combines program editing, execution control, and state visualization with moderate complexity, requiring persistent program storage and execution state management.

## Essential Features

### Program Editor (COMPLETE)
- **Functionality**: Text area for writing Setun programs in balanced ternary notation with immediate syntax validation
- **Purpose**: Enable users to write programs using the -1, 0, 1 trit system (balanced ternary)
- **Trigger**: User clicks into editor area or loads saved program
- **Progression**: Focus editor → Type program instructions → See syntax highlighting → Validate trits → Save program
- **Success criteria**: Programs save correctly, invalid trits are highlighted, previously saved programs can be loaded

### Execution Controls (COMPLETE)
- **Functionality**: Step-through debugging and continuous execution with speed control
- **Purpose**: Allow users to observe how ternary computation progresses instruction by instruction
- **Trigger**: User clicks Run, Step, or Reset buttons
- **Progression**: Load program → Click Step (single instruction) OR Click Run (continuous) → Observe state changes → Pause/Reset as needed
- **Success criteria**: Step executes one instruction, Run executes continuously, Reset clears all state, execution can be paused mid-run

### Register & Memory Visualization (COMPLETE)
- **Functionality**: Real-time display of all registers (accumulator, program counter, instruction register) and memory in balanced ternary
- **Purpose**: Make the internal state of the ternary computer visible and understandable
- **Trigger**: Any instruction execution updates the visualization
- **Progression**: Execute instruction → Registers update → Changed values highlight briefly → Memory cells reflect new state → User can inspect any memory address
- **Success criteria**: All state changes are immediately visible, recently changed values are highlighted, balanced ternary notation is clear and readable

### Sample Programs Library (COMPLETE)
- **Functionality**: Preloaded example programs demonstrating ternary operations
- **Purpose**: Teach users how to program in balanced ternary through working examples
- **Trigger**: User clicks Examples dropdown and selects a program
- **Progression**: Click Examples → Browse program list (addition, multiplication, conditional) → Select program → Editor loads with program → User can run immediately
- **Success criteria**: At least 3 example programs available, loading replaces current editor content, examples execute correctly

## Edge Case Handling (COMPLETE)

- **Invalid Trits**: Any character other than -1, 0, 1 (or their symbolic equivalents) is highlighted as error; program cannot execute until fixed
- **Memory Overflow**: Attempting to access memory beyond available space shows clear error message and halts execution
- **Infinite Loops**: Execution limit (max instructions) prevents browser hang; user notified when limit reached
- **Empty Program**: Run/Step buttons disabled when editor is empty or contains only whitespace
- **Concurrent Edits**: Editing during execution automatically pauses execution with visual feedback

## Design Direction (COMPLETE)

The design should feel precise and technical with a retro-computing aesthetic - think oscilloscope green or amber terminals meets modern development tools - celebrating the historical nature of Setun while providing clean, readable visualizations of exotic ternary states.

## Color Selection (COMPLETE)

Triadic (three equally spaced colors) - Using a technical triadic palette centered around computing history colors to represent the three ternary states (-1, 0, 1) with amber for nostalgia and precision.

- **Primary Color**: Deep slate `oklch(0.25 0.02 240)` - Communicates technical precision and computing history, main background for code and display panels
- **Secondary Colors**: Amber `oklch(0.75 0.15 75)` for ternary +1 state, Cyan `oklch(0.70 0.12 195)` for active elements, Magenta `oklch(0.65 0.18 330)` for ternary -1 state
- **Accent Color**: Bright amber `oklch(0.82 0.18 70)` - Attention-grabbing highlight for execution state, active instruction, and interactive controls
- **Foreground/Background Pairings**:
  - Background (Deep Slate `oklch(0.25 0.02 240)`): Light amber text `oklch(0.92 0.08 75)` - Ratio 11.2:1 ✓
  - Card (Darker Slate `oklch(0.20 0.02 240)`): Light amber text `oklch(0.92 0.08 75)` - Ratio 14.8:1 ✓
  - Primary (Deep Slate `oklch(0.25 0.02 240)`): Light amber text `oklch(0.92 0.08 75)` - Ratio 11.2:1 ✓
  - Secondary (Medium Slate `oklch(0.35 0.02 240)`): Light text `oklch(0.95 0.01 75)` - Ratio 7.8:1 ✓
  - Accent (Bright Amber `oklch(0.82 0.18 70)`): Dark slate text `oklch(0.20 0.02 240)` - Ratio 10.5:1 ✓
  - Muted (Dark Slate `oklch(0.30 0.02 240)`): Amber gray text `oklch(0.70 0.05 75)` - Ratio 5.2:1 ✓

## Font Selection (COMPLETE)

Typefaces should evoke monospaced computing terminals and technical documentation - clear, precise, and unambiguous for displaying exotic balanced ternary notation.

- **Typographic Hierarchy**:
  - H1 (Emulator Title): JetBrains Mono Bold/32px/tight letter spacing/-0.02em
  - H2 (Section Headers): JetBrains Mono Semibold/20px/normal spacing/0em
  - Code (Program & State): JetBrains Mono Regular/16px/1.6 line height/0em
  - Body (Labels & Help): Inter Regular/14px/1.5 line height/0em
  - Small (Status & Metadata): Inter Regular/12px/1.4 line height/0.01em

## Animations (COMPLETE)

Animations should be minimal and functional, primarily indicating state transitions and execution flow - think oscilloscope sweeps and register updates rather than decorative motion.

- **Purposeful Meaning**: Flash/pulse animations on register changes communicate execution progression; smooth transitions between execution states convey the deliberate, step-by-step nature of low-level computing
- **Hierarchy of Movement**: Highest priority to currently executing instruction highlight, secondary priority to changed register values, tertiary to UI control state changes

## Component Selection (COMPLETE)

- **Components**: 
  - `Textarea` for program editor with monospace styling
  - `Button` for execution controls (Run, Step, Pause, Reset) with distinct states
  - `Card` for register displays and memory viewer panels
  - `Select` for example program dropdown
  - `Separator` to divide editor, controls, and state visualization sections
  - `Badge` for displaying execution status (Running, Paused, Error, Halted)
  - `Tooltip` for explaining balanced ternary notation and control functions
  - `Tabs` for switching between Memory View and Help/Documentation
  - `ScrollArea` for memory display when many addresses are populated

- **Customizations**: 
  - Monospace textarea with syntax highlighting for ternary trits (-, 0, +)
  - Custom register display component showing label, value in balanced ternary, and decimal equivalent
  - Memory grid component displaying addresses and values in balanced ternary
  - Execution indicator showing current instruction with highlight

- **States**: 
  - Buttons should have distinct hover (glow effect), active (pressed), and disabled (grayed, cursor not-allowed) states
  - Editor should highlight currently executing line with accent color background
  - Registers that changed on last instruction should pulse/flash briefly
  - Execution speed slider should provide immediate visual feedback

- **Icon Selection**: 
  - `Play` for Run
  - `Pause` for Pause
  - `ArrowRight` or `CaretRight` for Step
  - `ArrowCounterClockwise` for Reset
  - `FileCode` for Load Example
  - `FloppyDisk` for Save Program
  - `Question` for Help

- **Spacing**: 
  - Consistent `gap-4` between major sections
  - `gap-2` within control button groups
  - `p-6` for card padding
  - `space-y-3` for register/memory listings

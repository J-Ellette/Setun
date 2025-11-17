/**
 * Application logic - connects UI to Setun emulator
 */

class SetunApp {
    constructor() {
        this.emulator = new SetunEmulator();
        this.executionInterval = null;
        this.executionSpeed = 5; // Instructions per second
        this.previousState = null;
        this.changedRegisters = new Set();
        this.changedMemory = new Set();
        
        // Initialize emulator callbacks
        this.emulator.onStateChange = () => this.updateVisualization();
        this.emulator.onError = (msg) => this.handleError(msg);
        this.emulator.onHalt = (msg) => this.handleHalt(msg);
        
        // Initialize UI
        this.initializeUI();
        this.updateVisualization();
        this.updateLineNumbers();
    }
    
    initializeUI() {
        // Get DOM elements
        this.elements = {
            editor: document.getElementById('programEditor'),
            examplesSelect: document.getElementById('examplesSelect'),
            saveBtn: document.getElementById('saveBtn'),
            runBtn: document.getElementById('runBtn'),
            stepBtn: document.getElementById('stepBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            speedSlider: document.getElementById('speedSlider'),
            speedLabel: document.getElementById('speedLabel'),
            statusBadge: document.getElementById('statusBadge'),
            instructionCount: document.getElementById('instructionCount'),
            syntaxError: document.getElementById('syntaxError'),
            memoryViewer: document.getElementById('memoryViewer'),
            callStackViewer: document.getElementById('callStackViewer'),
            memoryViewMode: document.getElementById('memoryViewMode'),
            memorySizeSelect: document.getElementById('memorySizeSelect'),
            breakpointAddress: document.getElementById('breakpointAddress'),
            addBreakpointBtn: document.getElementById('addBreakpointBtn'),
            clearBreakpointsBtn: document.getElementById('clearBreakpointsBtn'),
            breakpointList: document.getElementById('breakpointList'),
            conditionType: document.getElementById('conditionType'),
            conditionAddress: document.getElementById('conditionAddress'),
            conditionOperator: document.getElementById('conditionOperator'),
            conditionValue: document.getElementById('conditionValue'),
            addConditionBtn: document.getElementById('addConditionBtn'),
            conditionalBreakpointList: document.getElementById('conditionalBreakpointList'),
            stepBackBtn: document.getElementById('stepBackBtn'),
            watchType: document.getElementById('watchType'),
            watchAddress: document.getElementById('watchAddress'),
            watchLabel: document.getElementById('watchLabel'),
            addWatchBtn: document.getElementById('addWatchBtn'),
            watchList: document.getElementById('watchList'),
            historySize: document.getElementById('historySize'),
            registerACC: document.getElementById('registerACC'),
            registerPC: document.getElementById('registerPC'),
            registerIR: document.getElementById('registerIR')
        };
        
        // Memory view state
        this.memoryViewMode = 'mixed';
        
        // Get line numbers and syntax highlighting elements
        this.elements.lineNumbers = document.getElementById('lineNumbers');
        this.elements.autocomplete = document.getElementById('autocomplete');
        
        // Autocomplete state
        this.autocompleteVisible = false;
        this.autocompleteIndex = 0;
        this.autocompleteSuggestions = [];
        
        // Code folding state
        this.foldedRegions = new Set();
        
        // Opcode definitions for autocomplete
        this.opcodeInfo = [
            { mnemonic: 'HALT', ternary: '0', decimal: 0, description: 'Stop program execution' },
            { mnemonic: 'ADD', ternary: '+', decimal: 1, description: 'Add operand to accumulator' },
            { mnemonic: 'SUB', ternary: '-', decimal: -1, description: 'Subtract operand from accumulator' },
            { mnemonic: 'LOAD', ternary: '+-', decimal: 2, description: 'Load value from memory address' },
            { mnemonic: 'STORE', ternary: '-+', decimal: -2, description: 'Store accumulator to memory address' },
            { mnemonic: 'JMP', ternary: '+0', decimal: 3, description: 'Unconditional jump to address' },
            { mnemonic: 'JZ', ternary: '++', decimal: 4, description: 'Jump if accumulator is zero' },
            { mnemonic: 'JNZ', ternary: '--', decimal: -4, description: 'Jump if accumulator is not zero' },
            { mnemonic: 'JNP', ternary: '+--', decimal: 5, description: 'Jump if accumulator is positive' },
            { mnemonic: 'SHL', ternary: '+-0', decimal: 6, description: 'Shift left (multiply by 3)' },
            { mnemonic: 'SHR', ternary: '-+0', decimal: -6, description: 'Shift right (divide by 3)' },
            { mnemonic: 'CALL', ternary: '+-+', decimal: 7, description: 'Call subroutine at address' },
            { mnemonic: 'RET', ternary: '-+-', decimal: -7, description: 'Return from subroutine' },
            { mnemonic: 'NEG', ternary: '+0-', decimal: 8, description: 'Negate accumulator value' },
            { mnemonic: 'INC', ternary: '+00', decimal: 9, description: 'Increment accumulator by 1' },
            { mnemonic: 'DEC', ternary: '-00', decimal: -9, description: 'Decrement accumulator by 1' }
        ];
        
        // Attach event listeners
        this.elements.examplesSelect.addEventListener('change', (e) => this.loadExample(e.target.value));
        this.elements.saveBtn.addEventListener('click', () => this.saveProgram());
        this.elements.runBtn.addEventListener('click', () => this.run());
        this.elements.stepBtn.addEventListener('click', () => this.step());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.speedSlider.addEventListener('input', (e) => this.updateSpeed(e.target.value));
        this.elements.editor.addEventListener('input', () => {
            this.validateSyntax();
            this.updateLineNumbers();
            this.handleAutocomplete();
        });
        this.elements.editor.addEventListener('scroll', () => this.syncScroll());
        this.elements.editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
        this.elements.editor.addEventListener('blur', () => this.hideAutocomplete());
        this.elements.memoryViewMode.addEventListener('change', (e) => this.changeMemoryViewMode(e.target.value));
        this.elements.memorySizeSelect.addEventListener('change', (e) => this.changeMemorySize(parseInt(e.target.value)));
        this.elements.addBreakpointBtn.addEventListener('click', () => this.addBreakpoint());
        this.elements.clearBreakpointsBtn.addEventListener('click', () => this.clearBreakpoints());
        this.elements.breakpointAddress.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBreakpoint();
        });
        this.elements.conditionType.addEventListener('change', (e) => {
            this.elements.conditionAddress.disabled = e.target.value !== 'memory';
        });
        this.elements.addConditionBtn.addEventListener('click', () => this.addConditionalBreakpoint());
        this.elements.conditionValue.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addConditionalBreakpoint();
        });
        this.elements.stepBackBtn.addEventListener('click', () => this.stepBack());
        this.elements.watchType.addEventListener('change', (e) => {
            this.elements.watchAddress.disabled = e.target.value !== 'memory';
        });
        this.elements.addWatchBtn.addEventListener('click', () => this.addWatch());
        this.elements.watchLabel.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWatch();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Setup Electron menu handlers if running in Electron
        if (window.electronAPI) {
            this.setupElectronHandlers();
        }
        
        // Populate examples dropdown
        this.populateExamplesDropdown();
        
        // Initialize breakpoint and watch lists
        this.updateBreakpointsList();
        this.updateConditionalBreakpointsList();
        this.updateWatchList();
        
        // Load saved program if exists
        this.loadSavedProgram();
        
        // Validate initial state
        this.validateSyntax();
    }
    
    setupElectronHandlers() {
        window.electronAPI.onNewProgram(() => {
            this.elements.editor.value = '';
            this.reset();
        });
        
        window.electronAPI.onSaveProgram(() => {
            this.saveProgram();
        });
        
        window.electronAPI.onRunProgram(() => {
            if (!this.elements.runBtn.disabled) {
                this.run();
            }
        });
        
        window.electronAPI.onStepProgram(() => {
            if (!this.elements.stepBtn.disabled) {
                this.step();
            }
        });
        
        window.electronAPI.onPauseProgram(() => {
            this.pause();
        });
        
        window.electronAPI.onResetProgram(() => {
            this.reset();
        });
        
        window.electronAPI.onShowAbout(() => {
            alert('Setun - Balanced Ternary Computer Emulator\n\nVersion 1.0.0\n\nA faithful emulator of the historic Setun computer,\nthe world\'s first ternary (base-3) computer\ndeveloped in the Soviet Union in 1958.\n\nBuilt with Electron and JavaScript.');
        });
    }
    
    validateSyntax() {
        const code = this.elements.editor.value.trim();
        
        if (code.length === 0) {
            this.elements.syntaxError.classList.add('hidden');
            this.elements.runBtn.disabled = true;
            this.elements.stepBtn.disabled = true;
            return true;
        }
        
        const tokens = code.split(/\s+/);
        
        for (let i = 0; i < tokens.length; i++) {
            if (!SetunEmulator.validateTernary(tokens[i])) {
                this.elements.syntaxError.textContent = `Invalid ternary at token ${i + 1}: "${tokens[i]}"`;
                this.elements.syntaxError.classList.remove('hidden');
                this.elements.runBtn.disabled = true;
                this.elements.stepBtn.disabled = true;
                return false;
            }
        }
        
        this.elements.syntaxError.classList.add('hidden');
        this.elements.runBtn.disabled = false;
        this.elements.stepBtn.disabled = false;
        return true;
    }
    
    loadExample(exampleKey) {
        if (!exampleKey) return;
        
        const example = EXAMPLE_PROGRAMS[exampleKey];
        if (example) {
            this.elements.editor.value = example.code;
            this.reset();
            this.validateSyntax();
            this.updateLineNumbers();
            this.elements.examplesSelect.value = '';
        }
    }
    
    populateExamplesDropdown() {
        // Clear existing options except the first
        while (this.elements.examplesSelect.options.length > 1) {
            this.elements.examplesSelect.remove(1);
        }
        
        // Add all examples
        for (const [key, example] of Object.entries(EXAMPLE_PROGRAMS)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = example.name;
            this.elements.examplesSelect.appendChild(option);
        }
    }
    
    saveProgram() {
        const code = this.elements.editor.value;
        localStorage.setItem('setun_program', code);
        
        // Visual feedback
        const originalText = this.elements.saveBtn.innerHTML;
        this.elements.saveBtn.innerHTML = '<span class="icon">✓</span>';
        setTimeout(() => {
            this.elements.saveBtn.innerHTML = originalText;
        }, 1000);
    }
    
    loadSavedProgram() {
        const saved = localStorage.getItem('setun_program');
        if (saved) {
            this.elements.editor.value = saved;
            this.validateSyntax();
            this.updateLineNumbers();
        }
    }
    
    run() {
        if (!this.validateSyntax()) return;
        
        try {
            // Load program if not already loaded
            if (!this.emulator.running && this.emulator.instructionCount === 0) {
                const code = this.elements.editor.value;
                this.emulator.loadProgram(code);
            }
            
            this.emulator.running = true;
            this.updateStatus('running');
            
            // Start execution loop
            const delay = 1000 / this.executionSpeed;
            this.executionInterval = setInterval(() => {
                if (!this.emulator.step()) {
                    this.pause();
                }
            }, delay);
            
            // Update UI
            this.elements.runBtn.classList.add('hidden');
            this.elements.pauseBtn.classList.remove('hidden');
            this.elements.stepBtn.disabled = true;
            this.elements.editor.disabled = true;
            
        } catch (e) {
            this.handleError(e.message);
        }
    }
    
    step() {
        if (!this.validateSyntax()) return;
        
        try {
            // Load program if not already loaded
            if (this.emulator.instructionCount === 0) {
                const code = this.elements.editor.value;
                this.emulator.loadProgram(code);
            }
            
            this.emulator.step();
            this.updateStatus('paused');
            
        } catch (e) {
            this.handleError(e.message);
        }
    }
    
    pause() {
        this.emulator.running = false;
        
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
        
        this.updateStatus('paused');
        
        // Update UI
        this.elements.runBtn.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.stepBtn.disabled = false;
        this.elements.editor.disabled = false;
    }
    
    reset() {
        this.pause();
        this.emulator.reset();
        this.updateStatus('idle');
        this.elements.syntaxError.classList.add('hidden');
        this.changedRegisters.clear();
        this.changedMemory.clear();
        this.previousState = null;
    }
    
    updateSpeed(value) {
        this.executionSpeed = parseInt(value);
        this.elements.speedLabel.textContent = `${value}x`;
        
        // Restart execution loop if running
        if (this.emulator.running) {
            clearInterval(this.executionInterval);
            const delay = 1000 / this.executionSpeed;
            this.executionInterval = setInterval(() => {
                if (!this.emulator.step()) {
                    this.pause();
                }
            }, delay);
        }
    }
    
    updateStatus(status) {
        const badge = this.elements.statusBadge;
        badge.className = 'badge';
        
        switch (status) {
            case 'running':
                badge.classList.add('badge-running');
                badge.textContent = 'Running';
                break;
            case 'paused':
                badge.classList.add('badge-paused');
                badge.textContent = 'Paused';
                break;
            case 'error':
                badge.classList.add('badge-error');
                badge.textContent = 'Error';
                break;
            case 'halted':
                badge.classList.add('badge-halted');
                badge.textContent = 'Halted';
                break;
            default:
                badge.classList.add('badge-idle');
                badge.textContent = 'Idle';
        }
    }
    
    updateVisualization() {
        const state = this.emulator.getState();
        
        // Detect changes
        if (this.previousState) {
            this.changedRegisters.clear();
            this.changedMemory.clear();
            
            if (state.accumulator !== this.previousState.accumulator) {
                this.changedRegisters.add('ACC');
            }
            if (state.programCounter !== this.previousState.programCounter) {
                this.changedRegisters.add('PC');
            }
            if (state.instructionRegister !== this.previousState.instructionRegister) {
                this.changedRegisters.add('IR');
            }
            
            for (let i = 0; i < state.memory.length; i++) {
                if (state.memory[i] !== this.previousState.memory[i]) {
                    this.changedMemory.add(i);
                }
            }
        }
        
        // Update registers
        this.updateRegister('ACC', state.accumulator, this.elements.registerACC);
        this.updateRegister('PC', state.programCounter, this.elements.registerPC);
        this.updateRegister('IR', state.instructionRegister, this.elements.registerIR);
        
        // Update memory view
        this.updateMemoryView(state);
        
        // Update call stack
        this.updateCallStackView(state);
        
        // Update breakpoint lists (only if changed)
        if (!this.previousState || 
            this.previousState.breakpoints.size !== state.breakpoints.size ||
            this.previousState.conditionalBreakpoints.length !== state.conditionalBreakpoints.length) {
            this.updateBreakpointsList();
            this.updateConditionalBreakpointsList();
        }
        
        // Update watch list
        this.updateWatchList();
        
        // Update instruction count
        this.elements.instructionCount.textContent = `Instructions: ${state.instructionCount}`;
        
        // Save current state
        this.previousState = state;
    }
    
    updateRegister(name, value, element) {
        const ternarySpan = element.querySelector('.ternary-value');
        const decimalSpan = element.querySelector('.decimal-value');
        
        ternarySpan.textContent = SetunEmulator.toBalancedTernary(value);
        decimalSpan.textContent = `(${value})`;
        
        // Highlight if changed
        if (this.changedRegisters.has(name)) {
            element.classList.add('changed');
            setTimeout(() => element.classList.remove('changed'), 500);
        }
    }
    
    updateMemoryView(state) {
        this.elements.memoryViewer.innerHTML = '';
        
        // Only show non-zero memory cells or current PC location
        for (let i = 0; i < state.memory.length; i++) {
            if (state.memory[i] !== 0 || i === state.programCounter || i < 10) {
                const cell = document.createElement('div');
                cell.className = 'memory-cell';
                
                if (i === state.programCounter) {
                    cell.classList.add('current');
                }
                
                if (state.breakpoints.has(i)) {
                    cell.classList.add('breakpoint');
                }
                
                if (this.changedMemory.has(i)) {
                    cell.classList.add('changed');
                }
                
                const formattedValue = this.formatMemoryValue(state.memory[i]);
                const opcodeName = this.emulator.getOpcodeName(state.memory[i]);
                const breakpointIndicator = state.breakpoints.has(i) ? '🔴 ' : '';
                
                cell.innerHTML = `
                    <span class="memory-address">${breakpointIndicator}[${i}]</span>
                    <span class="memory-value">${formattedValue}</span>
                    <span class="memory-opcode">${opcodeName}</span>
                `;
                
                cell.title = `Click to toggle breakpoint at address ${i}`;
                cell.style.cursor = 'pointer';
                cell.addEventListener('click', () => {
                    this.emulator.toggleBreakpoint(i);
                    this.updateVisualization();
                    this.updateBreakpointsList();
                });
                
                this.elements.memoryViewer.appendChild(cell);
            }
        }
    }
    
    updateCallStackView(state) {
        this.elements.callStackViewer.innerHTML = '';
        
        if (state.callStack.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'Empty';
            this.elements.callStackViewer.appendChild(emptyState);
        } else {
            state.callStack.forEach((returnAddr, index) => {
                const item = document.createElement('div');
                item.className = 'call-stack-item';
                item.innerHTML = `
                    <span class="stack-depth">#${index + 1}</span>
                    <span class="stack-return">Return to: ${returnAddr}</span>
                    <span class="stack-return-ternary">${SetunEmulator.toBalancedTernary(returnAddr)}</span>
                `;
                this.elements.callStackViewer.appendChild(item);
            });
        }
    }
    
    changeMemoryViewMode(mode) {
        this.memoryViewMode = mode;
        this.updateVisualization();
    }
    
    changeMemorySize(newSize) {
        if (this.emulator.running) {
            alert('Cannot change memory size while program is running. Please pause or reset first.');
            this.elements.memorySizeSelect.value = this.emulator.memorySize;
            return;
        }
        
        // Create new emulator with new size
        this.emulator = new SetunEmulator(newSize);
        this.emulator.onStateChange = () => this.updateVisualization();
        this.emulator.onError = (msg) => this.handleError(msg);
        this.emulator.onHalt = (msg) => this.handleHalt(msg);
        
        this.reset();
        this.updateVisualization();
    }
    
    formatMemoryValue(value) {
        switch (this.memoryViewMode) {
            case 'ternary':
                return SetunEmulator.toBalancedTernary(value);
            case 'decimal':
                return value.toString();
            case 'hex':
                const hex = (value >>> 0).toString(16).toUpperCase();
                return '0x' + hex.padStart(2, '0');
            case 'mixed':
            default:
                return `${SetunEmulator.toBalancedTernary(value)} (${value})`;
        }
    }
    
    addBreakpoint() {
        const address = parseInt(this.elements.breakpointAddress.value);
        if (isNaN(address) || address < 0 || address >= this.emulator.memorySize) {
            alert(`Please enter a valid address (0-${this.emulator.memorySize - 1})`);
            return;
        }
        
        this.emulator.addBreakpoint(address);
        this.elements.breakpointAddress.value = '';
        this.updateBreakpointsList();
    }
    
    clearBreakpoints() {
        this.emulator.clearBreakpoints();
        this.updateBreakpointsList();
    }
    
    removeBreakpoint(address) {
        this.emulator.removeBreakpoint(address);
        this.updateBreakpointsList();
    }
    
    addConditionalBreakpoint() {
        const type = this.elements.conditionType.value;
        const operator = this.elements.conditionOperator.value;
        const value = parseInt(this.elements.conditionValue.value);
        
        if (isNaN(value)) {
            alert('Please enter a valid value');
            return;
        }
        
        const condition = { type, operator, value };
        
        if (type === 'memory') {
            const address = parseInt(this.elements.conditionAddress.value);
            if (isNaN(address) || address < 0 || address >= this.emulator.memorySize) {
                alert(`Please enter a valid memory address (0-${this.emulator.memorySize - 1})`);
                return;
            }
            condition.address = address;
        }
        
        this.emulator.addConditionalBreakpoint(condition);
        this.elements.conditionValue.value = '';
        this.elements.conditionAddress.value = '';
        this.updateConditionalBreakpointsList();
    }
    
    removeConditionalBreakpoint(index) {
        this.emulator.removeConditionalBreakpoint(index);
        this.updateConditionalBreakpointsList();
    }
    
    updateBreakpointsList() {
        const state = this.emulator.getState();
        this.elements.breakpointList.innerHTML = '';
        
        if (state.breakpoints.size === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No breakpoints';
            this.elements.breakpointList.appendChild(emptyState);
        } else {
            const sortedBreakpoints = Array.from(state.breakpoints).sort((a, b) => a - b);
            sortedBreakpoints.forEach(addr => {
                const item = document.createElement('div');
                item.className = 'breakpoint-item';
                item.innerHTML = `
                    <span class="breakpoint-addr">Address ${addr}</span>
                    <span class="breakpoint-ternary">${SetunEmulator.toBalancedTernary(addr)}</span>
                    <button class="btn-remove" onclick="app.removeBreakpoint(${addr})">×</button>
                `;
                this.elements.breakpointList.appendChild(item);
            });
        }
    }
    
    updateConditionalBreakpointsList() {
        const state = this.emulator.getState();
        this.elements.conditionalBreakpointList.innerHTML = '';
        
        if (state.conditionalBreakpoints.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No conditions';
            this.elements.conditionalBreakpointList.appendChild(emptyState);
        } else {
            state.conditionalBreakpoints.forEach((condition, index) => {
                const item = document.createElement('div');
                item.className = 'conditional-breakpoint-item';
                const desc = condition.type === 'accumulator'
                    ? `ACC ${condition.operator} ${condition.value}`
                    : `Mem[${condition.address}] ${condition.operator} ${condition.value}`;
                item.innerHTML = `
                    <span class="condition-desc">${desc}</span>
                    <button class="btn-remove" onclick="app.removeConditionalBreakpoint(${index})">×</button>
                `;
                this.elements.conditionalBreakpointList.appendChild(item);
            });
        }
    }
    
    stepBack() {
        if (!this.emulator.stepBack()) {
            return;
        }
        
        // Update UI to reflect stepped-back state
        this.updateStatus('paused');
        this.elements.runBtn.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.stepBtn.disabled = false;
    }
    
    addWatch() {
        const type = this.elements.watchType.value;
        const label = this.elements.watchLabel.value.trim() || null;
        
        const watch = { type, label };
        
        if (type === 'memory') {
            const address = parseInt(this.elements.watchAddress.value);
            if (isNaN(address) || address < 0 || address >= this.emulator.memorySize) {
                alert(`Please enter a valid memory address (0-${this.emulator.memorySize - 1})`);
                return;
            }
            watch.address = address;
        }
        
        this.emulator.addWatch(watch);
        this.elements.watchLabel.value = '';
        this.elements.watchAddress.value = '';
        this.updateWatchList();
    }
    
    removeWatch(index) {
        this.emulator.removeWatch(index);
        this.updateWatchList();
    }
    
    updateWatchList() {
        const state = this.emulator.getState();
        this.elements.watchList.innerHTML = '';
        
        if (state.watches.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No watches';
            this.elements.watchList.appendChild(emptyState);
        } else {
            state.watches.forEach((watch, index) => {
                const item = document.createElement('div');
                item.className = 'watch-item';
                
                let desc = watch.label ? `${watch.label}: ` : '';
                if (watch.type === 'accumulator') {
                    desc += 'ACC';
                } else {
                    desc += `Mem[${watch.address}]`;
                }
                
                const value = watch.value !== null ? watch.value : 'N/A';
                const ternary = watch.value !== null ? SetunEmulator.toBalancedTernary(watch.value) : '';
                
                item.innerHTML = `
                    <span class="watch-desc">${desc}</span>
                    <span class="watch-value">${ternary} (${value})</span>
                    <button class="btn-remove" onclick="app.removeWatch(${index})">×</button>
                `;
                this.elements.watchList.appendChild(item);
            });
        }
        
        // Update history size
        this.elements.historySize.textContent = state.historySize;
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.getElementById('memoryTab').classList.toggle('active', tabName === 'memory');
        document.getElementById('memoryTab').classList.toggle('hidden', tabName !== 'memory');
        document.getElementById('helpTab').classList.toggle('active', tabName === 'help');
        document.getElementById('helpTab').classList.toggle('hidden', tabName !== 'help');
    }
    
    handleError(message) {
        this.pause();
        this.updateStatus('error');
        this.elements.syntaxError.textContent = `Error: ${message}`;
        this.elements.syntaxError.classList.remove('hidden');
    }
    
    handleHalt(message) {
        this.pause();
        this.updateStatus('halted');
        console.log('Halted:', message);
    }
    
    /**
     * Update line numbers in the editor with fold indicators
     */
    updateLineNumbers() {
        const lines = this.elements.editor.value.split('\n');
        
        // Find fold regions
        const foldRegions = this.findFoldRegions(lines);
        
        const lineNumbersHtml = lines.map((line, index) => {
            let foldIndicator = '';
            const region = foldRegions.find(r => r.start === index);
            
            if (region) {
                const isFolded = this.foldedRegions?.has(index) || false;
                const icon = isFolded ? '▶' : '▼';
                foldIndicator = `<span class="fold-indicator" data-line="${index}">${icon}</span>`;
            }
            
            return `<div>${foldIndicator}${index + 1}</div>`;
        }).join('');
        
        this.elements.lineNumbers.innerHTML = lineNumbersHtml;
        
        // Add click handlers for fold indicators
        this.elements.lineNumbers.querySelectorAll('.fold-indicator').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const lineNum = parseInt(el.dataset.line);
                this.toggleFold(lineNum);
            });
        });
    }
    
    /**
     * Find foldable regions in code (based on comments)
     */
    findFoldRegions(lines) {
        const regions = [];
        const stack = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Look for fold markers in comments
            if (trimmed.includes('; FOLD') || trimmed.includes(';FOLD')) {
                stack.push(index);
            } else if (trimmed.includes('; ENDFOLD') || trimmed.includes(';ENDFOLD')) {
                if (stack.length > 0) {
                    const start = stack.pop();
                    regions.push({ start, end: index });
                }
            }
        });
        
        return regions;
    }
    
    /**
     * Toggle fold state for a region
     */
    toggleFold(lineNumber) {
        if (!this.foldedRegions) {
            this.foldedRegions = new Set();
        }
        
        const lines = this.elements.editor.value.split('\n');
        const regions = this.findFoldRegions(lines);
        const region = regions.find(r => r.start === lineNumber);
        
        if (!region) return;
        
        if (this.foldedRegions.has(lineNumber)) {
            // Unfold
            this.foldedRegions.delete(lineNumber);
        } else {
            // Fold
            this.foldedRegions.add(lineNumber);
        }
        
        this.applyFolding();
        this.updateLineNumbers();
    }
    
    /**
     * Apply folding to editor by hiding lines
     */
    applyFolding() {
        const lines = this.elements.editor.value.split('\n');
        const regions = this.findFoldRegions(lines);
        
        // For simplicity, we'll just update line numbers visual
        // Full implementation would require more complex DOM manipulation
        // This is a basic implementation showing the concept
        
        // Update line number visibility
        const lineNumberDivs = this.elements.lineNumbers.querySelectorAll('div');
        regions.forEach(region => {
            const isFolded = this.foldedRegions?.has(region.start);
            for (let i = region.start + 1; i <= region.end; i++) {
                if (lineNumberDivs[i]) {
                    lineNumberDivs[i].style.display = isFolded ? 'none' : 'block';
                }
            }
        });
    }
    
    /**
     * Sync scroll between textarea and line numbers
     */
    syncScroll() {
        this.elements.lineNumbers.scrollTop = this.elements.editor.scrollTop;
    }
    
    /**
     * Handle autocomplete suggestions
     */
    handleAutocomplete() {
        const cursorPos = this.elements.editor.selectionStart;
        const text = this.elements.editor.value.substring(0, cursorPos);
        const lines = text.split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Check if we're at the start of a word (after whitespace or line start)
        const match = currentLine.match(/([A-Z]+)$/i);
        
        if (match && match[1].length > 0) {
            const partial = match[1].toUpperCase();
            this.autocompleteSuggestions = this.opcodeInfo.filter(op => 
                op.mnemonic.startsWith(partial)
            );
            
            if (this.autocompleteSuggestions.length > 0) {
                this.showAutocomplete(partial);
                return;
            }
        }
        
        this.hideAutocomplete();
    }
    
    /**
     * Show autocomplete dropdown
     */
    showAutocomplete(partial) {
        this.autocompleteVisible = true;
        this.autocompleteIndex = 0;
        
        // Build dropdown HTML
        let html = '';
        this.autocompleteSuggestions.forEach((op, index) => {
            const selectedClass = index === this.autocompleteIndex ? 'selected' : '';
            html += `
                <div class="autocomplete-item ${selectedClass}" data-index="${index}">
                    <div class="autocomplete-opcode">${op.mnemonic}</div>
                    <div class="autocomplete-description">${op.description}</div>
                    <div class="autocomplete-ternary">Ternary: ${op.ternary} (${op.decimal})</div>
                </div>
            `;
        });
        
        this.elements.autocomplete.innerHTML = html;
        this.elements.autocomplete.classList.remove('hidden');
        
        // Position dropdown at cursor
        this.positionAutocomplete();
        
        // Add click handlers
        this.elements.autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const index = parseInt(item.dataset.index);
                this.acceptAutocomplete(index);
            });
        });
    }
    
    /**
     * Hide autocomplete dropdown
     */
    hideAutocomplete() {
        this.autocompleteVisible = false;
        this.elements.autocomplete.classList.add('hidden');
    }
    
    /**
     * Position autocomplete dropdown at cursor
     */
    positionAutocomplete() {
        const cursorPos = this.elements.editor.selectionStart;
        const text = this.elements.editor.value.substring(0, cursorPos);
        const lines = text.split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1].length;
        
        // Approximate position (this is a simplified approach)
        const lineHeight = 25.6; // 16px font * 1.6 line-height
        const charWidth = 9.6; // Approximate monospace character width
        
        const top = (lineNumber - 1) * lineHeight + 50;
        const left = columnNumber * charWidth + 60;
        
        this.elements.autocomplete.style.top = `${top}px`;
        this.elements.autocomplete.style.left = `${left}px`;
    }
    
    /**
     * Handle keyboard navigation in autocomplete
     */
    handleEditorKeydown(e) {
        if (!this.autocompleteVisible) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.autocompleteIndex = Math.min(
                    this.autocompleteIndex + 1,
                    this.autocompleteSuggestions.length - 1
                );
                this.updateAutocompleteSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.autocompleteIndex = Math.max(this.autocompleteIndex - 1, 0);
                this.updateAutocompleteSelection();
                break;
                
            case 'Enter':
            case 'Tab':
                if (this.autocompleteVisible) {
                    e.preventDefault();
                    this.acceptAutocomplete(this.autocompleteIndex);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hideAutocomplete();
                break;
        }
    }
    
    /**
     * Update autocomplete selection highlight
     */
    updateAutocompleteSelection() {
        const items = this.elements.autocomplete.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.autocompleteIndex);
        });
        
        // Scroll selected item into view
        items[this.autocompleteIndex]?.scrollIntoView({ block: 'nearest' });
    }
    
    /**
     * Accept autocomplete suggestion
     */
    acceptAutocomplete(index) {
        const suggestion = this.autocompleteSuggestions[index];
        if (!suggestion) return;
        
        // Find the partial text to replace
        const cursorPos = this.elements.editor.selectionStart;
        const text = this.elements.editor.value;
        const beforeCursor = text.substring(0, cursorPos);
        const match = beforeCursor.match(/([A-Z]+)$/i);
        
        if (match) {
            const startPos = cursorPos - match[1].length;
            const newText = text.substring(0, startPos) + 
                           suggestion.mnemonic + 
                           text.substring(cursorPos);
            
            this.elements.editor.value = newText;
            this.elements.editor.selectionStart = startPos + suggestion.mnemonic.length;
            this.elements.editor.selectionEnd = this.elements.editor.selectionStart;
            
            this.validateSyntax();
            this.updateLineNumbers();
        }
        
        this.hideAutocomplete();
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SetunApp();
});

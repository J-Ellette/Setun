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
            registerACC: document.getElementById('registerACC'),
            registerPC: document.getElementById('registerPC'),
            registerIR: document.getElementById('registerIR')
        };
        
        // Attach event listeners
        this.elements.examplesSelect.addEventListener('change', (e) => this.loadExample(e.target.value));
        this.elements.saveBtn.addEventListener('click', () => this.saveProgram());
        this.elements.runBtn.addEventListener('click', () => this.run());
        this.elements.stepBtn.addEventListener('click', () => this.step());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.speedSlider.addEventListener('input', (e) => this.updateSpeed(e.target.value));
        this.elements.editor.addEventListener('input', () => this.validateSyntax());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Load saved program if exists
        this.loadSavedProgram();
        
        // Validate initial state
        this.validateSyntax();
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
            this.validateSyntax();
            this.elements.examplesSelect.value = '';
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
                
                if (this.changedMemory.has(i)) {
                    cell.classList.add('changed');
                }
                
                const ternaryValue = SetunEmulator.toBalancedTernary(state.memory[i]);
                
                cell.innerHTML = `
                    <span class="memory-address">[${i}]</span>
                    <span class="memory-value-ternary">${ternaryValue}</span>
                    <span class="memory-value-decimal">(${state.memory[i]})</span>
                `;
                
                this.elements.memoryViewer.appendChild(cell);
            }
        }
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
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.setunApp = new SetunApp();
});

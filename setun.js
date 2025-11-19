/**
 * Setun - Balanced Ternary Computer Emulator
 * Core emulator logic for the historic Setun computer
 */

class SetunEmulator {
    constructor(memorySize = 81) {
        // Machine state
        this.accumulator = 0;      // Main register
        this.programCounter = 0;   // Current instruction address
        this.instructionRegister = 0; // Current instruction
        this.memorySize = memorySize; // Configurable memory size
        this.memory = new Array(this.memorySize);
        this.memory.fill(0);
        
        // Call stack for subroutines
        this.callStack = [];
        this.maxCallDepth = 10;
        
        // Breakpoints
        this.breakpoints = new Set(); // Memory addresses with breakpoints
        this.conditionalBreakpoints = []; // {type, register, operator, value}
        
        // Execution history for step backwards
        this.executionHistory = [];
        this.maxHistorySize = 1000;
        this.historyEnabled = true;
        
        // Watch expressions
        this.watches = []; // {type: 'memory'|'accumulator', address?: number, label?: string}
        
        // Memory protection
        this.protectedMemory = new Set(); // Addresses that are read-only
        
        // Memory access tracking for heatmap
        this.memoryAccessCounts = new Array(this.memorySize);
        this.memoryAccessCounts.fill(0);
        this.heatmapEnabled = false;
        
        // Execution state
        this.running = false;
        this.instructionCount = 0;
        this.maxInstructions = 10000; // Prevent infinite loops
        this.hitBreakpoint = false;
        
        // Instruction opcodes (using balanced ternary encoding)
        this.OPCODES = {
            HALT: 0,      // 0 - Stop execution
            ADD: 1,       // + - Add value to accumulator
            SUB: -1,      // - - Subtract value from accumulator
            LOAD: 2,      // +- - Load from memory address
            STORE: -2,    // -+ - Store to memory address
            JMP: 3,       // +0 - Unconditional jump
            JZ: 4,        // ++ - Jump if accumulator is zero
            JNZ: -4,      // -- - Jump if accumulator is not zero
            JNP: 5,       // +-- - Jump if accumulator is positive
            SHL: 6,       // +-0 - Shift left (multiply by 3)
            SHR: -6,      // -+0 - Shift right (divide by 3)
            CALL: 7,      // +-+ - Call subroutine
            RET: -7,      // -+- - Return from subroutine
            NEG: 8,       // +0- - Negate accumulator
            INC: 9,       // +00 - Increment accumulator
            DEC: -9,      // -00 - Decrement accumulator
            LOADI: 10,    // ++- - Load indirect from memory
            STOREI: -10   // --+ - Store indirect to memory
        };
        
        // Callbacks
        this.onStateChange = null;
        this.onError = null;
        this.onHalt = null;
    }
    
    /**
     * Convert decimal to balanced ternary string
     */
    static toBalancedTernary(decimal) {
        if (decimal === 0) return '0';
        
        let result = [];
        let n = Math.abs(decimal);
        let isNegative = decimal < 0;
        
        // Standard ternary conversion
        while (n > 0) {
            let remainder = n % 3;
            n = Math.floor(n / 3);
            
            if (remainder === 2) {
                remainder = -1;
                n += 1;
            }
            result.unshift(remainder);
        }
        
        // Apply sign for negative numbers
        if (isNegative) {
            result = result.map(d => -d);
        }
        
        // Convert to symbols
        return result.map(d => {
            if (d === -1) return '-';
            if (d === 0) return '0';
            if (d === 1) return '+';
        }).join('');
    }
    
    /**
     * Convert balanced ternary string to decimal
     */
    static fromBalancedTernary(ternary) {
        if (!ternary || ternary.length === 0) return 0;
        
        let result = 0;
        let power = 0;
        
        // Process from right to left
        for (let i = ternary.length - 1; i >= 0; i--) {
            let digit = 0;
            const char = ternary[i];
            
            if (char === '-' || char === '−' || char === '_') {
                digit = -1;
            } else if (char === '0') {
                digit = 0;
            } else if (char === '+' || char === '1') {
                digit = 1;
            } else {
                throw new Error(`Invalid ternary digit: ${char}`);
            }
            
            result += digit * Math.pow(3, power);
            power++;
        }
        
        return result;
    }
    
    /**
     * Validate a ternary string
     */
    static validateTernary(str) {
        const validChars = /^[-−_0+1\s]*$/;
        return validChars.test(str);
    }
    
    /**
     * Parse a program string into memory
     */
    loadProgram(programText) {
        this.reset();
        
        if (!programText || programText.trim().length === 0) {
            return;
        }
        
        // Split into tokens (instructions)
        const tokens = programText.trim().split(/\s+/);
        
        // Validate and load into memory
        for (let i = 0; i < tokens.length && i < this.memory.length; i++) {
            const token = tokens[i];
            
            if (!SetunEmulator.validateTernary(token)) {
                throw new Error(`Invalid ternary at position ${i}: ${token}`);
            }
            
            try {
                this.memory[i] = SetunEmulator.fromBalancedTernary(token);
            } catch (e) {
                throw new Error(`Error parsing instruction ${i}: ${e.message}`);
            }
        }
    }
    
    /**
     * Reset the computer to initial state
     */
    reset() {
        this.accumulator = 0;
        this.programCounter = 0;
        this.instructionRegister = 0;
        this.memory.fill(0);
        this.callStack = [];
        this.running = false;
        this.instructionCount = 0;
        this.hitBreakpoint = false;
        this.clearHistory();
        this.memoryAccessCounts.fill(0); // Reset heatmap
        // Note: breakpoints and watches are NOT cleared on reset - they persist
        
        if (this.onStateChange) {
            this.onStateChange();
        }
    }
    
    /**
     * Decode instruction into opcode and operand
     */
    decodeInstruction(instruction) {
        // Simple encoding: instruction encodes both opcode and operand
        // For simplicity, we'll use the instruction value directly as opcode
        // In a real implementation, you'd split bits/trits
        return {
            opcode: instruction,
            operand: null
        };
    }
    
    /**
     * Execute an instruction based on opcode
     */
    executeInstruction(opcode, operand) {
        switch (opcode) {
            case this.OPCODES.HALT:
                this.running = false;
                if (this.onHalt) {
                    this.onHalt('Halt instruction (0) encountered');
                }
                return false;
                
            case this.OPCODES.ADD:
                // Next memory cell is operand
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    this.accumulator += this.memory[this.programCounter];
                }
                break;
                
            case this.OPCODES.SUB:
                // Next memory cell is operand
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    this.accumulator -= this.memory[this.programCounter];
                }
                break;
                
            case this.OPCODES.LOAD:
                // Load from memory address in next cell
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    const addr = this.memory[this.programCounter];
                    if (addr >= 0 && addr < this.memory.length) {
                        this.accumulator = this.memory[addr];
                        if (this.heatmapEnabled) {
                            this.memoryAccessCounts[addr]++;
                        }
                    }
                }
                break;
                
            case this.OPCODES.STORE:
                // Store to memory address in next cell
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    const addr = this.memory[this.programCounter];
                    if (addr >= 0 && addr < this.memory.length) {
                        if (this.canWriteToMemory(addr)) {
                            this.memory[addr] = this.accumulator;
                            if (this.heatmapEnabled) {
                                this.memoryAccessCounts[addr]++;
                            }
                        } else {
                            throw new Error(`Cannot write to protected memory address ${addr}`);
                        }
                    }
                }
                break;
                
            case this.OPCODES.JMP:
                // Unconditional jump to address in next cell
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    const addr = this.memory[this.programCounter];
                    if (addr >= 0 && addr < this.memory.length) {
                        this.programCounter = addr - 1; // -1 because we increment at end
                    }
                }
                break;
                
            case this.OPCODES.JZ:
                // Jump if accumulator is zero
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    if (this.accumulator === 0) {
                        const addr = this.memory[this.programCounter];
                        if (addr >= 0 && addr < this.memory.length) {
                            this.programCounter = addr - 1;
                        }
                    }
                }
                break;
                
            case this.OPCODES.JNZ:
                // Jump if accumulator is not zero
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    if (this.accumulator !== 0) {
                        const addr = this.memory[this.programCounter];
                        if (addr >= 0 && addr < this.memory.length) {
                            this.programCounter = addr - 1;
                        }
                    }
                }
                break;
                
            case this.OPCODES.JNP:
                // Jump if accumulator is positive
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    if (this.accumulator > 0) {
                        const addr = this.memory[this.programCounter];
                        if (addr >= 0 && addr < this.memory.length) {
                            this.programCounter = addr - 1;
                        }
                    }
                }
                break;
                
            case this.OPCODES.SHL:
                // Shift left (multiply by 3 in ternary)
                this.accumulator *= 3;
                break;
                
            case this.OPCODES.SHR:
                // Shift right (divide by 3 in ternary)
                this.accumulator = Math.floor(this.accumulator / 3);
                break;
                
            case this.OPCODES.CALL:
                // Call subroutine
                if (this.callStack.length >= this.maxCallDepth) {
                    this.running = false;
                    if (this.onError) {
                        this.onError('Call stack overflow');
                    }
                    return false;
                }
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    const addr = this.memory[this.programCounter];
                    this.callStack.push(this.programCounter + 1); // Save return address
                    if (addr >= 0 && addr < this.memory.length) {
                        this.programCounter = addr - 1;
                    }
                }
                break;
                
            case this.OPCODES.RET:
                // Return from subroutine
                if (this.callStack.length === 0) {
                    this.running = false;
                    if (this.onHalt) {
                        this.onHalt('Return with empty call stack');
                    }
                    return false;
                }
                this.programCounter = this.callStack.pop() - 1;
                break;
                
            case this.OPCODES.NEG:
                // Negate accumulator
                this.accumulator = -this.accumulator;
                break;
                
            case this.OPCODES.INC:
                // Increment accumulator
                this.accumulator++;
                break;
                
            case this.OPCODES.DEC:
                // Decrement accumulator
                this.accumulator--;
                break;
                
            case this.OPCODES.LOADI:
                // Load indirect - next cell contains address of address
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    const pointerAddr = this.memory[this.programCounter];
                    if (pointerAddr >= 0 && pointerAddr < this.memory.length) {
                        const actualAddr = this.memory[pointerAddr];
                        if (actualAddr >= 0 && actualAddr < this.memory.length) {
                            this.accumulator = this.memory[actualAddr];
                            if (this.heatmapEnabled) {
                                this.memoryAccessCounts[actualAddr]++;
                            }
                        }
                    }
                }
                break;
                
            case this.OPCODES.STOREI:
                // Store indirect - next cell contains address of address
                this.programCounter++;
                if (this.programCounter < this.memory.length) {
                    const pointerAddr = this.memory[this.programCounter];
                    if (pointerAddr >= 0 && pointerAddr < this.memory.length) {
                        const actualAddr = this.memory[pointerAddr];
                        if (actualAddr >= 0 && actualAddr < this.memory.length) {
                            if (this.canWriteToMemory(actualAddr)) {
                                this.memory[actualAddr] = this.accumulator;
                                if (this.heatmapEnabled) {
                                    this.memoryAccessCounts[actualAddr]++;
                                }
                            } else {
                                throw new Error(`Cannot write to protected memory address ${actualAddr}`);
                            }
                        }
                    }
                }
                break;
                
            default:
                // Unknown opcode - treat as NOP (no operation)
                break;
        }
        
        return true;
    }
    
    /**
     * Execute a single instruction
     */
    step() {
        if (this.instructionCount >= this.maxInstructions) {
            this.running = false;
            if (this.onError) {
                this.onError('Instruction limit reached (possible infinite loop)');
            }
            return false;
        }
        
        // Save current state to history before executing
        if (this.historyEnabled) {
            this.saveStateToHistory();
        }
        
        // Check for breakpoint at current address
        if (this.breakpoints.has(this.programCounter)) {
            this.running = false;
            this.hitBreakpoint = true;
            if (this.onHalt) {
                this.onHalt(`Breakpoint hit at address ${this.programCounter}`);
            }
            return false;
        }
        
        // Fetch instruction
        if (this.programCounter < 0 || this.programCounter >= this.memory.length) {
            this.running = false;
            if (this.onHalt) {
                this.onHalt('Program counter out of bounds');
            }
            return false;
        }
        
        this.instructionRegister = this.memory[this.programCounter];
        
        // Decode and execute instruction
        const { opcode, operand } = this.decodeInstruction(this.instructionRegister);
        const result = this.executeInstruction(opcode, operand);
        
        if (!result) {
            return false;
        }
        
        // Increment program counter
        this.programCounter++;
        this.instructionCount++;
        
        // Check conditional breakpoints
        const triggeredCondition = this.checkConditionalBreakpoints();
        if (triggeredCondition) {
            this.running = false;
            this.hitBreakpoint = true;
            if (this.onHalt) {
                const desc = triggeredCondition.type === 'accumulator' 
                    ? `Accumulator ${triggeredCondition.operator} ${triggeredCondition.value}`
                    : `Memory[${triggeredCondition.address}] ${triggeredCondition.operator} ${triggeredCondition.value}`;
                this.onHalt(`Conditional breakpoint: ${desc}`);
            }
            // Notify state change before stopping
            if (this.onStateChange) {
                this.onStateChange();
            }
            return false;
        }
        
        // Notify state change
        if (this.onStateChange) {
            this.onStateChange();
        }
        
        // Check if we've reached end of program
        if (this.programCounter >= this.memory.length) {
            this.running = false;
            if (this.onHalt) {
                this.onHalt('End of memory reached');
            }
            return false;
        }
        
        return true;
    }
    
    /**
     * Get current state for visualization
     */
    getState() {
        return {
            accumulator: this.accumulator,
            programCounter: this.programCounter,
            instructionRegister: this.instructionRegister,
            memory: [...this.memory],
            callStack: [...this.callStack],
            breakpoints: new Set(this.breakpoints),
            conditionalBreakpoints: [...this.conditionalBreakpoints],
            watches: this.getWatchValues(),
            historySize: this.executionHistory.length,
            historyEnabled: this.historyEnabled,
            instructionCount: this.instructionCount,
            running: this.running,
            hitBreakpoint: this.hitBreakpoint
        };
    }
    
    /**
     * Get opcode name for display
     */
    getOpcodeName(value) {
        for (const [name, opcode] of Object.entries(this.OPCODES)) {
            if (opcode === value) {
                return name;
            }
        }
        return 'DATA';
    }
    
    /**
     * Add a breakpoint at a memory address
     */
    addBreakpoint(address) {
        if (address >= 0 && address < this.memory.length) {
            this.breakpoints.add(address);
            return true;
        }
        return false;
    }
    
    /**
     * Remove a breakpoint
     */
    removeBreakpoint(address) {
        return this.breakpoints.delete(address);
    }
    
    /**
     * Toggle a breakpoint
     */
    toggleBreakpoint(address) {
        if (this.breakpoints.has(address)) {
            this.removeBreakpoint(address);
            return false;
        } else {
            return this.addBreakpoint(address);
        }
    }
    
    /**
     * Clear all breakpoints
     */
    clearBreakpoints() {
        this.breakpoints.clear();
    }
    
    /**
     * Add a conditional breakpoint
     */
    addConditionalBreakpoint(condition) {
        // condition: {type: 'accumulator'|'memory', address?: number, operator: '=='|'!='|'>'|'<'|'>='|'<=', value: number}
        this.conditionalBreakpoints.push(condition);
        return this.conditionalBreakpoints.length - 1;
    }
    
    /**
     * Remove a conditional breakpoint
     */
    removeConditionalBreakpoint(index) {
        if (index >= 0 && index < this.conditionalBreakpoints.length) {
            this.conditionalBreakpoints.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Clear all conditional breakpoints
     */
    clearConditionalBreakpoints() {
        this.conditionalBreakpoints = [];
    }
    
    /**
     * Save current state to execution history
     */
    saveStateToHistory() {
        const state = {
            accumulator: this.accumulator,
            programCounter: this.programCounter,
            instructionRegister: this.instructionRegister,
            memory: [...this.memory],
            callStack: [...this.callStack],
            instructionCount: this.instructionCount
        };
        
        this.executionHistory.push(state);
        
        // Limit history size
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.shift();
        }
    }
    
    /**
     * Step backwards to previous state
     */
    stepBack() {
        if (this.executionHistory.length === 0) {
            if (this.onError) {
                this.onError('No execution history available');
            }
            return false;
        }
        
        // Restore previous state
        const prevState = this.executionHistory.pop();
        this.accumulator = prevState.accumulator;
        this.programCounter = prevState.programCounter;
        this.instructionRegister = prevState.instructionRegister;
        this.memory = [...prevState.memory];
        this.callStack = [...prevState.callStack];
        this.instructionCount = prevState.instructionCount;
        
        // Notify state change
        if (this.onStateChange) {
            this.onStateChange();
        }
        
        return true;
    }
    
    /**
     * Clear execution history
     */
    clearHistory() {
        this.executionHistory = [];
    }
    
    /**
     * Toggle history recording
     */
    toggleHistory(enabled) {
        this.historyEnabled = enabled;
        if (!enabled) {
            this.clearHistory();
        }
    }
    
    /**
     * Add a watch expression
     */
    addWatch(watch) {
        // watch: {type: 'accumulator'|'memory', address?: number, label?: string}
        this.watches.push(watch);
        return this.watches.length - 1;
    }
    
    /**
     * Remove a watch expression
     */
    removeWatch(index) {
        if (index >= 0 && index < this.watches.length) {
            this.watches.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Clear all watch expressions
     */
    clearWatches() {
        this.watches = [];
    }
    
    /**
     * Get current values for all watches
     */
    getWatchValues() {
        return this.watches.map(watch => {
            let value;
            if (watch.type === 'accumulator') {
                value = this.accumulator;
            } else if (watch.type === 'memory' && watch.address !== undefined) {
                if (watch.address >= 0 && watch.address < this.memory.length) {
                    value = this.memory[watch.address];
                } else {
                    value = null;
                }
            }
            return { ...watch, value };
        });
    }
    
    /**
     * Check if any conditional breakpoint is triggered
     */
    checkConditionalBreakpoints() {
        for (const condition of this.conditionalBreakpoints) {
            let currentValue;
            
            if (condition.type === 'accumulator') {
                currentValue = this.accumulator;
            } else if (condition.type === 'memory' && condition.address !== undefined) {
                if (condition.address >= 0 && condition.address < this.memory.length) {
                    currentValue = this.memory[condition.address];
                } else {
                    continue;
                }
            } else {
                continue;
            }
            
            let triggered = false;
            switch (condition.operator) {
                case '==':
                    triggered = currentValue === condition.value;
                    break;
                case '!=':
                    triggered = currentValue !== condition.value;
                    break;
                case '>':
                    triggered = currentValue > condition.value;
                    break;
                case '<':
                    triggered = currentValue < condition.value;
                    break;
                case '>=':
                    triggered = currentValue >= condition.value;
                    break;
                case '<=':
                    triggered = currentValue <= condition.value;
                    break;
            }
            
            if (triggered) {
                return condition;
            }
        }
        return null;
    }
    
    /**
     * Memory protection methods
     */
    protectMemoryRange(startAddr, endAddr) {
        for (let addr = startAddr; addr <= endAddr; addr++) {
            if (addr >= 0 && addr < this.memory.length) {
                this.protectedMemory.add(addr);
            }
        }
    }
    
    unprotectMemoryRange(startAddr, endAddr) {
        for (let addr = startAddr; addr <= endAddr; addr++) {
            this.protectedMemory.delete(addr);
        }
    }
    
    isMemoryProtected(addr) {
        return this.protectedMemory.has(addr);
    }
    
    clearMemoryProtection() {
        this.protectedMemory.clear();
    }
    
    /**
     * Check if write to memory address is allowed
     */
    canWriteToMemory(addr) {
        if (addr < 0 || addr >= this.memory.length) {
            return false;
        }
        return !this.protectedMemory.has(addr);
    }
    
    /**
     * Memory heatmap methods
     */
    toggleHeatmap() {
        this.heatmapEnabled = !this.heatmapEnabled;
        return this.heatmapEnabled;
    }
    
    clearHeatmap() {
        this.memoryAccessCounts.fill(0);
    }
    
    getMaxAccessCount() {
        return Math.max(...this.memoryAccessCounts);
    }
}

// Example programs
const EXAMPLE_PROGRAMS = {
    addition: {
        name: 'Simple Addition',
        description: 'Uses ADD instruction to add numbers',
        code: '+ +0 + - 0'  // ADD 3, ADD -1, HALT
    },
    loadStore: {
        name: 'Load and Store',
        description: 'Demonstrates memory load/store operations',
        code: '+- +0- +0 -+ +-0 0'  // LOAD addr(5), JMP addr(6), DATA(3), STORE addr(6), HALT
    },
    conditional: {
        name: 'Conditional Jump',
        description: 'Jump if accumulator is zero',
        code: '+ 0 ++ +-- +00 +00 0'  // ADD 0, JZ addr(6), INC, INC, HALT
    },
    loop: {
        name: 'Simple Loop',
        description: 'Loop using conditional jump',
        code: '+00 -- + +0 ---- 0'  // INC, JNZ addr(3), ADD 3, JMP addr(0), HALT
    },
    shift: {
        name: 'Shift Operations',
        description: 'Multiply and divide by 3 using shifts',
        code: '+ +0 +-0 -+0 0'  // ADD 3, SHL (×3), SHR (÷3), HALT
    },
    subroutine: {
        name: 'Subroutine Call',
        description: 'Call and return from subroutine',
        code: '+-+ +-- +0 +--- + + -+- 0'  // CALL addr(6), JMP addr(2), HALT, <empty>, ADD 1, ADD 1, RET, HALT
    },
    negate: {
        name: 'Negate',
        description: 'Negate the accumulator',
        code: '+ +-- +0- 0'  // ADD 6, NEG, HALT
    }
};

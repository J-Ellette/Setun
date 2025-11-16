/**
 * Setun - Balanced Ternary Computer Emulator
 * Core emulator logic for the historic Setun computer
 */

class SetunEmulator {
    constructor() {
        // Machine state
        this.accumulator = 0;      // Main register
        this.programCounter = 0;   // Current instruction address
        this.instructionRegister = 0; // Current instruction
        this.memory = new Array(27); // 27 words of memory (3^3)
        this.memory.fill(0);
        
        // Execution state
        this.running = false;
        this.instructionCount = 0;
        this.maxInstructions = 10000; // Prevent infinite loops
        
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
        this.running = false;
        this.instructionCount = 0;
        
        if (this.onStateChange) {
            this.onStateChange();
        }
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
        
        // Fetch instruction
        if (this.programCounter < 0 || this.programCounter >= this.memory.length) {
            this.running = false;
            if (this.onHalt) {
                this.onHalt('Program counter out of bounds');
            }
            return false;
        }
        
        this.instructionRegister = this.memory[this.programCounter];
        
        // Simple instruction set for demonstration
        // In a real Setun, this would be more complex
        // For now: interpret as data or simple operations
        
        // Simplified execution: 
        // - Positive values: add to accumulator
        // - Negative values: subtract from accumulator
        // - Zero: halt
        
        if (this.instructionRegister === 0) {
            this.running = false;
            if (this.onHalt) {
                this.onHalt('Halt instruction (0) encountered');
            }
            return false;
        }
        
        // Execute instruction (simplified)
        this.accumulator += this.instructionRegister;
        
        // Increment program counter
        this.programCounter++;
        this.instructionCount++;
        
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
            instructionCount: this.instructionCount,
            running: this.running
        };
    }
}

// Example programs
const EXAMPLE_PROGRAMS = {
    addition: {
        name: 'Simple Addition',
        description: 'Adds several ternary numbers',
        code: '+ + + - 0'
    },
    multiplication: {
        name: 'Multiplication Demo',
        description: 'Demonstrates multiplication in ternary',
        code: '++ +- +0 -+ 0'
    },
    conditional: {
        name: 'Conditional Logic',
        description: 'Shows conditional execution',
        code: '+0+ -0- +-- 0'
    }
};

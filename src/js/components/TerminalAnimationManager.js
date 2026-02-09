/**
 * TerminalAnimationManager
 * Manages the terminal animation with typing effect, errors, and clear command
 */
export class TerminalAnimationManager {
    constructor() {
        this.terminal = document.getElementById('terminalContent');
        if (!this.terminal) return;

        this.isTyping = false;
        this.currentLine = null;
        this.commandQueue = [];

        // Start the animation cycle
        this.startAnimation();
    }

    /**
     * Creates a new terminal line element
     */
    createLine(hasPrompt = true) {
        const line = document.createElement('div');
        line.className = 'terminal__line';

        if (hasPrompt) {
            const prompt = document.createElement('span');
            prompt.className = 'terminal__prompt';
            prompt.textContent = '→';
            line.appendChild(prompt);
        }

        return line;
    }

    /**
     * Types text character by character with a typing effect
     */
    async typeText(element, text, speed = 80) {
        this.isTyping = true;

        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await this.sleep(speed + Math.random() * 40); // Slight variation for realism
        }

        this.isTyping = false;
    }

    /**
     * Clears the terminal content
     */
    clearTerminal() {
        this.terminal.innerHTML = '';
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Adds a cursor to the current line
     */
    addCursor(line) {
        const cursor = document.createElement('span');
        cursor.className = 'terminal__cursor';
        cursor.textContent = '_';
        line.appendChild(cursor);
    }

    /**
     * Removes cursor from line
     */
    removeCursor(line) {
        const cursor = line.querySelector('.terminal__cursor');
        if (cursor) cursor.remove();
    }

    /**
     * Main animation sequence
     */
    async runAnimationSequence() {
        // Step 1: Show prompt with cursor
        const commandLine = this.createLine(true);
        this.terminal.appendChild(commandLine);

        const commandText = document.createElement('span');
        commandText.className = 'terminal__command';
        commandLine.appendChild(commandText);

        this.addCursor(commandLine);
        await this.sleep(800);

        // Step 2: Type the command
        this.removeCursor(commandLine);
        await this.typeText(commandText, 'curl about.html');
        await this.sleep(600);

        // Step 3: "Execute" command (new line)
        await this.sleep(200);

        // Step 4: Show error message with typing effect
        const errorLine = this.createLine(false);
        const errorText = document.createElement('span');
        errorText.className = 'terminal__error';
        errorLine.appendChild(errorText);
        this.terminal.appendChild(errorLine);
        await this.sleep(200);

        // Type the error message character by character
        await this.typeText(errorText, 'zsh: work still in progress :*', 60);
        await this.sleep(1000);

        // Step 5: New prompt for clear command
        const clearLine = this.createLine(true);
        this.terminal.appendChild(clearLine);

        const clearText = document.createElement('span');
        clearText.className = 'terminal__command';
        clearLine.appendChild(clearText);

        this.addCursor(clearLine);
        await this.sleep(500);

        // Step 6: Type clear command
        this.removeCursor(clearLine);
        await this.typeText(clearText, 'clear', 100);
        await this.sleep(400);

        // Step 7: Execute clear
        await this.sleep(300);

        // Step 8: Clear terminal with fade effect
        this.terminal.style.transition = 'opacity 0.3s ease';
        this.terminal.style.opacity = '0';
        await this.sleep(300);

        this.clearTerminal();
        this.terminal.style.opacity = '1';
        await this.sleep(100);

        // Step 9: Restart the cycle
        await this.sleep(1500);
        this.runAnimationSequence();
    }

    /**
     * Start the animation
     */
    async startAnimation() {
        // Initial delay before starting
        await this.sleep(2000);
        this.runAnimationSequence();
    }

    /**
     * Stop the animation
     */
    destroy() {
        this.isTyping = false;
        if (this.terminal) {
            this.clearTerminal();
        }
    }
}



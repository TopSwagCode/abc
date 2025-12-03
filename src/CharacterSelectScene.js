/**
 * CharacterSelectScene
 * Character     preload() {
        // Load character sprites
        this.load.image('player_default', 'assets/player-default.png');
        this.load.image('player_random', 'assets/player-random.png');
        this.load.image('player_locked', 'assets/player-locked.png');
    }fficulty selection screen
 */

import GameConfig from './config/GameConfig.js';

export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
        
        // Character data
        this.characters = [
            { id: 'random', name: 'Random', sprite: 'player_random', unlocked: true },
            { id: 'default', name: 'Default', sprite: 'player_default', unlocked: true },
            { id: 'locked1', name: '???', sprite: 'player_locked', unlocked: false },
            { id: 'locked2', name: '???', sprite: 'player_locked', unlocked: false },
            { id: 'locked3', name: '???', sprite: 'player_locked', unlocked: false },
            { id: 'locked4', name: '???', sprite: 'player_locked', unlocked: false },
            { id: 'locked5', name: '???', sprite: 'player_locked', unlocked: false }
        ];
        
        // Difficulty levels
        this.difficulties = [
            { id: 1, name: 'Easy', sprite: 'difficulty_easy', color: 0x44ff44 },
            { id: 2, name: 'Normal', sprite: 'difficulty_medium', color: 0xffff44 },
            { id: 3, name: 'Hard', sprite: 'difficulty_hard', color: 0xff8844 },
            { id: 4, name: 'Extreme', sprite: 'difficulty_extreme', color: 0xff4444 }
        ];
        
        // Selection state
        this.selectedCharacterIndex = 0; // Default to "Random" character
        this.selectedDifficulty = 1; // Default to Easy
        
        // Navigation state (character vs difficulty selection)
        this.navigationMode = 'character'; // 'character' or 'difficulty'
        
        // Animation
        this.animationTime = 0;
    }
    
    preload() {
        // Load all character sprites for selection screen
        this.load.image('player_default', 'assets/player-default.png');
        this.load.image('player_random', 'assets/player-random.png');
        this.load.image('player_locked', 'assets/player-locked.png');
        
        // Load difficulty sprites
        this.load.image('difficulty_easy', 'assets/difficulty-easy.png');
        this.load.image('difficulty_medium', 'assets/difficulty-medium.png');
        this.load.image('difficulty_hard', 'assets/difficulty-hard.png');
        this.load.image('difficulty_extreme', 'assets/difficulty-extreme.png');
        
        // Load start button sprite
        this.load.image('start_button', 'assets/start.png');
    }
    
    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Title
        this.add.text(centerX, 50, 'SELECT CHARACTER', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Create character selection UI
        this.createCharacterSelection(centerX, centerY - 50);
        
        // Create difficulty selection UI
        this.createDifficultySelection(centerX, centerY + 150);
        
        // Start button
        this.createStartButton(centerX, centerY + 280);
        
        // Instructions
        this.add.text(centerX, this.cameras.main.height - 30, 
            'WASD / Arrows: Navigate | Enter / Space: Start Game | Click: Quick Select', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        
        // Setup input
        this.setupInput();
    }
    
    createCharacterSelection(centerX, startY) {
        this.characterSprites = [];
        this.characterLabels = [];
        this.characterHighlights = [];
        
        const spacing = 90;
        const startX = centerX - (this.characters.length - 1) * spacing / 2;
        
        this.characters.forEach((char, index) => {
            const x = startX + index * spacing;
            const y = startY;
            
            // Highlight box (hidden by default) - no fill, no stroke
            const highlight = this.add.rectangle(x, y, 75, 75, 0xffff00, 0);
            highlight.setStrokeStyle(0, 0xffff00);
            highlight.setVisible(false);
            this.characterHighlights.push(highlight);
            
            // Character sprite
            const sprite = this.add.sprite(x, y, char.sprite);
            const scale = 60 / Math.max(sprite.width, sprite.height);
            sprite.setScale(scale);
            
            // Store original position and scale for animation
            sprite.originalY = y;
            sprite.baseScale = scale;
            
            // Make sprite interactive for clicking
            sprite.setInteractive({ cursor: 'pointer' });
            sprite.on('pointerdown', () => {
                if (char.unlocked) {
                    this.selectedCharacterIndex = index;
                    this.navigationMode = 'character';
                    this.updateCharacterSelection();
                    this.updateDifficultySelection();
                    this.updateStartButton();
                }
            });
            
            this.characterSprites.push(sprite);
            
            // Character name
            const label = this.add.text(x, y + 50, char.name, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: char.unlocked ? '#ffffff' : '#666666'
            }).setOrigin(0.5);
            this.characterLabels.push(label);
        });
        
        // Update initial selection
        this.updateCharacterSelection();
    }
    
    createDifficultySelection(centerX, startY) {
        this.add.text(centerX, startY - 30, 'SELECT DIFFICULTY', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.difficultySprites = [];
        
        const spacing = 120;
        const startX = centerX - (this.difficulties.length - 1) * spacing / 2;
        
        this.difficulties.forEach((diff, index) => {
            const x = startX + index * spacing;
            const y = startY + 20;
            
            // Difficulty sprite
            const sprite = this.add.sprite(x, y, diff.sprite);
            const scale = 80 / Math.max(sprite.width, sprite.height);
            sprite.setScale(scale);
            
            // Store original position and scale for animation
            sprite.originalY = y;
            sprite.baseScale = scale;
            
            // Make sprite interactive for clicking
            sprite.setInteractive({ cursor: 'pointer' });
            
            // Click handler
            sprite.on('pointerdown', () => {
                this.selectedDifficulty = diff.id;
                this.navigationMode = 'difficulty';
                this.updateCharacterSelection();
                this.updateDifficultySelection();
                this.updateStartButton();
            });
            
            sprite.on('pointerover', () => {
                sprite.setTint(0xffffff); // White tint on hover
            });
            
            sprite.on('pointerout', () => {
                if (this.selectedDifficulty !== diff.id) {
                    sprite.clearTint();
                }
            });
            
            this.difficultySprites.push(sprite);
        });
        
        // Update initial selection
        this.updateDifficultySelection();
    }
    
    createStartButton(centerX, y) {
        // Start button sprite
        const startButton = this.add.sprite(centerX, y, 'start_button');
        
        // Scale to appropriate size (adjust as needed based on your image)
        const targetHeight = 80;
        const scale = targetHeight / startButton.height;
        startButton.setScale(scale);
        
        // Store original values for animation
        startButton.originalY = y;
        startButton.baseScale = scale;
        
        // Make interactive
        startButton.setInteractive({ cursor: 'pointer' });
        
        // Store reference for wiggle animation
        this.startButton = startButton;
        
        // Button interactions
        startButton.on('pointerdown', () => {
            this.startGame();
        });
        
        startButton.on('pointerover', () => {
            startButton.setTint(0xaaffaa); // Slight green tint on hover
        });
        
        startButton.on('pointerout', () => {
            startButton.clearTint();
        });
    }
    
    setupInput() {
        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // WASD keys
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        
        // Prevent key repeat
        this.lastKeyTime = 0;
        this.keyDelay = 200; // ms between key presses
        
        // Gamepad support
        this.input.gamepad.once('connected', (pad) => {
            this.gamepad = pad;
            console.log('🎮 Gamepad connected to Character Select');
        });
    }
    
    update(time, delta) {
        // Update animation time for wiggle effect
        this.animationTime += delta / 1000; // Convert to seconds
        
        // Apply wiggle to selected character
        this.updateWiggleAnimation();
        
        // Handle keyboard input
        if (time - this.lastKeyTime > this.keyDelay) {
            // Horizontal navigation (A/D and Left/Right)
            if (this.cursors.left.isDown || this.aKey.isDown) {
                if (this.navigationMode === 'character') {
                    this.moveCharacterSelection(-1);
                } else {
                    this.moveDifficultySelection(-1);
                }
                this.lastKeyTime = time;
            } else if (this.cursors.right.isDown || this.dKey.isDown) {
                if (this.navigationMode === 'character') {
                    this.moveCharacterSelection(1);
                } else {
                    this.moveDifficultySelection(1);
                }
                this.lastKeyTime = time;
            }
            
            // Vertical navigation (W/S and Up/Down) - switches between character, difficulty, and start
            if (this.cursors.up.isDown || this.wKey.isDown) {
                if (this.navigationMode === 'start') {
                    this.navigationMode = 'difficulty';
                } else if (this.navigationMode === 'difficulty') {
                    this.navigationMode = 'character';
                }
                this.updateCharacterSelection();
                this.updateDifficultySelection();
                this.updateStartButton();
                this.lastKeyTime = time;
            } else if (this.cursors.down.isDown || this.sKey.isDown) {
                if (this.navigationMode === 'character') {
                    this.navigationMode = 'difficulty';
                } else if (this.navigationMode === 'difficulty') {
                    this.navigationMode = 'start';
                }
                this.updateCharacterSelection();
                this.updateDifficultySelection();
                this.updateStartButton();
                this.lastKeyTime = time;
            }
            
            // Start game (enter or space) - only when start button is selected
            if (Phaser.Input.Keyboard.JustDown(this.enterKey) || 
                Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                if (this.navigationMode === 'start') {
                    this.startGame();
                }
                this.lastKeyTime = time;
            }
        }
        
        // Handle gamepad input
        if (this.gamepad) {
            if (time - this.lastKeyTime > this.keyDelay) {
                // D-pad or left stick for navigation
                const leftStickX = this.gamepad.leftStick.x;
                const leftStickY = this.gamepad.leftStick.y;
                
                if (leftStickX < -0.5 || this.gamepad.left) {
                    this.moveCharacterSelection(-1);
                    this.lastKeyTime = time;
                } else if (leftStickX > 0.5 || this.gamepad.right) {
                    this.moveCharacterSelection(1);
                    this.lastKeyTime = time;
                }
                
                if (leftStickY < -0.5 || this.gamepad.up) {
                    this.moveDifficultySelection(-1);
                    this.lastKeyTime = time;
                } else if (leftStickY > 0.5 || this.gamepad.down) {
                    this.moveDifficultySelection(1);
                    this.lastKeyTime = time;
                }
                
                // A button to start
                if (this.gamepad.A) {
                    this.startGame();
                    this.lastKeyTime = time;
                }
            }
        }
    }
    
    updateWiggleAnimation() {
        // Always wiggle the selected character sprite (even when not focused)
        this.characterSprites.forEach((sprite, index) => {
            if (index === this.selectedCharacterIndex) {
                // Apply bob and wiggle to selected character
                const bobAmount = Math.sin(this.animationTime * 4) * 5; // Up/down bob
                const wiggleAmount = Math.sin(this.animationTime * 8) * 0.05; // Slight rotation
                
                sprite.y = sprite.originalY + bobAmount;
                sprite.rotation = wiggleAmount;
                
                // Slight scale pulse
                const scalePulse = 1 + Math.sin(this.animationTime * 3) * 0.1;
                sprite.setScale(sprite.baseScale * scalePulse);
            } else {
                // Reset other sprites
                sprite.y = sprite.originalY;
                sprite.rotation = 0;
                sprite.setScale(sprite.baseScale);
            }
        });
        
        // Always wiggle the selected difficulty sprite (even when not focused)
        if (this.difficultySprites) {
            this.difficultySprites.forEach((sprite, index) => {
                const diff = this.difficulties[index];
                if (diff.id === this.selectedDifficulty) {
                    // Apply bob and wiggle to selected difficulty
                    const bobAmount = Math.sin(this.animationTime * 4) * 5;
                    const wiggleAmount = Math.sin(this.animationTime * 8) * 0.05;
                    
                    sprite.y = sprite.originalY + bobAmount;
                    sprite.rotation = wiggleAmount;
                    
                    const scalePulse = 1 + Math.sin(this.animationTime * 3) * 0.1;
                    sprite.setScale(sprite.baseScale * scalePulse);
                } else {
                    // Reset other sprites
                    sprite.y = sprite.originalY;
                    sprite.rotation = 0;
                    sprite.setScale(sprite.baseScale);
                }
            });
        }
        
        // Always wiggle the start button if it's in a "selected" state
        // (we'll consider it selected once you've navigated to it at least once, 
        // but for simplicity, just always wiggle when in start mode)
        if (this.startButton && this.navigationMode === 'start') {
            const bobAmount = Math.sin(this.animationTime * 4) * 5;
            const wiggleAmount = Math.sin(this.animationTime * 8) * 0.05;
            
            this.startButton.y = this.startButton.originalY + bobAmount;
            this.startButton.rotation = wiggleAmount;
            
            const scalePulse = 1 + Math.sin(this.animationTime * 3) * 0.1;
            this.startButton.setScale(this.startButton.baseScale * scalePulse);
        } else if (this.startButton) {
            this.startButton.y = this.startButton.originalY;
            this.startButton.rotation = 0;
            this.startButton.setScale(this.startButton.baseScale);
        }
    }
    
    moveCharacterSelection(direction) {
        // Find next unlocked character
        let newIndex = this.selectedCharacterIndex;
        let attempts = 0;
        
        do {
            newIndex += direction;
            
            // Wrap around
            if (newIndex < 0) newIndex = this.characters.length - 1;
            if (newIndex >= this.characters.length) newIndex = 0;
            
            attempts++;
            if (attempts > this.characters.length) break; // Prevent infinite loop
            
        } while (!this.characters[newIndex].unlocked && attempts < this.characters.length);
        
        if (this.characters[newIndex].unlocked) {
            this.selectedCharacterIndex = newIndex;
            this.updateCharacterSelection();
        }
    }
    
    moveDifficultySelection(direction) {
        this.selectedDifficulty += direction;
        
        // Clamp to valid range
        if (this.selectedDifficulty < 1) this.selectedDifficulty = 1;
        if (this.selectedDifficulty > 4) this.selectedDifficulty = 4;
        
        this.updateDifficultySelection();
    }
    
    updateCharacterSelection() {
        // Update highlights - show only if in character mode
        this.characterHighlights.forEach((highlight, index) => {
            const isSelected = index === this.selectedCharacterIndex && this.navigationMode === 'character';
            highlight.setVisible(isSelected);
        });
        
        // Update labels
        this.characterLabels.forEach((label, index) => {
            if (index === this.selectedCharacterIndex && this.navigationMode === 'character') {
                label.setStyle({ fontSize: '16px', color: '#ffffff' });
            } else {
                const char = this.characters[index];
                label.setStyle({ 
                    fontSize: '14px', 
                    color: char.unlocked ? '#ffffff' : '#666666' 
                });
            }
        });
    }
    
    updateDifficultySelection() {
        // Update difficulty sprites - no visual changes needed here
        // The bobbing animation will handle the visual feedback
        // Just clear tints for non-selected sprites
        if (this.difficultySprites) {
            this.difficultySprites.forEach((sprite, index) => {
                const diff = this.difficulties[index];
                if (diff.id !== this.selectedDifficulty) {
                    sprite.clearTint();
                }
            });
        }
    }
    
    updateStartButton() {
        // Visual feedback for start button when selected
        if (this.startButton) {
            if (this.navigationMode === 'start') {
                //this.startButton.setTint(0xaaffaa); // Green tint when selected
            } else {
                //this.startButton.clearTint();
            }
        }
    }
    
    startGame() {
        const selectedChar = this.characters[this.selectedCharacterIndex];
        
        console.log(`🎮 Starting game with character: ${selectedChar.name}, difficulty: ${this.selectedDifficulty}`);
        
        // Determine which character sprite to use
        let characterSprite = 'player_sprite'; // Default
        
        if (selectedChar.id === 'random') {
            // Pick a random unlocked character (excluding random and locked)
            const unlockedChars = this.characters.filter(c => c.unlocked && c.id !== 'random');
            if (unlockedChars.length > 0) {
                const randomChar = Phaser.Utils.Array.GetRandom(unlockedChars);
                characterSprite = randomChar.sprite;
                console.log(`🎲 Random selected: ${randomChar.name}`);
            }
        } else {
            characterSprite = selectedChar.sprite;
        }
        
        // Store selections in registry for GameScene to access
        this.registry.set('selectedCharacter', characterSprite);
        this.registry.set('selectedDifficulty', this.selectedDifficulty);
        
        // Transition to game scene
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene');
        });
    }
}

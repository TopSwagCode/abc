/**
 * InputManager
 * Handles all input (gamepad, keyboard, mouse) and mode switching
 */

import GameConfig from '../config/GameConfig.js';

export default class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.gamepad = null;
        this.inputMode = 'mouse'; // 'mouse' or 'controller'
        
        // Mouse tracking
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Input state
        this.movement = { x: 0, y: 0 };
        this.aimAngle = 0;
        
        this.init();
    }
    
    init() {
        // Set up keyboard
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = {
            w: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Set up gamepad
        this.setupGamepad();
        
        // Set up mouse tracking
        this.setupMouseTracking();
        
        // Initialize mouse position
        this.lastMouseX = this.scene.input.activePointer.x;
        this.lastMouseY = this.scene.input.activePointer.y;
    }
    
    setupGamepad() {
        console.log('🎮 Gamepad API available:', !!navigator.getGamepads);
        
        // Check for already connected gamepads
        const existingGamepads = navigator.getGamepads();
        existingGamepads.forEach((gp, i) => {
            if (gp) {
                console.log(`🎮 Gamepad ${i} already connected:`, gp.id);
            }
        });
        
        // Listen for gamepad connection
        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.on('connected', (pad) => {
                console.log('✅ Controller connected via Phaser:', pad.id);
                console.log('   Buttons:', pad.buttons.length);
                console.log('   Axes:', pad.axes.length);
                this.gamepad = pad;
                
                // Show on-screen notification
                this.showControllerNotification('🎮 Controller Connected!', 0x00ff00);
            });
            
            this.scene.input.gamepad.on('disconnected', (pad) => {
                console.log('❌ Controller disconnected:', pad.id);
                this.gamepad = null;
            });
        }
    }
    
    setupMouseTracking() {
        this.scene.input.on('pointermove', (pointer) => {
            const threshold = GameConfig.INPUT.MOUSE.MOVEMENT_THRESHOLD;
            const deltaX = Math.abs(pointer.x - this.lastMouseX);
            const deltaY = Math.abs(pointer.y - this.lastMouseY);
            
            if (deltaX > threshold || deltaY > threshold) {
                if (this.inputMode !== 'mouse') {
                    console.log('🖱️ Switched to mouse control');
                    this.inputMode = 'mouse';
                    this.scene.events.emit('inputModeChanged', 'mouse');
                }
            }
            
            this.lastMouseX = pointer.x;
            this.lastMouseY = pointer.y;
        });
    }
    
    showControllerNotification(text, color) {
        const connectText = this.scene.add.text(
            GameConfig.MAP_WIDTH / 2,
            GameConfig.MAP_HEIGHT / 2 - 100,
            text,
            {
                fontSize: '32px',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        connectText.setOrigin(0.5);
        connectText.setScrollFactor(0);
        connectText.setDepth(GameConfig.DEPTH.NOTIFICATION);
        
        this.scene.time.delayedCall(2000, () => {
            connectText.destroy();
        });
    }
    
    update() {
        this.updateMovement();
        this.updateAiming();
    }
    
    updateMovement() {
        let velocityX = 0;
        let velocityY = 0;
        
        // Keyboard input
        if (this.wasd.a.isDown) {
            velocityX = -1;
        } else if (this.wasd.d.isDown) {
            velocityX = 1;
        }
        
        if (this.wasd.w.isDown) {
            velocityY = -1;
        } else if (this.wasd.s.isDown) {
            velocityY = 1;
        }
        
        // Gamepad left stick input (overrides keyboard if active)
        if (this.gamepad) {
            const leftStick = this.gamepad.leftStick;
            const deadzone = GameConfig.INPUT.GAMEPAD.LEFT_STICK_DEADZONE;
            
            if (Math.abs(leftStick.x) > deadzone) {
                velocityX = leftStick.x;
            }
            if (Math.abs(leftStick.y) > deadzone) {
                velocityY = leftStick.y;
            }
        }
        
        this.movement = { x: velocityX, y: velocityY };
    }
    
    updateAiming() {
        let angle;
        let usingGamepad = false;
        
        // Gamepad right stick aiming (priority)
        if (this.gamepad) {
            const rightStick = this.gamepad.rightStick;
            const deadzone = GameConfig.INPUT.GAMEPAD.RIGHT_STICK_DEADZONE;
            
            if (Math.abs(rightStick.x) > deadzone || Math.abs(rightStick.y) > deadzone) {
                angle = Math.atan2(rightStick.y, rightStick.x);
                usingGamepad = true;
                
                // Switch to controller mode
                if (this.inputMode !== 'controller') {
                    console.log('🎮 Switched to controller control');
                    this.inputMode = 'controller';
                    this.scene.events.emit('inputModeChanged', 'controller');
                }
            }
        }
        
        // Mouse aiming (fallback)
        if (!usingGamepad) {
            const pointer = this.scene.input.activePointer;
            const player = this.scene.player; // Access player from scene
            
            if (player && player.sprite) {
                angle = Phaser.Math.Angle.Between(
                    player.sprite.x,
                    player.sprite.y,
                    pointer.x,
                    pointer.y
                );
            } else {
                angle = 0;
            }
        }
        
        this.aimAngle = angle;
    }
    
    getMovement() {
        return this.movement;
    }
    
    getAim() {
        return {
            angle: this.aimAngle,
            isGamepad: this.inputMode === 'controller'
        };
    }
    
    getAimAngle() {
        return this.aimAngle;
    }
    
    getInputMode() {
        return this.inputMode;
    }
    
    isButtonPressed(buttonName) {
        if (!this.gamepad) return false;
        
        const buttonIndex = GameConfig.INPUT.GAMEPAD.BUTTONS[buttonName];
        return this.gamepad.buttons[buttonIndex]?.pressed || false;
    }
    
    wasButtonJustPressed(buttonName) {
        if (!this.gamepad) return false;
        
        const buttonIndex = GameConfig.INPUT.GAMEPAD.BUTTONS[buttonName];
        return this.gamepad.buttons[buttonIndex]?.justDown || false;
    }
}

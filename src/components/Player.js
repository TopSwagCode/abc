/**
 * Player Component
 * Handles player entity, movement, rotation, health, and visual representation
 */

import GameConfig from '../config/GameConfig.js';

export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        console.log('🎮 Creating player at', x, y);
        
        // Stats
        this.maxHP = GameConfig.PLAYER.MAX_HP;
        this.hp = GameConfig.PLAYER.STARTING_HP;
        this.moveSpeed = GameConfig.PLAYER.MOVE_SPEED;
        
        // Create sprite
        this.sprite = this.createSprite(x, y);
        
        if (!this.sprite) {
            console.error('❌ Failed to create player sprite!');
            return;
        }
        
        console.log('✅ Player sprite created successfully');
        
        // Create shadow
        this.shadow = this.scene.add.circle(
            x,
            y + GameConfig.PLAYER.SHADOW_OFFSET_Y,
            GameConfig.PLAYER.SHADOW_SIZE,
            0x000000,
            GameConfig.PLAYER.SHADOW_ALPHA
        );
        this.shadow.setDepth(GameConfig.DEPTH.SHADOW);
        
        // Create crosshair
        this.crosshair = this.scene.add.sprite(x, y, 'crosshair');
        this.crosshair.setScale(GameConfig.CROSSHAIR.SCALE);
        this.crosshair.setDepth(GameConfig.CROSSHAIR.DEPTH);
        this.crosshair.setAlpha(GameConfig.CROSSHAIR.ALPHA);
        this.crosshair.setVisible(false); // Hidden by default (mouse mode)
        
        // Track previous position for continuous collision
        this.sprite.prevX = this.sprite.x;
        this.sprite.prevY = this.sprite.y;
    }
    
    createSprite(x, y) {
        let sprite;
        
        console.log('🔨 Creating sprite, checking textures...');
        console.log('  player_sprite exists:', this.scene.textures.exists('player_sprite'));
        console.log('  player exists:', this.scene.textures.exists('player'));
        
        // Try to use custom player sprite if available
        if (this.scene.textures.exists('player_sprite')) {
            console.log('  Using player_sprite texture');
            const spriteTexture = this.scene.textures.get('player_sprite');
            const frame = spriteTexture.get();
            
            // Calculate scale to make sprite 30 pixels
            const targetSize = GameConfig.PLAYER.SIZE;
            const scale = targetSize / Math.max(frame.width, frame.height);
            
            sprite = this.scene.physics.add.sprite(x, y, 'player_sprite');
            sprite.setScale(scale);
            sprite.setCircle(targetSize / 2);
        } else {
            console.log('  Generating fallback player texture');
            // Generate simple circle texture if it doesn't exist
            if (!this.scene.textures.exists('player')) {
                const graphics = this.scene.add.graphics();
                graphics.fillStyle(0x00ff00);
                graphics.fillCircle(16, 16, 16);
                graphics.generateTexture('player', 32, 32);
                graphics.destroy();
                console.log('  Created player texture');
            }
            
            sprite = this.scene.physics.add.sprite(x, y, 'player');
        }
        
        if (!sprite) {
            console.error('❌ Failed to create player sprite!');
            return null;
        }
        
        sprite.setCollideWorldBounds(true);
        sprite.setDepth(GameConfig.DEPTH.PLAYER);
        sprite.setVisible(true); // Explicitly set visible
        
        console.log('  Sprite properties:', {
            x: sprite.x,
            y: sprite.y,
            visible: sprite.visible,
            depth: sprite.depth,
            alpha: sprite.alpha
        });
        
        return sprite;
    }
    
    update(inputManager) {
        if (!this.sprite) {
            console.error('Player sprite is null in update!');
            return;
        }
        
        // Handle movement
        this.handleMovement(inputManager);
        
        // Handle rotation
        this.handleRotation(inputManager);
        
        // Update shadow position
        this.shadow.x = this.sprite.x;
        this.shadow.y = this.sprite.y + GameConfig.PLAYER.SHADOW_OFFSET_Y;
        
        // Update crosshair position
        const distance = GameConfig.CROSSHAIR.DISTANCE;
        this.crosshair.x = this.sprite.x + Math.cos(this.sprite.rotation) * distance;
        this.crosshair.y = this.sprite.y + Math.sin(this.sprite.rotation) * distance;
        this.crosshair.rotation = this.sprite.rotation;
    }
    
    updatePreviousPosition() {
        // Update previous position AFTER collision checks
        // This is called from GameScene after collision detection
        if (this.sprite) {
            this.sprite.prevX = this.sprite.x;
            this.sprite.prevY = this.sprite.y;
        }
    }
    
    handleMovement(inputManager) {
        const movement = inputManager.getMovement();
        
        if (movement.x !== 0 || movement.y !== 0) {
            // Normalize diagonal movement
            const magnitude = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
            const normalizedX = movement.x / magnitude;
            const normalizedY = movement.y / magnitude;
            
            this.sprite.setVelocity(
                normalizedX * this.moveSpeed,
                normalizedY * this.moveSpeed
            );
        } else {
            this.sprite.setVelocity(0, 0);
        }
    }
    
    handleRotation(inputManager) {
        const aim = inputManager.getAim();
        
        if (aim.angle !== null) {
            this.sprite.rotation = aim.angle;
            
            // Show/hide crosshair based on input method
            this.crosshair.setVisible(aim.isGamepad);
        }
    }
    
    getPosition() {
        if (!this.sprite) return { x: 0, y: 0 };
        return { x: this.sprite.x, y: this.sprite.y };
    }
    
    getRotation() {
        if (!this.sprite) return 0;
        return this.sprite.rotation;
    }
    
    getHP() {
        return this.hp;
    }
    
    getMaxHP() {
        return this.maxHP;
    }
    
    getMoveSpeed() {
        return this.moveSpeed;
    }
    
    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }
    
    setHP(hp) {
        this.hp = Math.max(0, Math.min(hp, this.maxHP));
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        
        if (this.hp <= 0) {
            this.hp = 0;
            return true; // Player is dead
        }
        
        return false; // Player is still alive
    }
    
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHP);
    }
    
    increaseMaxHP(amount) {
        this.maxHP += amount;
        this.hp += amount; // Also increase current HP
        // Make sure HP doesn't exceed new max
        this.hp = Math.min(this.hp, this.maxHP);
    }
    
    create() {
        // Empty method for compatibility - initialization happens in constructor
    }
    
    reset() {
        this.hp = this.maxHP;
        this.sprite.setPosition(GameConfig.MAP_WIDTH / 2, GameConfig.MAP_HEIGHT / 2);
        this.sprite.setVelocity(0, 0);
        
        // Reset previous position for collision detection
        this.prevX = GameConfig.MAP_WIDTH / 2;
        this.prevY = GameConfig.MAP_HEIGHT / 2;
    }
    
    setCrosshairVisible(visible) {
        this.crosshair.setVisible(visible);
    }
    
    destroy() {
        this.sprite.destroy();
        this.shadow.destroy();
        this.crosshair.destroy();
    }
}

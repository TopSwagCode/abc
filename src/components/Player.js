/**
 * Player Component
 * Handles player entity, movement, rotation, health, and visual representation
 */

import { GameConfig } from '../config/GameConfig.js';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Stats
        this.maxHP = GameConfig.PLAYER.MAX_HP;
        this.hp = GameConfig.PLAYER.STARTING_HP;
        this.moveSpeed = GameConfig.PLAYER.MOVE_SPEED;
        
        // Create sprite
        this.sprite = this.createSprite(x, y);
        
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
        
        // Try to use custom player sprite if available
        if (!this.scene.textures.exists('player')) {
            if (this.scene.textures.exists('player_sprite')) {
                const spriteTexture = this.scene.textures.get('player_sprite');
                const frame = spriteTexture.get();
                
                // Calculate scale to make sprite 30 pixels
                const targetSize = GameConfig.PLAYER.SIZE;
                const scale = targetSize / Math.max(frame.width, frame.height);
                
                sprite = this.scene.physics.add.sprite(x, y, 'player_sprite');
                sprite.setScale(scale);
                sprite.setCircle(targetSize / 2);
            } else {
                // Generate simple circle texture
                const graphics = this.scene.add.graphics();
                graphics.fillStyle(0x00ff00);
                graphics.fillCircle(16, 16, 16);
                graphics.generateTexture('player', 32, 32);
                graphics.destroy();
                
                sprite = this.scene.physics.add.sprite(x, y, 'player');
            }
        } else {
            sprite = this.scene.physics.add.sprite(x, y, 'player');
        }
        
        sprite.setCollideWorldBounds(true);
        sprite.setDepth(GameConfig.DEPTH.PLAYER);
        
        return sprite;
    }
    
    update(inputManager) {
        // Update previous position for collision detection
        this.sprite.prevX = this.sprite.x;
        this.sprite.prevY = this.sprite.y;
        
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
    
    handleMovement(inputManager) {
        const movement = inputManager.getMovement();
        
        this.sprite.setVelocity(
            movement.x * this.moveSpeed,
            movement.y * this.moveSpeed
        );
    }
    
    handleRotation(inputManager) {
        this.sprite.rotation = inputManager.getAimAngle();
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        
        return this.hp <= 0; // Returns true if dead
    }
    
    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHP) this.hp = this.maxHP;
    }
    
    increaseMoveSpeed(amount) {
        this.moveSpeed += amount;
    }
    
    increaseMaxHP(amount) {
        this.maxHP += amount;
        this.hp += amount; // Also heal by that amount
    }
    
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }
    
    getRotation() {
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
    
    setCrosshairVisible(visible) {
        this.crosshair.setVisible(visible);
    }
    
    destroy() {
        this.sprite.destroy();
        this.shadow.destroy();
        this.crosshair.destroy();
    }
}

export default Player;

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
        
        // Animation properties for bobbing and squashing
        this.animationTime = 0;
        this.baseScale = this.scene.textures.exists('player_sprite') ? 
            (GameConfig.PLAYER.SIZE / Math.max(this.sprite.width, this.sprite.height)) : 1;
        this.currentAimAngle = 0; // Track aim direction for sprite flipping
        
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
        
        // Handle sprite flipping based on aim direction (instead of rotation)
        this.handleAimDirection(inputManager);
        
        // Animate player sprite (bob and squash)
        this.animatePlayer();
        
        // Update shadow position
        this.shadow.x = this.sprite.x;
        this.shadow.y = this.sprite.y + GameConfig.PLAYER.SHADOW_OFFSET_Y;
        
        // Update crosshair position
        const distance = GameConfig.CROSSHAIR.DISTANCE;
        this.crosshair.x = this.sprite.x + Math.cos(this.currentAimAngle) * distance;
        this.crosshair.y = this.sprite.y + Math.sin(this.currentAimAngle) * distance;
        this.crosshair.rotation = this.currentAimAngle;
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
    
    handleAimDirection(inputManager) {
        const aim = inputManager.getAim();
        
        if (aim.angle !== null) {
            this.currentAimAngle = aim.angle;
            
            // Flip sprite based on aim direction
            // If aiming left (angle between 90° and 270°), flip sprite
            const angleInDegrees = (aim.angle * 180 / Math.PI + 360) % 360;
            if (angleInDegrees > 90 && angleInDegrees < 270) {
                // Aiming left, flip sprite
                this.sprite.setFlipX(true);
            } else {
                // Aiming right, show normal sprite
                this.sprite.setFlipX(false);
            }
            
            // Show/hide crosshair based on input method
            this.crosshair.setVisible(aim.isGamepad);
        }
    }
    
    /**
     * Animate player with bob and squash effects based on movement
     */
    animatePlayer() {
        if (!this.sprite) return;
        
        // Get movement velocity
        const velocity = this.sprite.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // Only animate when moving
        if (speed > 1) {
            // Animation speed based on movement speed
            const speedFactor = speed / this.moveSpeed;
            const bobSpeed = speedFactor * 3; // Adjust multiplier for animation speed
            
            // Update animation time
            this.animationTime += 0.016 * bobSpeed; // ~60fps delta
            
            // Calculate bob offset (vertical bounce)
            const bobAmount = speedFactor * 2; // Movement speed affects bob intensity
            const bobOffset = Math.sin(this.animationTime) * bobAmount;
            
            // Calculate squash/stretch
            const squashAmount = 0.08 * speedFactor;
            const squashFactor = Math.sin(this.animationTime * 2) * squashAmount;
            
            // Apply scale with squash effect
            const scaleX = this.baseScale * (1 + squashFactor);
            const scaleY = this.baseScale * (1 - squashFactor);
            
            // Preserve flip state when setting scale
            const currentFlip = this.sprite.flipX;
            this.sprite.setScale(scaleX, scaleY);
            this.sprite.setFlipX(currentFlip);
            
            // Apply vertical bob offset
            this.sprite.displayOriginY = this.sprite.height / 2 - bobOffset;
            
            // Update shadow with bob effect
            const shadowScale = 1 - Math.abs(bobOffset) * 0.02;
            this.shadow.setScale(shadowScale);
        } else {
            // Reset to base scale when not moving
            const currentFlip = this.sprite.flipX;
            this.sprite.setScale(this.baseScale);
            this.sprite.setFlipX(currentFlip);
            this.sprite.displayOriginY = this.sprite.height / 2;
            this.shadow.setScale(1);
        }
    }
    
    getPosition() {
        if (!this.sprite) return { x: 0, y: 0 };
        return { x: this.sprite.x, y: this.sprite.y };
    }
    
    getRotation() {
        // Return current aim angle instead of sprite rotation
        return this.currentAimAngle;
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
        
        // Reset animation properties
        this.animationTime = 0;
        this.currentAimAngle = 0;
        this.sprite.setScale(this.baseScale);
        this.sprite.setFlipX(false);
        this.sprite.displayOriginY = this.sprite.height / 2;
        this.shadow.setScale(1);
        
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

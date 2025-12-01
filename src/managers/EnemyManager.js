/**
 * EnemyManager
 * Handles enemy spawning, management, AI, and behavior
 */

import GameConfig from '../config/GameConfig.js';

export default class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        
        // Enemy configuration
        this.enemyTypes = [];
        this.enemyConfig = null;
        
        // Spawning settings
        this.spawnRate = GameConfig.ENEMY.SPAWN_RATE;
        this.minSpawnRate = GameConfig.ENEMY.MIN_SPAWN_RATE;
        this.lastSpawnTime = 0;
        this.enemySpeed = GameConfig.ENEMY.SPEED;
        
        // Create physics group
        this.enemies = scene.physics.add.group();
    }
    
    async loadEnemyConfig() {
        try {
            // Get the config from Phaser's cache (already loaded in preload)
            this.enemyConfig = this.scene.cache.json.get('enemyConfig');
            
            if (!this.enemyConfig || !this.enemyConfig.enemyTypes) {
                throw new Error('Enemy config not found in cache');
            }
            
            this.enemyTypes = this.enemyConfig.enemyTypes;
            console.log('✅ Loaded enemy types:', this.enemyTypes.length);
        } catch (error) {
            console.error('Failed to load enemies.json:', error);
            // Fallback to default enemy
            this.enemyTypes = [{
                id: 'basic',
                name: 'Basic Enemy',
                hp: 50,
                damage: 10,
                baseSpeed: 50,
                size: 16,
                color: 0xff0000,
                spawnWeight: 1
            }];
        }
    }
    
    preloadEnemySprites() {
        // Load enemy sprites if defined in config
        this.enemyTypes.forEach(enemyType => {
            if (enemyType.sprite) {
                this.scene.load.image(`enemy_sprite_${enemyType.id}`, enemyType.sprite);
            }
        });
    }
    
    createEnemyTextures() {
        // Generate textures for enemies without sprites
        this.enemyTypes.forEach(enemyType => {
            if (!enemyType.sprite && !this.scene.textures.exists(`enemy_${enemyType.id}`)) {
                const graphics = this.scene.add.graphics();
                graphics.fillStyle(enemyType.color || 0xff0000);
                const size = enemyType.size * 2;
                graphics.fillCircle(size, size, enemyType.size);
                graphics.generateTexture(`enemy_${enemyType.id}`, size * 2, size * 2);
                graphics.destroy();
            }
        });
    }
    
    update(time, player) {
        // Spawn enemies
        this.handleSpawning(time);
        
        // Update existing enemies
        this.updateEnemies(player);
    }
    
    handleSpawning(time) {
        if (time - this.lastSpawnTime < this.spawnRate) return;
        
        this.lastSpawnTime = time;
        this.spawnEnemy();
    }
    
    spawnEnemy() {
        // Select random enemy type based on spawn weight
        const enemyType = this.selectRandomEnemyType();
        
        // Spawn at random edge of map
        const edge = Phaser.Math.Between(0, 3);
        let x, y;
        
        switch(edge) {
            case 0: // Top
                x = Phaser.Math.Between(0, GameConfig.MAP_WIDTH);
                y = -20;
                break;
            case 1: // Right
                x = GameConfig.MAP_WIDTH + 20;
                y = Phaser.Math.Between(0, GameConfig.MAP_HEIGHT);
                break;
            case 2: // Bottom
                x = Phaser.Math.Between(0, GameConfig.MAP_WIDTH);
                y = GameConfig.MAP_HEIGHT + 20;
                break;
            case 3: // Left
                x = -20;
                y = Phaser.Math.Between(0, GameConfig.MAP_HEIGHT);
                break;
        }
        
        // Create enemy sprite
        const textureKey = enemyType.sprite ? `enemy_sprite_${enemyType.id}` : `enemy_${enemyType.id}`;
        const enemy = this.enemies.create(x, y, textureKey);
        
        // Scale sprite to match collision size if using sprite
        if (enemyType.sprite) {
            const targetDiameter = enemyType.size * 2;
            const scale = targetDiameter / Math.max(enemy.width, enemy.height);
            enemy.setScale(scale);
            
            const bodySize = targetDiameter;
            const offsetX = (enemy.displayWidth - bodySize) / 2;
            const offsetY = (enemy.displayHeight - bodySize) / 2;
            enemy.body.setCircle(enemyType.size, offsetX, offsetY);
        } else {
            enemy.setCircle(enemyType.size);
        }
        
        // Set enemy properties
        enemy.hp = enemyType.hp;
        enemy.maxHP = enemyType.hp;
        enemy.damage = enemyType.damage;
        enemy.speed = enemyType.baseSpeed + (this.enemySpeed - GameConfig.ENEMY.SPEED);
        enemy.enemyType = enemyType;
        
        // Animation properties for bobbing and squashing
        enemy.animationTime = Math.random() * Math.PI * 2; // Random starting phase
        enemy.baseScale = enemyType.sprite ? 
            (enemyType.size * 2) / Math.max(enemy.width, enemy.height) : 1;
        
        // Calculate animation speed based on movement speed and size
        // Faster enemies = faster animation, bigger enemies = slower animation
        const speedFactor = enemy.speed / 100; // Normalize speed
        const sizeFactor = 1 / (enemyType.size / 16); // Normalize to base size 16
        enemy.bobSpeed = speedFactor * sizeFactor * 2; // Combined factor
        enemy.bobAmount = (speedFactor * 2) / sizeFactor; // Faster = more bob, bigger = less bob
        
        // Track previous position for continuous collision
        enemy.prevX = x;
        enemy.prevY = y;
        
        // Add shadow
        enemy.shadow = this.scene.add.circle(x, y + 3, enemyType.size, 0x000000, 0.25);
        enemy.shadow.setDepth(GameConfig.DEPTH.ENEMY_SHADOW);
        
        // Visual settings
        enemy.setTint(0xffffff);
        enemy.setDepth(GameConfig.DEPTH.PLAYER);
        
        // Create health bar
        this.createEnemyHealthBar(enemy, enemyType);
        
        return enemy;
    }
    
    createEnemyHealthBar(enemy, enemyType) {
        const healthBarWidth = enemyType.size * 2;
        const healthBarHeight = 3;
        const healthBarY = -enemyType.size - 8;
        
        enemy.healthBarBg = this.scene.add.graphics();
        enemy.healthBarBg.setDepth(50);
        
        enemy.healthBarFill = this.scene.add.graphics();
        enemy.healthBarFill.setDepth(51);
        
        this.updateEnemyHealthBar(enemy);
    }
    
    updateEnemyHealthBar(enemy) {
        if (!enemy || !enemy.active) return;
        if (!enemy.healthBarBg || !enemy.healthBarFill) return;
        
        const healthBarWidth = enemy.enemyType.size * 2;
        const healthBarHeight = 3;
        const healthBarY = -enemy.enemyType.size - 8;
        
        const hpPercent = enemy.hp / enemy.maxHP;
        
        // Background
        try {
            enemy.healthBarBg.clear();
            enemy.healthBarBg.fillStyle(0x000000, 0.5);
            enemy.healthBarBg.fillRect(
                enemy.x - healthBarWidth / 2,
                enemy.y + healthBarY,
                healthBarWidth,
                healthBarHeight
            );
        } catch (e) {
            // Graphics object was destroyed
            return;
        }
        
        // Fill
        try {
            enemy.healthBarFill.clear();
            let barColor = 0x00ff00;
            if (hpPercent < 0.3) barColor = 0xff0000;
            else if (hpPercent < 0.6) barColor = 0xff8800;
            
            enemy.healthBarFill.fillStyle(barColor);
            enemy.healthBarFill.fillRect(
                enemy.x - healthBarWidth / 2,
                enemy.y + healthBarY,
                healthBarWidth * hpPercent,
                healthBarHeight
            );
        } catch (e) {
            // Graphics object was destroyed
            return;
        }
    }
    
    updateEnemies(player) {
        if (!player) return;
        
        const playerPos = player.getPosition();
        const currentTime = this.scene.time.now;
        
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active || !enemy.enemyType) return;
            
            // Store previous position for collision detection
            enemy.prevX = enemy.x;
            enemy.prevY = enemy.y;
            
            // Handle movement based on behavior pattern
            const behavior = enemy.enemyType.behavior;
            
            switch(behavior.movementPattern) {
                case 'direct_chase':
                    this.moveEnemyDirectChase(enemy, playerPos);
                    break;
                    
                case 'sinusoidal_chase':
                    this.moveEnemySinusoidalChase(enemy, playerPos, behavior);
                    break;
                    
                case 'random_wander':
                    this.moveEnemyRandomWander(enemy, behavior, currentTime);
                    break;
                    
                default:
                    // Fallback to direct chase
                    this.moveEnemyDirectChase(enemy, playerPos);
            }
            
            // Animate enemy sprite (bob and squash based on speed and size)
            this.animateEnemy(enemy);
            
            // Flip sprite based on player position (face toward player)
            this.updateEnemyFacing(enemy, playerPos);
            
            // Update shadow position (follow bob animation)
            if (enemy.shadow) {
                enemy.shadow.x = enemy.x;
                // Shadow moves slightly when bobbing up (simulates height)
                const bobOffset = Math.sin(enemy.animationTime) * enemy.bobAmount * 0.5;
                enemy.shadow.y = enemy.y + 3 + Math.abs(bobOffset);
                // Shadow gets slightly smaller when enemy "jumps" higher
                const shadowScale = 1 - Math.abs(bobOffset) * 0.02;
                enemy.shadow.setScale(shadowScale);
            }
            
            // Update health bar
            this.updateEnemyHealthBar(enemy);
            
            // Remove if too far from map (cleanup)
            if (enemy.x < -100 || enemy.x > GameConfig.MAP_WIDTH + 100 ||
                enemy.y < -100 || enemy.y > GameConfig.MAP_HEIGHT + 100) {
                this.destroyEnemy(enemy);
            }
        });
    }
    
    moveEnemyDirectChase(enemy, playerPos) {
        // Standard direct movement toward player (RED enemies)
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            playerPos.x, playerPos.y
        );
        
        enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
        );
    }
    
    moveEnemySinusoidalChase(enemy, playerPos, behavior) {
        // Move toward player with sinusoidal wave pattern (GREEN enemies)
        const angleToPlayer = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            playerPos.x, playerPos.y
        );
        
        // Initialize sin time if not exists
        if (enemy.sinTime === undefined) {
            enemy.sinTime = 0;
            enemy.sinOffset = Math.random() * Math.PI * 2; // Random phase
        }
        
        // Update sin time
        enemy.sinTime += 0.1;
        
        // Calculate perpendicular angle (for side-to-side motion)
        const perpAngle = angleToPlayer + Math.PI / 2;
        
        // Add sinusoidal offset
        const amplitude = behavior.amplitude || 50;
        const frequency = behavior.frequency || 1;
        const sinOffset = Math.sin(enemy.sinTime * frequency + enemy.sinOffset) * amplitude;
        
        // Calculate velocity with wave
        const baseVx = Math.cos(angleToPlayer) * enemy.speed;
        const baseVy = Math.sin(angleToPlayer) * enemy.speed;
        
        const offsetVx = Math.cos(perpAngle) * sinOffset;
        const offsetVy = Math.sin(perpAngle) * sinOffset;
        
        enemy.setVelocity(baseVx + offsetVx, baseVy + offsetVy);
    }
    
    moveEnemyRandomWander(enemy, behavior, currentTime) {
        // Random wandering movement (BLUE enemies)
        
        // Initialize properties if not exists
        if (enemy.wanderAngle === undefined) {
            enemy.wanderAngle = Math.random() * Math.PI * 2;
            enemy.lastDirectionChange = currentTime;
        }
        
        // Change direction periodically
        const changeInterval = behavior.directionChangeInterval || 2000;
        if (currentTime - enemy.lastDirectionChange > changeInterval) {
            // Pick new random direction
            enemy.wanderAngle = Math.random() * Math.PI * 2;
            enemy.lastDirectionChange = currentTime;
        }
        
        // Move in current wander direction
        enemy.setVelocity(
            Math.cos(enemy.wanderAngle) * enemy.speed,
            Math.sin(enemy.wanderAngle) * enemy.speed
        );
    }
    
    /**
     * Animate enemy with bob and squash effects based on speed and size
     */
    animateEnemy(enemy) {
        if (!enemy || !enemy.active) return;
        
        // Update animation time based on bob speed
        enemy.animationTime += 0.016 * enemy.bobSpeed; // ~60fps delta
        
        // Calculate bob offset (vertical bounce)
        const bobOffset = Math.sin(enemy.animationTime) * enemy.bobAmount;
        
        // Calculate squash/stretch (horizontal and vertical scale variation)
        // When bobbing up, squash vertically and stretch horizontally (and vice versa)
        const squashAmount = 0.05 * enemy.bobAmount; // Proportional to bob amount
        const squashFactor = Math.sin(enemy.animationTime * 2) * squashAmount;
        
        // Apply scale with squash effect
        const scaleX = enemy.baseScale * (1 + squashFactor);
        const scaleY = enemy.baseScale * (1 - squashFactor);
        
        enemy.setScale(scaleX, scaleY);
        
        // Apply vertical bob offset to y position (visual only, doesn't affect physics)
        enemy.displayOriginY = enemy.height / 2 - bobOffset;
    }
    
    /**
     * Update enemy sprite facing based on movement direction
     * Enemies face the direction they are moving
     */
    updateEnemyFacing(enemy, playerPos) {
        if (!enemy || !enemy.active) return;
        
        // Check the enemy's velocity to determine movement direction
        const velocity = enemy.body.velocity;
        
        // Only update facing if enemy is actually moving (avoid flickering when stationary)
        if (Math.abs(velocity.x) > 1) {
            if (velocity.x < 0) {
                // Moving left, flip the sprite
                enemy.setFlipX(true);
            } else {
                // Moving right, show normal sprite
                enemy.setFlipX(false);
            }
        }
    }
    
    selectRandomEnemyType() {
        // Calculate total weight
        const totalWeight = this.enemyTypes.reduce((sum, type) => sum + type.spawnWeight, 0);
        
        // Random value
        let random = Math.random() * totalWeight;
        
        // Select based on weight
        for (const type of this.enemyTypes) {
            random -= type.spawnWeight;
            if (random <= 0) {
                return type;
            }
        }
        
        return this.enemyTypes[0];
    }
    
    damageEnemy(enemy, damage) {
        enemy.hp -= damage;
        this.updateEnemyHealthBar(enemy);
        
        if (enemy.hp <= 0) {
            this.destroyEnemy(enemy);
            return true; // Enemy killed
        }
        
        return false; // Enemy still alive
    }
    
    destroyEnemy(enemy) {
        if (!enemy) return;
        
        // Destroy attached graphics
        if (enemy.shadow && enemy.shadow.active) {
            enemy.shadow.destroy();
        }
        if (enemy.healthBarBg && !enemy.healthBarBg.scene) {
            // Already destroyed, skip
        } else if (enemy.healthBarBg) {
            enemy.healthBarBg.destroy();
        }
        if (enemy.healthBarFill && !enemy.healthBarFill.scene) {
            // Already destroyed, skip
        } else if (enemy.healthBarFill) {
            enemy.healthBarFill.destroy();
        }
        
        // Destroy the enemy sprite
        if (enemy.active) {
            enemy.destroy();
        }
    }
    
    getEnemies() {
        return this.enemies;
    }
    
    getEnemyCount() {
        return this.enemies.countActive(true);
    }
    
    increaseDifficulty() {
        // Increase spawn rate (decrease time between spawns)
        this.spawnRate = Math.max(this.minSpawnRate, this.spawnRate - 100);
        
        // Increase enemy speed
        this.enemySpeed += 10;
    }
    
    clearAllEnemies() {
        // Create a copy of the array to avoid iteration issues during destruction
        const enemyList = [...this.enemies.children.entries];
        enemyList.forEach(enemy => {
            if (enemy && enemy.active) {
                this.destroyEnemy(enemy);
            }
        });
    }
    
    reset() {
        // Clear all enemies
        this.clearAllEnemies();
        
        // Reset spawn rate and difficulty
        this.spawnRate = GameConfig.ENEMY.SPAWN_RATE;
        this.lastSpawnTime = 0;
        this.enemySpeed = GameConfig.ENEMY.SPEED;
    }
}

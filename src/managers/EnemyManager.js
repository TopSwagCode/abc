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
            
            // Set collision circle smaller than sprite (to account for sprite whitespace)
            const collisionRadius = enemyType.size * GameConfig.COLLISION.ENEMY_MULTIPLIER;
            const bodySize = collisionRadius * 2;
            const offsetX = (enemy.displayWidth - bodySize) / 2;
            const offsetY = (enemy.displayHeight - bodySize) / 2;
            enemy.body.setCircle(collisionRadius, offsetX, offsetY);
        } else {
            // Fallback colored circles also use smaller collision
            const collisionRadius = enemyType.size * GameConfig.COLLISION.ENEMY_MULTIPLIER;
            enemy.setCircle(collisionRadius);
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
        enemy.bobSpeed = speedFactor * sizeFactor * 20; // Combined factor
        enemy.bobAmount = (speedFactor * 2.5) / sizeFactor; // Faster = more bob, bigger = less bob
        
        // Track previous position for continuous collision
        enemy.prevX = x;
        enemy.prevY = y;
        
        // Add shadow
        enemy.shadow = this.scene.add.circle(
            x, 
            y + GameConfig.SHADOW.OFFSET_Y, 
            enemyType.size * GameConfig.SHADOW.SIZE_MULTIPLIER, 
            0x000000
        );
        enemy.shadow.setAlpha(GameConfig.SHADOW.ALPHA);
        enemy.shadow.setDepth(GameConfig.DEPTH.ENEMY_SHADOW);
        
        // Visual settings
        enemy.setTint(0xffffff);
        enemy.setDepth(GameConfig.DEPTH.PLAYER);
        
        // Create health bar
        this.createEnemyHealthBar(enemy, enemyType);
        
        return enemy;
    }
    
    createEnemyHealthBar(enemy, enemyType) {
        // Use custom size if available (for split slimes), otherwise use enemyType size
        const size = enemy.customSize || enemyType.size;
        const healthBarWidth = size * 2;
        const healthBarHeight = 3;
        const healthBarY = -size - 8;
        
        enemy.healthBarBg = this.scene.add.graphics();
        enemy.healthBarBg.setDepth(50);
        
        enemy.healthBarFill = this.scene.add.graphics();
        enemy.healthBarFill.setDepth(51);
        
        this.updateEnemyHealthBar(enemy);
    }
    
    updateEnemyHealthBar(enemy) {
        if (!enemy || !enemy.active) return;
        if (!enemy.healthBarBg || !enemy.healthBarFill) return;
        
        // Use custom size if available (for split slimes), otherwise use enemyType size
        const size = enemy.customSize || enemy.enemyType.size;
        const healthBarWidth = size * 2;
        const healthBarHeight = 3;
        const healthBarY = -size - 8;
        
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
                enemy.shadow.y = enemy.y + GameConfig.SHADOW.OFFSET_Y + Math.abs(bobOffset);
                // Shadow gets slightly smaller when enemy "jumps" higher
                const shadowScale = 1 - Math.abs(bobOffset) * 0.02;
                enemy.shadow.setScale(shadowScale);
            }
            
            // Update health bar
            this.updateEnemyHealthBar(enemy);
            
            // Update poison stack indicator if poisoned
            if (enemy.poisonStacks > 0 && this.scene.effectsManager) {
                this.scene.effectsManager.updateStackIndicator(enemy);
            }
            
            // Check if enemy died (from poison or other DoT effects)
            if (enemy.hp <= 0) {
                // destroyEnemy will handle XP awarding on permanent death
                this.destroyEnemy(enemy);
                return; // Skip further processing for this enemy
            }
            
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
        
        // Store position and type before destruction
        const enemyX = enemy.x;
        const enemyY = enemy.y;
        const enemyType = enemy.enemyType;
        
        // Special death logic: Skeleton resurrection
        if (enemyType && enemyType.id === 'skeleton') {
            const shouldResurrect = this.handleSkeletonDeath(enemy, enemyX, enemyY, enemyType);
            if (shouldResurrect) {
                // Don't destroy the enemy yet, resurrection will handle it
                return;
            }
        }
        
        // Special death logic: Slime splitting
        if (enemyType && enemyType.id === 'slime') {
            this.handleSlimeSplit(enemy, enemyX, enemyY, enemyType);
        }
        
        // Play death animation BEFORE destroying the enemy
        if (this.scene.deathAnimationManager && enemy.enemyType) {
            this.scene.deathAnimationManager.playDeathAnimation(enemy, enemy.enemyType);
        }
        
        // Clear any active effects (poison, etc.) - ALWAYS call to ensure cleanup
        if (this.scene.effectsManager) {
            this.scene.effectsManager.clearPoison(enemy);
        }
        
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
        
        // Failsafe: Destroy poison stack indicator if it still exists
        if (enemy.poisonStackText) {
            enemy.poisonStackText.destroy();
            enemy.poisonStackText = null;
        }
        
        // Award XP for permanent death (only reaches here if not resurrecting)
        this.scene.events.emit('enemyKilled', {
            enemyType: enemyType,
            position: { x: enemyX, y: enemyY }
        });
        
        // Destroy the enemy sprite
        if (enemy.active) {
            enemy.destroy();
        }
    }
    
    /**
     * Handle slime splitting on death
     * Slimes split into 2 smaller slimes until they would have less than 10 HP
     */
    handleSlimeSplit(enemy, x, y, enemyType) {
        // Get current slime's HP and size (might be a split slime with custom values)
        const currentHP = enemy.maxHP || enemyType.hp; // Use maxHP if it's a split slime
        const currentSize = enemy.customSize || enemyType.size;
        
        // Calculate new slime stats (half HP and size)
        const newHP = Math.floor(currentHP / 2);
        const newSize = Math.floor(currentSize / 1.25);
        
        // Only split if new HP would be >= 10
        if (newHP < 10) {
            console.log(`Slime too small to split (would have ${newHP} HP)`);
            return; // Don't spawn smaller slimes
        }
        
        console.log(`Slime splitting: ${currentHP}HP → 2x ${newHP}HP slimes`);
        
        // Spawn 2 smaller slimes at slight offsets
        const spawnOffsets = [
            { x: -15, y: -10 },  // Top-left
            { x: 15, y: -10 }    // Top-right
        ];
        
        spawnOffsets.forEach(offset => {
            this.spawnSplitSlime(
                x + offset.x,
                y + offset.y,
                enemyType,
                newHP,
                newSize
            );
        });
    }
    
    /**
     * Spawn a split slime with custom HP and size
     */
    spawnSplitSlime(x, y, enemyType, hp, size) {
        // Create enemy sprite directly
        const textureKey = enemyType.sprite ? `enemy_sprite_${enemyType.id}` : `enemy_${enemyType.id}`;
        const enemy = this.enemies.create(x, y, textureKey);
        
        if (!enemy) return;
        
        // Calculate the scale needed for the custom size
        const targetDiameter = size * 2;
        const scale = targetDiameter / Math.max(enemy.width, enemy.height);
        
        // Set enemy properties with custom HP and size FIRST
        enemy.maxHP = hp;
        enemy.hp = hp;
        enemy.customSize = size; // Store for future splits
        enemy.damage = enemyType.damage;
        enemy.speed = enemyType.baseSpeed + (this.enemySpeed - GameConfig.ENEMY.SPEED);
        enemy.enemyType = enemyType;
        
        // Animation properties
        enemy.animationTime = Math.random() * Math.PI * 2;
        enemy.baseScale = scale;
        const speedFactor = enemy.speed / 100;
        const sizeFactor = 1 / (size / 16);
        enemy.bobSpeed = speedFactor * sizeFactor * 20;
        enemy.bobAmount = (speedFactor * 2.5) / sizeFactor;
        
        // Track previous position
        enemy.prevX = x;
        enemy.prevY = y;
        
        // Set the scale BEFORE setting collision
        enemy.setScale(scale);
        
        // Now set collision circle for the new size
        // The collision should be based on the actual size, not the sprite size
        const collisionRadius = size * GameConfig.COLLISION.ENEMY_MULTIPLIER;
        
        if (enemyType.sprite) {
            // For sprites, we need to calculate offset based on display size
            const bodyDiameter = collisionRadius * 2;
            const offsetX = (enemy.displayWidth - bodyDiameter) / 2;
            const offsetY = (enemy.displayHeight - bodyDiameter) / 2;
            enemy.body.setCircle(collisionRadius, offsetX, offsetY);
        } else {
            // For generated textures
            enemy.setCircle(collisionRadius);
        }
        
        // Add shadow with correct size (use radius, not diameter)
        const shadowRadius = (size / 2) * GameConfig.SHADOW.SIZE_MULTIPLIER;
        enemy.shadow = this.scene.add.circle(
            x, 
            y + GameConfig.SHADOW.OFFSET_Y, 
            shadowRadius, 
            0x000000
        );
        enemy.shadow.setAlpha(GameConfig.SHADOW.ALPHA);
        enemy.shadow.setDepth(GameConfig.DEPTH.ENEMY_SHADOW);
        
        // Visual settings
        enemy.setTint(0xffffff);
        enemy.setDepth(GameConfig.DEPTH.PLAYER);
        
        // Create health bar (will use customSize)
        this.createEnemyHealthBar(enemy, enemyType);
        
        // Add a little bounce effect when spawned (scale from small to normal)
        const targetScale = scale;
        enemy.setAlpha(0.5);
        enemy.setScale(scale * 0.3); // Start very small
        
        this.scene.tweens.add({
            targets: enemy,
            alpha: 1,
            scale: targetScale,
            duration: 250,
            ease: 'Back.easeOut',
            onUpdate: () => {
                // Update collision during scale animation to keep it accurate
                if (enemy.active && enemy.body) {
                    const currentRadius = size * GameConfig.COLLISION.ENEMY_MULTIPLIER;
                    if (enemyType.sprite) {
                        const bodyDiameter = currentRadius * 2;
                        const offsetX = (enemy.displayWidth - bodyDiameter) / 2;
                        const offsetY = (enemy.displayHeight - bodyDiameter) / 2;
                        enemy.body.setCircle(currentRadius, offsetX, offsetY);
                    }
                }
            }
        });
        
        console.log(`✅ Spawned split slime: ${hp}HP, ${size}px size (scale: ${scale.toFixed(2)}, collision radius: ${collisionRadius.toFixed(1)})`);
    }
    
    /**
     * Handle skeleton death and resurrection
     * Skeletons can die up to 3 times before final death
     * @returns {boolean} true if skeleton will resurrect, false if final death
     */
    handleSkeletonDeath(enemy, x, y, enemyType) {
        // Initialize death counter if not exists
        if (!enemy.deathCount) {
            enemy.deathCount = 0;
        }
        
        enemy.deathCount++;
        
        console.log(`💀 Skeleton death #${enemy.deathCount}/3`);
        
        // Check if this is the final death
        if (enemy.deathCount >= 3) {
            console.log(`💀 Skeleton final death - no resurrection`);
            return false; // Allow normal death
        }
        
        // Skeleton will resurrect!
        this.createSkeletonResurrection(enemy, x, y, enemyType);
        return true; // Prevent normal death
    }
    
    /**
     * Create skeleton resurrection animation and logic
     */
    createSkeletonResurrection(enemy, x, y, enemyType) {
        // Hide the original enemy and its components
        enemy.setVisible(false);
        enemy.setActive(false);
        enemy.body.enable = false;
        
        // Hide shadow and health bar
        if (enemy.shadow) enemy.shadow.setVisible(false);
        if (enemy.healthBarBg) enemy.healthBarBg.setVisible(false);
        if (enemy.healthBarFill) enemy.healthBarFill.setVisible(false);
        
        // Create bone pile sprite
        const bonePile = this.scene.add.sprite(x, y, 'enemy_sprite_skeleton_dead');
        const targetSize = enemyType.size * 2;
        const scale = targetSize / Math.max(bonePile.width, bonePile.height);
        bonePile.setScale(scale);
        bonePile.setDepth(GameConfig.DEPTH.PLAYER);
        bonePile.setAlpha(0);
        
        // Fade in the bone pile
        this.scene.tweens.add({
            targets: bonePile,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        console.log(`💀 Skeleton collapsed into bones, will resurrect in 5 seconds...`);
        
        // Wait 3 seconds, then shake for 2 seconds, then resurrect
        this.scene.time.delayedCall(3000, () => {
            console.log(`💀 Bones starting to shake...`);
            
            // Shake animation for 2 seconds
            const shakeInterval = this.scene.time.addEvent({
                delay: 50,
                callback: () => {
                    if (bonePile && bonePile.active) {
                        const offsetX = (Math.random() - 0.5) * 4;
                        const offsetY = (Math.random() - 0.5) * 4;
                        bonePile.setPosition(x + offsetX, y + offsetY);
                    }
                },
                loop: true
            });
            
            // After 2 seconds of shaking, resurrect
            this.scene.time.delayedCall(2000, () => {
                shakeInterval.remove();
                
                // Flash effect
                const flash = this.scene.add.circle(x, y, enemyType.size * 2, 0xffffff);
                flash.setAlpha(0.8);
                flash.setDepth(GameConfig.DEPTH.PROJECTILE);
                
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scale: 2,
                    duration: 300,
                    onComplete: () => flash.destroy()
                });
                
                // Destroy bone pile
                bonePile.destroy();
                
                // Resurrect the skeleton
                this.resurrectSkeleton(enemy, x, y, enemyType);
            });
        });
    }
    
    /**
     * Resurrect the skeleton at full health
     */
    resurrectSkeleton(enemy, x, y, enemyType) {
        console.log(`✨ Skeleton resurrected! Deaths: ${enemy.deathCount}/3`);
        
        // Restore full health
        enemy.hp = enemyType.hp;
        enemy.maxHP = enemyType.hp;
        
        // Reset position
        enemy.setPosition(x, y);
        
        // Make visible and active again
        enemy.setVisible(true);
        enemy.setActive(true);
        enemy.body.enable = true;
        
        // Show shadow and health bar
        if (enemy.shadow) {
            enemy.shadow.setVisible(true);
            enemy.shadow.setPosition(x, y + GameConfig.SHADOW.OFFSET_Y);
        }
        if (enemy.healthBarBg) enemy.healthBarBg.setVisible(true);
        if (enemy.healthBarFill) enemy.healthBarFill.setVisible(true);
        
        // Update health bar to show full health
        this.updateEnemyHealthBar(enemy);
        
        // Resurrection animation - pop in effect
        enemy.setAlpha(0);
        enemy.setScale(enemy.baseScale * 0.5);
        
        this.scene.tweens.add({
            targets: enemy,
            alpha: 1,
            scale: enemy.baseScale,
            duration: 400,
            ease: 'Back.easeOut'
        });
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

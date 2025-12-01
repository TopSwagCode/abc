/**
 * EnemyManager
 * Handles enemy spawning, management, AI, and behavior
 */

import { GameConfig } from '../config/GameConfig.js';

export class EnemyManager {
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
            const response = await fetch('enemies.json');
            this.enemyConfig = await response.json();
            this.enemyTypes = this.enemyConfig.enemies;
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
        if (!enemy.healthBarBg || !enemy.healthBarFill) return;
        
        const healthBarWidth = enemy.enemyType.size * 2;
        const healthBarHeight = 3;
        const healthBarY = -enemy.enemyType.size - 8;
        
        const hpPercent = enemy.hp / enemy.maxHP;
        
        // Background
        enemy.healthBarBg.clear();
        enemy.healthBarBg.fillStyle(0x000000, 0.5);
        enemy.healthBarBg.fillRect(
            enemy.x - healthBarWidth / 2,
            enemy.y + healthBarY,
            healthBarWidth,
            healthBarHeight
        );
        
        // Fill
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
    }
    
    updateEnemies(player) {
        if (!player) return;
        
        const playerPos = player.getPosition();
        
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            
            // Store previous position for collision detection
            enemy.prevX = enemy.x;
            enemy.prevY = enemy.y;
            
            // Move toward player
            const angle = Phaser.Math.Angle.Between(
                enemy.x, enemy.y,
                playerPos.x, playerPos.y
            );
            
            enemy.setVelocity(
                Math.cos(angle) * enemy.speed,
                Math.sin(angle) * enemy.speed
            );
            
            // Update shadow position
            if (enemy.shadow) {
                enemy.shadow.x = enemy.x;
                enemy.shadow.y = enemy.y + 3;
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
        if (enemy.shadow) enemy.shadow.destroy();
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        if (enemy.healthBarFill) enemy.healthBarFill.destroy();
        enemy.destroy();
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
        this.enemies.children.entries.forEach(enemy => {
            this.destroyEnemy(enemy);
        });
    }
}

export default EnemyManager;

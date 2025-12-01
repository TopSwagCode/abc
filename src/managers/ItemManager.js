/**
 * ItemManager - Manages all items, weapons, and shooting mechanics
 * 
 * Responsibilities:
 * - Load items configuration from JSON
 * - Manage player's active items and levels
 * - Handle shooting mechanics for all item types
 * - Calculate item stats with level bonuses
 * - Manage item behaviors and projectile patterns
 * - Create and configure projectile sprites
 */

import GameConfig from '../config/GameConfig.js';

export default class ItemManager {
    constructor(scene) {
        this.scene = scene;
        this.itemTypes = [];
        this.playerItems = [];
        this.autoFire = false;
    }
    
    /**
     * Load items configuration from JSON file
     */
    async loadItemsConfig() {
        try {
            const response = await fetch('items.json');
            if (!response.ok) {
                throw new Error(`Failed to load items.json: ${response.statusText}`);
            }
            this.itemTypes = await response.json();
            console.log(`✅ Loaded ${this.itemTypes.length} item types`);
            
            // Initialize with starting item
            const startingItem = this.itemTypes.find(i => i.isStarting);
            if (startingItem) {
                this.playerItems = [{
                    itemType: startingItem,
                    level: 1,
                    lastFireTime: 0
                }];
            }
            
            return this.itemTypes;
        } catch (error) {
            console.error('❌ Error loading items config:', error);
            return [];
        }
    }
    
    /**
     * Preload all item sprites
     */
    preloadItemSprites(scene) {
        this.itemTypes.forEach(itemType => {
            if (itemType.visual && itemType.visual.sprite) {
                scene.load.image(itemType.visual.sprite, itemType.visual.sprite);
            }
        });
    }
    
    /**
     * Create projectile textures for all item types
     */
    createProjectileTextures() {
        this.itemTypes.forEach(itemType => {
            const size = itemType.visual.size;
            const color = parseInt(itemType.visual.color, 16);
            const glowColor = parseInt(itemType.visual.glowColor, 16);
            const diameter = size * 2 + 6;
            
            const graphics = this.scene.add.graphics();
            
            // Outer glow effect
            graphics.fillStyle(glowColor, 0.5);
            graphics.fillCircle(diameter / 2, diameter / 2, size + 3);
            
            // Inner glow
            graphics.fillStyle(glowColor, 0.7);
            graphics.fillCircle(diameter / 2, diameter / 2, size + 1);
            
            // Main ball
            graphics.fillStyle(color, 1);
            graphics.fillCircle(diameter / 2, diameter / 2, size);
            
            // Highlight
            graphics.fillStyle(0xffffff, 0.8);
            graphics.fillCircle(diameter / 2 - size / 3, diameter / 2 - size / 3, size / 2.5);
            
            graphics.generateTexture(`projectile_${itemType.id}`, diameter, diameter);
            graphics.destroy();
        });
    }
    
    /**
     * Handle shooting for all player items
     */
    handleItemShooting(currentTime, playerRotation, playerPosition, ballsGroup) {
        if (!playerRotation || !playerPosition || !ballsGroup) return;
        
        this.playerItems.forEach(playerItem => {
            const itemStats = this.getItemStats(playerItem);
            const fireRate = itemStats.fireRate;
            
            // Check if this item is ready to fire
            if (currentTime - playerItem.lastFireTime >= fireRate) {
                this.shootItem(playerItem, currentTime, playerRotation, playerPosition, ballsGroup);
                playerItem.lastFireTime = currentTime;
            }
        });
    }
    
    /**
     * Shoot a single item
     */
    shootItem(playerItem, currentTime, playerRotation, playerPosition, ballsGroup) {
        const itemType = playerItem.itemType;
        const itemStats = this.getItemStats(playerItem);
        const behavior = this.getItemBehavior(playerItem);
        
        const numProjectiles = behavior.projectilesPerShot;
        const spreadAngle = behavior.spreadAngle;
        const baseAngle = playerRotation;
        
        // Shoot multiple projectiles if needed
        for (let i = 0; i < numProjectiles; i++) {
            let angleOffset = 0;
            if (numProjectiles > 1) {
                const angleStep = spreadAngle / (numProjectiles - 1);
                angleOffset = (i * angleStep - spreadAngle / 2) * (Math.PI / 180);
            }
            
            const shootAngle = baseAngle + angleOffset;
            
            // Create ball at player position
            const ball = ballsGroup.create(
                playerPosition.x,
                playerPosition.y,
                `projectile_${itemType.id}`
            );
            
            // Set collision circle
            ball.body.setCircle(itemStats.size);
            
            // Visual properties
            ball.setTint(0xffffff);
            ball.setDepth(GameConfig.DEPTH.PROJECTILES);
            ball.setAlpha(1.0);
            
            // Set velocity
            ball.setVelocity(
                Math.cos(shootAngle) * itemStats.speed,
                Math.sin(shootAngle) * itemStats.speed
            );
            
            // Ball properties
            ball.bounceCount = 0;
            ball.maxBounces = itemStats.maxBounces;
            ball.damage = itemStats.damage;
            ball.knockback = itemStats.knockback;
            ball.itemType = itemType;
            ball.itemLevel = playerItem.level;
            
            ball.setBounce(1, 1);
        }
    }
    
    /**
     * Calculate item stats with level bonuses
     */
    getItemStats(playerItem) {
        const baseStats = playerItem.itemType.baseStats;
        const levelUpBonus = playerItem.itemType.levelUpBonus;
        const level = playerItem.level;
        
        return {
            damage: baseStats.damage + (levelUpBonus.damage * (level - 1)),
            speed: baseStats.speed + (levelUpBonus.speed * (level - 1)),
            maxBounces: baseStats.maxBounces + (levelUpBonus.maxBounces * (level - 1)),
            size: baseStats.size,
            knockback: baseStats.knockback,
            fireRate: Math.max(100, baseStats.fireRate + (levelUpBonus.fireRate * (level - 1)))
        };
    }
    
    /**
     * Get item behavior (including level-specific changes)
     */
    getItemBehavior(playerItem) {
        const baseBehavior = playerItem.itemType.behavior;
        const level = playerItem.level;
        const levelUpBehavior = playerItem.itemType.levelUpBehavior;
        
        if (levelUpBehavior) {
            const levelKey = `level${level}`;
            if (levelUpBehavior[levelKey]) {
                return { ...baseBehavior, ...levelUpBehavior[levelKey] };
            }
        }
        
        return baseBehavior;
    }
    
    /**
     * Add a new item to player's inventory
     */
    addItem(itemType) {
        const hasItem = this.playerItems.find(pi => pi.itemType.id === itemType.id);
        
        if (!hasItem) {
            this.playerItems.push({
                itemType: itemType,
                level: 1,
                lastFireTime: 0
            });
            console.log(`✅ Unlocked: ${itemType.name}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Level up an existing item
     */
    levelUpItem(itemTypeId) {
        const playerItem = this.playerItems.find(pi => pi.itemType.id === itemTypeId);
        
        if (playerItem && playerItem.level < playerItem.itemType.maxLevel) {
            playerItem.level++;
            console.log(`⬆️ ${playerItem.itemType.name} leveled up to ${playerItem.level}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get all available item types
     */
    getItemTypes() {
        return this.itemTypes;
    }
    
    /**
     * Get player's current items
     */
    getPlayerItems() {
        return this.playerItems;
    }
    
    /**
     * Set auto-fire mode
     */
    setAutoFire(enabled) {
        this.autoFire = enabled;
        console.log('🎮 Auto-fire:', this.autoFire ? 'ON' : 'OFF');
    }
    
    /**
     * Toggle auto-fire mode
     */
    toggleAutoFire() {
        this.autoFire = !this.autoFire;
        console.log('🎮 Auto-fire:', this.autoFire ? 'ON' : 'OFF');
        return this.autoFire;
    }
    
    /**
     * Check if auto-fire is enabled
     */
    isAutoFireEnabled() {
        return this.autoFire;
    }
    
    /**
     * Reset item manager state
     */
    reset() {
        this.autoFire = false;
        
        // Reset to starting item
        const startingItem = this.itemTypes.find(i => i.isStarting);
        if (startingItem) {
            this.playerItems = [{
                itemType: startingItem,
                level: 1,
                lastFireTime: 0
            }];
        } else {
            this.playerItems = [];
        }
    }
    
    /**
     * Get item by ID
     */
    getItemTypeById(id) {
        return this.itemTypes.find(item => item.id === id);
    }
    
    /**
     * Get unlockable items for current level
     */
    getUnlockableItems(playerLevel) {
        return this.itemTypes.filter(itemType => {
            const hasItem = this.playerItems.find(pi => pi.itemType.id === itemType.id);
            return !hasItem && itemType.unlockLevel <= playerLevel;
        });
    }
    
    /**
     * Get upgradeable items
     */
    getUpgradeableItems() {
        return this.playerItems.filter(playerItem => 
            playerItem.level < playerItem.itemType.maxLevel
        );
    }
}

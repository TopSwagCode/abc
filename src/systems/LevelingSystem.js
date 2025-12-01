/**
 * LevelingSystem - Manages XP, leveling, and upgrade selection
 * 
 * Responsibilities:
 * - Track XP and level progression
 * - Calculate XP requirements for next level
 * - Generate upgrade options (new items, item levels, stat boosts)
 * - Handle level-up triggers and rewards
 * - Emit events for UI updates
 */

export default class LevelingSystem {
    constructor(scene) {
        this.scene = scene;
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.levelUpPending = false;
    }
    
    /**
     * Gain XP and check for level up
     */
    gainXP(amount) {
        this.xp += amount;
        
        // Emit XP gained event for UI updates
        this.scene.events.emit('xpGained', {
            currentXP: this.xp,
            requiredXP: this.xpToNextLevel,
            amount: amount
        });
        
        // Check for level up
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
            
            this.triggerLevelUp();
        }
    }
    
    /**
     * Trigger level up sequence
     */
    triggerLevelUp() {
        this.levelUpPending = true;
        
        // Emit level up event
        this.scene.events.emit('levelUp', {
            level: this.level,
            xpToNextLevel: this.xpToNextLevel
        });
        
        console.log(`🎉 Level Up! Now level ${this.level}`);
    }
    
    /**
     * Generate upgrade options based on current game state
     */
    generateUpgradeOptions(itemManager, playerStats) {
        const upgrades = [];
        const itemTypes = itemManager.getItemTypes();
        const playerItems = itemManager.getPlayerItems();
        
        // Add options to unlock new items
        itemTypes.forEach(itemType => {
            const hasItem = playerItems.find(pi => pi.itemType.id === itemType.id);
            
            if (!hasItem && itemType.unlockLevel <= this.level) {
                upgrades.push({
                    name: `🔫 ${itemType.name}`,
                    description: `${itemType.description}\n+${itemType.baseStats.damage} DMG`,
                    type: 'new_item',
                    itemType: itemType,
                    apply: () => {
                        itemManager.addItem(itemType);
                    }
                });
            } else if (hasItem && hasItem.level < itemType.maxLevel) {
                // Level up existing item
                const nextLevel = hasItem.level + 1;
                const bonus = itemType.levelUpBonus;
                upgrades.push({
                    name: `⬆️ ${itemType.name} Lv${nextLevel}`,
                    description: `+${bonus.damage} DMG, ${bonus.fireRate < 0 ? '+' : ''}${Math.abs(bonus.fireRate)}ms fire rate`,
                    type: 'level_up_item',
                    itemType: itemType,
                    apply: () => {
                        itemManager.levelUpItem(itemType.id);
                    }
                });
            }
        });
        
        // Add stat upgrades as fallback
        const statUpgrades = [
            {
                name: '🏃 Move Speed',
                description: 'Move 20% faster',
                type: 'stat',
                apply: () => {
                    const newSpeed = playerStats.moveSpeed * 1.2;
                    this.scene.events.emit('statUpgrade', {
                        stat: 'moveSpeed',
                        value: newSpeed
                    });
                }
            },
            {
                name: '❤️ Max HP +20',
                description: 'Increases maximum health',
                type: 'stat',
                apply: () => {
                    this.scene.events.emit('statUpgrade', {
                        stat: 'maxHP',
                        value: playerStats.maxHP + 20
                    });
                }
            },
            {
                name: '💚 Heal +30',
                description: 'Restore health',
                type: 'stat',
                apply: () => {
                    this.scene.events.emit('statUpgrade', {
                        stat: 'heal',
                        value: 30
                    });
                }
            }
        ];
        
        upgrades.push(...statUpgrades);
        
        // Randomly select 3 upgrades
        return Phaser.Utils.Array.Shuffle([...upgrades]).slice(0, 3);
    }
    
    /**
     * Complete the level up process
     */
    completeLevelUp() {
        this.levelUpPending = false;
        
        this.scene.events.emit('levelUpComplete');
    }
    
    /**
     * Check if level up is pending
     */
    isLevelUpPending() {
        return this.levelUpPending;
    }
    
    /**
     * Get current level
     */
    getLevel() {
        return this.level;
    }
    
    /**
     * Get current XP
     */
    getXP() {
        return this.xp;
    }
    
    /**
     * Get XP required for next level
     */
    getXPToNextLevel() {
        return this.xpToNextLevel;
    }
    
    /**
     * Get XP progress as percentage (0-1)
     */
    getXPProgress() {
        return this.xp / this.xpToNextLevel;
    }
    
    /**
     * Reset leveling system
     */
    reset() {
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.levelUpPending = false;
        
        this.scene.events.emit('levelingReset');
    }
    
    /**
     * Set level (for testing/debugging)
     */
    setLevel(level) {
        this.level = level;
        this.xp = 0;
        this.xpToNextLevel = 100 * Math.pow(1.5, level - 1);
    }
}

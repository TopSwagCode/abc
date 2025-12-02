/**
 * EffectsManager
 * Handles damage-over-time, buffs, debuffs, and other effects on entities
 */

export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.lastUpdateTime = 0;
    }
    
    /**
     * Update all effects - call this every frame
     */
    update(time, enemies, player) {
        // Only process effects every 100ms to avoid excessive checks
        if (time - this.lastUpdateTime < 100) {
            return;
        }
        
        this.lastUpdateTime = time;
        
        // Update enemy effects
        if (enemies && enemies.children) {
            enemies.children.entries.forEach(enemy => {
                if (enemy.active) {
                    this.updateEnemyEffects(enemy, time);
                }
            });
        }
        
        // Update player effects (for future use)
        if (player) {
            this.updatePlayerEffects(player, time);
        }
    }
    
    /**
     * Update effects on an enemy
     */
    updateEnemyEffects(enemy, currentTime) {
        // Check poison effect
        if (enemy.poisonStacks > 0) {
            this.updatePoisonEffect(enemy, currentTime);
        }
        
        // Future: Add other effects like burn, freeze, slow, etc.
    }
    
    /**
     * Update player effects
     */
    updatePlayerEffects(player, currentTime) {
        // Future: Add player effects like regeneration, shields, buffs, etc.
    }
    
    /**
     * Update poison ticking on an enemy
     */
    updatePoisonEffect(enemy, currentTime) {
        // Initialize poison tracking if needed
        if (!enemy.poisonLastTickTime) {
            enemy.poisonLastTickTime = currentTime;
            return;
        }
        
        // Check if it's time for the next poison tick
        const timeSinceLastTick = currentTime - enemy.poisonLastTickTime;
        
        if (timeSinceLastTick >= enemy.poisonTickInterval) {
            // Apply poison damage
            const totalDamage = enemy.poisonDamagePerTick * enemy.poisonStacks;
            enemy.hp -= totalDamage;
            
            // Update last tick time
            enemy.poisonLastTickTime = currentTime;
            
            // Show poison damage number
            this.showDamageNumber(enemy, totalDamage, '#44ff44');
            
            // Note: Enemy death is now handled by EnemyManager.update()
            // which checks enemy.hp <= 0 every frame
        }
        
        // Check if poison should expire
        if (!enemy.poisonExpiryTime) {
            enemy.poisonExpiryTime = currentTime + enemy.poisonDuration;
        }
        
        if (currentTime >= enemy.poisonExpiryTime) {
            this.clearPoison(enemy);
        }
    }
    
    /**
     * Apply poison to an enemy
     */
    applyPoison(enemy, poisonData, currentTime) {
        // Initialize poison tracking if not exists
        if (!enemy.poisonStacks) {
            enemy.poisonStacks = 0;
        }
        
        const isFirstStack = enemy.poisonStacks === 0;
        
        // Add a poison stack (up to max)
        if (enemy.poisonStacks < poisonData.maxStacks) {
            enemy.poisonStacks++;
        }
        
        // Store poison properties
        enemy.poisonDamagePerTick = poisonData.damagePerTick;
        enemy.poisonTickInterval = poisonData.tickInterval;
        enemy.poisonDuration = poisonData.duration;
        
        // Only initialize tick timer on first stack
        if (isFirstStack) {
            enemy.poisonLastTickTime = currentTime;
            enemy.poisonExpiryTime = currentTime + poisonData.duration;
        } else {
            // Extend the expiry time instead of resetting it
            // This keeps poison active as long as you keep hitting
            enemy.poisonExpiryTime = currentTime + poisonData.duration;
            // Don't reset poisonLastTickTime - let ticks continue naturally
        }
        
        // Apply green tint to show poison
        enemy.setTint(0x88ff88);
        
        // Show stack indicator
        this.showStackIndicator(enemy);
    }
    
    /**
     * Clear poison from an enemy
     */
    clearPoison(enemy) {
        if (!enemy) return;
        
        // Debug log
        if (enemy.poisonStackText) {
            console.log('Clearing poison stack text for enemy');
        }
        
        enemy.poisonStacks = 0;
        enemy.poisonLastTickTime = null;
        enemy.poisonExpiryTime = null;
        
        // Clear tint (only if enemy is still active)
        if (enemy.active) {
            enemy.clearTint();
        }
        
        // Remove stack indicator if it exists (always do this, even if enemy is inactive)
        if (enemy.poisonStackText) {
            enemy.poisonStackText.destroy();
            enemy.poisonStackText = null;
        }
    }
    
    /**
     * Show damage number floating above entity
     */
    showDamageNumber(entity, damage, color = '#ff0000') {
        const damageText = this.scene.add.text(entity.x, entity.y - 20, `-${Math.floor(damage)}`, {
            fontSize: '14px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        });
        damageText.setOrigin(0.5);
        damageText.setDepth(100);
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 25,
            alpha: 0,
            duration: 600,
            ease: 'Cubic.easeOut',
            onComplete: () => damageText.destroy()
        });
    }
    
    /**
     * Show stack indicator above enemy
     */
    showStackIndicator(enemy) {
        // Remove old indicator if exists
        if (enemy.poisonStackText) {
            enemy.poisonStackText.destroy();
        }
        
        // Create new stack indicator
        enemy.poisonStackText = this.scene.add.text(
            enemy.x, 
            enemy.y - enemy.enemyType.size - 15, 
            `☠${enemy.poisonStacks}`,
            {
                fontSize: '12px',
                fill: '#44ff44',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        enemy.poisonStackText.setOrigin(0.5);
        enemy.poisonStackText.setDepth(60);
    }
    
    /**
     * Update stack indicator position (call from enemy update loop)
     */
    updateStackIndicator(enemy) {
        if (enemy.poisonStackText && enemy.active) {
            enemy.poisonStackText.x = enemy.x;
            enemy.poisonStackText.y = enemy.y - enemy.enemyType.size - 15;
            enemy.poisonStackText.setText(`☠${enemy.poisonStacks}`);
        }
    }
}

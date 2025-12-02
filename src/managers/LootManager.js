/**
 * LootManager
 * Handles loot drops, animations, and magnetic pickup
 */

import GameConfig from '../config/GameConfig.js';

export default class LootManager {
    constructor(scene) {
        this.scene = scene;
        
        // Loot drop settings
        this.dropChance = 0.5; // 50% chance
        
        // Create physics group for loot items
        this.lootItems = scene.physics.add.group();
        
        // Animation tracking
        this.lootAnimations = new Map(); // Map<lootId, animationData>
    }
    
    /**
     * Preload loot assets
     */
    preloadAssets(scene) {
        scene.load.image('chest', 'assets/chest.png');
    }
    
    /**
     * Try to drop loot at enemy death position
     */
    tryDropLoot(position) {
        // 50% chance to drop
        if (Math.random() > this.dropChance) {
            return;
        }
        
        this.dropChest(position.x, position.y);
    }
    
    /**
     * Drop a chest at the specified position
     */
    dropChest(x, y) {
        // Create chest sprite
        const chest = this.lootItems.create(x, y, 'chest');
        
        if (!chest) {
            console.error('Failed to create chest sprite');
            return;
        }
        
        // Physics properties
        chest.setCollideWorldBounds(false);
        chest.setDepth(GameConfig.DEPTH.PLAYER); // Same depth as player
        
        // Chest properties
        chest.lootType = 'chest';
        chest.lootId = `chest_${Date.now()}_${Math.random()}`;
        chest.isBeingCollected = false;
        chest.isCollected = false; // Flag to prevent multiple collections
        
        // Size the chest appropriately
        const targetSize = 24; // 24x24 pixels
        const scale = targetSize / Math.max(chest.width, chest.height);
        chest.setScale(scale);
        
        // Set up collision circle for pickup detection (smaller than visual to account for sprite whitespace)
        const collisionRadius = (targetSize / 2) * GameConfig.COLLISION.LOOT_MULTIPLIER;
        chest.body.setCircle(collisionRadius);
        
        // Create shadow for the chest (consistent with all entities)
        // Shadow radius should be half of chest size
        const shadowRadius = (targetSize / 2) * GameConfig.SHADOW.SIZE_MULTIPLIER; 
        const shadow = this.scene.add.circle(
            x, 
            y + GameConfig.SHADOW.OFFSET_Y,
            shadowRadius,
            0x000000
        );
        shadow.setAlpha(GameConfig.SHADOW.ALPHA);
        shadow.setDepth(GameConfig.DEPTH.ENEMY_SHADOW);
        chest.shadow = shadow;
        
        console.log(`Created chest shadow: radius=${shadowRadius.toFixed(1)} (chest: ${targetSize}, multiplier: ${GameConfig.SHADOW.SIZE_MULTIPLIER})`);
        
        // Initialize animation data
        this.lootAnimations.set(chest.lootId, {
            wiggleTime: Math.random() * Math.PI * 2, // Random starting phase
            wiggleSpeed: 2,
            wiggleAmount: 0.1, // Slight rotation wiggle
            bobAmount: 3, // Vertical bob in pixels
            baseY: y,
            baseScale: scale
        });
        
        // Add a subtle drop-in animation
        chest.setAlpha(0);
        chest.y = y - 30;
        shadow.setAlpha(0);
        
        this.scene.tweens.add({
            targets: chest,
            y: y,
            alpha: 1,
            duration: 300,
            ease: 'Bounce.easeOut'
        });
        
        this.scene.tweens.add({
            targets: shadow,
            alpha: GameConfig.SHADOW.ALPHA,
            duration: 300,
            ease: 'Bounce.easeOut'
        });
        
        return chest;
    }
    
    /**
     * Update all loot items (animations and magnetic attraction)
     */
    update(delta, player) {
        const playerPos = player.getPosition();
        const magneticRange = player.getMagneticRange();
        
        this.lootItems.children.entries.forEach(loot => {
            if (!loot || !loot.active || loot.isCollected) return;
            
            // Update shadow position (same offset as all entities)
            if (loot.shadow && loot.shadow.active) {
                loot.shadow.x = loot.x;
                loot.shadow.y = loot.y + GameConfig.SHADOW.OFFSET_Y;
            }
            
            // Animate the loot
            this.animateLoot(loot, delta);
            
            // Always check and apply magnetic attraction
            this.applyMagneticAttraction(loot, playerPos, magneticRange);
            
            // Check if player touched the loot
            this.checkPickup(loot, playerPos, player);
        });
    }
    
    /**
     * Animate loot with wiggle and bob effects
     */
    animateLoot(loot, delta) {
        const animData = this.lootAnimations.get(loot.lootId);
        if (!animData) return;
        
        // Update wiggle time
        animData.wiggleTime += delta * 0.001 * animData.wiggleSpeed;
        
        // Apply wiggle rotation (side to side)
        const wiggleRotation = Math.sin(animData.wiggleTime) * animData.wiggleAmount;
        loot.setRotation(wiggleRotation);
        
        // Only apply bob effect if NOT being collected (don't interfere with physics movement)
        if (!loot.isBeingCollected) {
            const bobOffset = Math.sin(animData.wiggleTime * 1.5) * animData.bobAmount;
            loot.y = animData.baseY + bobOffset;
            
            // Update shadow with bob effect (same as enemies)
            if (loot.shadow && loot.shadow.active) {
                loot.shadow.y = loot.y + GameConfig.SHADOW.OFFSET_Y + Math.abs(bobOffset);
                // Shadow gets slightly smaller when loot "jumps" higher
                const shadowScale = 1 - Math.abs(bobOffset) * 0.02;
                loot.shadow.setScale(shadowScale);
            }
        }
        
        // Slight scale pulse
        const scalePulse = 1 + Math.sin(animData.wiggleTime * 2) * 0.05;
        loot.setScale(animData.baseScale * scalePulse);
    }
    
    /**
     * Apply magnetic attraction to loot
     */
    applyMagneticAttraction(loot, playerPos, magneticRange) {
        // Calculate distance to player
        const dx = playerPos.x - loot.x;
        const dy = playerPos.y - loot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Once within magnetic range, always pull towards player until collected
        if (distance < magneticRange) {
            // Mark as being collected
            loot.isBeingCollected = true;
        }
        
        // If being collected, continue pulling towards player
        if (loot.isBeingCollected) {
            // Calculate attraction strength (stronger when closer)
            // Use a speed that increases as we get closer
            const speed = 150 + Math.max(0, (magneticRange - distance)) * 2;
            
            // Normalize direction vector (avoid division by zero)
            if (distance > 0.1) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                // Debug logging
                if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
                    console.log(`Magnetic: dist=${distance.toFixed(1)}, speed=${speed.toFixed(1)}, isBeingCollected=${loot.isBeingCollected}`);
                }
                
                // Set velocity directly towards player (updated every frame)
                loot.setVelocity(
                    dirX * speed,
                    dirY * speed
                );
            }
        } else {
            // Not being collected yet, stay still
            loot.setVelocity(0, 0);
            loot.setAcceleration(0, 0);
        }
    }
    
    /**
     * Check if player picked up the loot
     */
    checkPickup(loot, playerPos, player) {
        // Skip if already collected
        if (loot.isCollected) return;
        
        const dx = playerPos.x - loot.x;
        const dy = playerPos.y - loot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Pickup distance (very close to player)
        if (distance < 15) {
            this.collectLoot(loot, player);
        }
    }
    
    /**
     * Collect the loot
     */
    collectLoot(loot, player) {
        // Prevent multiple collections
        if (loot.isCollected) return;
        loot.isCollected = true;
        
        // Stop physics immediately
        if (loot.body) {
            loot.body.setVelocity(0, 0);
            loot.body.setAcceleration(0, 0);
        }
        
        // Play collection animation
        this.scene.tweens.add({
            targets: loot,
            scale: loot.scale * 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // Clean up
                this.lootAnimations.delete(loot.lootId);
                
                // Destroy shadow
                if (loot.shadow && loot.shadow.active) {
                    loot.shadow.destroy();
                }
                
                if (loot && loot.active) {
                    loot.destroy();
                }
            }
        });
        
        // Fade out shadow too
        if (loot.shadow && loot.shadow.active) {
            this.scene.tweens.add({
                targets: loot.shadow,
                alpha: 0,
                duration: 200,
                ease: 'Cubic.easeIn'
            });
        }
        
        // Award loot to player
        this.awardChestLoot(player);
        
        // Visual feedback
        this.showCollectionEffect(loot.x, loot.y);
    }
    
    /**
     * Award chest loot to player
     */
    awardChestLoot(player) {
        // For now, just award bonus XP
        // In the future, could be random items, gold, etc.
        const bonusXP = 50;
        this.scene.events.emit('chestCollected', { bonusXP });
        
        // Show text notification
        const text = this.scene.add.text(
            player.sprite.x,
            player.sprite.y - 40,
            `+${bonusXP} XP!`,
            {
                fontSize: '20px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }
        );
        text.setOrigin(0.5);
        text.setDepth(100);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }
    
    /**
     * Show collection particle effect
     */
    showCollectionEffect(x, y) {
        // Create sparkle particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            
            const particle = this.scene.add.circle(x, y, 3, 0xffff00);
            particle.setDepth(100);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    /**
     * Clean up all loot items
     */
    reset() {
        this.lootItems.clear(true, true);
        this.lootAnimations.clear();
    }
    
    /**
     * Get all active loot items
     */
    getLootItems() {
        return this.lootItems;
    }
}

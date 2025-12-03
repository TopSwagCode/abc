/**
 * DeathAnimationManager
 * Handles satisfying death animations for enemies
 */

import GameConfig from '../config/GameConfig.js';

export default class DeathAnimationManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Play death animation for an enemy
     * @param {Phaser.GameObjects.Sprite} enemy - The enemy sprite
     * @param {Object} enemyType - Enemy configuration with color info
     */
    playDeathAnimation(enemy, enemyType) {
        const x = enemy.x;
        const y = enemy.y;
        const color = enemyType.color ? parseInt(enemyType.color) : 0xff0000;
        const size = enemyType.size || 20;

        // 1. White damage flash (single frame)
        this.createDamageFlash(x, y, color, size);

        // 2. Quick squash-and-pop on the enemy before it disappears
        this.createPopEffect(enemy);

        // 3. Add a few larger "blood drops"
        this.createBloodDrops(x, y, color, size);
    }

    /**
     * Create a brief white flash at death location
     */
    createDamageFlash(x, y, color, size) {
        const flash = this.scene.add.circle(x, y, size, color);
        flash.setAlpha(1.0);
        flash.setDepth(GameConfig.DEPTH.PROJECTILE);

        // Flash disappears almost instantly
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 120,
            ease: 'Power3',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    /**
     * Create quick squash-and-expand pop effect on the enemy sprite
     */
    createPopEffect(enemy) {
        // Quick squash down (more dramatic)
        this.scene.tweens.add({
            targets: enemy,
            scaleX: enemy.scaleX * 1.6,
            scaleY: enemy.scaleY * 0.4,
            duration: 60,
            ease: 'Power2',
            yoyo: false,
            onComplete: () => {
                // Then HUGE expand and fade
                this.scene.tweens.add({
                    targets: enemy,
                    scaleX: enemy.scaleX * 2.5,
                    scaleY: enemy.scaleY * 2.5,
                    alpha: 0,
                    duration: 180,
                    ease: 'Back.easeIn',
                });
            }
        });
    }

    /**
     * Create larger blood/ink drops that fall
     */
    createBloodDrops(x, y, color, size) {
        const dropCount = 4 + Math.floor(size / 8);

        for (let i = 0; i < dropCount; i++) {
            // Random angle for outward spread
            const angle = Math.random() * Math.PI * 2;
            const spreadDistance = size * 0.3 + Math.random() * size * 0.5;
            
            // Start position - slight offset from center
            const startOffsetX = Math.cos(angle) * (size * 0.2);
            const startOffsetY = Math.sin(angle) * (size * 0.2);
            
            const dropSize = 5 + Math.random() * 5; // Bigger drops

            const drop = this.scene.add.circle(
                x + startOffsetX,
                y + startOffsetY,
                dropSize,
                color
            );
            drop.setAlpha(0.9);
            drop.setDepth(GameConfig.DEPTH.PROJECTILE - 2);

            // Calculate outward spread destination
            const spreadX = Math.cos(angle) * spreadDistance;
            const spreadY = Math.sin(angle) * spreadDistance;
            
            // Also fall down with gravity
            const fallDistance = 30 + Math.random() * 50;

            // Animate drop spreading outward AND falling
            this.scene.tweens.add({
                targets: drop,
                x: drop.x + spreadX,
                y: drop.y + spreadY + fallDistance, // Spread + gravity
                alpha: 0,
                scale: 0.4,
                duration: 500 + Math.random() * 250,
                ease: 'Quad.easeOut', // Changed to easeOut for more natural arc
                onComplete: () => {
                    drop.destroy();
                }
            });
        }
    }

    /**
     * Create alternative "poof" style death (lighter, less gore)
     */
    createPoofAnimation(x, y, color, size) {
        const poofCount = 8 + Math.floor(size / 4);

        for (let i = 0; i < poofCount; i++) {
            const angle = (Math.PI * 2 * i) / poofCount;
            const distance = size * 0.5;
            const cloudSize = 6 + Math.random() * 6;

            const cloud = this.scene.add.circle(
                x + Math.cos(angle) * (size * 0.2),
                y + Math.sin(angle) * (size * 0.2),
                cloudSize,
                color
            );
            cloud.setAlpha(0.6);
            cloud.setDepth(GameConfig.DEPTH.PROJECTILE - 1);

            // Animate outward in a puff
            this.scene.tweens.add({
                targets: cloud,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 10,
                scale: 2,
                alpha: 0,
                duration: 400 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => {
                    cloud.destroy();
                }
            });
        }
    }
}

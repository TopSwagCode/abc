/**
 * CollisionManager
 * Handles all collision detection including continuous swept collision
 */

import GameConfig from '../config/GameConfig.js';

export class CollisionManager {
    constructor(scene, effectsManager, enemyManager) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.enemyManager = enemyManager;
        
        // Track recent ball-enemy collisions to prevent multiple hits
        // Format: Map<ballId, Map<enemyId, timestamp>>
        this.recentHits = new Map();
        this.hitCooldown = 50; // 50ms cooldown between same ball hitting same enemy
    }
    
    /**
     * Check if a ball can hit an enemy (cooldown-based)
     */
    canBallHitEnemy(ball, enemy) {
        // Create unique ID for the ball if it doesn't have one
        if (!ball.ballId) {
            ball.ballId = `ball_${Date.now()}_${Math.random()}`;
        }
        
        // Create unique ID for the enemy if it doesn't have one
        if (!enemy.enemyId) {
            enemy.enemyId = `enemy_${enemy.x}_${enemy.y}_${Date.now()}`;
        }
        
        const currentTime = Date.now();
        
        // Get the hit tracking for this ball
        if (!this.recentHits.has(ball.ballId)) {
            this.recentHits.set(ball.ballId, new Map());
        }
        
        const ballHits = this.recentHits.get(ball.ballId);
        
        // Check if this ball hit this enemy recently
        if (ballHits.has(enemy.enemyId)) {
            const lastHitTime = ballHits.get(enemy.enemyId);
            const timeSinceHit = currentTime - lastHitTime;
            
            if (timeSinceHit < this.hitCooldown) {
                // Still in cooldown period
                return false;
            }
        }
        
        // Record this hit
        ballHits.set(enemy.enemyId, currentTime);
        
        // Clean up old entries (older than 1 second)
        for (const [enemyId, timestamp] of ballHits.entries()) {
            if (currentTime - timestamp > 1000) {
                ballHits.delete(enemyId);
            }
        }
        
        return true;
    }
    
    /**
     * Clean up hit tracking for a destroyed ball
     */
    cleanupBallHits(ball) {
        if (ball.ballId && this.recentHits.has(ball.ballId)) {
            this.recentHits.delete(ball.ballId);
        }
    }
    
    /**
     * Check ball-enemy collisions with continuous detection
     * Detects only the FIRST/CLOSEST collision to prevent multiple hits per frame
     */
    checkBallEnemyCollisions(balls, enemies) {
        const ballsArray = balls.children.entries;
        const enemiesArray = enemies.children.entries;
        
        ballsArray.forEach(ball => {
            if (!ball.active) return;
            
            // Get ball movement vector
            const dx = ball.x - ball.prevX;
            const dy = ball.y - ball.prevY;
            
            // If ball hasn't moved much, skip expensive collision check
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
            
            let closestCollision = null;
            let closestT = 1.0; // Parametric time (0 = start, 1 = end)
            
            // Check collision with all enemies, find the closest one
            enemiesArray.forEach(enemy => {
                if (!enemy.active) return;
                
                // Check cooldown before doing expensive collision detection
                if (!this.canBallHitEnemy(ball, enemy)) {
                    return; // Skip this enemy, still in cooldown
                }
                
                // Get ball and enemy radii
                const ballRadius = ball.displayWidth / 2;
                const enemyRadius = enemy.enemyType ? enemy.enemyType.size : 15;
                
                // Use continuous collision detection
                const collision = this.sweptCircleCircle(
                    ball.prevX, ball.prevY, ballRadius,
                    ball.x, ball.y,
                    enemy.x, enemy.y, enemyRadius
                );
                
                if (collision && collision.t < closestT) {
                    closestT = collision.t;
                    closestCollision = { enemy: enemy, t: collision.t };
                }
            });
            
            // Handle the earliest collision only
            if (closestCollision) {
                // Move ball to collision point
                ball.x = ball.prevX + dx * closestCollision.t;
                ball.y = ball.prevY + dy * closestCollision.t;
                
                // Handle collision
                this.handleBallEnemyHit(ball, closestCollision.enemy);
            }
        });
    }
    
    /**
     * Check player-enemy collisions with continuous detection + distance fallback
     */
    checkPlayerEnemyCollisions(player, enemies) {
        const playerSprite = player.sprite;
        const playerPos = player.getPosition();
        const enemiesArray = enemies.children.entries;
        
        // Get player radius
        const playerRadius = GameConfig.PLAYER.SIZE / 2;
        
        enemiesArray.forEach(enemy => {
            if (!enemy.active) return;
            
            let hasCollision = false;
            
            // Get enemy radius
            const enemyRadius = enemy.enemyType ? enemy.enemyType.size : 15;
            
            // Check if player is moving
            const playerMoving = Math.abs(playerSprite.body.velocity.x) > 0.1 || 
                                Math.abs(playerSprite.body.velocity.y) > 0.1;
            
            if (playerMoving && playerSprite.prevX !== undefined && playerSprite.prevY !== undefined) {
                // Use continuous collision for moving player
                const collision = this.sweptCircleCircle(
                    playerSprite.prevX, playerSprite.prevY, playerRadius,
                    playerPos.x, playerPos.y,
                    enemy.x, enemy.y, enemyRadius
                );
                hasCollision = collision !== null;
            } else {
                // Use simple distance check for stationary player or if prevX/prevY not set
                const distance = Phaser.Math.Distance.Between(
                    playerPos.x, playerPos.y,
                    enemy.x, enemy.y
                );
                const minDistance = playerRadius + enemyRadius;
                hasCollision = distance < minDistance;
            }
            
            if (hasCollision) {
                this.handlePlayerEnemyHit(player, enemy);
            }
        });
    }
    
    /**
     * Swept circle-circle collision detection
     * Returns collision time t in [0, 1] or null if no collision
     */
    sweptCircleCircle(x1, y1, r1, x2, y2, cx, cy, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Vector from start to circle center
        const fx = x1 - cx;
        const fy = y1 - cy;
        
        const combinedRadius = r1 + r2;
        
        // Quadratic equation coefficients for swept collision
        // ||f + t*d|| = r
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = (fx * fx + fy * fy) - combinedRadius * combinedRadius;
        
        const discriminant = b * b - 4 * a * c;
        
        // No collision if discriminant is negative
        if (discriminant < 0) return null;
        
        // Calculate both possible collision times
        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);
        
        // We want the earliest collision in range [0, 1]
        if (t1 >= 0 && t1 <= 1) {
            return { t: t1 };
        }
        
        if (t2 >= 0 && t2 <= 1) {
            return { t: t2 };
        }
        
        // Check if already overlapping at start
        if (t1 < 0 && t2 > 1) {
            return { t: 0 };
        }
        
        return null;
    }
    
    /**
     * Handle ball hitting enemy
     */
    handleBallEnemyHit(ball, enemy) {
        if (!ball.active || !enemy.active) return;
        
        const damage = ball.damage;
        
        // Apply damage to enemy
        enemy.hp -= damage;
        
        // Apply poison if this is a poison ball
        if (ball.isPoisonBall && this.effectsManager) {
            const poisonData = {
                damagePerTick: ball.poisonDamagePerTick,
                tickInterval: ball.poisonTickInterval,
                duration: ball.poisonDuration,
                maxStacks: ball.poisonMaxStacks
            };
            this.effectsManager.applyPoison(enemy, poisonData, this.scene.time.now);
        }
        
        // Visual feedback - flash color based on ball type
        const flashColor = ball.isPoisonBall ? 0x44ff44 : 0xff0000;
        enemy.setTint(flashColor);
        this.scene.time.delayedCall(250, () => {
            if (enemy.active) {
                // Return to poison tint if poisoned, otherwise clear
                if (enemy.poisonStacks > 0) {
                    enemy.setTint(0x88ff88);
                } else {
                    enemy.clearTint();
                }
            }
        });
        
        // Damage number popup
        const damageText = this.scene.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
            fontSize: '16px',
            fill: ball.isPoisonBall ? '#44ff44' : '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        });
        damageText.setOrigin(0.5);
        damageText.setDepth(100);
        
        // Animate damage text floating up and fading
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => damageText.destroy()
        });
        
        // Knockback effect on enemy
        const knockback = ball.knockback || 100;
        const knockbackAngle = Phaser.Math.Angle.Between(ball.x, ball.y, enemy.x, enemy.y);
        enemy.setVelocity(
            Math.cos(knockbackAngle) * knockback,
            Math.sin(knockbackAngle) * knockback
        );
        
        // Kill enemy if HP <= 0
        if (enemy.hp <= 0) {
            // Use EnemyManager's destroyEnemy for proper cleanup
            // EnemyManager will handle XP awarding on permanent death
            this.enemyManager.destroyEnemy(enemy);
        }
        
        // Handle ball bounce
        ball.bounceCount++;
        if (ball.bounceCount >= ball.maxBounces) {
            // Clean up hit tracking before destroying
            this.cleanupBallHits(ball);
            ball.destroy();
        } else {
            // Bounce ball away from enemy (reflect direction)
            const bounceAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, ball.x, ball.y);
            const currentSpeed = ball.body.speed; // Use current physics speed
            ball.setVelocity(
                Math.cos(bounceAngle) * currentSpeed,
                Math.sin(bounceAngle) * currentSpeed
            );
        }
        
        // Emit event for damage dealing (for health bar updates)
        this.scene.events.emit('enemyDamaged', enemy, damage);
    }
    
    /**
     * Handle player hitting enemy
     */
    handlePlayerEnemyHit(player, enemy) {
        if (!enemy.active) return;
        
        const damage = enemy.damage;
        const isDead = player.takeDamage(damage);
        
        // Visual feedback
        player.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(500, () => {
            if (player.sprite.active) {
                player.sprite.clearTint();
            }
        });
        
        // Screen shake on hit
        this.scene.cameras.main.shake(100, 0.005);
        
        // Knockback player away from enemy
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            player.sprite.x, player.sprite.y
        );
        player.sprite.setVelocity(
            player.sprite.body.velocity.x + Math.cos(angle) * 200,
            player.sprite.body.velocity.y + Math.sin(angle) * 200
        );
        
        // Use EnemyManager's destroyEnemy for proper cleanup (includes poison icons)
        this.enemyManager.destroyEnemy(enemy);
        
        // Emit events
        if (isDead) {
            this.scene.events.emit('playerDied');
        }
    }
}

export default CollisionManager;

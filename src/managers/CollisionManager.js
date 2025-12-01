/**
 * CollisionManager
 * Handles all collision detection including continuous swept collision
 */

export class CollisionManager {
    constructor(scene) {
        this.scene = scene;
    }
    
    /**
     * Check ball-enemy collisions with continuous detection
     */
    checkBallEnemyCollisions(balls, enemies) {
        const ballsArray = balls.children.entries;
        const enemiesArray = enemies.children.entries;
        
        ballsArray.forEach(ball => {
            if (!ball.active) return;
            
            enemiesArray.forEach(enemy => {
                if (!enemy.active) return;
                
                // Use continuous collision detection
                const collision = this.sweptCircleCircle(
                    ball.prevX, ball.prevY, ball.body.radius,
                    ball.x, ball.y,
                    enemy.x, enemy.y, enemy.body.radius
                );
                
                if (collision) {
                    this.handleBallEnemyHit(ball, enemy);
                }
            });
        });
    }
    
    /**
     * Check player-enemy collisions with continuous detection + distance fallback
     */
    checkPlayerEnemyCollisions(player, enemies) {
        const playerSprite = player.sprite;
        const playerPos = player.getPosition();
        const enemiesArray = enemies.children.entries;
        
        enemiesArray.forEach(enemy => {
            if (!enemy.active) return;
            
            let hasCollision = false;
            
            // Check if player is moving
            const playerMoving = Math.abs(playerSprite.body.velocity.x) > 0.1 || 
                                Math.abs(playerSprite.body.velocity.y) > 0.1;
            
            if (playerMoving) {
                // Use continuous collision for moving player
                const collision = this.sweptCircleCircle(
                    playerSprite.prevX, playerSprite.prevY, playerSprite.body.radius,
                    playerPos.x, playerPos.y,
                    enemy.x, enemy.y, enemy.body.radius
                );
                hasCollision = collision !== null;
            } else {
                // Use simple distance check for stationary player
                const distance = Phaser.Math.Distance.Between(
                    playerPos.x, playerPos.y,
                    enemy.x, enemy.y
                );
                const minDistance = playerSprite.body.radius + enemy.body.radius;
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
        
        // Visual feedback - flash red
        enemy.setTint(0xff0000);
        this.scene.time.delayedCall(250, () => {
            if (enemy.active) {
                enemy.clearTint();
            }
        });
        
        // Damage number popup
        const damageText = this.scene.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
            fontSize: '16px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        });
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
        
        // Knockback effect
        const knockback = ball.knockback || 100;
        const angle = Math.atan2(ball.body.velocity.y, ball.body.velocity.x);
        enemy.setVelocity(
            enemy.body.velocity.x + Math.cos(angle) * knockback,
            enemy.body.velocity.y + Math.sin(angle) * knockback
        );
        
        // Handle ball bounce
        ball.bounceCount++;
        if (ball.bounceCount >= ball.maxBounces) {
            ball.destroy();
        } else {
            // Bounce off enemy
            ball.setVelocity(-ball.body.velocity.x * 0.8, -ball.body.velocity.y * 0.8);
        }
        
        // Emit event for damage dealing
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
        
        // Knockback
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            player.sprite.x, player.sprite.y
        );
        player.sprite.setVelocity(
            player.sprite.body.velocity.x + Math.cos(angle) * 200,
            player.sprite.body.velocity.y + Math.sin(angle) * 200
        );
        
        // Emit events
        this.scene.events.emit('playerDamaged', damage);
        
        if (isDead) {
            this.scene.events.emit('playerDied');
        } else {
            // Destroy enemy on hit (like in original game)
            this.scene.events.emit('enemyKilled', enemy);
        }
    }
}

export default CollisionManager;

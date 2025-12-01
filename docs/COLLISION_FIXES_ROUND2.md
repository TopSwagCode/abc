# Collision System Fixes - Round 2

## Issues Found

1. **TypeError: Cannot read properties of undefined (reading 'radius')**
   - `ball.body.radius` was undefined
   - `enemy.body.radius` was undefined

2. **No ball bouncing off enemies**
   - Balls were destroyed instead of bouncing
   - Bounce logic was incorrect (reversing velocity instead of reflecting away from enemy)

3. **Multiple collision hits per frame**
   - Every enemy was checked and could hit the same ball
   - Should only detect the FIRST/CLOSEST collision

## Root Causes

### Problem 1: Wrong Property Access
The refactored code was trying to use:
- `ball.body.radius` - doesn't exist
- `enemy.body.radius` - doesn't exist

The original code used:
- `ball.displayWidth / 2` for ball radius
- `enemy.enemyType.size` for enemy radius

### Problem 2: Incorrect Bounce Logic
**Buggy code:**
```javascript
// Wrong - just reverses velocity
ball.setVelocity(-ball.body.velocity.x * 0.8, -ball.body.velocity.y * 0.8);
```

**Correct code (from game.old.js):**
```javascript
// Correct - bounces away from enemy at current speed
const bounceAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, ball.x, ball.y);
const currentSpeed = ball.body.speed;
ball.setVelocity(
    Math.cos(bounceAngle) * currentSpeed,
    Math.sin(bounceAngle) * currentSpeed
);
```

### Problem 3: Multiple Collisions Per Frame
**Old approach (wrong):**
```javascript
ballsArray.forEach(ball => {
    enemiesArray.forEach(enemy => {
        if (collision) {
            this.handleBallEnemyHit(ball, enemy); // Hits ALL enemies!
        }
    });
});
```

**New approach (correct):**
```javascript
ballsArray.forEach(ball => {
    let closestCollision = null;
    let closestT = 1.0;
    
    // Find the CLOSEST collision
    enemiesArray.forEach(enemy => {
        if (collision && collision.t < closestT) {
            closestT = collision.t;
            closestCollision = { enemy, t: collision.t };
        }
    });
    
    // Only handle the earliest collision
    if (closestCollision) {
        ball.x = ball.prevX + dx * closestCollision.t; // Move to collision point
        this.handleBallEnemyHit(ball, closestCollision.enemy);
    }
});
```

## Solutions Applied

### 1. Fixed Radius Access
```javascript
// Use proper properties
const ballRadius = ball.displayWidth / 2;
const enemyRadius = enemy.enemyType ? enemy.enemyType.size : 15;

const collision = this.sweptCircleCircle(
    ball.prevX, ball.prevY, ballRadius,
    ball.x, ball.y,
    enemy.x, enemy.y, enemyRadius
);
```

### 2. Implemented First-Collision-Only Logic
- Loop through all enemies to find collision times
- Track the closest collision (smallest `t` value)
- Move ball to exact collision point: `ball.x = ball.prevX + dx * t`
- Only process that one collision

### 3. Fixed Bounce Physics
```javascript
// Knockback enemy away from ball impact
const knockbackAngle = Phaser.Math.Angle.Between(ball.x, ball.y, enemy.x, enemy.y);
enemy.setVelocity(
    Math.cos(knockbackAngle) * knockback,
    Math.sin(knockbackAngle) * knockback
);

// Bounce ball away from enemy (reflection)
const bounceAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, ball.x, ball.y);
const currentSpeed = ball.body.speed; // Maintain current speed
ball.setVelocity(
    Math.cos(bounceAngle) * currentSpeed,
    Math.sin(bounceAngle) * currentSpeed
);
```

### 4. Added Movement Threshold
```javascript
// Skip expensive collision check if ball barely moved
const dx = ball.x - ball.prevX;
const dy = ball.y - ball.prevY;

if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
```

## Why This Matters

### Continuous Collision Detection (CCD)
Fast-moving projectiles could "tunnel" through enemies between frames:

```
Frame 1: Ball at (100, 100) ━━━━━━━━━━━━━━━→
                              Enemy at (150, 100)
Frame 2:                                      Ball at (200, 100)
```

Without CCD, the ball jumps from (100, 100) to (200, 100), completely missing the enemy at (150, 100).

With CCD, we trace the path and find collision at `t = 0.5`:
```
Collision point = ball.prevX + (ball.x - ball.prevX) * 0.5
                = 100 + (200 - 100) * 0.5
                = 150 ✅
```

### First Collision Only
If a ball is traveling through multiple enemies:
```
Ball path: ━━━━━━━━━━━━━━━→
           Enemy A  Enemy B
           (t=0.3) (t=0.7)
```

We detect both collisions but only handle Enemy A (t=0.3) because it happens first. This prevents the ball from damaging multiple enemies in one frame.

## Files Modified

**src/managers/CollisionManager.js**
- Fixed `checkBallEnemyCollisions()` to use proper radius properties
- Implemented first-collision-only logic with `closestT` tracking
- Move ball to exact collision point before handling hit
- Fixed bounce physics to reflect away from enemy at current speed
- Fixed knockback to push enemy away from ball impact point

## Testing

After these fixes:
- ✅ No more "undefined radius" errors
- ✅ Balls bounce off enemies correctly
- ✅ Balls maintain speed after bounce
- ✅ Enemies get knocked back from ball impact
- ✅ Only one collision per ball per frame (no multi-hits)
- ✅ Fast projectiles don't tunnel through enemies
- ✅ Ball bounces are destroyed after reaching max bounces

## Performance Note

The movement threshold check (`Math.abs(dx) < 0.1`) skips CCD for nearly stationary balls, improving performance when many balls are bouncing slowly or stopped.

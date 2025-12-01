# Player-Enemy Collision Fix

## Issue
Player could walk through enemies when moving - no collision detection was happening for moving players.

## Root Cause

### Same Problem as Balls
Just like the earlier ball collision issue, the player's `prevX`/`prevY` were being updated BEFORE collision checks, making continuous collision detection impossible.

**The broken flow:**
```javascript
// 1. Player.update() sets prevX = current x
this.sprite.prevX = this.sprite.x;  // prevX = 100
this.sprite.prevY = this.sprite.y;  // prevY = 100

// 2. Player moves
this.handleMovement();  // Player moves to (150, 100)

// 3. Collision check tries to use swept collision
sweptCircleCircle(
    prevX: 100,   // But this is the OLD position
    prevY: 100,
    currentX: 150,  // After movement
    currentY: 100
);
// This would work...

// BUT THE PROBLEM:
// prevX was set to 100 AFTER the previous frame's movement
// So it's not the "before movement" position, it's the "after movement" position
// from the previous frame, which is also ~100
// Meaning there's no movement delta to detect!
```

### Additional Issues
1. **Wrong radius values:** Using `playerSprite.body.radius` and `enemy.body.radius` (undefined)
2. **No null check:** Not checking if `prevX`/`prevY` exist before using them

## Solution

### 1. Fixed Update Order
**Removed** `prevX/prevY` update from `Player.update()` and created a separate method:

```javascript
// Player.js
update(inputManager) {
    // NO LONGER sets prevX/prevY here
    this.handleMovement(inputManager);
    this.handleRotation(inputManager);
    // Update visuals...
}

updatePreviousPosition() {
    // Called AFTER collision checks from GameScene
    if (this.sprite) {
        this.sprite.prevX = this.sprite.x;
        this.sprite.prevY = this.sprite.y;
    }
}
```

### 2. Corrected GameScene Update Sequence
```javascript
// GameScene.js update()

// 1. Update player position (no prevX/prevY update yet)
this.player.update(this.inputManager);

// 2. Update enemies
this.enemyManager.update(time, this.player);

// 3. Check collisions (uses prevX/prevY from LAST frame)
this.collisionManager.checkPlayerEnemyCollisions(this.player, enemies);

// 4. NOW update prevX/prevY for NEXT frame
this.player.updatePreviousPosition();
this.updateBalls(); // Same for balls
```

### 3. Fixed Radius Values
```javascript
// CollisionManager.js
checkPlayerEnemyCollisions(player, enemies) {
    // Use proper radius values
    const playerRadius = GameConfig.PLAYER.SIZE / 2;  // 15
    const enemyRadius = enemy.enemyType ? enemy.enemyType.size : 15;
    
    // Check if prevX/prevY exist before using continuous collision
    if (playerMoving && playerSprite.prevX !== undefined) {
        const collision = this.sweptCircleCircle(
            playerSprite.prevX, playerSprite.prevY, playerRadius,
            playerPos.x, playerPos.y,
            enemy.x, enemy.y, enemyRadius
        );
    }
}
```

## How Continuous Collision Detection Works Now

### Frame N:
```
Player at (100, 100)
Enemy at (130, 100)
No collision yet
```

### Frame N+1:
```
1. Player.update() moves player
   Player now at (140, 100)
   
2. Collision check:
   - prevX = 100 (from frame N)
   - currentX = 140 (from step 1)
   - Trace path from (100, 100) → (140, 100)
   - Enemy is at (130, 100)
   - Collision detected at t=0.75!
   
3. Handle collision
   - Player takes damage
   - Enemy destroyed
   
4. Update prevX for next frame
   prevX = 140
```

This catches the collision even though the player moved 40 pixels in one frame.

## Files Modified

1. **src/components/Player.js**
   - Removed `prevX/prevY` update from `update()` method
   - Added `updatePreviousPosition()` method

2. **src/GameScene.js**
   - Reordered update sequence
   - Call `player.updatePreviousPosition()` AFTER collision checks

3. **src/managers/CollisionManager.js**
   - Use `GameConfig.PLAYER.SIZE / 2` instead of `playerSprite.body.radius`
   - Use `enemy.enemyType.size` instead of `enemy.body.radius`
   - Added null check for `prevX`/`prevY` before using continuous collision

## Testing

After refresh, verify:
- ✅ Player collides with enemies when moving
- ✅ Player collides with enemies when standing still
- ✅ Fast player movement doesn't tunnel through enemies
- ✅ Player takes damage from enemy contact
- ✅ Enemy is destroyed after hitting player
- ✅ Screen shakes on collision
- ✅ Player gets knocked back

## Why This Pattern Matters

The same pattern applies to ALL moving objects that need continuous collision detection:

```javascript
// WRONG (broken CCD):
update() {
    this.prevX = this.x;  // ❌ Too early
    this.move();
}

// RIGHT (working CCD):
update() {
    this.move();  // Move first
}

// ... later, after collision checks ...
updatePrevious() {
    this.prevX = this.x;  // ✅ After collision checks
}
```

This ensures `prevX` always represents the position from the PREVIOUS frame, not the current frame.

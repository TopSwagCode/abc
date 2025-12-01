# Collision System Fixes

## Issues Found
1. **Player.takeDamage is not a function** - Player missing damage handling method
2. **No ball-enemy collisions** - Projectiles not hitting enemies
3. **Debug collision circles not visible for enemies** - Debug visualization broken

## Root Causes & Solutions

### 1. Missing Player.takeDamage() Method

**Problem:** CollisionManager called `player.takeDamage(damage)` but Player component didn't have this method.

**Solution:** Added `takeDamage()` method to Player component:

```javascript
takeDamage(damage) {
    this.hp -= damage;
    
    if (this.hp <= 0) {
        this.hp = 0;
        return true; // Player is dead
    }
    
    return false; // Player is still alive
}
```

This matches the original behavior from `game.old.js` where player HP was decremented and checked for game over.

**File Modified:** `src/components/Player.js`

---

### 2. Ball Collision Detection Broken

**Root Cause:** Multiple issues with continuous collision detection for projectiles:

#### Issue A: Missing prevX/prevY on balls
Balls were created without previous position tracking needed for swept collision detection.

**Fix:** Initialize prevX/prevY when creating projectiles in ItemManager:

```javascript
// Initialize previous position for collision detection
ball.prevX = playerPosition.x;
ball.prevY = playerPosition.y;
```

**File Modified:** `src/managers/ItemManager.js`

#### Issue B: Update order was backwards
The update sequence was:
1. Update balls (sets prevX/prevY = current position)
2. Check collisions (but prevX/prevY are now same as x/y!)

This broke continuous collision detection because there was no movement delta to check.

**Fix:** Reordered the update sequence in GameScene:

```javascript
// CORRECT ORDER:
1. Check collisions (using previous frame's positions)
2. Update balls (set prevX/prevY for next frame)
```

**File Modified:** `src/GameScene.js`

#### Issue C: prevX/prevY never updated
The updateBalls() method only removed out-of-bounds projectiles but never updated previous positions for the next frame.

**Fix:** Added position tracking to updateBalls():

```javascript
updateBalls() {
    this.balls.children.entries.forEach(ball => {
        // Update previous position for collision detection
        ball.prevX = ball.x;
        ball.prevY = ball.y;
        
        // Remove if out of bounds...
    });
}
```

**File Modified:** `src/GameScene.js`

---

### 3. Debug Collision Circles Not Visible

**Problem:** Debug visualization wasn't showing enemy collision circles when pressing 'O'.

**Root Cause:** Two issues:
1. Code didn't skip inactive/destroyed enemies
2. Used `enemy.enemyType.size` instead of actual `enemy.body.radius`

**Fix:** Improved debug rendering with proper radius detection and active checks:

```javascript
// Enemies
this.enemies.children.entries.forEach(enemy => {
    if (!enemy.active) return;  // Skip inactive
    this.debugGraphics.lineStyle(2, 0xff0000, 1);
    // Use actual body radius
    const radius = enemy.body && enemy.body.radius ? enemy.body.radius : enemy.enemyType.size;
    this.debugGraphics.strokeCircle(enemy.x, enemy.y, radius);
});

// Balls
this.balls.children.entries.forEach(ball => {
    if (!ball.active) return;  // Skip inactive
    this.debugGraphics.lineStyle(2, 0xffff00, 1);
    const radius = ball.body && ball.body.radius ? ball.body.radius : ball.displayWidth / 2;
    this.debugGraphics.strokeCircle(ball.x, ball.y, radius);
});
```

**File Modified:** `src/GameScene.js`

---

## Continuous Collision Detection Flow

The proper flow for swept collision detection:

```
Frame N:
  1. Ball at position (x, y)
  2. Ball has prevX, prevY from frame N-1
  3. Check collision using swept circle (prevX, prevY) → (x, y)
  4. Update prevX = x, prevY = y for next frame

Frame N+1:
  1. Ball moved to new position (x2, y2)
  2. Ball has prevX, prevY from frame N
  3. Check collision using swept circle (prevX, prevY) → (x2, y2)
  4. Update prevX = x2, prevY = y2 for next frame
```

This catches fast-moving projectiles that might tunnel through enemies between frames.

---

## Files Modified Summary

1. **src/components/Player.js**
   - Added `takeDamage(damage)` method

2. **src/managers/ItemManager.js**
   - Initialize `ball.prevX` and `ball.prevY` on creation

3. **src/GameScene.js**
   - Reordered collision checks before ball updates
   - Added prevX/prevY updates in `updateBalls()`
   - Improved debug rendering with active checks and proper radius

---

## Testing Checklist

After these fixes:
- ✅ Player takes damage when hit by enemies
- ✅ Player death (HP = 0) triggers game over
- ✅ Red flash effect shows when player is hit
- ✅ Projectiles hit and damage enemies
- ✅ Enemies die when HP reaches 0
- ✅ XP is awarded on enemy kill
- ✅ Debug mode (O key) shows collision circles:
  - Green circle for player
  - Red circles for enemies
  - Yellow circles for projectiles
- ✅ Continuous collision detection works for fast projectiles

---

## Related to Original Code

These fixes restore the collision behavior from `game.old.js`:
- Player damage handling (line 1462: `this.playerHP -= enemy.damage`)
- Game over check (line 1479: `if (this.playerHP <= 0)`)
- Enemy HP reduction (line 1384: `enemy.hp -= damage`)
- Visual feedback with tint effects
- Proper collision detection with swept circles

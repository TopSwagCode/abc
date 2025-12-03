# Game Reset System Guide

## Overview
The game reset system handles cleanup and restoration of game state when the player dies and restarts. This ensures all enemies, effects, timers, and UI elements are properly cleared and reset.

## Problem Symptoms (Before Fix)
- Enemies from previous game remain visible
- Enemy shadows not cleaned up
- Player unable to move after restart
- Lingering visual effects (flashing, poison indicators)
- Timers from previous game still running (resurrections, i-frames)

## Root Causes
1. **Timers Not Cleared**: Invincibility flashing, skeleton resurrections, and other time-based events continued running
2. **Tweens Not Killed**: Animation tweens (bob, death effects) persisted
3. **Incomplete Enemy Cleanup**: `destroyEnemy()` was being called but some enemies were inactive and had lingering graphics
4. **Player State Issues**: Invincibility flags and alpha values not properly reset
5. **Missing Effect Manager Reset**: No cleanup for poison effects and other status effects

## Solution Architecture

### 1. GameScene.handleGameOver()
**Location**: `src/GameScene.js`

**Immediate Cleanup on Death**:
```javascript
handleGameOver() {
    this.gameOver = true;
    
    // Immediately clear all game objects
    this.enemyManager.clearAllEnemies();
    this.lootManager.reset();
    this.balls.clear(true, true);
    this.tweens.killAll();
    this.time.removeAllEvents();
    
    // Hide player and shadow
    this.player.sprite.setVisible(false);
    this.player.shadow.setVisible(false);
    if (this.player.crosshair) {
        this.player.crosshair.setVisible(false);
    }
    
    // Show game over screen
    this.uiManager.setGameOverVisible(true);
}
```

**Why Clear on Death**:
- Prevents visual artifacts during game over screen
- Stops all animations immediately (no skeletons resurrecting on game over screen!)
- Clears screen completely (including player) so only game over message is visible
- Faster transition to clean slate

### 2. GameScene.resetGameState()
**Location**: `src/GameScene.js`

**Key Additions**:
```javascript
// Order matters! Clear objects BEFORE clearing timers
// 1. Clear game objects first
this.enemyManager.reset();
this.lootManager.reset();
this.balls.clear(true, true);

// 2. Then clear timers and tweens
this.time.removeAllEvents();
this.tweens.killAll();

// 3. Finally reset player
this.player.reset();
```

**Full Reset Sequence**:
1. Clear game objects (enemies, loot, projectiles) FIRST
2. Clear timers and tweens SECOND (after objects destroyed)
3. Reset player state (position, health, invincibility, alpha, physics)
4. Reset remaining managers (items, leveling, effects)
5. Reset UI (hide game over, hide level up)
6. Emit item update events

**Why This Order**:
- Objects destroyed first prevents animations from accessing destroyed objects
- Timers cleared after prevents callbacks trying to resurrect/animate destroyed enemies
- Player reset last ensures no collision issues with lingering enemies

### 2. Player.reset()
**Location**: `src/components/Player.js`

**Key Additions**:
```javascript
// Reset health and invincibility
this.hp = this.maxHP;
this.isInvincible = false;

// Reset sprite state
this.sprite.setActive(true);
this.sprite.setVisible(true);
this.sprite.setAlpha(1.0); // Clear invincibility flash
this.sprite.clearTint(); // Clear damage tint

// Reset physics body
if (this.sprite.body) {
    this.sprite.body.enable = true;
}

// Reset shadow completely
this.shadow.setAlpha(GameConfig.SHADOW.ALPHA);
this.shadow.setPosition(...);
```

**Reset Flow**:
1. Health → maxHP
2. Invincibility → false
3. Position → map center
4. Velocity → (0, 0)
5. Active/Visible → true
6. Physics body → enabled
7. Alpha → 1.0 (visible)
8. Tint → cleared
9. Animation properties → reset
10. Shadow → visible, reset position and alpha
11. Crosshair → reset position
12. Previous position → updated

### 3. EnemyManager.clearAllEnemies()
**Location**: `src/managers/EnemyManager.js`

**Complete Cleanup**:
```javascript
clearAllEnemies() {
    const enemyList = [...this.enemies.children.entries];
    
    enemyList.forEach(enemy => {
        if (enemy) {
            // Destroy ALL attached graphics
            if (enemy.shadow && enemy.shadow.active) {
                enemy.shadow.destroy();
            }
            if (enemy.healthBarBg) {
                enemy.healthBarBg.destroy();
            }
            if (enemy.healthBarFill) {
                enemy.healthBarFill.destroy();
            }
            if (enemy.poisonStackText) {
                enemy.poisonStackText.destroy();
            }
            // Destroy enemy sprite
            if (enemy.active) {
                enemy.destroy();
            }
        }
    });
    
    // Clear the entire physics group
    this.enemies.clear(true, true);
}
```

**Why This Works**:
- Iterates ALL enemies (not just active ones)
- Destroys ALL graphics (shadow, health bars, poison text)
- Clears physics group completely
- No reliance on `destroyEnemy()` which might skip cleanup

### 4. EffectsManager.reset()
**Location**: `src/managers/EffectsManager.js`

**Simple Reset**:
```javascript
reset() {
    console.log('🧹 Resetting EffectsManager');
    // Enemies already cleared, so poison effects are gone
    // This is a safety hook for future effects
}
```

## Reset Call Chain

```
Player dies
    ↓
GameScene.handleGameOver()
    ├── enemyManager.clearAllEnemies() ─→ Destroys ALL enemies + graphics immediately
    ├── lootManager.reset() ────────────→ Clears XP gems
    ├── balls.clear(true, true) ────────→ Removes all projectiles
    ├── tweens.killAll() ───────────────→ Stops all animations
    ├── time.removeAllEvents() ─────────→ Clears all timers
    └── Show game over screen

User clicks to restart
    ↓
GameScene.resetGameState()
    ├── enemyManager.reset() ───────────→ Ensures enemies cleared (redundant but safe)
    ├── lootManager.reset() ────────────→ Ensures loot cleared
    ├── balls.clear(true, true) ────────→ Ensures projectiles cleared
    ├── effectsManager.reset() ─────────→ Clears poison effects
    ├── time.removeAllEvents() ─────────→ Clears any new timers (redundant but safe)
    ├── tweens.killAll() ───────────────→ Kills any new tweens
    ├── Player.reset() ─────────────────→ Resets position, health, invincibility
    ├── itemManager.reset() ────────────→ Resets weapons
    ├── levelingSystem.reset() ─────────→ Resets XP/level
    └── UI reset ───────────────────────→ Hides game over screen
```

## Critical Components Reset

### Timers Cleared
- **Invincibility Flash Timer**: 10 flashes over 1 second
- **Skeleton Resurrection Timer**: 5 seconds (3s wait + 2s shake)
- **Damage Tint Timer**: 200ms red flash
- **Poison Tick Timer**: Damage over time intervals
- **Any other delayed callbacks**

### Tweens Killed
- **Death Animations**: Flash, pop, particle explosion
- **Bob Animations**: Enemy floating motion
- **Scale Animations**: Split slime spawn bounce
- **Invincibility Flash**: Alpha toggling
- **Resurrection Effects**: Bone pile shake, flash

### Graphics Destroyed
- **Enemy Sprites**: All enemy visuals
- **Enemy Shadows**: Circle shapes under enemies
- **Health Bars**: Background and fill graphics
- **Poison Indicators**: Stack count text
- **Projectiles**: All active balls
- **Loot**: XP gems

### Physics Reset
- **Player Body**: Re-enabled if disabled
- **Player Velocity**: Set to (0, 0)
- **Enemy Group**: Completely cleared
- **Ball Group**: Completely cleared
- **Loot Group**: Completely cleared

## Testing Checklist

After implementing reset system, verify:

- [ ] All enemies disappear on restart
- [ ] All enemy shadows removed
- [ ] Player can move immediately
- [ ] Player is visible (not flashing/transparent)
- [ ] No lingering health bars
- [ ] No poison indicators
- [ ] No projectiles from previous game
- [ ] XP gems cleared
- [ ] Level/XP reset to 0
- [ ] Health bar shows correct values
- [ ] No console errors
- [ ] Game over screen hidden
- [ ] Camera positioned correctly
- [ ] Multiple restarts work correctly

## Common Issues & Solutions

### Player Can't Move After Restart
**Cause**: Physics body disabled or invincibility still active
**Solution**: Ensure `sprite.body.enable = true` and `isInvincible = false`

### Lingering Enemy Shadows
**Cause**: Shadows not destroyed in cleanup
**Solution**: Added explicit `shadow.destroy()` in `clearAllEnemies()`

### Flashing Won't Stop
**Cause**: Timer still running from invincibility
**Solution**: Added `time.removeAllEvents()` to clear all timers

### Enemies Still Visible
**Cause**: Inactive enemies not cleaned up
**Solution**: Changed from `if (enemy.active)` to `if (enemy)` in cleanup

### Resurrections Still Happening
**Cause**: Skeleton resurrection timers not cleared
**Solution**: `time.removeAllEvents()` clears delayed resurrection callbacks

### Player Stuck Transparent
**Cause**: Alpha not reset after invincibility flash
**Solution**: Added `sprite.setAlpha(1.0)` in player reset

### Health Bar Shows Wrong Values
**Cause**: UI not updated after player reset
**Solution**: Player reset sets `hp = maxHP`, UI automatically updates

## Performance Considerations

### Clear vs Destroy
```javascript
// Good: Destroys individual objects with cleanup
enemy.shadow.destroy();

// Good: Clears entire group efficiently
this.enemies.clear(true, true);

// Bad: Memory leak if graphics not destroyed first
this.enemies.clear(false, false);
```

### Timer Cleanup
```javascript
// Good: Removes ALL timers at once
this.time.removeAllEvents();

// Bad: Trying to remove individual timers (hard to track)
// Timer references would need to be stored
```

### Tween Cleanup
```javascript
// Good: Kills all tweens instantly
this.tweens.killAll();

// Bad: Letting tweens complete (delays cleanup)
```

## Future Enhancements

### Save System Integration
When implementing save/load:
```javascript
resetGameState() {
    // ... current reset logic ...
    
    // Restore from save if available
    if (this.saveData) {
        this.loadGameState(this.saveData);
    }
}
```

### Statistics Tracking
Track across resets:
```javascript
// Don't reset these
this.totalEnemiesKilled += this.sessionEnemiesKilled;
this.totalGamesPlayed++;
this.highScore = Math.max(this.highScore, this.score);

// Then reset session stats
this.sessionEnemiesKilled = 0;
this.score = 0;
```

### Difficulty Persistence
Option to keep difficulty on restart:
```javascript
reset() {
    // Save difficulty before reset
    const savedSpeed = this.enemySpeed;
    const savedSpawnRate = this.spawnRate;
    
    // ... normal reset ...
    
    // Restore difficulty (optional)
    if (GameConfig.KEEP_DIFFICULTY_ON_RESTART) {
        this.enemySpeed = savedSpeed;
        this.spawnRate = savedSpawnRate;
    }
}
```

## Related Systems
- **GameScene**: Orchestrates entire reset process
- **Player**: Resets character state
- **EnemyManager**: Cleans up all enemies
- **EffectsManager**: Clears status effects
- **UIManager**: Hides game over screen
- **LevelingSystem**: Resets progression
- **ItemManager**: Resets weapons
- **LootManager**: Clears XP gems
- **Phaser Time**: Clears all timers
- **Phaser Tweens**: Kills all animations

## Summary
The game reset system comprehensively clears all game state by:

**On Player Death (handleGameOver)**:
1. Destroying all enemies and their graphics (sprites, shadows, health bars)
2. Clearing all loot (XP gems)
3. Removing all projectiles (balls)
4. Stopping all timers (resurrections, i-frames, poison ticks)
5. Killing all tweens (animations, death effects, flashing)
6. Hiding player, player shadow, and crosshair
7. Showing clean game over screen

**On Restart (resetGameState)**:
1. Clearing all game objects (redundant but safe)
2. Resetting player state (health, position, physics, visibility)
3. Resetting all managers (enemies, items, leveling, loot, effects)
4. Clearing all UI elements (hiding game over screen)

This ensures a completely clean slate - both on death and restart - with no lingering artifacts or broken functionality.

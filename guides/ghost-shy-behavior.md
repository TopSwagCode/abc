# Ghost Shy Behavior Guide

## Overview
The ghost enemy implements "Boo from Mario" behavior - it stops moving and looks scared when the player faces it, but chases the player when not being looked at.

## Assets Required
- `assets/enemy-ghost.png` - Normal ghost sprite (chasing state)
- `assets/enemy-ghost-scared.png` - Scared ghost sprite (when player looks at it)

Both sprites must be preloaded in `GameScene.js`:
```javascript
this.load.image('enemy_sprite_ghost', 'assets/enemy-ghost.png');
this.load.image('enemy_sprite_ghost_scared', 'assets/enemy-ghost-scared.png');
```

## Enemy Configuration
In `enemies.json`:
```json
{
  "id": "ghost",
  "name": "Ghost",
  "hp": 55,
  "speed": 75,
  "size": 18,
  "sprite": "enemy_sprite_ghost",
  "xpValue": 12,
  "spawnWeight": 7,
  "behavior": {
    "type": "direct_chase"
  }
}
```

**Key Stats:**
- **HP**: 55 (glass cannon - low health)
- **Speed**: 75 (fast - one of the fastest enemies)
- **Size**: 18 (small - harder to hit)
- **Spawn Weight**: 7 (moderate spawn rate)

## Behavior Logic

### How It Works
1. **Player Direction Detection**: Uses the player's `currentAimAngle` (from `player.getRotation()`) which works for both mouse and controller input
2. **Angle Calculation**: Calculates the angle from player to ghost
3. **View Cone Check**: Determines if ghost is within the player's view cone (±60°)
4. **State Switching**:
   - **Facing Ghost**: Stops movement, switches to scared sprite
   - **Not Facing Ghost**: Resumes chase, switches to normal sprite

### Implementation Location
**File**: `src/managers/EnemyManager.js`

**Method**: `updateGhostBehavior(enemy, player)`

**Call Site**: In the `updateEnemies()` loop, before the movement switch statement:
```javascript
// Special logic: Ghost (Boo-like behavior)
if (enemy.enemyType.id === 'ghost') {
    this.updateGhostBehavior(enemy, player);
}
```

### Code Breakdown

```javascript
updateGhostBehavior(enemy, player) {
    // 1. Get player's current aim angle (works for both mouse and controller)
    const playerFacingAngle = player.getRotation();
    
    // 2. Get player position
    const playerPos = player.getPosition();

    // 3. Calculate angle from player to ghost
    const angleToGhost = Math.atan2(
        enemy.y - playerPos.y,
        enemy.x - playerPos.x
    );

    // 4. Normalize angle difference to -PI to PI
    let angleDiff = angleToGhost - playerFacingAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // 5. Check if within view cone (±60°)
    const viewConeAngle = Math.PI / 3; // 60 degrees
    const isPlayerFacingGhost = Math.abs(angleDiff) < viewConeAngle;

    // 6. Update ghost state
    if (isPlayerFacingGhost) {
        enemy.isScared = true;
        enemy.setTexture('enemy_sprite_ghost_scared');
        enemy.setVelocity(0, 0); // Stop moving
    } else {
        enemy.isScared = false;
        enemy.setTexture('enemy_sprite_ghost');
        // Movement resumes via moveEnemyDirectChase()
    }
}
```

## Configuration Options

### View Cone Angle
The view cone determines how wide the player's "vision" is:
```javascript
const viewConeAngle = Math.PI / 3; // 60 degrees (±30° from center)
```

**Adjustment Guide:**
- `Math.PI / 6` (30°) - Narrow cone, harder to scare ghost
- `Math.PI / 3` (60°) - Default, balanced
- `Math.PI / 2` (90°) - Wide cone, easier to scare ghost
- `Math.PI` (180°) - Ghost scared when player faces general direction

### Ghost Stats Tuning
Adjust in `enemies.json`:
- **Speed**: Higher = harder to keep in view, more challenging
- **HP**: Lower = glass cannon (fast but fragile)
- **Size**: Smaller = harder to hit with balls
- **Spawn Weight**: Higher = appears more frequently

## Visual Effects

### Bob Animation
The ghost continues bobbing even when scared - this is intentional and adds character:
```javascript
// In animateEnemy() - always runs regardless of scared state
const bobOffset = Math.sin(enemy.animationTime) * enemy.bobAmount;
```

### Sprite Swapping
Immediate texture swap when state changes:
- `'enemy_sprite_ghost'` → Normal chasing
- `'enemy_sprite_ghost_scared'` → Player looking at it

## Gameplay Strategy

### For Players:
- **Keep Eyes On**: Face the ghost to keep it frozen
- **Quick Turns**: Face away briefly to bait movement, then turn back
- **Corner Trapping**: Back into corner, keep ghost in view while dealing with other enemies
- **Ball Timing**: Hit ghost when it's frozen (easier target)

### Difficulty Balance:
- **Easy**: Low speed (50-60), larger size (24-30), narrow view cone
- **Medium**: Current stats (75 speed, 18 size, 60° cone)
- **Hard**: High speed (85-95), tiny size (12-16), wide view cone (90°)

## Troubleshooting

### Ghost Doesn't Stop When Looked At
**Check:**
1. Player aim angle is being used: `player.getRotation()` should return the current aim direction
2. Ghost behavior hook is called: Check `updateEnemies()` has the special logic check with `player` (not `playerPos`)
3. Sprite names match: 'enemy_sprite_ghost' and 'enemy_sprite_ghost_scared' in GameScene preload
4. Angle calculation is correct: Debug by logging `playerFacingAngle` and `angleToGhost`

### Ghost Always Scared or Never Scared
**Likely Issues:**
- View cone too wide/narrow: Adjust `viewConeAngle` constant
- Angle normalization broken: Check `angleDiff` wrapping logic
- Player facing calculation wrong: Verify crosshair position is being read correctly

### Sprite Doesn't Change
**Check:**
1. Both textures loaded in GameScene.js preload
2. Texture keys match exactly: `'enemy_sprite_ghost_scared'` (not `'ghost_scared'`)
3. Assets exist at correct paths: `assets/enemy-ghost.png` and `assets/enemy-ghost-scared.png`

### Ghost Movement Stutters
**Possible Causes:**
- State toggling too fast: Add hysteresis (delay between state changes)
- Player on boundary of view cone: Increase/decrease cone angle slightly
- Movement code conflicts: Ensure ghost behavior runs before movement switch

## Technical Notes

### Why Use Player's Aim Angle?
- **Universal Input Support**: `player.getRotation()` returns `currentAimAngle` which works for both mouse and controller
- **Accurate Direction**: The player's aim angle is updated by the InputManager based on the current input method
- **No Additional Dependencies**: No need to access crosshair or mouse pointer directly
- **Predictable**: Player has direct control via their aiming (cursor position or right stick)

### State Persistence
The `enemy.isScared` flag prevents unnecessary texture swaps:
```javascript
if (!enemy.isScared) {
    enemy.isScared = true; // Only swap texture when state changes
    enemy.setTexture('enemy_sprite_ghost_scared');
}
```

### Movement Control Flow
1. `updateGhostBehavior()` runs first (sets `enemy.isScared` flag and velocity to 0 if scared)
2. Movement code checks: Skip if ghost is scared (`enemy.isScared === true`)
3. If not scared, movement switch case runs (sets chase velocity)
4. If scared, velocity remains 0 (frozen in place)

**Critical**: The movement switch is wrapped in a condition to prevent overriding the ghost's stopped state:
```javascript
// Skip movement if ghost is scared (frozen in place)
if (!(enemy.enemyType.id === 'ghost' && enemy.isScared)) {
    // Normal movement code here
}
```

## Future Enhancements

### Possible Additions:
1. **Turn Animation**: Rotate ghost when player first looks at it
2. **Sound Effects**: Add "boo" sound when scared, ghostly wail when chasing
3. **Transparency**: Ghost becomes more transparent when scared
4. **Speed Burst**: Ghost gets speed boost after being looked at for X seconds
5. **Group Behavior**: Multiple ghosts take turns chasing/hiding
6. **Distance Factor**: Ghost only scared if player is within certain range

### Code Extension Points:
```javascript
// Add to updateGhostBehavior()
if (isPlayerFacingGhost) {
    // Track how long ghost has been scared
    enemy.scaredDuration = (enemy.scaredDuration || 0) + delta;
    
    // After 3 seconds, ghost becomes bold and charges
    if (enemy.scaredDuration > 3000) {
        enemy.isBold = true;
        // Override scared state
    }
}
```

## Related Systems
- **DeathAnimationManager**: Ghost death uses standard particle explosion (white/gray particles recommended)
- **CollisionManager**: Ghost collision uses standard enemy collision multiplier (0.7)
- **Shadow System**: Ghost has small shadow (size 18 * 1.0 multiplier)
- **XP System**: Ghost awards 12 XP on death (via EnemyManager.destroyEnemy)

## Summary
The ghost shy behavior adds strategic depth to combat - players must balance keeping the ghost in view (frozen but occupying attention) versus dealing with other threats. The implementation is self-contained in `updateGhostBehavior()` and integrates cleanly with existing enemy AI systems.

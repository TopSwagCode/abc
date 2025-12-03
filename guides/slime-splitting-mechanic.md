# Slime Splitting Mechanic

This guide explains the special slime splitting behavior implemented in the game.

## Overview

Slimes have a unique death mechanic: when killed, they **split into 2 smaller slimes** instead of simply dying. This continues recursively until the slimes would be too small to split (HP < 10).

## How It Works

### Splitting Logic

```
Original Slime (200 HP, 35px)
        ↓ Dies
   ┌────┴────┐
   ↓         ↓
Slime A    Slime B
(100 HP)   (100 HP)
(17px)     (17px)
   ↓         ↓ Dies
   ↓      ┌──┴──┐
   ↓      ↓     ↓
   ↓   Slime C  Slime D
   ↓   (50 HP)  (50 HP)
   ↓   (8px)    (8px)
   ↓      ↓      ↓ Dies
   ↓      ↓   (Too small - stops)
  ...    ...
```

### Split Conditions

**When a slime dies:**
1. Calculate new HP: `newHP = currentHP / 2` (rounded down)
2. Calculate new size: `newSize = currentSize / 2` (rounded down)
3. **IF** `newHP >= 10`: Spawn 2 smaller slimes
4. **IF** `newHP < 10`: Slime dies normally (no split)

### Example Chain

Starting with default slime from `enemies.json`:
```json
{
  "id": "slime",
  "hp": 200,
  "size": 35
}
```

**Generation 1:** 200 HP, 35px → Dies → Spawns 2 slimes
**Generation 2:** 100 HP, 17px → Dies → Spawns 2 slimes each
**Generation 3:** 50 HP, 8px → Dies → Spawns 2 slimes each
**Generation 4:** 25 HP, 4px → Dies → Spawns 2 slimes each
**Generation 5:** 12 HP, 2px → Dies → Spawns 2 slimes each
**Generation 6:** 6 HP, 1px → Dies → **STOPS** (HP < 10)

**Total potential slimes from one:** 1 + 2 + 4 + 8 + 16 + 32 = **63 slimes!**

## Implementation Details

### Files Modified

**`/src/managers/EnemyManager.js`**

Added three methods:

| Method | Purpose |
|--------|---------|
| `handleSlimeSplit()` | Checks if slime should split and spawns 2 new ones |
| `spawnSplitSlime()` | Creates a new slime with custom HP and size |
| Updated `destroyEnemy()` | Calls slime split logic before death animation |

### Split Slime Properties

Split slimes have special properties:

```javascript
enemy.maxHP = hp;        // Custom max HP (not from config)
enemy.hp = hp;           // Current HP
enemy.customSize = size; // Custom size for future splits
```

These properties allow split slimes to split again with their current stats, not the original slime's stats.

### Spawn Positions

New slimes spawn at slight offsets from the parent:
```javascript
Offset 1: { x: -15, y: -10 }  // Top-left
Offset 2: { x: 15, y: -10 }   // Top-right
```

This creates a nice "splitting upward" effect.

### Visual Effects

**Spawn Animation:**
- Slimes start at 50% scale and fade in
- Expand to full size over 200ms
- Uses `Back.easeOut` for a bouncy feel
- Alpha fades from 0.7 to 1.0

**Updated Systems:**
- Collision circle rescaled to new size
- Shadow rescaled to new size
- Health bar updated to show new max HP
- All proportions maintained correctly

## Balancing

### Current Settings

With the default slime (200 HP, 35px):
- **Splits**: 5 times before stopping
- **Maximum slimes**: 63 total (if all survive)
- **Smallest slime**: 12 HP, 2px

### Adjusting Split Behavior

**Change minimum HP threshold** (currently 10):

In `EnemyManager.js`, line ~532:
```javascript
if (newHP < 10) {  // Change this value
    return; // Don't split
}
```

Examples:
- `newHP < 20`: Stops splitting sooner (4 generations max)
- `newHP < 5`: Splits more times (6+ generations)

**Change split count** (currently 2):

In `EnemyManager.js`, line ~545:
```javascript
const spawnOffsets = [
    { x: -15, y: -10 },  // Slime 1
    { x: 15, y: -10 }    // Slime 2
    // Add more for 3+ splits
];
```

For 3 slimes per split:
```javascript
const spawnOffsets = [
    { x: -20, y: -10 },  // Left
    { x: 0, y: -15 },    // Center
    { x: 20, y: -10 }    // Right
];
```

### XP Considerations

Each slime death grants XP independently. With default settings:
- 1 slime → 2 slimes → 4 slimes → 8 slimes...
- If each death = 20 XP, killing all generations = massive XP!

Consider reducing slime XP or changing `XP_PER_KILL` in `GameConfig.js`.

## Enemy-Specific Death Logic

### Adding Similar Mechanics for Other Enemies

The slime split logic is in `destroyEnemy()`:

```javascript
destroyEnemy(enemy) {
    const enemyType = enemy.enemyType;
    
    // Special death logic for specific enemies
    if (enemyType && enemyType.id === 'slime') {
        this.handleSlimeSplit(enemy, enemy.x, enemy.y, enemyType);
    }
    
    // Add more enemy-specific death behaviors here
    if (enemyType && enemyType.id === 'skeleton') {
        this.handleSkeletonDeath(enemy);
    }
    
    // ... rest of destruction code
}
```

### Example: Skeleton Bone Drop

```javascript
handleSkeletonDeath(enemy) {
    // Drop bone items or spawn bone particles
    const boneCount = 3;
    for (let i = 0; i < boneCount; i++) {
        this.spawnBone(enemy.x, enemy.y);
    }
}
```

## Troubleshooting

### Slimes Not Splitting
- **Check**: Enemy ID in `enemies.json` is exactly `"slime"` (case-sensitive)
- **Check**: Slime HP is >= 20 (so half would be >= 10)
- **Check**: Console logs for "Slime splitting" messages

### Too Many Slimes (Performance)
- **Increase**: Minimum HP threshold (e.g., 20 instead of 10)
- **Reduce**: Initial slime HP in `enemies.json`
- **Add**: Maximum split generation limit

### Split Slimes Wrong Size
- **Check**: Shadow and collision are being updated in `spawnSplitSlime()`
- **Check**: `GameConfig.COLLISION.ENEMY_MULTIPLIER` is set correctly

### Slimes Die Too Fast
- **Increase**: Initial HP in `enemies.json`
- **Reduce**: Player damage output
- **Add**: Defense scaling for smaller slimes

## Advanced: Split Size Scaling

To make smaller slimes take less damage (harder to kill tiny ones):

```javascript
spawnSplitSlime(x, y, enemyType, hp, size) {
    // ... existing code ...
    
    // Add defense for smaller slimes
    const sizeRatio = size / enemyType.size;
    enemy.defenseMultiplier = Math.max(0.5, sizeRatio); // Smaller = more defense
    
    // ... rest of code ...
}
```

Then in `damageEnemy()`:
```javascript
damageEnemy(enemy, damage) {
    const actualDamage = enemy.defenseMultiplier 
        ? damage * enemy.defenseMultiplier 
        : damage;
    enemy.hp -= actualDamage;
    // ... rest
}
```

## Related Files

- **`/src/managers/EnemyManager.js`**: Slime split logic
- **`/enemies.json`**: Slime configuration (HP, size)
- **`/src/config/GameConfig.js`**: Collision and shadow settings
- **`/src/managers/DeathAnimationManager.js`**: Death visual effects

---

**Pro Tip:** Make slimes rare (low `spawnWeight`) but rewarding, so their splitting creates exciting "slime explosion" moments!

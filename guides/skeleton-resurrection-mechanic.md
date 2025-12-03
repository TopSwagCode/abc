# Skeleton Resurrection Mechanic

This guide explains the special skeleton resurrection behavior implemented in the game.

## Overview

Skeletons are unique enemies that **refuse to stay dead**. When killed, instead of dying immediately, they collapse into a pile of bones that will resurrect after a delay. Skeletons must be killed **3 times** before they finally die permanently.

## How It Works

### Death Cycle

```
Skeleton (Full HP) 
    ↓ Death #1
💀 Bone Pile (3s still) → (2s shaking) → ✨ Resurrect (Full HP)
    ↓ Death #2
💀 Bone Pile (3s still) → (2s shaking) → ✨ Resurrect (Full HP)
    ↓ Death #3
💀 FINAL DEATH (normal death animation)
```

### Timeline Per Death (Except Final)

| Time | Event |
|------|-------|
| 0s | Skeleton dies, collapses into bone pile |
| 0-3s | Bone pile lies still on ground |
| 3s | Bones start shaking |
| 3-5s | Bones shake violently |
| 5s | Flash of light, skeleton resurrects at full HP |

### Death Counter

Each skeleton tracks how many times it has died:
- **Death 1 & 2**: Collapse → Resurrect
- **Death 3**: Permanent death with normal death animation

## Visual Effects

### Bone Pile Phase (0-3s)
- Skeleton sprite switches to `enemy-skeleton-dead.png`
- Bone pile fades in over 300ms
- Original skeleton becomes invisible (but not destroyed)
- Shadow and health bar hidden

### Shaking Phase (3-5s)
- Bones shake randomly every 50ms
- Shake intensity: ±4 pixels in X and Y
- Building tension for resurrection

### Resurrection Phase (5s)
- White flash explosion (2x skeleton size)
- Bone pile destroyed
- Original skeleton restored at same position
- Health restored to 100% (full HP)
- Pop-in animation (scale from 50% to 100%)
- Shadow and health bar reappear

## Implementation Details

### Files Modified

**`/src/managers/EnemyManager.js`**

Added four new methods:

| Method | Purpose |
|--------|---------|
| `handleSkeletonDeath()` | Checks death count and decides resurrect vs final death |
| `createSkeletonResurrection()` | Creates bone pile and schedules resurrection |
| `resurrectSkeleton()` | Restores skeleton to full health and visibility |
| Updated `destroyEnemy()` | Checks for skeleton before normal death |

**`/src/GameScene.js`**
- Added preload for `enemy_sprite_skeleton_dead`

### Skeleton Properties

Each skeleton enemy has:
```javascript
enemy.deathCount = 0;  // Incremented each death (max 3)
```

### Asset Requirements

**Required Sprite:**
- `assets/enemy-skeleton-dead.png` - Bone pile image

The bone pile sprite should show collapsed bones/remains. It will be scaled to match the skeleton's size.

## Balancing

### Current Settings

- **Deaths Before Permanent**: 3
- **Still Time**: 3 seconds
- **Shake Time**: 2 seconds
- **Total Resurrection Time**: 5 seconds
- **Resurrected HP**: 100% (full health)

### Adjusting Resurrection Time

In `EnemyManager.js`, line ~701:

**Change still time** (currently 3000ms):
```javascript
this.scene.time.delayedCall(3000, () => {  // Change this value
    // Shake animation starts
});
```

**Change shake time** (currently 2000ms):
```javascript
this.scene.time.delayedCall(2000, () => {  // Change this value
    // Resurrection happens
});
```

Examples:
- Fast resurrection: 1000ms still + 1000ms shake = 2 seconds total
- Slow resurrection: 5000ms still + 3000ms shake = 8 seconds total

### Adjusting Death Count

In `EnemyManager.js`, line ~688:

```javascript
if (enemy.deathCount >= 3) {  // Change this value
    return false; // Final death
}
```

Examples:
- `>= 2`: Skeleton dies permanently after 2 deaths (1 resurrection)
- `>= 5`: Skeleton dies permanently after 5 deaths (4 resurrections)
- `>= 1`: Skeleton never resurrects (like normal enemy)

### Adjusting Resurrected HP

In `EnemyManager.js`, line ~739:

```javascript
// Current: Full health
enemy.hp = enemyType.hp;

// Alternative: 50% health
enemy.hp = enemyType.hp * 0.5;

// Alternative: Decreasing health per resurrection
const healthPercent = 1 - (enemy.deathCount * 0.2); // 80%, 60%, etc.
enemy.hp = enemyType.hp * healthPercent;
```

## Strategy & Gameplay

### Player Perspective

**Challenge:**
- Must damage skeleton 3 times to kill permanently
- Each resurrection gives skeleton full HP
- 5 second window to prepare for resurrection
- Shaking bones warn of incoming resurrection

**Tactics:**
- Stay near bones to kill immediately on resurrection
- Use resurrection window to heal/reposition
- Count deaths (visual feedback in console)
- Prioritize skeletons early or save for last

### XP Consideration

Currently, skeletons grant XP on **each death** including resurrections. This means:
- Death 1: XP awarded (but skeleton resurrects)
- Death 2: XP awarded (but skeleton resurrects)  
- Death 3: XP awarded (permanent death)

**Total XP from 1 skeleton = 3x XP_PER_KILL**

To change this behavior, modify the XP emission in `destroyEnemy()` to only trigger on final death.

## Advanced Customization

### Different Resurrection Animations

**Spiral Bones Effect:**
```javascript
// Instead of shake, rotate bones in spiral
this.scene.tweens.add({
    targets: bonePile,
    angle: 360,
    scale: scale * 1.2,
    duration: 2000,
    ease: 'Quad.easeInOut'
});
```

**Green Necromancy Glow:**
```javascript
const glow = this.scene.add.circle(x, y, enemyType.size * 3, 0x00ff00);
glow.setAlpha(0.3);
this.scene.tweens.add({
    targets: glow,
    alpha: 0,
    scale: 2,
    duration: 2000,
    onComplete: () => glow.destroy()
});
```

### Resurrection Sound Effect

Add sound when bones start shaking:
```javascript
this.scene.time.delayedCall(3000, () => {
    // Play rattle sound
    this.scene.sound.play('bone_rattle');
    
    // Shake animation...
});
```

### Prevent Resurrection (Special Attacks)

Add logic to prevent resurrection with special weapons:
```javascript
handleSkeletonDeath(enemy, x, y, enemyType) {
    // Check if killed with holy weapon
    if (enemy.killedByHolyWeapon) {
        console.log(`💀 Skeleton vanquished by holy power!`);
        return false; // No resurrection
    }
    
    // Normal resurrection logic...
}
```

## Troubleshooting

### Skeleton Not Resurrecting
- **Check**: Death count is less than 3
- **Check**: Bone pile sprite loads correctly (`enemy_sprite_skeleton_dead`)
- **Check**: Console shows "Skeleton will resurrect" message
- **Check**: Timer delays are completing (check browser performance)

### Bone Pile Wrong Size
- **Check**: Bone pile sprite matches skeleton sprite dimensions (1024x1024)
- **Adjust**: Scale calculation in `createSkeletonResurrection()`

### Skeleton Disappears After Death
- **Check**: `destroyEnemy()` returns early for skeletons (before normal destruction)
- **Check**: Skeleton isn't being removed by other systems during resurrection

### Multiple Skeletons Overlapping
Skeletons resurrect at their death position. If many die in same spot:
```javascript
// Add random offset to resurrection position
const offsetX = (Math.random() - 0.5) * 40;
const offsetY = (Math.random() - 0.5) * 40;
enemy.setPosition(x + offsetX, y + offsetY);
```

## Combining with Other Mechanics

### Skeleton + Poison
Poison continues to tick during bone pile phase. To prevent this:
```javascript
createSkeletonResurrection(enemy, x, y, enemyType) {
    // Clear poison effects during resurrection
    if (this.scene.effectsManager) {
        this.scene.effectsManager.clearPoison(enemy);
    }
    // ... rest of code
}
```

### Skeleton + Area Damage
Bone piles are still valid targets. To make them invulnerable:
```javascript
enemy.body.enable = false;  // Already done - bones can't be damaged
```

## Related Files

- **`/src/managers/EnemyManager.js`**: Resurrection logic
- **`/src/GameScene.js`**: Asset loading
- **`/enemies.json`**: Skeleton configuration
- **`/assets/enemy-skeleton-dead.png`**: Required bone pile sprite

## Example: Different Enemy Types with Lives

The resurrection system can be adapted for other enemies:

```javascript
// In destroyEnemy()
if (enemyType && enemyType.id === 'phoenix') {
    return this.handlePhoenixRebirth(enemy, x, y, enemyType);
}

if (enemyType && enemyType.id === 'zombie') {
    return this.handleZombieRevive(enemy, x, y, enemyType);
}
```

Each can have unique:
- Death count limits
- Resurrection times  
- Visual effects
- HP restoration amounts

---

**Pro Tip:** Make skeletons rare but valuable - their 3x XP potential and challenging mechanics make them exciting mini-boss encounters!

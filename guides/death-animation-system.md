# Enemy Death Animation System

This guide explains the death animation system for enemies in the game.

## Overview

When an enemy dies, a satisfying multi-layered animation plays:

1. **White Damage Flash** - Single-frame bright flash
2. **Squash & Pop Effect** - Enemy squashes then expands
3. **Particle Explosion** - Colored particles burst outward
4. **Blood Drops** - Larger particles that fall down

## How It Works

### Animation Sequence

```
Enemy Dies → Flash (100ms) → Squash (50ms) → Expand & Fade (150ms)
              ↓
         Particles burst outward (300-500ms)
              ↓
         Blood drops fall (400-600ms)
```

### Color System

Each enemy death uses its color from `enemies.json`:
- **Red Enemy** (`0xff4444`) → Red particles
- **Green Enemy** (`0x44ff44`) → Green particles  
- **Blue Enemy** (`0x4444ff`) → Blue particles
- **Skeleton** (`0xcccccc`) → Gray/white particles
- **Slime** (`0x00ff88`) → Cyan/green particles

## Files Involved

### `/src/managers/DeathAnimationManager.js`

Main animation system with methods:

| Method | Purpose |
|--------|---------|
| `playDeathAnimation()` | Main entry point - orchestrates all effects |
| `createDamageFlash()` | White flash on impact |
| `createPopEffect()` | Squash and expand on enemy sprite |
| `createParticleExplosion()` | Radial particle burst |
| `createBloodDrops()` | Falling particle drops |
| `createPoofAnimation()` | Alternative lighter effect (not used by default) |

### Integration Points

**GameScene.js:**
```javascript
// Manager is initialized in create()
this.deathAnimationManager = new DeathAnimationManager(this);
```

**EnemyManager.js:**
```javascript
// Called in destroyEnemy() before enemy is removed
if (this.scene.deathAnimationManager && enemy.enemyType) {
    this.scene.deathAnimationManager.playDeathAnimation(enemy, enemy.enemyType);
}
```

## Customization

### Adjusting Animation Intensity

Edit values in `/src/managers/DeathAnimationManager.js`:

**Particle Count** (line ~99):
```javascript
const particleCount = Math.floor(size / 2) + 5; // More = denser explosion
```

**Particle Speed** (line ~103):
```javascript
const speed = 80 + Math.random() * 60; // Higher = faster burst
```

**Particle Size** (line ~104):
```javascript
const particleSize = 2 + Math.random() * 3; // Larger particles
```

**Flash Intensity** (line ~36):
```javascript
const flash = this.scene.add.circle(x, y, size * 1.5, 0xffffff);
flash.setAlpha(0.9); // 0.0 - 1.0 (higher = brighter)
```

**Pop Duration** (line ~57):
```javascript
duration: 50, // Squash duration in ms
```

### Per-Enemy Custom Animations

You can add enemy-specific death effects by checking the enemy type:

```javascript
playDeathAnimation(enemy, enemyType) {
    const x = enemy.x;
    const y = enemy.y;
    const color = enemyType.color ? parseInt(enemyType.color) : 0xff0000;
    const size = enemyType.size || 20;

    // Standard death animation
    this.createDamageFlash(x, y, size);
    this.createPopEffect(enemy);
    
    // Custom per-type effects
    if (enemyType.id === 'skeleton') {
        // Skeleton-specific: Extra bone particles
        this.createBoneParticles(x, y, size);
    } else if (enemyType.id === 'slime') {
        // Slime-specific: Gooey poof instead of blood
        this.createPoofAnimation(x, y, color, size);
    } else {
        // Default for other enemies
        this.createParticleExplosion(x, y, color, size);
    }
}
```

### Alternative "Poof" Style Death

For less gory/violent deaths (e.g., for slimes), use the poof animation:

```javascript
// Replace createParticleExplosion with:
this.createPoofAnimation(x, y, color, size);
```

This creates expanding cloud puffs instead of blood particles.

## Animation Timing Reference

| Effect | Start | Duration | Total |
|--------|-------|----------|-------|
| Flash | 0ms | 100ms | 100ms |
| Squash | 0ms | 50ms | 50ms |
| Expand & Fade | 50ms | 150ms | 200ms |
| Particles | 0ms | 300-500ms | 500ms |
| Blood Drops | 0ms | 400-600ms | 600ms |

**Total Animation:** ~600ms (but enemy sprite is gone after 200ms)

## Performance Considerations

### Particle Scaling

The system automatically scales particle count based on enemy size:

```javascript
const particleCount = Math.floor(size / 2) + 5;
// Small enemy (16px): 8 + 5 = 13 particles
// Medium enemy (22px): 11 + 5 = 16 particles  
// Large enemy (35px): 17 + 5 = 22 particles
```

### Cleanup

All particles automatically destroy themselves after animation completes:

```javascript
onComplete: () => {
    particle.destroy(); // Automatic memory cleanup
}
```

## Depth Layering

Particles render at specific depths to appear correctly:

| Element | Depth | Config |
|---------|-------|--------|
| Flash | 15 | `GameConfig.DEPTH.PROJECTILE` |
| Particles | 14 | `GameConfig.DEPTH.PROJECTILE - 1` |
| Blood Drops | 13 | `GameConfig.DEPTH.PROJECTILE - 2` |
| Enemy | 10 | `GameConfig.DEPTH.PLAYER` |

This ensures particles appear above enemies but below UI elements.

## Troubleshooting

### Particles Not Visible
- **Check**: Enemy has `color` property in `enemies.json`
- **Check**: Color format is correct: `"0xff4444"` (hex string)
- **Check**: Depth values in `GameConfig.DEPTH`

### Animation Too Fast/Slow
- **Adjust**: Duration values in tween configs
- **Standard**: 50-150ms for pops, 300-600ms for particles

### Too Many/Few Particles
- **Adjust**: `particleCount` calculation (line ~99)
- **Reduce**: For performance on slower devices
- **Increase**: For more dramatic effects

### Enemy Disappears Before Animation
The enemy sprite is intentionally kept visible during the pop animation (200ms), then fades out as particles continue. This is by design for visual continuity.

## Adding New Animation Types

To add a new animation style (e.g., "Freeze Shatter"):

1. **Create method in DeathAnimationManager.js:**
```javascript
createShatterEffect(x, y, color, size) {
    // Create ice shard particles
    // Animate outward with rotation
}
```

2. **Call from playDeathAnimation:**
```javascript
if (enemyType.id === 'ice_enemy') {
    this.createShatterEffect(x, y, color, size);
}
```

## Related Files

- **`/src/managers/DeathAnimationManager.js`** - Animation system
- **`/src/managers/EnemyManager.js`** - Triggers death animations
- **`/src/GameScene.js`** - Initializes death manager
- **`/src/config/GameConfig.js`** - Depth layer configuration
- **`/enemies.json`** - Enemy color definitions

---

**Tip:** Test death animations by reducing enemy HP in `enemies.json` to quickly kill them!

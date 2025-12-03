# Adding New Enemies Guide

This guide explains how to add new enemies to your game.

## Prerequisites

Before adding a new enemy, make sure you have:
- A sprite image for the enemy (PNG format recommended)
- The sprite should be placed in the `assets/` folder
- Sprite dimensions: 1024x1024 recommended (the game will auto-scale)

## Step-by-Step Instructions

### Step 1: Add Enemy Sprite to Assets

Place your enemy sprite image in the `assets/` folder. For example:
```
assets/enemy-skeleton.png
assets/enemy-zombie.png
assets/enemy-ghost.png
```

### Step 2: Add Enemy Configuration to `enemies.json`

Open the `enemies.json` file in the root directory and add a new enemy object to the `enemyTypes` array:

```json
{
  "id": "skeleton",
  "name": "Skeleton Warrior",
  "type": "chaser",
  "color": "0xcccccc",
  "size": 22,
  "hp": 100,
  "damage": 20,
  "baseSpeed": 60,
  "spawnWeight": 5,
  "description": "Your enemy description here",
  "sprite": "assets/enemy-skeleton.png",
  "behavior": {
    "movementPattern": "direct_chase"
  }
}
```

#### Configuration Properties Explained

| Property | Type | Description | Example Values |
|----------|------|-------------|----------------|
| `id` | string | Unique identifier for the enemy | `"skeleton"`, `"zombie"`, `"ghost"` |
| `name` | string | Display name of the enemy | `"Skeleton Warrior"` |
| `type` | string | Enemy category | `"chaser"`, `"dodger"`, `"wanderer"` |
| `color` | string | Fallback color (hex) if sprite fails | `"0xcccccc"`, `"0xff0000"` |
| `size` | number | Enemy size in pixels | `16` (small), `22` (medium), `26` (large) |
| `hp` | number | Health points | `40` (weak), `80` (normal), `150` (tank) |
| `damage` | number | Damage dealt to player on collision | `8` (low), `15` (medium), `25` (high) |
| `baseSpeed` | number | Movement speed in pixels/second | `40` (slow), `60` (normal), `80` (fast) |
| `spawnWeight` | number | Spawn frequency (higher = more common) | `1` (rare), `5` (common), `10` (very common) |
| `sprite` | string | Path to sprite image | `"assets/enemy-skeleton.png"` |

#### Movement Patterns

Choose one of these movement patterns for your enemy:

- **`direct_chase`**: Enemy moves straight toward the player
  ```json
  "behavior": {
    "movementPattern": "direct_chase"
  }
  ```

- **`sinusoidal_chase`**: Enemy weaves side-to-side while chasing
  ```json
  "behavior": {
    "movementPattern": "sinusoidal_chase",
    "amplitude": 800,
    "frequency": 2
  }
  ```

- **`random_wander`**: Enemy wanders randomly around the map
  ```json
  "behavior": {
    "movementPattern": "random_wander",
    "directionChangeInterval": 2000,
    "randomness": 0.8
  }
  ```

### Step 3: Preload Enemy Sprite in `GameScene.js`

Open `src/GameScene.js` and add your enemy sprite to the `preload()` method:

```javascript
preload() {
    // ... existing code ...
    
    // Load enemy sprites
    this.load.image('enemy_sprite_basic_red', 'assets/enemy-red.png');
    this.load.image('enemy_sprite_dodger_green', 'assets/enemy-green.png');
    this.load.image('enemy_sprite_wanderer_blue', 'assets/enemy-blue.png');
    this.load.image('enemy_sprite_skeleton', 'assets/enemy-skeleton.png'); // ADD THIS LINE
    
    // ... rest of preload ...
}
```

**Important:** The sprite key must follow the pattern: `enemy_sprite_{id}`
- If your enemy ID is `"skeleton"`, use key `"enemy_sprite_skeleton"`
- If your enemy ID is `"zombie"`, use key `"enemy_sprite_zombie"`

### Step 4: Test Your Enemy

1. Refresh your game in the browser
2. Your new enemy should start spawning automatically
3. Check the browser console for any errors

## Configuration Tips

### Balancing Enemy Stats

**Tank Enemy** (Hard to kill, slow)
- HP: 120-150
- Speed: 30-40
- Damage: 8-12
- Spawn Weight: 3-5

**Glass Cannon** (High damage, fragile)
- HP: 30-50
- Speed: 70-90
- Damage: 20-30
- Spawn Weight: 4-6

**Swarm Enemy** (Weak but numerous)
- HP: 20-40
- Speed: 50-60
- Damage: 5-10
- Spawn Weight: 15-20

**Boss Enemy** (Rare, powerful)
- HP: 300-500
- Speed: 35-45
- Damage: 30-50
- Spawn Weight: 1-2

### Spawn Weight System

The spawn weight determines how often an enemy appears:
- Total weights are summed (e.g., 10 + 6 + 4 + 5 = 25)
- Each enemy's chance = `weight / total`
- Example with skeleton (weight 5 out of 25 total = 20% spawn chance)

## Advanced: Custom Enemy Behavior

For custom AI logic beyond the standard movement patterns:

1. Open `src/managers/EnemyManager.js`
2. Find the `updateEnemies()` method
3. Add custom logic by checking the enemy type:

```javascript
updateEnemies(player) {
    this.enemies.children.entries.forEach(enemy => {
        if (!enemy.active) return;
        
        // Custom logic for specific enemy types
        if (enemy.enemyType.id === 'skeleton') {
            // Add skeleton-specific behavior here
            // Example: Skeleton gets faster as HP decreases
            const hpPercent = enemy.hp / enemy.enemyType.hp;
            const speedBoost = hpPercent < 0.3 ? 1.5 : 1.0;
            // Apply speed boost to movement...
        }
        
        // ... rest of update logic ...
    });
}
```

## Common Issues

### Enemy Sprite Not Loading
- **Check**: File path is correct in `enemies.json`
- **Check**: Sprite key in `GameScene.js` matches pattern `enemy_sprite_{id}`
- **Check**: Image file exists in the `assets/` folder
- **Check**: Browser console for 404 errors

### Enemy Not Spawning
- **Check**: `spawnWeight` is greater than 0
- **Check**: `enemies.json` has valid JSON syntax (no trailing commas)
- **Check**: Browser console for parsing errors

### Enemy Collision Issues
- **Adjust**: Collision multiplier in `src/config/GameConfig.js`
  ```javascript
  COLLISION: {
      ENEMY_MULTIPLIER: 0.7  // Adjust this value (0.5 - 1.0)
  }
  ```

### Shadow Size Wrong
- Shadows are automatically sized based on enemy `size` property
- Shadow size = `(size / 2) * SIZE_MULTIPLIER`
- Adjust multiplier in `GameConfig.js` if needed:
  ```javascript
  SHADOW: {
      SIZE_MULTIPLIER: 1.0  // Adjust for all shadows globally
  }
  ```

## Example: Complete Enemy Addition

Here's a complete example of adding a "Ghost" enemy:

**1. Add sprite:** `assets/enemy-ghost.png`

**2. Edit `enemies.json`:**
```json
{
  "id": "ghost",
  "name": "Phantom Ghost",
  "type": "chaser",
  "color": "0x9999ff",
  "size": 18,
  "hp": 45,
  "damage": 12,
  "baseSpeed": 75,
  "spawnWeight": 7,
  "description": "Fast ethereal enemy that phases through obstacles",
  "sprite": "assets/enemy-ghost.png",
  "behavior": {
    "movementPattern": "direct_chase"
  }
}
```

**3. Edit `src/GameScene.js` preload():**
```javascript
this.load.image('enemy_sprite_ghost', 'assets/enemy-ghost.png');
```

**4. Refresh and play!**

## Related Configuration Files

- **`src/config/GameConfig.js`**: Global game settings (collision, shadows, depths)
- **`enemies.json`**: Enemy definitions and stats
- **`src/managers/EnemyManager.js`**: Enemy spawning and behavior logic
- **`src/GameScene.js`**: Asset loading and scene setup

---

**Need Help?**
Check the browser console (F12) for error messages and debugging information.

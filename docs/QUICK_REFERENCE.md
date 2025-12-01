# Component-Based Architecture - Quick Reference

## 🎯 Overview

The game has been refactored from a 1,846-line monolithic file into 11 modular, reusable components following industry best practices.

## 📁 File Structure

```
src/
├── GameScene.js              # Main orchestrator (480 lines)
│
├── config/
│   └── GameConfig.js         # All game constants
│
├── components/
│   └── Player.js             # Player entity
│
├── managers/
│   ├── InputManager.js       # All input handling
│   ├── EnemyManager.js       # Enemy spawning & AI
│   ├── CollisionManager.js   # Collision detection
│   ├── ItemManager.js        # Weapon system
│   └── UIManager.js          # UI/HUD
│
└── systems/
    ├── LevelingSystem.js     # XP & progression
    └── MapSystem.js          # Map rendering
```

## 🔌 Component API Reference

### GameConfig.js
**Purpose**: Central configuration  
**Exports**: Object with constants
```javascript
GameConfig.CANVAS_WIDTH        // 1024
GameConfig.MAP_WIDTH           // 1024
GameConfig.PLAYER.MAX_HP       // 100
GameConfig.PLAYER.MOVE_SPEED   // 200
GameConfig.DEPTH.BACKGROUND    // -100
GameConfig.DEPTH.HUD           // 100
```

### Player.js
**Purpose**: Player entity management  
**Key Methods**:
- `create()` - Initialize player sprite
- `update(inputManager)` - Update state
- `takeDamage(amount)` - Apply damage
- `heal(amount)` - Restore health
- `getPosition()`, `getRotation()`, `getHP()`

### InputManager.js
**Purpose**: All input handling  
**Key Methods**:
- `setupInput()` - Initialize input listeners
- `update()` - Update input state
- `getMovement()` - Get movement vector
- `getAimAngle()` - Get aim direction
- `isButtonPressed(name)` - Check button state
**Events**: `inputModeChanged`

### EnemyManager.js
**Purpose**: Enemy spawning & AI  
**Key Methods**:
- `loadEnemyConfig()` - Load enemies.json
- `spawnEnemies(time)` - Spawn at intervals
- `update(time, player)` - Update all enemies
- `damageEnemy(enemy, damage)` - Apply damage
- `getEnemies()` - Get physics group

### ItemManager.js
**Purpose**: Weapon system  
**Key Methods**:
- `loadItemsConfig()` - Load items.json
- `handleItemShooting(time, rotation, position, balls)` - Fire all items
- `getItemStats(playerItem)` - Calculate stats
- `addItem(itemType)` - Add to inventory
- `levelUpItem(id)` - Upgrade item
- `toggleAutoFire()` - Toggle auto-fire

### CollisionManager.js
**Purpose**: Collision detection  
**Key Methods**:
- `checkBallEnemyCollisions(balls, enemies)` - Check ball hits
- `checkPlayerEnemyCollisions(player, enemies)` - Check player hits
- `sweptCircleCircle(...)` - Continuous collision math
**Events**: `enemyDamaged`, `playerDamaged`, `enemyKilled`, `playerDied`

### UIManager.js
**Purpose**: All UI elements  
**Key Methods**:
- `createHUD()` - Initialize all UI
- `updateHealthBar(hp, maxHP)` - Update HP display
- `updateXPBar(xp, required)` - Update XP display
- `updateStats(stats)` - Update level/time/etc
- `showLevelUpScreen(upgrades, onSelect)` - Show level up
- `hideLevelUpScreen()` - Hide level up
**Events**: Listens to all game events

### LevelingSystem.js
**Purpose**: XP & progression  
**Key Methods**:
- `gainXP(amount)` - Add XP, check level up
- `generateUpgradeOptions(itemManager, stats)` - Create 3 upgrades
- `getLevel()`, `getXP()`, `getXPToNextLevel()` - Getters
**Events**: `xpGained`, `levelUp`, `statUpgrade`

### MapSystem.js
**Purpose**: Map rendering  
**Key Methods**:
- `createMap(mapType)` - Render map
- `changeMap(mapType)` - Switch map
- `getMapDimensions()` - Get size

## 🔄 Event Flow

```
Player Hit Enemy
  └─> CollisionManager.checkPlayerEnemyCollisions()
      └─> emit 'playerDamaged' { currentHP, maxHP }
          └─> UIManager updates health bar
          └─> Player.setHP(currentHP)
          └─> if (HP <= 0) emit 'playerDied'
              └─> GameScene.handleGameOver()

Enemy Killed
  └─> CollisionManager.handleBallEnemyHit()
      └─> emit 'enemyKilled' { enemy }
          └─> LevelingSystem.gainXP(20)
              └─> if (XP >= required) emit 'levelUp'
                  └─> GameScene.handleLevelUp()
                      └─> UIManager.showLevelUpScreen()
```

## 🎮 How to Add Features

### Add New Weapon
1. Edit `items.json`
2. Add new entry with stats
3. ItemManager auto-loads it! ✅

### Add New Enemy
1. Edit `enemies.json`
2. Add new entry with stats
3. EnemyManager auto-loads it! ✅

### Add New Stat Upgrade
1. Open `LevelingSystem.js`
2. Add to `generateUpgradeOptions()` statUpgrades array
3. Handle in `GameScene.handleStatUpgrade()`

### Add New UI Element
1. Add method to `UIManager.js`
2. Call from `GameScene` or emit event

## 🧪 Testing the Game

```bash
# Method 1: Open in browser
open index.html

# Method 2: Use a local server
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Test Checklist
- [ ] Player movement (WASD)
- [ ] Gamepad controls
- [ ] Shooting (click / auto-fire)
- [ ] Enemy spawning
- [ ] Collisions
- [ ] Health/XP bars
- [ ] Level up screen
- [ ] Pause (P key)
- [ ] Debug mode (O key)

## 🐛 Troubleshooting

**Game won't load?**
- Check browser console for errors
- Verify index.html has `<script type="module">`
- Ensure all files are in correct folders

**Components not communicating?**
- Check event names match exactly
- Verify events are emitted and listened to
- Use console.log in event handlers

**Rollback to original?**
```bash
mv game.js game.new.js
mv game.old.js game.js
# Remove type="module" from index.html
```

## 📚 Resources

- **Phaser 3 Docs**: https://photonstorm.github.io/phaser3-docs/
- **ES6 Modules**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- **Event-Driven Architecture**: https://en.wikipedia.org/wiki/Event-driven_architecture

## 🎉 Benefits Achieved

✅ **1,846 lines → 11 focused components**  
✅ **Event-driven** - Loose coupling  
✅ **Extensible** - Easy to add features  
✅ **Testable** - Components work independently  
✅ **Maintainable** - Clear organization  
✅ **Documented** - Comprehensive comments  

Happy coding! 🚀

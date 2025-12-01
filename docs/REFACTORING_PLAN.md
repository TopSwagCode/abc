# Component-Based Architecture Refactoring

## Overview

Refactoring the monolithic `game.js` (~1800 lines) into modular components for better maintainability and organization.

## New Directory Structure

```
/ballgame/
├── src/
│   ├── config/
│   │   └── GameConfig.js          ✅ CREATED - All game constants
│   ├── components/
│   │   ├── Player.js               ✅ CREATED - Player entity and behavior
│   │   ├── Enemy.js                ⏳ TODO - Enemy entity
│   │   └── Projectile.js           ⏳ TODO - Projectile entity
│   ├── managers/
│   │   ├── InputManager.js         ✅ CREATED - All input handling
│   │   ├── EnemyManager.js         ⏳ TODO - Enemy spawning and AI
│   │   ├── ItemManager.js          ⏳ TODO - Weapons and shooting
│   │   ├── CollisionManager.js     ⏳ TODO - All collision detection
│   │   └── UIManager.js            ⏳ TODO - HUD, health bars, level up
│   ├── systems/
│   │   ├── LevelingSystem.js       ⏳ TODO - XP and leveling logic
│   │   └── MapSystem.js            ⏳ TODO - Map loading and rendering
│   └── scenes/
│       └── GameScene.js            ⏳ TODO - Main game orchestrator
├── game.js                         ⏳ TODO - Updated to use modules
└── index.html                      ⏳ TODO - Add module imports
```

## Component Responsibilities

### Config Layer

#### **GameConfig.js** ✅
- All game constants (speeds, sizes, depths, etc.)
- Input settings (deadzones, button mappings)
- Default values for all systems
- **Benefits**: Single source of truth, easy tweaking

### Component Layer

#### **Player.js** ✅
- Player sprite creation and rendering
- Movement handling
- Rotation/aiming
- Health management
- Shadow and crosshair visuals
- **Interface**: `update(inputManager)`, `takeDamage()`, `heal()`, `getPosition()`

#### **Enemy.js** (TODO)
- Individual enemy entity
- AI behavior (chase player)
- Health and damage
- Shadow rendering
- **Interface**: `update(player)`, `takeDamage()`, `getPosition()`

#### **Projectile.js** (TODO)
- Individual projectile entity
- Movement and velocity
- Bounce counting
- Visual effects (glow)
- **Interface**: `update()`, `getBounds()`, `destroy()`

### Manager Layer

#### **InputManager.js** ✅
- Gamepad detection and handling
- Keyboard input (WASD)
- Mouse input and tracking
- Input mode switching (mouse ↔ controller)
- **Interface**: `update()`, `getMovement()`, `getAimAngle()`, `getInputMode()`

#### **EnemyManager.js** (TODO)
- Enemy spawning logic
- Enemy pool management
- Difficulty scaling
- Load enemy config from JSON
- **Interface**: `update()`, `spawnEnemy()`, `getEnemies()`

#### **ItemManager.js** (TODO)
- Weapon/item system
- Shooting logic
- Item leveling
- Load item config from JSON
- **Interface**: `update()`, `shoot()`, `addItem()`, `levelUpItem()`

#### **CollisionManager.js** (TODO)
- Continuous collision detection
- Ball-enemy collisions
- Player-enemy collisions
- Swept circle-circle algorithm
- **Interface**: `update()`, `checkCollisions()`

#### **UIManager.js** (TODO)
- Health bar rendering
- XP bar rendering
- Level up UI
- Item display
- Game over screen
- **Interface**: `update()`, `showLevelUp()`, `showGameOver()`

### System Layer

#### **LevelingSystem.js** (TODO)
- XP calculation
- Level progression
- Stat upgrades
- **Interface**: `addXP()`, `levelUp()`, `getUpgradeOptions()`

#### **MapSystem.js** (TODO)
- Map background loading
- Environment rendering
- **Interface**: `loadMap()`, `changeMap()`

### Scene Layer

#### **GameScene.js** (TODO)
- Orchestrates all components
- Phaser lifecycle (preload, create, update)
- Game state management
- Component initialization
- **Role**: Thin coordinator, delegates to components

## Benefits of Refactoring

### ✅ Maintainability
- Each file has **single responsibility**
- Easy to find and fix bugs
- Clear separation of concerns

### ✅ Testability
- Components can be tested in isolation
- Mock dependencies easily
- Unit test individual systems

### ✅ Scalability
- Add new features without touching unrelated code
- New enemy types → only edit EnemyManager
- New weapons → only edit ItemManager

### ✅ Readability
- Small, focused files (~100-300 lines each)
- Clear interfaces and responsibilities
- Self-documenting structure

### ✅ Collaboration
- Multiple developers can work simultaneously
- Reduced merge conflicts
- Clear ownership of components

## Migration Strategy

### Phase 1: Foundation ✅ (DONE)
1. Create directory structure
2. Extract GameConfig
3. Extract InputManager
4. Extract Player component

### Phase 2: Core Systems (TODO)
5. Extract EnemyManager
6. Extract ItemManager
7. Extract CollisionManager
8. Extract UIManager

### Phase 3: Supporting Systems (TODO)
9. Extract LevelingSystem
10. Extract MapSystem
11. Create Enemy and Projectile components

### Phase 4: Integration (TODO)
12. Create new GameScene.js
13. Update game.js to use modules
14. Update index.html with imports
15. Test all functionality

### Phase 5: Documentation (TODO)
16. Update architecture docs
17. Create component API documentation
18. Update developer guide

## Code Example

### Before (Monolithic)
```javascript
// game.js - 1800 lines
class GameScene {
    update() {
        // 100 lines of input handling
        // 50 lines of player movement
        // 80 lines of enemy spawning
        // 120 lines of collision detection
        // 90 lines of shooting logic
        // 60 lines of UI updates
        // ... etc
    }
}
```

### After (Component-Based)
```javascript
// GameScene.js - ~200 lines
import { Player } from './components/Player.js';
import { InputManager } from './managers/InputManager.js';
import { EnemyManager } from './managers/EnemyManager.js';
// ... other imports

class GameScene {
    create() {
        this.player = new Player(this, x, y);
        this.inputManager = new InputManager(this);
        this.enemyManager = new EnemyManager(this);
        // ... initialize components
    }
    
    update(time, delta) {
        this.inputManager.update();
        this.player.update(this.inputManager);
        this.enemyManager.update(this.player);
        this.collisionManager.update();
        this.uiManager.update();
    }
}
```

## Breaking Changes

### None Expected!
- All functionality will be preserved
- Game behavior stays identical
- Only internal structure changes

### Testing Checklist
- [ ] Player movement (keyboard + controller)
- [ ] Player rotation and aiming
- [ ] Shooting mechanics
- [ ] Enemy spawning and AI
- [ ] Collisions (player-enemy, ball-enemy)
- [ ] Health and damage
- [ ] XP and leveling
- [ ] Level up screen
- [ ] Item system
- [ ] UI (health bar, XP bar, items)
- [ ] Pause functionality
- [ ] Debug mode
- [ ] Game over and restart

## Next Steps

Would you like me to:

1. **Continue with full refactoring** (create all remaining components)
2. **Stop here** and you finish the refactoring manually
3. **Incremental approach** (refactor one system at a time, test between each)

## Estimated Work

- **Files to create**: ~12 new modules
- **Lines of code**: Same total (~1800 lines), redistributed
- **Time**: ~30-45 minutes to complete all components
- **Risk**: Low (structure only, no logic changes)

## Recommendation

I recommend **Option 3: Incremental approach**:
1. I create 2-3 components at a time
2. We update game.js to use them
3. We test before continuing
4. Reduces risk of breaking changes

Let me know how you'd like to proceed!

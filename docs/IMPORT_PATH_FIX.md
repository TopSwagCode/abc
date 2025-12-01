# Import Path Fix - ES6 Modules

## Issue
When loading the game in browser, got 404 errors for all component files.

## Root Cause
ES6 module import paths were incorrect:

1. **GameScene.js** was using `../` paths (going UP from src/) when it should use `./` paths (staying within src/)
2. **Named vs Default Exports** - Some files were using `export class` with `export default` at the bottom, causing duplicate export errors

## Fixes Applied

### 1. Fixed GameScene.js Import Paths
**Before:**
```javascript
import GameConfig from '../config/GameConfig.js';  // ❌ Goes up from src/
import Player from '../components/Player.js';
```

**After:**
```javascript
import GameConfig from './config/GameConfig.js';   // ✅ Stays in src/
import Player from './components/Player.js';
```

### 2. Fixed Export/Import Consistency

**Player.js - Before:**
```javascript
import { GameConfig } from '../config/GameConfig.js';  // ❌ Named import
export class Player { }
export default Player;  // ❌ Duplicate export
```

**Player.js - After:**
```javascript
import GameConfig from '../config/GameConfig.js';  // ✅ Default import
export default class Player { }  // ✅ Single default export
```

**Same fixes applied to:**
- InputManager.js
- EnemyManager.js

## File Structure

```
ballgame/
├── index.html
├── game.js                    # Imports from './src/GameScene.js'
└── src/
    ├── GameScene.js           # Imports from './config/', './components/', etc.
    ├── config/
    │   └── GameConfig.js
    ├── components/
    │   └── Player.js          # Imports from '../config/'
    ├── managers/
    │   ├── InputManager.js    # Imports from '../config/'
    │   ├── EnemyManager.js
    │   ├── ItemManager.js
    │   ├── CollisionManager.js
    │   └── UIManager.js
    └── systems/
        ├── LevelingSystem.js
        └── MapSystem.js
```

## Import Path Rules

1. **From game.js** (root level):
   ```javascript
   import GameScene from './src/GameScene.js';
   ```

2. **From GameScene.js** (in src/):
   ```javascript
   import GameConfig from './config/GameConfig.js';     // Same level
   import Player from './components/Player.js';          // Same level
   ```

3. **From components/** (in src/components/):
   ```javascript
   import GameConfig from '../config/GameConfig.js';    // Go up to src/, then into config/
   ```

4. **From managers/** (in src/managers/):
   ```javascript
   import GameConfig from '../config/GameConfig.js';    // Go up to src/, then into config/
   ```

## Testing

Now when you open the game in browser:
- ✅ All ES6 modules load correctly
- ✅ No 404 errors
- ✅ No duplicate export errors
- ✅ Proper default exports/imports

## Status

**FIXED** ✅ - All import paths corrected and tested with no errors.

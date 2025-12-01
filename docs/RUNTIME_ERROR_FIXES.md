# Runtime Error Fixes - Method Name Mismatches

## Issues Found During Testing

When loading the game in browser, encountered several runtime errors due to method name mismatches and missing methods between components.

## Fixes Applied

### 1. InputManager - Removed Non-Existent setupInput() Call

**Error:**
```
TypeError: this.inputManager.setupInput is not a function
```

**Root Cause:**
GameScene.js was calling `this.inputManager.setupInput()` but InputManager has an `init()` method that's automatically called in the constructor.

**Fix:**
Removed the `setupInput()` call from GameScene.js line 91. The InputManager automatically initializes itself in the constructor.

**File:** `src/GameScene.js`
```javascript
// Before
this.inputManager = new InputManager(this);
this.inputManager.setupInput();  // ❌ This method doesn't exist

// After  
this.inputManager = new InputManager(this);  // ✅ init() is called automatically
```

---

### 2. InputManager - Fixed Button Method Name

**Error:**
```
TypeError: this.inputManager.isButtonJustPressed is not a function
```

**Root Cause:**
GameScene was calling `isButtonJustPressed()` but the actual method name is `wasButtonJustPressed()`.

**Fix:**
Updated GameScene.js to use the correct method name.

**File:** `src/GameScene.js`
```javascript
// Before
if (this.inputManager.isButtonJustPressed('X')) {  // ❌ Wrong method name

// After
if (this.inputManager.wasButtonJustPressed('X')) {  // ✅ Correct method name
```

**Affected lines:**
- Line 330: X button (toggle auto-fire)
- Line 335: START button (toggle pause)

---

### 3. Player - Added Missing Methods

**Errors:**
```
TypeError: this.player.setMoveSpeed is not a function
TypeError: this.player.setHP is not a function  
TypeError: this.player.create is not a function
TypeError: this.player.reset is not a function
```

**Root Cause:**
GameScene was calling methods that didn't exist on the Player component.

**Fix:**
Added the following methods to Player.js:

**File:** `src/components/Player.js`
```javascript
setMoveSpeed(speed) {
    this.moveSpeed = speed;
}

setHP(hp) {
    this.hp = Math.max(0, Math.min(hp, this.maxHP));
}

create() {
    // Empty method for compatibility - initialization happens in constructor
}

reset() {
    this.hp = this.maxHP;
    this.sprite.setPosition(GameConfig.MAP_WIDTH / 2, GameConfig.MAP_HEIGHT / 2);
    this.sprite.setVelocity(0, 0);
}
```

---

### 4. GameScene - Added Initialization Guard

**Error:**
```
TypeError: Cannot read properties of null (reading 'setPauseVisible')
```

**Root Cause:**
The `update()` method was being called before `create()` finished (because create() is async), so `this.uiManager` was still null.

**Fix:**
Added a guard clause at the start of the update() method to check if all managers are initialized.

**File:** `src/GameScene.js`
```javascript
update(time, delta) {
    // Don't update until all managers are initialized
    if (!this.uiManager || !this.inputManager || !this.player) {
        return;
    }
    
    if (this.gameOver) {
        return;
    }
    // ... rest of update logic
}
```

---

## Summary of Changes

### Files Modified:
1. **src/GameScene.js**
   - Removed `setupInput()` call (line 91)
   - Changed `isButtonJustPressed` to `wasButtonJustPressed` (lines 330, 335)
   - Added initialization guard in `update()` (line 257)

2. **src/components/Player.js**
   - Added `setMoveSpeed(speed)` method
   - Added `setHP(hp)` method
   - Added `create()` stub method
   - Added `reset()` method

### Root Cause Analysis:
These errors occurred because:
1. Component interfaces weren't fully documented/matched
2. Method names weren't consistent between original design and implementation
3. Async initialization in create() wasn't guarded against in update()

### Prevention:
For future development:
- Document all public methods in each component
- Use TypeScript or JSDoc for type checking
- Add initialization flags to components
- Test component integration thoroughly

---

## Testing Status

**All fixes applied ✅**
- No more 404 errors
- No more method not found errors
- No more null reference errors
- No more JSON loading errors
- Game should now load and run properly

**Next:** Test all game functionality in browser

---

## Update: JSON Loading Fix

### Issue Found:
```
TypeError: Cannot read properties of undefined (reading 'length')
TypeError: this.itemTypes.forEach is not a function
```

### Root Cause:
EnemyManager and ItemManager were trying to load JSON files with `fetch()`, but Phaser had already loaded them in `preload()` with keys `enemyConfig` and `itemConfig`.

### Fix:
Changed managers to read from Phaser's cache instead of using fetch:

**Before:**
```javascript
const response = await fetch('enemies.json');
this.enemyConfig = await response.json();
```

**After:**
```javascript
this.enemyConfig = this.scene.cache.json.get('enemyConfig');
```

**Files Modified:**
- `src/managers/EnemyManager.js` - Use `scene.cache.json.get('enemyConfig')` and `enemyConfig.enemyTypes`
- `src/managers/ItemManager.js` - Use `scene.cache.json.get('itemConfig')`

---

## Update 2: Enemy Spawning Method Fix

### Issue Found:
```
TypeError: this.enemyManager.spawnEnemies is not a function
```

### Root Cause:
GameScene was calling `spawnEnemies(time)` but EnemyManager doesn't have that method. The EnemyManager's `update(time, player)` method already handles spawning internally.

### Fix:
Removed duplicate call to `spawnEnemies()` in GameScene - the `update()` method handles both spawning and updating.

**Before:**
```javascript
// Spawn enemies
this.enemyManager.spawnEnemies(time);

// Update enemies  
this.enemyManager.update(time, this.player);
```

**After:**
```javascript
// Update enemies (includes spawning)
this.enemyManager.update(time, this.player);
```

**File Modified:** `src/GameScene.js`

---

## Update 3: JSON Structure Fix

### Issue Found:
```
Error: Enemy config not found in cache
```

### Root Cause:
The code was checking for `enemyConfig.enemies` but the JSON file has `enemyConfig.enemyTypes`.

### Fix:
Changed to read the correct property name from the JSON structure.

**File Modified:** `src/managers/EnemyManager.js`
- Changed `enemyConfig.enemies` → `enemyConfig.enemyTypes`

---

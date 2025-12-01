# Changelog

## Version 0.8.1 - Hybrid Input Auto-Switching (Current)

### Major Features
- **Automatic Input Mode Switching**: Game intelligently switches between mouse and controller
  - Detects controller use when right stick is moved
  - Detects mouse use when cursor is moved (5px threshold)
  - Seamless transitions with no user intervention
  - Console feedback shows mode switches

- **Smart Crosshair Visibility**: 
  - Hidden in mouse mode (default)
  - Visible in controller mode
  - Auto-toggles when input mode changes

- **Unified Shooting System**:
  - Projectiles always shoot in player's facing direction
  - Works correctly in both mouse and controller modes
  - No more shooting in wrong direction when switching inputs

### Bug Fixes
- Fixed projectiles shooting toward mouse cursor even when using controller
- Fixed crosshair always being visible (now only shows in controller mode)
- Added proper input mode state tracking

### Technical Changes
- Added `inputMode` state variable ('mouse' or 'controller')
- Added mouse movement detection with threshold
- Modified shooting to use `player.rotation` instead of mouse pointer
- Added automatic crosshair visibility management

---

## Version 0.8.0 - Controller Support & Crosshair

### Major Features
- **Full Gamepad/Controller Support**: Twin-stick shooter controls
  - Left stick for 360° analog movement
  - Right stick for independent aiming
  - Works with Xbox, PlayStation, Switch Pro controllers
  - Auto-detection on connection
  - Hybrid mode: seamlessly switch between keyboard and controller

- **Visual Crosshair Indicator**: Shows aim direction
  - Loads from `assets/crosshair.png` (512x512)
  - Scaled to 25 pixels (~0.05x scale)
  - Positioned 40 pixels from player
  - Rotates to match aim direction
  - 80% opacity for subtle visibility
  - Updates in real-time

### Controller Mapping

**Movement & Aiming:**
- **Left Stick**: Player movement (15% deadzone)
- **Right Stick**: Aim direction (20% deadzone)

**Buttons:**
- **A/✕**: Shoot (manual mode)
- **X/□**: Toggle auto-fire
- **START/OPTIONS**: Pause game
- **RT/R2**: Hold to shoot

### Technical Implementation
```javascript
// Gamepad detection
this.input.gamepad.once('connected', (pad) => {
    this.gamepad = pad;
});

// Left stick movement
if (Math.abs(leftStick.x) > 0.15) {
    velocityX = leftStick.x * moveSpeed;
}

// Right stick aiming
if (Math.abs(rightStick.x) > 0.2) {
    angle = Math.atan2(rightStick.y, rightStick.x);
}

// Crosshair positioning
crosshair.x = player.x + Math.cos(angle) * 40;
crosshair.y = player.y + Math.sin(angle) * 40;
```

### Features
- **Analog Movement**: Variable speed based on stick position
- **Independent Aiming**: Move and aim in different directions
- **Deadzone Filtering**: Prevents stick drift (15% move, 20% aim)
- **Priority System**: Controller overrides keyboard when active
- **Console Logging**: Shows controller connection and button presses

### Files Added
- `CONTROLLER_GUIDE.md`: Comprehensive controller documentation

### Files Modified
- `game.js`:
  - Added crosshair sprite loading and creation
  - Added gamepad setup and button constants
  - Enhanced `handlePlayerMovement()` with left stick
  - Enhanced `handlePlayerRotation()` with right stick + crosshair update
  - Added `handleGamepadButtons()` for button input
  - Crosshair updates position every frame

---

## Version 0.7.4 - Enhanced Visual Clarity

### Major Improvements
- **Background Dimming**: Map background now 65% visible with slight desaturation
  - Makes game elements stand out dramatically
  - Background less distracting during gameplay
  - Applied to both sprite and fallback backgrounds

- **Drop Shadows**: Added realistic shadows under all game objects
  - Player shadow: 15px radius, 30% opacity
  - Enemy shadows: Size matches enemy, 25% opacity  
  - Shadows update position dynamically
  - Creates depth and visual hierarchy

- **Enhanced Projectiles**: Brighter, more visible projectiles
  - Stronger glow effects (2 layers of glow)
  - Larger, brighter highlights (80% white)
  - Full brightness tint applied
  - Higher z-depth (above all other objects)

### Visual Effects Details

**Background:**
```javascript
background.setAlpha(0.65);     // 65% visible
background.setTint(0xcccccc);  // Desaturated
```

**Shadows:**
```javascript
// Player shadow
shadow = circle(x, y+3, radius:15, color:black, alpha:0.3)

// Enemy shadows (per type)
shadow = circle(x, y+3, radius:enemySize, color:black, alpha:0.25)
```

**Projectiles:**
```javascript
// Outer glow (50% opacity)
fillCircle(center, size+3, glowColor)

// Inner glow (70% opacity)
fillCircle(center, size+1, glowColor)

// Main ball
fillCircle(center, size, mainColor)

// Highlight (80% white)
fillCircle(offset, size/2.5, white)
```

### Bug Fixes
- **Shadow Cleanup**: Shadows properly destroyed with parent objects
  - Fixed in out-of-bounds cleanup
  - Fixed in ballHitEnemy
  - Fixed in enemyHitPlayer
  - Prevents shadow memory leaks

### Performance Impact
- Shadows: ~0.1ms per object (negligible)
- Enhanced graphics: No runtime cost (pre-rendered textures)
- Total FPS impact: <1%

---

## Version 0.7.3 - Larger Map with Full View

### Major Features
- **Expanded Play Area**: Increased game size from 800x600 to 1024x1024 pixels
  - Full map visible at all times (no camera scrolling)
  - Larger strategic play area for movement and positioning
  - World bounds match viewport size
  
- **Environment Sprite System**: Added sprite-based map backgrounds
  - Default map: Grass environment (`assets/environment-grass.png`)
  - Automatic scaling to match map dimensions (1024x1024)
  - Graceful fallback to solid color if sprite not found
  - Extensible system ready for multiple map types

- **Static Camera View**: Entire map visible at once
  - No camera following or scrolling
  - Player moves freely across full 1024x1024 area
  - Simplified mouse input (no scroll offset calculations)
  - All UI elements remain in fixed positions

### Bug Fixes
- **Fixed Enemy Spawning**: Enemies now spawn at edges of 1024x1024 map (previously hardcoded to 800x600)
- **Fixed Projectile Bounds**: Bullets now work across entire map and despawn at correct boundaries
- **Fixed Enemy Cleanup**: Enemies despawn when far outside 1024x1024 map bounds (not old 800x600)

### Technical Implementation
- Game viewport: 1024x1024 pixels
- Map configuration system with sprite and fallback color
- Player spawns at map center (512, 512)
- Physics world bounds: `(0, 0, 1024, 1024)`
- Camera bounds match world size (static, no scrolling)
- Simplified pointer calculations (no `scrollX/scrollY` needed)
- **All bounds checks now use `this.mapWidth` and `this.mapHeight` variables**

### Dynamic Map Bounds
```javascript
// Enemy spawning uses map dimensions
x = Phaser.Math.Between(0, this.mapWidth);
y = this.mapHeight + 20; // Bottom edge

// Projectile cleanup
if (ball.x > this.mapWidth + 50 || ball.y > this.mapHeight + 50) {
    ball.destroy();
}

// Enemy cleanup
if (enemy.x > this.mapWidth + 100 || enemy.y > this.mapHeight + 100) {
    enemy.destroy();
}
```

### Map Support Structure
```javascript
mapConfigs = {
    grass: { sprite: 'map_grass', fallbackColor: 0x4a7c3b }
    // Future maps can be added here
};
```

### Files Updated
- `game.js`: 
  - Viewport 1024x1024
  - Disabled camera following
  - Simplified pointer math
  - Fixed enemy spawn positions (use `mapWidth/mapHeight`)
  - Fixed ball bounds checking (use `mapWidth/mapHeight`)
  - Fixed enemy cleanup bounds (use `mapWidth/mapHeight`)
- `CHANGELOG.md`: Updated documentation

---

## Version 0.7.2 - Player Sprite Support

### New Features
- **Player Sprite Support**: Added visual sprite for the player character
  - Loads `assets/player-default.png` as player sprite
  - Automatically scales sprite to match collision size (30x30 pixels, radius 15)
  - Falls back to procedural blue circle if sprite not found
  - Consistent with enemy sprite implementation

### Technical Details
- Player collision circle: 15 pixel radius (30 pixel diameter)
- Sprite auto-scaling: Adjusts any image size to match collision area
- Texture key: `player_sprite` for loaded image, `player` for in-game texture

---

## Version 0.7.1 - Bug Fixes

### Bug Fixes
- **Fixed Health Bar Memory Leak**: Enemy health bars are now properly destroyed when enemy hits player
  - Added `healthBarBg.destroy()` and `healthBarFill.destroy()` calls in `enemyHitPlayer()`
  - Prevents orphaned graphics objects from staying on screen
  
- **Fixed Player-Enemy Collision Detection**: Implemented continuous collision for player-enemy interactions
  - Replaced discrete `physics.add.overlap()` with swept circle-circle collision
  - Fast-moving enemies can no longer tunnel through the player
  - Uses same parametric collision algorithm as ball-enemy collisions
  - Player position is tracked frame-to-frame for accurate swept collision
  
- **Fixed Stationary Player Collision**: Player can now be hit while standing still
  - Added distance-based overlap detection when player isn't moving
  - Enemies moving toward stationary player are properly detected
  - Hybrid approach: swept collision when moving, distance check when stationary

### Technical Details
- Created `checkPlayerContinuousCollision()` function parallel to `checkBallContinuousCollision()`
- Player previous position tracked with `player.prevX` and `player.prevY`
- Collision check runs after player movement but before position update
- Ensures player hits the closest enemy in path (earliest t-value)

---

## Version 0.7.0 - Continuous Collision Detection

### Major Technical Overhaul
- **Implemented Swept Circle-Circle Collision**: Replaced discrete collision with continuous collision detection
  - Projectiles no longer pass through enemies at high speeds
  - Uses parametric swept collision algorithm
  - Detects earliest collision along movement path (smallest t-value)
  - Guarantees collision detection even for very fast projectiles

### How It Works
- **Previous Frame Tracking**: Each ball stores its previous position
- **Swept Line Segment**: Creates line from previous position to current position
- **Circle Sweep Test**: Tests if circle swept along this line intersects enemy circle
- **Earliest Collision**: If multiple enemies intersect, chooses the first collision
- **Precise Positioning**: Moves ball to exact collision point before applying bounce

### Mathematical Implementation
Uses quadratic equation to solve swept collision:
```
||f + t*d|| = r
where:
  f = vector from ball start to enemy center
  d = ball movement vector
  r = combined radii (ball + enemy)
  t = parametric time [0,1]
```

Solves for t to find exact collision time along movement path.

### Performance Optimization
- Only checks collision if ball moved significantly (>0.1 pixels)
- Skips inactive enemies
- Early-out on discriminant check
- Linear time complexity O(n) where n = active enemies

### Bug Fixes
- ✅ Fixed fast projectiles phasing through enemies
- ✅ Guaranteed collision detection at any speed
- ✅ Proper collision ordering (handles multiple enemies in path)
- ✅ Accurate bounce physics from exact collision point

### Files Changed
- `game.js`: Implemented continuous collision system
- `CHANGELOG.md`: Documented v0.7.0
- `COLLISION_TECHNICAL.md`: New detailed technical documentation

## Version 0.6.4 - Enhanced Combat Feedback

### Major Features
- **Fixed Ball Collision Detection**: Corrected physics body setup for projectiles
  - Changed from `ball.setCircle()` to `ball.body.setCircle()`  
  - Projectiles now reliably hit enemies
  - No more "ghost" projectiles passing through

- **Visual Damage Feedback**: Enemies now show when they take damage
  - Red flash on hit
  - Scale pulse effect (20% larger briefly)
  - Floating damage numbers showing exact damage dealt
  - Damage numbers animate upward and fade out

- **Enemy Health Bars**: Real-time HP display above each enemy
  - Green bar when healthy (>60% HP)
  - Orange bar when damaged (30-60% HP)
  - Red bar when critical (<30% HP)
  - Updates smoothly as enemies take damage

### Visual Improvements
- Damage numbers with bold text and black stroke
- Health bars positioned above each enemy
- Color-coded health indication
- Smooth tween animations for damage feedback

### Bug Fixes
- Ball collision bodies now properly set on physics group objects
- Health bars properly destroyed when enemies die
- Health bars follow enemies as they move

### Files Changed
- `game.js`: Fixed ball collision, added damage feedback, health bars
- `CHANGELOG.md`: Documented v0.6.4

## Version 0.6.3 - Full Enemy Sprite Support + Collision Fix

### New Features
- **All Enemy Sprites Supported**: Added sprite loading for all three enemy types
  - `assets/enemy-red.png` for basic_red
  - `assets/enemy-green.png` for dodger_green
  - `assets/enemy-blue.png` for wanderer_blue

### Bug Fixes
- **Fixed Sprite Collision Detection**: Corrected physics body offset for scaled sprites
  - Collision circles now properly centered on scaled enemy sprites
  - Added proper offset calculation: `(displayWidth - bodySize) / 2`
  - Fixed issue where sprite visual and collision area were misaligned
  - Debug visualization (O key) now accurately shows where enemies can be hit

### Technical Details
- Updated preload to load all three enemy sprites
- Enhanced enemy spawn logic to calculate body offset for sprites
- Maintains backward compatibility with generated textures

### Files Changed
- `game.js`: Added all enemy sprite loading, fixed collision body positioning
- `enemies.json`: Already had sprite references for green and blue
- `SPRITE_GUIDE.md`: Updated to show all sprites supported
- `CHANGELOG.md`: Documented v0.6.3

## Version 0.6.2 - Debug Collision Visualization

### New Features
- **Collision Circle Visualization**: Press O key to see collision areas
  - Green circle: Player collision area
  - Red circles: Enemy collision areas
  - Yellow circles: Projectile collision areas
  - Helps adjust enemy sprite sizes to match collision
  - Essential for tuning gameplay balance

### Why This Matters
- Makes it easy to see why enemies are hard/easy to hit
- Allows fine-tuning of `size` field in enemies.json
- Visual feedback for sprite scaling adjustments
- Debug overlay now shows both stats AND collision visualization

### Files Changed
- `game.js`: Added debugGraphics, updateDebug() function
- `README.md`: Updated O key description
- `SPRITE_GUIDE.md`: Added collision tuning instructions

## Version 0.6.1 - Enemy Sprite Support

### New Features
- **Enemy Sprite Support**: Enemies can now use custom image sprites
  - Add `"sprite"` field to enemies.json with image path
  - Falls back to generated circles if no sprite provided
  - Currently implemented for `basic_red` enemy using `assets/enemy-red.png`
  - Easy to expand for other enemies in the future

### Technical Changes
- Added sprite loading in preload: `enemy_sprite_{enemy_id}` format
- Updated createGraphics to skip texture generation when sprite is defined
- Modified enemy spawning to use sprite texture key when available
- Maintains backward compatibility with generated graphics

### Files Changed
- `game.js`: Added sprite preload and conditional texture generation
- `enemies.json`: Added sprite field to basic_red enemy
- `README.md`: Updated modding section with sprite documentation
- `SPRITE_GUIDE.md`: New comprehensive guide for adding enemy sprites

## Version 0.6 - Multi-Item Loadout System

### Major Changes
- **Multi-Item System**: Players can now equip multiple weapons simultaneously
  - Each item fires independently on its own timer
  - No more switching between weapons - all fire at once!
  - Items shown in HUD with color-coded icons and level display

- **Item Leveling System**: Each item can be leveled up to level 5
  - Base stats improve with each level
  - Fire rate gets faster as you level
  - Twin Shot gains extra projectiles at levels 3 and 5
  - Level-up UI shows cyan highlights for item upgrades

### Technical Implementation
- Replaced `projectiles.json` with `items.json`
- Changed from single active projectile to `playerItems` array
- Each item tracks: `{itemType, level, lastFireTime}`
- Independent firing logic with `handleItemShooting()` and `shootItem()`
- Dynamic stat calculation with `getItemStats()` including level bonuses
- Visual item display container showing all active items

### Item Stats at Max Level (Level 5)
- **Basic Ball**: 40 damage, 180ms fire rate, 480 speed
- **Cannon Ball**: 140 damage, 480ms fire rate, 290 speed  
- **Twin Shot**: 28 damage per shot, 240ms fire rate, 600 speed, 4 projectiles

### Files Changed
- `game.js`: Complete refactor of projectile/item system (~1174 lines)
- `items.json`: New file with leveling progression
- `README.md`: Updated documentation for multi-item system

## Version 0.5 - Projectile Types System

### Features Added
- Multiple projectile types with unique stats
- Projectile unlocking system via level-ups
- JSON-based projectile configuration
- Three projectile types: Basic Ball, Cannon Ball, Twin Shot
- Visual customization per projectile type

### Files Added
- `projectiles.json` (now replaced by items.json)

## Version 0.4 - Enemy Variety System

### Features Added
- Multiple enemy types with unique behaviors
- JSON-based enemy configuration system
- Three enemy types: Basic Walker, Dodger, Wanderer
- Movement patterns: direct chase, sinusoidal, random wander
- Spawn weight system for enemy rarity

### Files Added
- `enemies.json`

## Version 0.3 - Visual Polish

### Features Added
- Color-coded health bar (green → orange → red)
- Animated XP bar with wobble effect
- Pause system (P key)
- Debug stats overlay (O key)
- Enhanced HUD with visual feedback

## Version 0.2 - Progression System

### Features Added
- Auto-fire toggle (F key)
- XP and leveling system
- Powerup upgrade choices on level-up
- Stat upgrades: fire rate, speed, max HP

## Version 0.1 - Initial Prototype

### Core Features
- Player movement (WASD) and rotation (mouse)
- Click to shoot bouncing balls
- Enemy spawning and AI
- Collision detection
- Basic HUD
- Game over system

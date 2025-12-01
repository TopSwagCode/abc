# Ballgame Project - File Overview

## Core Game Files

### `index.html` (Entry Point)
- Simple HTML structure
- Loads Phaser 3.70.0 from CDN
- Contains game canvas container
- Includes game.js script

### `game.js` (Main Game Logic - ~1174 lines)
**Purpose:** Contains all game mechanics, physics, and logic

**Key Components:**
- Phaser game configuration and scenes
- Player controls and movement
- Multi-item shooting system with independent timers
- Enemy AI with multiple behavior types
- Collision detection and damage system
- XP and leveling mechanics
- Level-up UI with upgrade choices
- Visual HUD (health bar, XP bar, item icons)
- Debug overlay system
- Game over and restart logic

**Main Functions:**
- `handleItemShooting(time)` - Fires all equipped items independently
- `shootItem(playerItem, time)` - Creates projectiles for a specific item
- `getItemStats(playerItem)` - Calculates item stats with level bonuses
- `getItemBehavior(playerItem)` - Gets item behavior with level-specific changes
- `showLevelUpScreen()` - Displays upgrade choices
- `updateItemsDisplay()` - Updates visual item icons in HUD

## Configuration Files (JSON)

### `items.json` (Item System Configuration)
**Purpose:** Defines all weapon/projectile types with leveling progression

**Contains:** 3 items (Basic Ball, Cannon Ball, Twin Shot)

**Each Item Has:**
- Unique ID and display name
- Unlock level requirement
- Visual properties (color, size, glow, trail)
- Base stats (damage, speed, bounces, knockback, fire rate)
- Level-up bonuses (applied each level 1-5)
- Behavior (projectiles per shot, spread angle)
- Special level-up behavior (e.g., Twin Shot gains projectiles)

### `enemies.json` (Enemy System Configuration)
**Purpose:** Defines all enemy types with AI behaviors

**Contains:** 3 enemy types (Basic Walker, Dodger, Wanderer)

**Each Enemy Has:**
- Unique ID and display name
- Stats (HP, damage, speed, size)
- Visual properties (color, size)
- Spawn weight (rarity)
- Movement behavior (direct_chase, sinusoidal_chase, random_wander)
- Behavior-specific parameters (amplitude, frequency, wander interval)

### `projectiles.json` (Deprecated)
**Status:** No longer used, replaced by items.json
**Keep:** For reference only

## Documentation Files

### `README.md` (Main Documentation)
**Purpose:** Complete game documentation for players and developers

**Sections:**
- Features list
- How to play (controls, objective)
- Game mechanics (player, items, enemies, leveling)
- Detailed item stats and leveling progression
- Technical details
- Modding guide for items and enemies
- Future enhancements

### `CHANGELOG.md` (Version History)
**Purpose:** Track all major changes and versions

**Current Version:** 0.6 - Multi-Item Loadout System

**Documents:**
- Version 0.6: Multi-item system, item leveling
- Version 0.5: Projectile types (deprecated approach)
- Version 0.4: Enemy variety system
- Version 0.3: Visual polish
- Version 0.2: Progression system
- Version 0.1: Initial prototype

### `ITEM_GUIDE.md` (Player Strategy Guide)
**Purpose:** Help players understand the item system

**Covers:**
- How the loadout system works
- Unlocking and leveling items
- Item icon display explanation
- Strategy tips (early/mid/late game)
- Item role comparison
- Independent timer mechanics
- Complete level-up progression tables
- Using debug mode effectively

### `TESTING.md` (QA Checklist)
**Purpose:** Testing guide for verifying all features work

**Includes:**
- Basic functionality checks
- Item unlocking tests
- Item leveling verification
- Independent timer validation
- Visual display tests
- Stat scaling verification
- Edge case testing
- Performance checks
- Success criteria

## Design Documents

### `game_plan_v1.md` (Original Design Doc)
**Purpose:** Initial game concept and planned features
**Status:** Reference for original vision and future enhancements

### `ideas.md` (Feature Brainstorming)
**Purpose:** Additional ideas and potential features
**Status:** Not yet implemented ideas

## File Structure Summary

```
/ballgame/
├── index.html              # Entry point (HTML)
├── game.js                 # Main game logic (JavaScript, ~1174 lines)
│
├── items.json              # Item definitions with leveling
├── enemies.json            # Enemy type definitions
├── projectiles.json        # (Deprecated, kept for reference)
│
├── README.md               # Main documentation
├── CHANGELOG.md            # Version history
├── ITEM_GUIDE.md          # Player strategy guide
├── TESTING.md             # QA testing checklist
│
├── game_plan_v1.md        # Original design document
└── ideas.md               # Future feature ideas
```

## Key Dependencies

- **Phaser 3.70.0**: Loaded from CDN (https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.js)
- **No Build Process**: Pure JavaScript, runs directly in browser
- **No External Assets**: All graphics generated programmatically

## Running the Game

**Method 1: Direct File**
```bash
open index.html  # macOS
```

**Method 2: Local Server (Recommended)**
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## Modding the Game

### To Add a New Item:
1. Edit `items.json`
2. Add new item object with all required fields
3. Set appropriate unlockLevel
4. Define baseStats and levelUpBonus
5. Refresh browser - item appears at specified level

### To Add a New Enemy:
1. Edit `enemies.json`
2. Add new enemy object with required fields
3. Choose movement behavior type
4. Set spawn weight for rarity
5. Refresh browser - enemy spawns randomly

### To Modify Game Constants:
1. Edit `game.js`
2. Look for comments like "// Game settings"
3. Adjust values (spawn rates, difficulty scaling, etc.)
4. Save and refresh

## Code Statistics

- **Total Lines:** ~1400 (game.js + JSON files)
- **Functions:** ~30 major functions
- **JSON Objects:** 6 (3 items + 3 enemies)
- **Features:** 20+ implemented features
- **Versions:** 0.1 → 0.6 (6 major iterations)

## Next Steps

See `README.md` "Future Enhancements" section for planned features:
- More item types with unique mechanics
- Boss enemies
- Procedural arenas
- Particle effects
- Mobile controls
- Power-up pickups

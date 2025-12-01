# Breakout x Vampire Survivors - Prototype

A simple 2D browser game mixing mechanics from Breakout and Vampire Survivors, built with Phaser.js.

## Features Implemented ✅

- **Player Controls**: WASD movement, mouse rotation, click to shoot
- **Auto-Fire Mode**: Press F to toggle automatic shooting
- **Pause System**: Press P to pause/resume the game
- **Debug Stats**: Press O to toggle debug overlay with detailed stats
- **Visual Health Bar**: Color-coded health bar (green → orange → red)
- **Animated XP Bar**: Smooth filling XP bar with glowing wobble effect
- **Multi-Item Loadout**: Equip multiple weapons that fire simultaneously with independent timers
- **Item Leveling**: Each item has 5 levels with progressive stat improvements
- **Visual Item Display**: HUD shows all active items with their current level
- **Enemy AI**: Enemies spawn at edges and chase the player
- **Collision System**: Ball-enemy and enemy-player collisions with damage and knockback
- **XP & Leveling System**: Gain XP from kills, level up to choose upgrades
- **Powerup Upgrades**: Choose between unlocking new items, leveling items, or stat upgrades
- **Progressive Difficulty**: Enemy spawn rate and speed increase over time
- **Enhanced HUD**: Visual bars, level display, enemy count, survival time, active items
- **Multiple Enemy Types**: 3 unique enemy types with different behaviors and stats
- **Enemy Configuration**: Enemy types defined in JSON for easy modding
- **Item Configuration**: Item types defined in JSON with leveling progression
- **Game Over**: Death state with restart option

## How to Play

### Running the Game

1. Open `index.html` in a web browser (Chrome, Firefox, Safari, Edge)
2. The game will load automatically

Alternatively, you can run a local server:
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx http-server
```
Then navigate to `http://localhost:8000`

### Controls

- **WASD**: Move player
- **Mouse**: Aim direction
- **Left Click**: Shoot ball
- **F Key**: Toggle auto-fire mode (shoots automatically)
- **P Key**: Pause/resume game
- **O Key**: Toggle debug stats overlay + collision visualization
  - Shows detailed stats for all items
  - **Visualizes collision circles** (green=player, red=enemies, yellow=projectiles)
  - Helpful for adjusting enemy sprite sizes
- **After Game Over**: Click to restart
- **During Level Up**: Click an upgrade to choose it

### Objective

Survive as long as possible by:
- Shooting bouncing balls at enemies
- Avoiding enemy contact
- Managing your limited bounces per ball
- Unlocking new item types with unique abilities
- Leveling up both your character and your items
- Building a powerful multi-item loadout
- Using auto-fire mode for continuous combat

## Game Mechanics

### Player
- HP: 100
- Movement speed: 200 (upgradeable)
- Can equip multiple items simultaneously
- Each item fires independently on its own timer

### Multi-Item Loadout System

**How It Works:**
- Start with the Basic Ball at level 1
- Unlock new items when leveling up (shown in **yellow**)
- Level up existing items to improve their stats (shown in **cyan**)
- All equipped items fire automatically on independent timers
- Each item has its own fire rate, damage, and properties
- Items can reach a maximum of level 5

**Item Display:**
- Active items are shown in the top-left corner
- Each icon shows the item's color and current level
- Icons update automatically when items are unlocked or leveled up

### Item Types & Leveling

#### Basic Ball (Starting Item)
**Level 1 Stats:**
- Damage: 20
- Fire Rate: 300ms
- Speed: 400
- Max Bounces: 5
- Knockback: 100

**Per Level Bonus:**
- Damage: +5
- Fire Rate: -30ms (shoots faster!)
- Speed: +20
- Max Bounces: No change
- Knockback: +10

**Level 5 Stats:**
- Damage: 40
- Fire Rate: 180ms
- Speed: 480
- Max Bounces: 5
- Knockback: 140

#### Cannon Ball (Unlockable at Level 2)
**Level 1 Stats:**
- Damage: 60 ⚡
- Fire Rate: 800ms
- Speed: 250
- Max Bounces: 3
- Knockback: 200
- Leaves an orange trail

**Per Level Bonus:**
- Damage: +20
- Fire Rate: -80ms (shoots faster!)
- Speed: +10
- Max Bounces: No change
- Knockback: +20

**Level 5 Stats:**
- Damage: 140
- Fire Rate: 480ms
- Speed: 290
- Max Bounces: 3
- Knockback: 280

**Behavior:** Large, slow, devastating damage with strong knockback. Great for crowd control.

#### Twin Shot (Unlockable at Level 3)
**Level 1 Stats:**
- Damage: 12 per shot
- Fire Rate: 400ms
- Speed: 500
- Max Bounces: 4
- Knockback: 60
- Projectiles per Shot: 2
- Cyan colored with trail effect

**Per Level Bonus:**
- Damage: +4
- Fire Rate: -40ms (shoots faster!)
- Speed: +25
- Max Bounces: No change
- Knockback: +5

**Special Level-Up Behavior:**
- Level 3: Projectiles per shot increases to 3
- Level 5: Projectiles per shot increases to 4

**Level 5 Stats:**
- Damage: 28 per shot
- Fire Rate: 240ms
- Speed: 600
- Max Bounces: 4
- Knockback: 80
- Projectiles per Shot: 4 (spreading pattern)

**Behavior:** Small, fast, multi-shot projectiles. Excellent for sustained DPS and hitting multiple enemies.

### All Projectiles
- Bounce off enemies
- Deal damage on each hit
- Apply knockback to enemies
- Despawn after reaching max bounces or leaving arena

### Enemies

The game features multiple enemy types, each with unique behaviors:

#### Basic Walker (Red)
- HP: 60
- Speed: 50
- Damage: 10
- Movement: Moves directly toward the player
- Spawn Weight: Common

#### Dodger (Green)
- HP: 40
- Speed: 70
- Damage: 15
- Movement: Moves toward player in a sinusoidal (wave) pattern, making it harder to hit
- Spawn Weight: Uncommon

#### Wanderer (Blue)
- HP: 80
- Speed: 40
- Damage: 8
- Movement: Wanders randomly around the map, changes direction every 2 seconds
- Spawn Weight: Rare

All enemies:
- Spawn at random edges of the arena
- Spawn rate increases over time (starts at 2 seconds, min 0.5 seconds)
- Speed increases over time
- Award 20 XP when killed

### Leveling System
- XP required for level 1→2: 100
- XP requirement increases by 50% per level
- Game pauses on level up to choose upgrade
- **Available Upgrades:**
  - **🔫 New Items**: Unlock Cannon Ball or Twin Shot (highlighted in **yellow**)
  - **⬆️ Level Up Items**: Improve existing items to level 2-5 (highlighted in **cyan**)
  - **⚡ Faster Fire Rate**: Reduces all item fire rates by 20%
  - **🏃 Move Speed**: Increases player movement by 20%
  - **❤️ Max HP +20**: Increases maximum health and heals
- Player starts with Basic Ball at level 1
- Items unlock at specific player levels (Basic Ball: 1, Cannon Ball: 2, Twin Shot: 3)
- Item levels are independent from player level

### Difficulty Scaling
Every 10 seconds:
- Enemy spawn rate decreases by 100ms (min: 500ms)
- Enemy speed increases by 2 (max: 100)

## Technical Details

- **Engine**: Phaser 3.70.0
- **Physics**: Arcade Physics (no gravity)
- **Resolution**: 800x600
- **Assets**: Programmatically generated geometric shapes
- **Enemy System**: JSON-based configuration (`enemies.json`)
- **Item System**: JSON-based configuration (`items.json`) with leveling progression
- **Movement AI**: Multiple behavior patterns (direct chase, sinusoidal, random wander)
- **Firing System**: Independent timers per item, all items fire simultaneously

## Modding

### Enemy Types
You can easily add or modify enemy types by editing `enemies.json`. Each enemy type supports:
- Custom HP, damage, speed, size, and color
- Spawn weight (affects how often they appear)
- Movement patterns: `direct_chase`, `sinusoidal_chase`, `random_wander`
- Behavior-specific parameters (amplitude, frequency, intervals, etc.)
- **Sprite support**: Add a `"sprite"` field with path to image file (e.g., `"sprite": "assets/enemy-red.png"`)
  - Sprites are **automatically scaled** to match the `size` field
  - Works with any image size (1024x1024, 64x64, etc.)
  - If sprite is provided, it will be used instead of generated graphics
  - If no sprite, a colored circle will be generated based on `color` field
  - See `SPRITE_GUIDE.md` for detailed instructions

### Item Types
You can create custom item/weapon types by editing `items.json`. Each item supports:

**Required Fields:**
- `id`: Unique identifier
- `name`: Display name
- `description`: Short description shown in upgrades
- `unlockLevel`: Player level required to unlock
- `maxLevel`: Maximum item level (typically 5)
- `color`: Hex color string (e.g., "0xff4444")

**Base Stats:**
- `damage`: Base damage per hit
- `speed`: Projectile velocity
- `maxBounces`: How many times projectile can bounce
- `size`: Projectile radius
- `knockback`: Force applied to enemies
- `fireRate`: Milliseconds between shots

**Level-Up Bonuses (applied each level):**
- All same stat keys as baseStats
- Negative values decrease stats (e.g., negative fireRate = shoots faster)
- Values are added per level (level 3 item = base + 3× bonus)

**Optional Features:**
- `projectilesPerShot`: Number of projectiles fired at once (default: 1)
- `spreadAngle`: Angle in degrees between projectiles (for multi-shot)
- `levelUpBehavior`: Special changes at specific levels (see Twin Shot example)

**Example Item with Leveling:**
```json
{
  "id": "my_weapon",
  "name": "My Weapon",
  "description": "Custom weapon",
  "unlockLevel": 2,
  "maxLevel": 5,
  "color": "0x00ff00",
  "baseStats": {
    "damage": 30,
    "speed": 350,
    "maxBounces": 4,
    "size": 8,
    "knockback": 120,
    "fireRate": 500
  },
  "levelUpBonus": {
    "damage": 10,
    "speed": 20,
    "maxBounces": 0,
    "size": 1,
    "knockback": 15,
    "fireRate": -50
  }
}
```

This weapon would have:
- Level 1: 30 damage, 500ms fire rate
- Level 2: 40 damage, 450ms fire rate
- Level 5: 70 damage, 300ms fire rate

## Future Enhancements (V2)

See `game_plan_v1.md` for planned features including:
- More projectile types with unique mechanics
- Boss enemies
- Procedural arenas
- Particle effects
- Mobile controls
- Power-up items

## License

MIT

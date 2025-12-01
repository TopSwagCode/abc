# Multi-Item System Guide

## Overview
The game now features a **loadout system** where you can equip multiple weapons and have them all firing simultaneously! Each weapon fires on its own independent timer based on its stats.

## How It Works

### Starting the Game
- You begin with the **Basic Ball** at level 1
- It's shown in the top-left corner of the screen
- The icon displays the item's color and level

### Unlocking New Items
When you level up, you'll see upgrade choices:
- **Yellow highlight** = New item unlock
- **Cyan highlight** = Level up existing item
- **White highlight** = Stat upgrade (affects all items)

### Building Your Loadout
1. **Level 2**: Unlock Cannon Ball
   - Now you'll shoot both Basic Ball AND Cannon Ball
   - Each fires on its own timer
   
2. **Level 3**: Unlock Twin Shot
   - Now all three fire simultaneously!
   - Basic Ball: Fast, balanced damage
   - Cannon Ball: Slow, devastating hits
   - Twin Shot: Multiple projectiles, rapid fire

3. **Level 4+**: Choose to level up your items
   - Each item can reach level 5
   - Higher levels = more damage, faster fire rate
   - Twin Shot gains extra projectiles at levels 3 and 5

## Item Icons Display
```
Top-Left Corner:
┌────┬────┬────┐
│ ●  │ ●  │ ●  │  ← Colored circles (item colors)
│Lv1 │Lv3 │Lv2 │  ← Level indicators
└────┴────┴────┘
Red   Orange Cyan
```

## Strategy Tips

### Early Game (Levels 1-3)
- Focus on unlocking all three item types
- Build a diverse loadout
- Basic Ball + Cannon Ball = good balance

### Mid Game (Levels 4-8)
- Start leveling up your items
- Prioritize items you use most
- Twin Shot at level 3+ gets very powerful (3-4 projectiles!)

### Late Game (Level 9+)
- Max out your favorite items to level 5
- Mix stat upgrades with item upgrades
- All three items at high levels = massive DPS

## Item Comparison

### Basic Ball
- **Role**: Balanced all-rounder
- **Best For**: Consistent damage
- **Scaling**: Good damage increase per level
- **Max Level Power**: 40 damage, 180ms fire rate

### Cannon Ball  
- **Role**: Heavy hitter
- **Best For**: Tough enemies, knockback
- **Scaling**: Massive damage increase per level (+20 per level!)
- **Max Level Power**: 140 damage, 480ms fire rate

### Twin Shot
- **Role**: Rapid multi-hit
- **Best For**: Crowd control, fast enemies
- **Scaling**: Gains extra projectiles at levels 3 and 5
- **Max Level Power**: 28 damage × 4 shots = 112 total damage per volley!

## Independent Timers

Each item fires based on its own fire rate:
- **Basic Ball Level 1**: Fires every 300ms
- **Cannon Ball Level 1**: Fires every 800ms  
- **Twin Shot Level 1**: Fires every 400ms

Example timeline:
```
Time  0ms: All three fire
Time 300ms: Basic Ball fires
Time 400ms: Twin Shot fires
Time 600ms: Basic Ball fires
Time 800ms: All three fire again!
```

## Level-Up Progression Example

**Basic Ball Progression:**
- Level 1: 20 damage, 300ms
- Level 2: 25 damage, 270ms
- Level 3: 30 damage, 240ms
- Level 4: 35 damage, 210ms
- Level 5: 40 damage, 180ms

**Cannon Ball Progression:**
- Level 1: 60 damage, 800ms
- Level 2: 80 damage, 720ms
- Level 3: 100 damage, 640ms
- Level 4: 120 damage, 560ms
- Level 5: 140 damage, 480ms

**Twin Shot Progression:**
- Level 1: 12 damage × 2, 400ms
- Level 2: 16 damage × 2, 360ms
- Level 3: 20 damage × 3, 320ms ← Extra projectile!
- Level 4: 24 damage × 3, 280ms
- Level 5: 28 damage × 4, 240ms ← Another extra projectile!

## Debug Info

Press **O** to see detailed stats for all your items:
- Current level of each item
- Actual damage, speed, and fire rate values
- How many projectiles each shoots
- All stats after level bonuses applied

This helps you make informed decisions about which items to level up!

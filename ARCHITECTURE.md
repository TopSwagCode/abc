# Multi-Item System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      GAME INITIALIZATION                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Load items.json      │
                  │  Load enemies.json    │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ playerItems = [       │
                  │   {                   │
                  │     itemType: basic,  │
                  │     level: 1,         │
                  │     lastFireTime: 0   │
                  │   }                   │
                  │ ]                     │
                  └───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        GAME LOOP                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Player clicks or     │
                  │  Auto-fire active?    │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ handleItemShooting()  │
                  └───────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  For each item in playerItems:      │
        └─────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Basic Ball   │    │ Cannon Ball  │    │ Twin Shot    │
│ Last: 100ms  │    │ Last: 50ms   │    │ Last: 200ms  │
│ Rate: 300ms  │    │ Rate: 800ms  │    │ Rate: 400ms  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
  Current: 450ms        Current: 450ms        Current: 450ms
        │                     │                     │
        ▼                     ▼                     ▼
  450-100=350 ✅           450-50=400  ❌        450-200=250 ❌
  350>=300                400>=800              250>=400
        │                                              
        ▼                                              
  ┌──────────────────┐                                
  │ shootItem()      │                                
  │ - Get stats      │                                
  │ - Get behavior   │                                
  │ - Create balls   │                                
  └──────────────────┘                                
        │                                              
        ▼                                              
  lastFireTime = 450                                  


Next frame (500ms):
  Basic: 500-450=50 < 300 ❌
  Cannon: 500-50=450 < 800 ❌
  Twin: 500-200=300 < 400 ❌

Next frame (650ms):
  Basic: 650-450=200 < 300 ❌
  Cannon: 650-50=600 < 800 ❌
  Twin: 650-200=450 >= 400 ✅ FIRE!

Next frame (750ms):
  Basic: 750-450=300 >= 300 ✅ FIRE!
  Cannon: 750-50=700 < 800 ❌
  Twin: 750-650=100 < 400 ❌
```

## Item Stats Calculation Flow

```
playerItem = {
  itemType: twinShot,
  level: 3,
  lastFireTime: 0
}
        │
        ▼
getItemStats(playerItem)
        │
        ├─ baseStats = itemType.baseStats
        │  {damage: 12, fireRate: 400, ...}
        │
        ├─ levelUpBonus = itemType.levelUpBonus
        │  {damage: 4, fireRate: -40, ...}
        │
        ├─ level = playerItem.level (3)
        │
        └─ Calculate: base + (bonus × (level - 1))
           │
           ├─ damage: 12 + (4 × 2) = 20
           ├─ fireRate: 400 + (-40 × 2) = 320
           └─ speed: 500 + (25 × 2) = 550
                    │
                    ▼
           Return {
             damage: 20,
             fireRate: 320,
             speed: 550,
             ...
           }
```

## Level-Up Behavior Flow

```
playerItem.level = 3
        │
        ▼
getItemBehavior(playerItem)
        │
        ├─ baseBehavior = itemType.behavior
        │  {projectilesPerShot: 2, spreadAngle: 15}
        │
        ├─ levelUpBehavior = itemType.levelUpBehavior
        │  {
        │    level3: {projectilesPerShot: 3, spreadAngle: 20},
        │    level5: {projectilesPerShot: 4, spreadAngle: 25}
        │  }
        │
        └─ Check if levelUpBehavior["level3"] exists
                    │
                    ▼ YES
           Merge baseBehavior with level3 overrides
                    │
                    ▼
           Return {
             projectilesPerShot: 3,  ← Overridden!
             spreadAngle: 20,        ← Overridden!
             piercing: false,
             homing: false
           }
```

## Upgrade System Flow

```
Player levels up (gains enough XP)
        │
        ▼
showLevelUpScreen()
        │
        ├─ Build upgrade options array
        │  │
        │  ├─ For each itemType:
        │  │   │
        │  │   ├─ hasItem = find in playerItems
        │  │   │
        │  │   ├─ IF NOT hasItem AND unlockLevel <= playerLevel
        │  │   │   └─ Add NEW_ITEM option (yellow)
        │  │   │
        │  │   └─ IF hasItem AND level < maxLevel
        │  │       └─ Add LEVEL_UP_ITEM option (cyan)
        │  │
        │  └─ Add STAT upgrades (white)
        │
        ├─ Randomly select 3 options
        │
        └─ Display with appropriate highlights
                    │
                    ▼
          Player clicks an option
                    │
                    ├─ NEW_ITEM: playerItems.push({...})
                    │   └─ updateItemsDisplay()
                    │
                    ├─ LEVEL_UP_ITEM: hasItem.level++
                    │   └─ updateItemsDisplay()
                    │
                    └─ STAT: improve player stats
                        └─ (no item display update needed)
```

## Visual Display Update Flow

```
updateItemsDisplay() called
        │
        ├─ Destroy all existing icons
        │  itemIcons.forEach(icon => icon.destroy())
        │
        └─ For each item in playerItems:
           │
           ├─ Create background rectangle (dark gray)
           ├─ Create colored circle (item color)
           ├─ Create level text ("Lv3")
           │
           ├─ Position: index × 60 pixels apart
           │
           ├─ Add to itemsContainer
           │
           └─ Track in itemIcons array
                    │
                    ▼
           Visual result:
           ┌────┬────┬────┐
           │ ●  │ ●  │ ●  │
           │Lv1 │Lv3 │Lv2 │
           └────┴────┴────┘
```

## Complete Data Flow Example

```
SCENARIO: Player at level 4 with two items

State:
  playerItems = [
    {itemType: basicBall, level: 2, lastFireTime: 0},
    {itemType: cannonBall, level: 1, lastFireTime: 0}
  ]

Action: Player gains enough XP to level up
  │
  ▼
gainXP(20)
  │
  ├─ xp += 20
  ├─ xp (120) >= xpToNextLevel (100)?
  │  └─ YES
  │
  ├─ xp -= xpToNextLevel (xp now 20)
  ├─ level++ (now level 5)
  ├─ xpToNextLevel = 100 × 1.5 = 150
  │
  └─ showLevelUpScreen()
      │
      ├─ Build options:
      │  │
      │  ├─ Basic Ball Lv3 (cyan) - has item, can level
      │  ├─ Cannon Ball Lv2 (cyan) - has item, can level
      │  ├─ Twin Shot (yellow) - NEW ITEM, unlockLevel 2 <= 5
      │  ├─ Faster Fire Rate (white) - stat upgrade
      │  └─ Move Speed (white) - stat upgrade
      │
      ├─ Randomly select 3
      │  └─ [Twin Shot, Basic Ball Lv3, Move Speed]
      │
      └─ Display to player
          │
          Player clicks "Twin Shot"
          │
          ├─ playerItems.push({
          │    itemType: twinShot,
          │    level: 1,
          │    lastFireTime: currentTime
          │  })
          │
          ├─ updateItemsDisplay()
          │  └─ Now shows 3 icons: [●Lv2] [●Lv1] [●Lv1]
          │
          └─ hideLevelUpScreen()
              │
              Game resumes with 3 active items!
```

## Independent Timer Example Timeline

```
Time    Action
────────────────────────────────────────────────────────
0ms     All items ready (lastFireTime = 0)
        Basic fires (300ms cooldown)
        Cannon fires (800ms cooldown)
        Twin fires (400ms cooldown)

300ms   Basic fires (300ms since last)
        lastFireTime[basic] = 300

400ms   Twin fires (400ms since last)
        lastFireTime[twin] = 400

600ms   Basic fires (300ms since 300ms)
        lastFireTime[basic] = 600

800ms   Cannon fires (800ms since 0ms)
        Twin fires (400ms since 400ms)
        lastFireTime[cannon] = 800
        lastFireTime[twin] = 800

900ms   Basic fires (300ms since 600ms)
        lastFireTime[basic] = 900

1200ms  Basic fires (300ms since 900ms)
        Twin fires (400ms since 800ms)
        lastFireTime[basic] = 1200
        lastFireTime[twin] = 1200

1500ms  Basic fires
        lastFireTime[basic] = 1500

1600ms  Cannon fires (800ms since 800ms)
        Twin fires (400ms since 1200ms)
        lastFireTime[cannon] = 1600
        lastFireTime[twin] = 1600

RESULT: Continuous stream of projectiles with different timings!
```

## Key Architectural Decisions

### 1. Independent Timers (Not Global Cooldown)
**Why:** Allows items to fire asynchronously
**How:** Each item tracks its own `lastFireTime`
**Benefit:** More dynamic combat, feels like multiple weapons

### 2. Dynamic Stat Calculation (Not Pre-calculated)
**Why:** Stats can change (upgrades, power-ups)
**How:** Calculate on demand: `base + (bonus × (level - 1))`
**Benefit:** Easy to add global multipliers later

### 3. Behavior Overrides (Not Hardcoded)
**Why:** Flexible level-based changes
**How:** JSON `levelUpBehavior` merged at runtime
**Benefit:** Easy to add special abilities without code changes

### 4. Visual Display Update (Not Continuous)
**Why:** Performance (avoid recreating every frame)
**How:** Only update when items change (unlock/level-up)
**Benefit:** Clean, efficient rendering

### 5. Array of Items (Not Map/Dictionary)
**Why:** Simple iteration for firing loop
**How:** `forEach` through array each frame
**Benefit:** Order preserved, easy to debug

---

This architecture allows for:
- ✅ Easy addition of new items (just edit JSON)
- ✅ Complex level-based behaviors
- ✅ Efficient independent firing
- ✅ Clear visual feedback
- ✅ Extensible upgrade system

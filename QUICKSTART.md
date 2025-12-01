# Quick Start Guide

## Running the Game

### Option 1: Direct Open (Simple)
Just double-click `index.html` in your file browser, or:
```bash
open index.html
```

### Option 2: Local Server (Recommended)
```bash
cd /Users/topswagcode/git/ballgame
python3 -m http.server 8000
```
Then open: http://localhost:8000

## First Time Playing

1. **Move** with WASD keys
2. **Aim** with your mouse
3. **Click** to shoot (or press **F** for auto-fire)
4. **Kill enemies** to gain XP
5. **Level up** and choose upgrades
6. **Unlock** Cannon Ball at level 2
7. **Unlock** Twin Shot at level 3
8. **Build** your multi-item loadout!

## Controls Reference

| Key | Action |
|-----|--------|
| W/A/S/D | Move player |
| Mouse | Aim direction |
| Left Click | Shoot (manual) |
| F | Toggle auto-fire |
| P | Pause/resume |
| O | Debug stats overlay |

## Understanding the HUD

```
┌─────────────────────────────────────────┐
│ [●Lv1] [●Lv2] [●Lv3]  ← Active items    │
│                                          │
│ HP: [████████░░] ← Health bar           │
│ XP: [██████░░░░] ← Experience bar       │
│ Level: 5  Score: 1234                    │
│ Enemies: 8  Time: 1:23                   │
│                       Auto-Fire: ON →    │
└─────────────────────────────────────────┘
```

## Tips for Success

### Early Game (Levels 1-3)
- Focus on **unlocking all three item types**
- Basic Ball is reliable, but you want variety
- Use auto-fire (F key) to maximize DPS
- Keep moving to avoid enemies

### Mid Game (Levels 4-8)
- Start **leveling up your favorite items**
- Twin Shot at level 3 gets a third projectile!
- Balance between item levels and stat upgrades
- Watch enemy spawn rate increase

### Late Game (Level 9+)
- Push items to **level 5** for max power
- All three items at high levels = insane DPS
- Don't neglect movement speed upgrades
- Survive as long as possible!

## Item Progression Goals

**Priority 1:** Unlock all three items
- Level 2: Get Cannon Ball
- Level 3: Get Twin Shot

**Priority 2:** Level up Twin Shot
- Level 3: Third projectile
- Level 5: Fourth projectile

**Priority 3:** Level up favorites
- Cannon Ball for big damage
- Basic Ball for consistency
- Twin Shot for DPS

## Debugging Tips

Press **O** to see:
- Current level and stats
- All item levels and their stats
- Enemy count and spawn rate
- Frame rate and performance
- Exact damage/fire rate values

## Common Issues

**Game won't load?**
- Check browser console (F12) for errors
- Make sure items.json and enemies.json are valid
- Use a local server instead of opening file directly

**Items not firing?**
- Check if auto-fire is on (F key)
- Try clicking to shoot manually
- Press O to verify items are equipped

**Performance issues?**
- Close other browser tabs
- Check debug overlay (O) for FPS
- Reduce number of active projectiles

## Next Steps

1. **Play** the game and test the multi-item system
2. **Read** ITEM_GUIDE.md for strategy tips
3. **Check** README.md for detailed mechanics
4. **Modify** items.json to create custom weapons
5. **Share** feedback on balance and bugs!

## Documentation Files

- **README.md** - Complete game documentation
- **ITEM_GUIDE.md** - Strategy and item details
- **TESTING.md** - QA checklist
- **CHANGELOG.md** - Version history
- **IMPLEMENTATION_SUMMARY.md** - Technical changes
- **PROJECT_OVERVIEW.md** - File structure guide

## Need Help?

1. Check the README for mechanics
2. Use debug mode (O key) to inspect stats
3. Review ITEM_GUIDE.md for strategy
4. Check browser console for errors (F12)

---

**Have fun building your ultimate loadout!** 🎮

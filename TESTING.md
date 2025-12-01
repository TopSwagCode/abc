# Testing Checklist for Multi-Item System

## Basic Functionality
- [ ] Game loads without errors
- [ ] Player starts with Basic Ball (level 1)
- [ ] Basic Ball icon appears in top-left with "Lv1" text
- [ ] Basic Ball fires when clicking or auto-fire is on

## Item Unlocking
- [ ] Reach level 2 and see Cannon Ball in upgrade options (yellow highlight)
- [ ] Unlock Cannon Ball - icon appears next to Basic Ball icon
- [ ] Both items now fire independently
- [ ] Cannon Ball fires slower than Basic Ball (800ms vs 300ms)

## Item Leveling
- [ ] Level up and see item level-up options (cyan highlight)
- [ ] Level up Basic Ball to level 2
- [ ] Icon updates to show "Lv2"
- [ ] Damage increases (check with debug overlay - press O)
- [ ] Fire rate decreases (shoots faster)

## Independent Timers
- [ ] With multiple items equipped, verify they fire at different times
- [ ] Basic Ball should fire more frequently
- [ ] Cannon Ball should fire less frequently but hit harder
- [ ] Twin Shot should fire between the two

## Twin Shot Special Behavior
- [ ] Unlock Twin Shot at level 2+
- [ ] Initially shoots 2 projectiles in a spread pattern
- [ ] Level up to level 3 - should shoot 3 projectiles
- [ ] Level up to level 5 - should shoot 4 projectiles
- [ ] Verify spread angle increases with more projectiles

## Visual Display
- [ ] All equipped items show in top-left corner
- [ ] Each icon shows correct color (white, orange, cyan)
- [ ] Level text updates correctly when items level up
- [ ] Icons aligned horizontally with proper spacing
- [ ] Icons stay visible during gameplay

## Stat Scaling
- [ ] Press O to open debug overlay
- [ ] Verify each item shows:
  - Current level
  - Damage (should increase with level)
  - Fire rate (should decrease with level)
  - Speed (should increase with level for some items)
  - Projectiles per shot
- [ ] Verify stats match expected values from ITEM_GUIDE.md

## Edge Cases
- [ ] Level up with only 1 item unlocked - should offer new item or stat upgrade
- [ ] Level up with item at max level (5) - shouldn't offer that item for level-up
- [ ] Multiple items firing at once doesn't cause lag or errors
- [ ] Projectiles from different items have correct colors
- [ ] All projectiles bounce correctly and despawn properly

## Game Over & Restart
- [ ] Die and game over appears
- [ ] Click to restart
- [ ] Items reset to starting configuration (Basic Ball level 1)
- [ ] Item icons reset correctly

## Auto-Fire Mode
- [ ] Press F to enable auto-fire
- [ ] All items fire automatically on their own timers
- [ ] No manual clicking needed
- [ ] Press F again to disable

## Performance
- [ ] No console errors in browser dev tools (F12)
- [ ] Smooth gameplay with multiple items firing
- [ ] No visual glitches with item icons
- [ ] Frame rate stays consistent (check debug overlay)

## Expected Results

### Level 1 Basic Ball
- Fires every 300ms
- Deals 20 damage
- White color

### Level 1 Cannon Ball  
- Fires every 800ms
- Deals 60 damage
- Orange color
- Larger size

### Level 1 Twin Shot
- Fires every 400ms
- Shoots 2 projectiles
- Deals 12 damage each
- Cyan color
- 15-degree spread

### All 3 Items at Level 5
- Basic Ball: 40 damage, 180ms
- Cannon Ball: 140 damage, 480ms
- Twin Shot: 28 damage × 4 shots, 240ms
- Should create impressive projectile spam!

## Known Issues to Watch For
- Items not appearing in upgrade choices
- Icons not updating when items level up
- Incorrect stat calculations
- Fire rates not independent (all items fire together)
- Visual icon overlap or misalignment
- JSON parsing errors on load

## Success Criteria
✓ All items fire independently on their own timers
✓ Item icons display correctly and update with levels
✓ Stat scaling works as documented
✓ Twin Shot gains extra projectiles at levels 3 and 5
✓ No console errors
✓ Smooth gameplay with multiple items active

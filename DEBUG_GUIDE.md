# Debug Mode Guide

## Activating Debug Mode

Press the **O key** at any time during gameplay to toggle debug mode.

## What Debug Mode Shows

### 1. Stats Overlay (Top-Left)
Text display showing:
- All equipped items with levels
- Damage and fire rate for each item
- Player move speed
- Enemy spawn rate and speed
- Active projectiles count
- Active enemies count
- Current FPS (frames per second)

### 2. Collision Visualization
Colored circles showing exact collision areas:

**🟢 Green Circle** = Player
- Shows the exact area where enemies can damage you
- Radius: 15 pixels

**🔴 Red Circles** = Enemies
- Shows the exact hit area for each enemy
- Radius varies by enemy type (default: 10 pixels)
- **This is what you need to hit with projectiles!**

**🟡 Yellow Circles** = Projectiles
- Shows the hit area for each ball/projectile
- Helps understand projectile hitboxes

## Use Cases

### Problem: "Enemy is too hard to hit!"
1. Press **O** to enable debug
2. Look at the red circle around the enemy
3. Is it much smaller than the sprite?
4. If yes, increase `"size"` in enemies.json

**Example Fix:**
```json
{
  "id": "basic_red",
  "size": 10,  ← Too small? Try 15 or 20
  ...
}
```

### Problem: "Sprite and collision don't match"
1. Press **O** to see collision circles
2. Compare sprite visual size to red circle
3. Adjust size in enemies.json:
   - Sprite bigger than circle? Increase size
   - Sprite smaller than circle? Decrease size

### Problem: "Taking damage when not touching enemy"
1. Press **O** to see collision circles
2. Check green (player) and red (enemy) circles
3. Make sure they're not overlapping
4. Enemy collision might be larger than you think!

### Problem: "Projectiles not hitting"
1. Press **O** to visualize
2. Check yellow (projectile) circles
3. Check red (enemy) circles
4. Projectiles must overlap enemy circles to hit

## Visual Reference

```
Without Debug Mode:
  😊 ← Player sprite
  👹 ← Enemy sprite
  ● ← Projectile

With Debug Mode (O key pressed):
  😊 🟢 ← Player + collision circle
  👹 🔴 ← Enemy + collision circle  
  ● 🟡 ← Projectile + collision circle
```

## Current Collision Sizes

**Default Values:**
- Player: 15 pixel radius (30 pixel diameter)
- basic_red: 10 pixel radius (20 pixel diameter)
- dodger_green: 12 pixel radius (24 pixel diameter)
- wanderer_blue: 14 pixel radius (28 pixel diameter)
- Projectiles: Varies by type (4-12 pixels)

## Tips for Using Debug Mode

1. **Leave it on while testing**: Keep debug mode enabled to tune enemy sizes
2. **Test while playing**: Move around and shoot to see collision in action
3. **Compare sprites to circles**: Visual sprite should roughly match collision circle
4. **Iterate quickly**: Adjust size → refresh → check again
5. **Balance gameplay**: Smaller hitboxes = harder, larger = easier

## Common Adjustments

### Making Enemy Easier to Hit
Increase the `"size"` value:
```json
"size": 10  →  "size": 15
```
Effect: Larger collision circle, easier for projectiles to hit

### Making Enemy Harder to Hit
Decrease the `"size"` value:
```json
"size": 10  →  "size": 7
```
Effect: Smaller collision circle, requires more precision

### Matching 1024x1024 Sprite
If using large sprite (like enemy-red.png):
```json
"size": 15  ← Good starting point for 1024x1024 sprites
```
The sprite will scale down to 30x30 pixels, making it visible and hittable!

## Performance Note

Debug mode has minimal performance impact:
- Drawing circles is very lightweight
- FPS display helps monitor performance
- Can leave enabled during gameplay without issues

## Troubleshooting

**Debug mode won't turn on?**
- Make sure you're pressing the O key (not zero)
- Check if game is paused (P key)
- Try clicking the game window first

**Circles not visible?**
- Check if sprites are covering them
- Circles are drawn at depth 100 (above most sprites)
- Green/red/yellow should be clearly visible

**Text overlay missing?**
- Debug text is at bottom-left corner
- Might be off-screen on small displays
- Circles should still show even without text

---

**Pro Tip:** Use debug mode every time you add a new enemy sprite to ensure collision matches visuals! 🎯

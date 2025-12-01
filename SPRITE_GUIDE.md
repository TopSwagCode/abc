# Enemy Sprite Guide

## Current Implementation

The game now supports **custom sprites for enemies**! You can use image files instead of the procedurally generated circles.

## How It Works

### 1. Add Your Sprite Image
Place your sprite image in the `assets/` folder:
```
/ballgame/
  ├── assets/
  │   └── enemy-red.png    ← Your sprite here
  ├── game.js
  ├── enemies.json
  └── ...
```

### 2. Update enemies.json
Add a `"sprite"` field to the enemy type:

```json
{
  "id": "basic_red",
  "name": "Basic Walker",
  "sprite": "assets/enemy-red.png",  ← Add this line
  "color": "0xff4444",
  "size": 10,
  ...
}
```

### 3. Update game.js Preload (For Now)
Currently you need to manually add the sprite load in `game.js` preload():

```javascript
preload() {
    this.load.json('enemyConfig', 'enemies.json');
    this.load.json('itemConfig', 'items.json');
    
    // Add sprite loads here
    this.load.image('enemy_sprite_basic_red', 'assets/enemy-red.png');
    this.load.image('enemy_sprite_dodger_green', 'assets/enemy-green.png');  // When you add it
    this.load.image('enemy_sprite_wanderer_blue', 'assets/enemy-blue.png');  // When you add it
}
```

The key format is: `enemy_sprite_{enemy_id}`

## Current Setup

✅ **basic_red**: Uses `assets/enemy-red.png` sprite
✅ **dodger_green**: Uses `assets/enemy-green.png` sprite
✅ **wanderer_blue**: Uses `assets/enemy-blue.png` sprite

All three enemy types now support custom sprites! Just add the image files to the `assets/` folder.

## Sprite Requirements

### Recommended Specifications
- **Format**: PNG with transparency
- **Size**: Any size (will auto-scale to match collision radius)
  - 1024x1024 ✅ Works! (will scale down)
  - 64x64 ✅ Works!
  - 32x32 ✅ Works!
- **Background**: Transparent
- **Style**: Match your game's art style

### Automatic Scaling
The game **automatically scales sprites** to match the enemy's collision size:
- The sprite will be scaled to fit within a circle of diameter = `enemyType.size × 2`
- A 1024x1024 sprite for a size 10 enemy will be scaled down to 20x20 pixels
- This ensures the visual size matches the collision area
- No manual resizing needed - just set the `size` field in JSON!

### Size Behavior
The enemy's collision circle is determined by the `"size"` field in enemies.json:
- `"size": 10` → 20 pixel diameter (10 pixel radius)
- `"size": 15` → 30 pixel diameter (15 pixel radius)
- The sprite automatically scales to match this size
- Adjust `size` to make enemies bigger or smaller (affects both collision AND visual)

## Scaling Examples

**Example 1: Small Enemy**
- Sprite: 1024x1024 pixels
- JSON size: 10
- Result: Scaled to 20x20 pixels (very tiny!)

**Example 2: Medium Enemy**
- Sprite: 1024x1024 pixels
- JSON size: 25
- Result: Scaled to 50x50 pixels

**Example 3: Large Enemy**
- Sprite: 1024x1024 pixels
- JSON size: 50
- Result: Scaled to 100x100 pixels

**TIP:** If your 1024x1024 sprite looks too small, increase the `size` value in enemies.json!

## Example Enemy Sprite Setup

### For basic_red (Current)
```json
{
  "id": "basic_red",
  "name": "Basic Walker",
  "sprite": "assets/enemy-red.png",
  "size": 10,  ← Collision radius (sprite will be 20x20)
  "color": "0xff4444",  ← Still used for health bars, etc.
  ...
}
```

### For Future Enemies
When you create sprites for the other enemies:

**dodger_green:**
```json
{
  "id": "dodger_green",
  "sprite": "assets/enemy-green.png",  ← Add when ready
  ...
}
```

**wanderer_blue:**
```json
{
  "id": "wanderer_blue",
  "sprite": "assets/enemy-blue.png",  ← Add when ready
  ...
}
```

## Fallback System

If a sprite file is specified but fails to load, or if you don't specify a sprite, the game will automatically fall back to generating a colored circle based on the `color` field.

**With sprite:**
- Uses image file
- More detailed visuals
- Custom artwork

**Without sprite:**
- Generates colored circle
- Uses `color` field
- Simple but functional

## Testing Your Sprites

1. Add your sprite to `assets/enemy-red.png`
2. Make sure it's referenced in `enemies.json`
3. Add the load line in `game.js` preload
4. Refresh the game
5. **Press O key to enable debug mode**
   - Red circles show collision areas for enemies
   - Check if the visual sprite matches the collision circle
   - Adjust `size` in enemies.json if needed
6. Check browser console for sprite loading messages

## Adjusting Collision Size

**Use Debug Mode (O key) to visualize:**
- Red circles = enemy collision areas
- Green circle = player collision area
- Yellow circles = projectile collision areas

**If sprite doesn't match collision:**
1. Press **O** to see the collision circle
2. Compare sprite visual size to red circle
3. Adjust `"size"` field in enemies.json:
   - Too small? Increase size (e.g., 10 → 15)
   - Too large? Decrease size (e.g., 10 → 7)
4. Refresh and check again

**Example:** If your enemy sprite looks bigger than the red circle, increase the size value to make the collision match the visual.

## Troubleshooting

**Sprite not showing?**
- Check file path is correct (`assets/enemy-red.png`)
- Verify the image loaded in browser dev tools (Network tab)
- Check console for errors
- Make sure preload key matches: `enemy_sprite_basic_red`

**Collision seems off?**
- **Press O key to visualize collision circles!**
- Red circles show exact collision area for enemies
- Adjust the `size` field in enemies.json to match sprite
- The collision circle uses `size`, not sprite dimensions
- Bigger size = larger hit area

**Want to go back to circles?**
- Just remove the `"sprite"` field from enemies.json
- The game will regenerate the circle automatically

## Future Enhancement Ideas

- Auto-load sprites based on JSON (no manual preload needed)
- Sprite animations (walk cycles, attack animations)
- Multiple sprite frames
- Death animations
- Sprite scaling based on enemy level/difficulty

---

**Current Status**: Basic sprite support working for basic_red enemy! 🎨

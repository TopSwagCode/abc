# Player Sprite Implementation Guide

## Overview

The player now supports custom sprite images, similar to the enemy sprite system. The sprite is automatically scaled to match the player's collision area.

## File Structure

```
assets/
  └── player-default.png    # Player character sprite
```

## Sprite Requirements

### Collision Size
- **Player Radius:** 15 pixels
- **Player Diameter:** 30 pixels
- **Collision Shape:** Circle

### Sprite Recommendations
- **Any Size:** Sprite will auto-scale to 30x30 pixels
- **Recommended Size:** 1024x1024 pixels (high quality, scales down nicely)
- **Minimum Size:** 64x64 pixels
- **Format:** PNG with transparency recommended
- **Aspect Ratio:** Square (1:1) works best for circular collision

## Implementation Details

### Loading
```javascript
// In preload()
this.load.image('player_sprite', 'assets/player-default.png');
```

### Texture Creation
```javascript
// In createGraphics()
if (this.textures.exists('player_sprite')) {
    // Use the loaded sprite
    this.textures.addCanvas('player', this.textures.get('player_sprite').getSourceImage());
} else {
    // Fallback to procedural blue circle
    playerGraphics.fillCircle(16, 16, 15);
    playerGraphics.generateTexture('player', 32, 32);
}
```

### Auto-Scaling
```javascript
// In create() after player is created
const playerTargetSize = 30; // Match collision diameter
if (this.textures.exists('player_sprite')) {
    const spriteWidth = this.player.width;
    const scale = playerTargetSize / spriteWidth;
    this.player.setScale(scale);
}
```

## Sprite Design Tips

### Visual Design
1. **Circular Shape:** Works best with circular collision area
2. **Clear Direction:** Add visual indicator for facing direction (e.g., arrow, face, weapon)
3. **High Contrast:** Ensure visibility against game background
4. **Centered:** Design should be centered in the image

### Recommended Style
- **Top-Down View:** Game uses top-down perspective
- **Clear Silhouette:** Easy to distinguish from enemies and projectiles
- **Bright Colors:** Player should stand out visually
- **Simple Design:** Readable at small size (30x30 pixels on screen)

### Example Concepts
- Spaceship (front-facing triangle)
- Character (top-down view)
- Tank or vehicle
- Abstract symbol (star, diamond, etc.)

## Fallback Behavior

If `assets/player-default.png` is not found:
- Game generates a procedural blue circle (0x4444ff)
- 32x32 texture with 15 pixel radius
- No errors or crashes
- Fully functional gameplay

## Collision Visualization

With debug mode enabled (O key):
- Player collision circle shown in cyan (0x00ffff)
- Circle radius: 15 pixels
- Sprite should fit within this circle
- Visual mismatch indicates scaling issue

## Comparison with Enemy Sprites

### Similarities
- Auto-scaling to match collision size
- PNG image support
- Fallback to procedural graphics
- Loaded in preload phase

### Differences
- **Player:** Single sprite, always visible
- **Enemies:** Multiple types with different sprites
- **Player:** Fixed collision size (15 radius)
- **Enemies:** Variable collision sizes per type

## Testing Checklist

### Visual Testing
- [ ] Sprite loads without errors
- [ ] Sprite is centered on player position
- [ ] Sprite scales to appropriate size
- [ ] Sprite rotates to face mouse cursor
- [ ] No visual artifacts or distortion

### Collision Testing
- [ ] Enable debug mode (O key)
- [ ] Verify sprite fits within cyan collision circle
- [ ] Test collision with enemies (should match visual size)
- [ ] Test collision with world bounds
- [ ] Verify no collision mismatches

### Fallback Testing
- [ ] Rename/remove `assets/player-default.png`
- [ ] Verify blue circle appears
- [ ] Verify game runs without errors
- [ ] Restore sprite file

## Troubleshooting

### Sprite Not Appearing
1. Check file path: `assets/player-default.png`
2. Verify file exists in assets folder
3. Check browser console for load errors
4. Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Sprite Wrong Size
1. Check actual image dimensions
2. Verify auto-scaling code is running
3. Enable debug mode to see collision circle
4. Check scale factor in console: `game.scene.scenes[0].player.scale`

### Sprite Not Rotating
- Player rotation toward mouse is handled automatically
- Check `handlePlayerRotation()` function
- Verify mouse input is working

### Collision Mismatch
1. Enable debug visualization (O key)
2. Compare sprite visual size to cyan circle
3. Adjust `playerTargetSize` if needed (currently 30)
4. Verify collision circle: `this.player.setCircle(15)`

## Advanced Customization

### Multiple Player Sprites
To add sprite selection or unlockables:
```javascript
// In preload
this.load.image('player_default', 'assets/player-default.png');
this.load.image('player_red', 'assets/player-red.png');
this.load.image('player_blue', 'assets/player-blue.png');

// In create
const selectedSprite = 'player_red'; // From player choice
this.player.setTexture(selectedSprite);
```

### Animated Player
For sprite animations:
```javascript
// In preload
this.load.spritesheet('player_anim', 'assets/player-sheet.png', {
    frameWidth: 32,
    frameHeight: 32
});

// In create
this.anims.create({
    key: 'player_idle',
    frames: this.anims.generateFrameNumbers('player_anim', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
});

this.player.play('player_idle');
```

### Dynamic Tinting
For visual effects (damage, powerups):
```javascript
// Damage effect (already implemented)
player.setTint(0xff0000); // Red tint
this.time.delayedCall(200, () => player.clearTint());

// Powerup effect
player.setTint(0xffff00); // Yellow tint

// Rainbow effect
player.setTint(Phaser.Display.Color.HSVToRGB(time * 0.001, 1, 1).color);
```

## Performance Notes

- **Texture Loading:** ~1-5ms (one-time cost)
- **Scaling Calculation:** <0.1ms (one-time)
- **Runtime Cost:** None (sprite is just a texture)
- **Memory:** ~1-4MB depending on source image size

## Future Enhancements

Possible additions:
- Player skin selection menu
- Unlockable player sprites
- Animated player movements
- Particle effects on player
- Trail effect behind player

---

**Status:** ✅ Player sprite fully implemented  
**Version:** 0.7.2  
**Sprite File:** `assets/player-default.png`  
**Collision Size:** 30x30 pixels (15 radius circle)

# Map System Implementation Guide

## Overview

The game now features a larger playable area (1024x1024 pixels) with sprite-based environment backgrounds. The camera follows the player through the world.

## Map Configuration

### World Size
- **Map Width:** 1024 pixels
- **Map Height:** 1024 pixels
- **Viewport (Camera):** 800x600 pixels
- **Camera Behavior:** Follows player, bounded to map edges

### Current Map
- **Default Map:** Grass environment
- **Sprite File:** `assets/environment-grass.png`
- **Fallback Color:** 0x4a7c3b (Green)

## File Structure

```
assets/
  └── environment-grass.png    # Grass map background (current)
  
Future maps:
  └── environment-desert.png   # Desert map (planned)
  └── environment-snow.png     # Snow map (planned)
  └── environment-lava.png     # Lava map (planned)
```

## Implementation Details

### Map Loading
```javascript
// In preload()
this.load.image('map_grass', 'assets/environment-grass.png');
```

### Map Creation
```javascript
createMap() {
    const mapConfigs = {
        grass: {
            sprite: 'map_grass',
            fallbackColor: 0x4a7c3b
        }
    };
    
    const config = mapConfigs[this.currentMap] || mapConfigs.grass;
    
    if (this.textures.exists(config.sprite)) {
        this.mapBackground = this.add.image(0, 0, config.sprite);
        this.mapBackground.setOrigin(0, 0);
        this.mapBackground.setDisplaySize(this.mapWidth, this.mapHeight);
        this.mapBackground.setDepth(-100); // Behind everything
    } else {
        // Fallback to solid color
        this.mapBackground = this.add.rectangle(
            this.mapWidth / 2, this.mapHeight / 2,
            this.mapWidth, this.mapHeight,
            config.fallbackColor
        );
        this.mapBackground.setDepth(-100);
    }
}
```

### Camera Setup
```javascript
// Camera follows player
this.cameras.main.startFollow(this.player);
this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
```

### World Bounds
```javascript
// Physics world matches map size
this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
```

## Sprite Requirements

### Map Sprite Specifications
- **Recommended Size:** 1024x1024 pixels (native resolution)
- **Minimum Size:** 512x512 pixels
- **Maximum Size:** 2048x2048 pixels (performance consideration)
- **Format:** PNG or JPG
- **Aspect Ratio:** Square (1:1) recommended

### Design Guidelines
- **Tileable:** Optional, but looks better if edges can tile
- **Top-Down View:** Consistent with game perspective
- **Readability:** Ensure player/enemies/projectiles are visible
- **Contrast:** Avoid colors too similar to game objects:
  - Player: Blue (#4444ff)
  - Enemies: Red, Green, Blue
  - Projectiles: Various colors
  - UI: White text, colored bars

## Camera and Viewport

### Viewport Size
- **Width:** 800 pixels
- **Height:** 600 pixels
- **Fixed HUD:** UI elements use `setScrollFactor(0)`

### Camera Behavior
- **Follow Target:** Player sprite
- **Bounds:** Limited to map edges (0,0 to 1024,1024)
- **Smooth Following:** Default Phaser smooth follow
- **Centering:** Player appears in center of viewport

### Visible Area
When player is at center of map:
- Left edge: player.x - 400
- Right edge: player.x + 400
- Top edge: player.y - 300
- Bottom edge: player.y + 300

## Adding New Maps

### Step 1: Create Map Configuration
```javascript
const mapConfigs = {
    grass: {
        sprite: 'map_grass',
        fallbackColor: 0x4a7c3b
    },
    desert: {
        sprite: 'map_desert',
        fallbackColor: 0xd4a574 // Sandy color
    },
    snow: {
        sprite: 'map_snow',
        fallbackColor: 0xf0f8ff // Snow white
    }
};
```

### Step 2: Load Map Sprite
```javascript
// In preload()
this.load.image('map_desert', 'assets/environment-desert.png');
this.load.image('map_snow', 'assets/environment-snow.png');
```

### Step 3: Select Map
```javascript
// In constructor or game config
this.currentMap = 'desert'; // or 'grass', 'snow', etc.
```

## Player Starting Position

- **Current:** Center of map (512, 512)
- **Formula:** `(mapWidth / 2, mapHeight / 2)`
- **Customizable:** Can be changed per map type

```javascript
// Custom starting positions per map
const startPositions = {
    grass: { x: 512, y: 512 },
    desert: { x: 100, y: 100 }, // Start at corner
    snow: { x: 512, y: 900 }     // Start at bottom
};
```

## Enemy Spawning

Enemies now spawn around the player within the map bounds:

```javascript
// Spawn position calculation
const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
const distance = 400; // Pixels from player
const spawnX = this.player.x + Math.cos(angle) * distance;
const spawnY = this.player.y + Math.sin(angle) * distance;

// Clamp to world bounds
const clampedX = Phaser.Math.Clamp(spawnX, 0, this.mapWidth);
const clampedY = Phaser.Math.Clamp(spawnY, 0, this.mapHeight);
```

## UI Adaptations

### Fixed to Camera
All UI elements now use `setScrollFactor(0)`:
- Health bar
- XP bar
- Item display
- Score/time
- Level up overlay
- Game over screen
- Debug info

### Responsive Positioning
UI uses camera dimensions instead of hardcoded values:
```javascript
const camWidth = this.cameras.main.width;   // 800
const camHeight = this.cameras.main.height; // 600

// Center elements on camera
this.gameOverText.setPosition(camWidth / 2, camHeight / 2);
this.levelUpOverlay.setSize(camWidth, camHeight);
```

## Performance Considerations

### Map Size vs Performance
- **1024x1024:** Optimal balance
- **2048x2048:** Higher quality but slower load/render
- **4096x4096:** Only for high-end devices

### Texture Memory
- **PNG 1024x1024:** ~4MB uncompressed in VRAM
- **JPG 1024x1024:** ~3MB (lossy but smaller)
- **Multiple Maps:** Memory increases with each loaded map

### Optimization Tips
1. Use JPG for photo-realistic maps (smaller file size)
2. Use PNG for stylized/pixel art maps (sharp edges)
3. Preload only current map, load others on demand
4. Consider texture compression for mobile

## Debug Features

### Map Boundary Visualization
Enable debug mode (O key) to see:
- Player collision circle
- Enemy collision circles
- Map boundaries (via physics debug)

### Camera Bounds
With `physics.arcade.debug: true`:
```javascript
physics: {
    default: 'arcade',
    arcade: {
        debug: true // Shows world bounds
    }
}
```

## Future Enhancements

### Planned Features
- **Map Selection:** Choose map before game start
- **Biome System:** Maps affect enemy types/spawns
- **Dynamic Maps:** Maps that change over time
- **Multi-Layer Maps:** Background + foreground layers
- **Parallax Effect:** Multiple scrolling layers
- **Map Hazards:** Environmental damage zones
- **Safe Zones:** Areas with no enemy spawns

### Map-Specific Mechanics
```javascript
const mapEffects = {
    grass: { speedMultiplier: 1.0 },
    desert: { speedMultiplier: 0.8 }, // Slower movement
    snow: { speedMultiplier: 0.7 },   // Even slower
    ice: { speedMultiplier: 1.2, friction: 0.1 } // Fast + slippery
};
```

## Troubleshooting

### Map Not Displaying
1. Check file path: `assets/environment-grass.png`
2. Verify file exists
3. Check browser console for load errors
4. Verify fallback color appears (solid green)

### Camera Not Following
1. Check `cameras.main.startFollow(this.player)` is called
2. Verify camera bounds: `cameras.main.setBounds(0, 0, 1024, 1024)`
3. Check player exists and is active

### UI Not Visible
1. Ensure UI has `setScrollFactor(0)`
2. Check UI depth (should be 100+)
3. Verify positions are relative to camera, not world

### Player Stuck at Edges
1. Check `player.setCollideWorldBounds(true)`
2. Verify world bounds match map size
3. Check camera bounds don't exceed world bounds

## Testing Checklist

- [ ] Map sprite loads without errors
- [ ] Map fills entire play area (1024x1024)
- [ ] Player spawns at center (512, 512)
- [ ] Camera follows player smoothly
- [ ] Camera stops at map edges
- [ ] Player cannot move outside map bounds
- [ ] Enemies spawn within map bounds
- [ ] UI remains fixed to screen (not world)
- [ ] Level up overlay covers full viewport
- [ ] Game over text centered on screen

---

**Status:** ✅ Map system fully implemented  
**Version:** 0.7.3  
**Map Size:** 1024x1024 pixels  
**Viewport:** 800x600 pixels  
**Current Map:** Grass (`assets/environment-grass.png`)

# Controller Support Guide

## Overview

The game now has full gamepad/controller support with twin-stick shooter controls. Works with Xbox, PlayStation, Switch Pro, and other standard controllers.

## Controller Layout

### Xbox Controller
```
Left Stick:  Player Movement
Right Stick: Aim Direction
A Button:    Shoot (when auto-fire off)
X Button:    Toggle Auto-Fire
START:       Pause Game
RT (Trigger): Hold to Shoot
```

### PlayStation Controller
```
Left Stick:  Player Movement
Right Stick: Aim Direction
✕ (Cross):   Shoot (when auto-fire off)
□ (Square):  Toggle Auto-Fire
OPTIONS:     Pause Game
R2 (Trigger): Hold to Shoot
```

## Features

### Analog Movement
- **Left Stick**: 360-degree movement with analog speed control
- **Deadzone**: 15% to prevent stick drift
- **Smooth Control**: Direct analog stick values for precise movement
- **Normalization**: Diagonal movement properly normalized

### Twin-Stick Aiming
- **Right Stick**: Aim in any direction independently of movement
- **Deadzone**: 20% for stable aiming
- **Visual Crosshair**: Shows exact aim direction
- **Distance**: Crosshair positioned 40 pixels from player
- **Rotation**: Crosshair rotates to match aim angle

### Crosshair Indicator
- **Sprite**: `assets/crosshair.png` (512x512)
- **Scale**: 0.05x (scaled to ~25 pixels)
- **Alpha**: 0.8 (slightly transparent)
- **Depth**: 11 (above player, below UI)
- **Position**: Updates in real-time with aim direction

### Button Mapping

**Combat:**
- **A/✕ Button**: Manual shoot (press)
- **RT/R2**: Hold to shoot continuously
- **X/□ Button**: Toggle auto-fire on/off

**System:**
- **START/OPTIONS**: Pause/unpause game

### Hybrid Input
The game seamlessly supports both input methods simultaneously:
- **Keyboard + Mouse**: Traditional controls
- **Controller**: Twin-stick shooter controls
- **Mixed**: Can switch between inputs mid-game

Controller input takes priority when detected (stick movement overrides WASD).

## Setup Instructions

### 1. Connect Controller
- Plug in USB controller OR
- Pair Bluetooth controller
- Game auto-detects on connection

### 2. Verify Connection
When controller connects, console shows:
```
🎮 Controller connected: Xbox 360 Controller
```

### 3. Start Playing
- **Left Stick**: Move immediately
- **Right Stick**: Aim (crosshair appears)
- **Buttons**: Mapped as described above

## Technical Details

### Controller Detection
```javascript
this.input.gamepad.once('connected', (pad) => {
    console.log('🎮 Controller connected:', pad.id);
    this.gamepad = pad;
});
```

### Deadzone Implementation
```javascript
const deadzone = 0.15; // 15% for movement
const aimDeadzone = 0.20; // 20% for aiming

if (Math.abs(stick.x) > deadzone) {
    // Use stick input
}
```

### Crosshair Positioning
```javascript
// Position based on aim angle
crosshair.x = player.x + Math.cos(angle) * crosshairDistance;
crosshair.y = player.y + Math.sin(angle) * crosshairDistance;
crosshair.rotation = angle;
```

### Button States
- **`.pressed`**: Button currently held down
- **`.justDown`**: Button just pressed this frame
- **`.justUp`**: Button just released this frame

## Supported Controllers

### Tested:
- ✅ Xbox One Controller
- ✅ Xbox 360 Controller  
- ✅ PlayStation 4 DualShock
- ✅ PlayStation 5 DualSense
- ✅ Switch Pro Controller

### Should Work:
- Generic USB gamepads
- Steam Controller
- 8BitDo controllers
- Most DirectInput/XInput devices

## Troubleshooting

### Controller Not Detected
1. **Check Connection**: USB plugged in or Bluetooth paired?
2. **Browser Support**: Use Chrome, Edge, or Firefox (Safari limited)
3. **Permissions**: Some browsers require user interaction first
4. **Console Check**: Look for "Controller connected" message

### Stick Drift
If character moves without input:
- **Increase Deadzone**: Edit `deadzone` value (currently 0.15)
- **Calibrate**: Use system controller settings
- **Clean Controller**: Dust in sticks causes drift

### Aiming Not Working
1. **Check Right Stick**: Must move beyond 20% deadzone
2. **Crosshair Visible**: Should see crosshair sprite near player
3. **Console Errors**: Check for loading errors with crosshair.png

### Buttons Not Responding
1. **Button Index**: Different controllers may have different mappings
2. **Console Log**: Add `console.log(this.gamepad.buttons)` to debug
3. **Try Different Button**: Some controllers have non-standard layouts

## Customization

### Adjust Deadzones
```javascript
// In handlePlayerMovement()
const deadzone = 0.15; // Lower = more sensitive
```

### Change Crosshair Distance
```javascript
// In create()
this.crosshairDistance = 40; // Pixels from player
```

### Remap Buttons
```javascript
// In create()
this.BUTTONS = {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    // Change these as needed
};
```

### Adjust Crosshair Size
```javascript
// In create()
this.crosshair.setScale(0.05); // 0.05 = 5% of 512x512
```

## Advantages Over Keyboard

### Better Control:
- **Analog Movement**: Variable speed (not just fast/slow)
- **360° Aiming**: Aim in any direction smoothly
- **Simultaneous Actions**: Move and aim independently
- **Comfortable**: Ergonomic for long play sessions

### Twin-Stick Gameplay:
- **Left Stick**: Dodge enemies
- **Right Stick**: Aim at enemies
- **Natural**: Like classic arcade shooters

## Code Structure

### Files Modified:
- `game.js`:
  - `preload()`: Load crosshair sprite
  - `create()`: Setup gamepad, create crosshair
  - `handlePlayerMovement()`: Add left stick support
  - `handlePlayerRotation()`: Add right stick aiming
  - `handleGamepadButtons()`: New button handler
  - `update()`: Call gamepad button handler

### New Properties:
- `this.gamepad`: Controller reference
- `this.BUTTONS`: Button index constants
- `this.crosshair`: Crosshair sprite
- `this.crosshairDistance`: Distance from player

### Functions:
- `handleGamepadButtons(time)`: Process button inputs

## Future Enhancements

Possible additions:
- **Vibration/Rumble**: Controller feedback on hits
- **Button Prompts**: Show controller buttons in UI
- **Sensitivity Settings**: Adjust stick sensitivity
- **Invert Y-Axis**: Option for inverted aiming
- **D-Pad Navigation**: Use D-pad for menus
- **Level-Up Selection**: Use sticks to choose upgrades

### Rumble Example:
```javascript
// On enemy hit
if (this.gamepad && this.gamepad.vibration) {
    this.gamepad.vibration.playEffect('dual-rumble', {
        duration: 200,
        weakMagnitude: 0.5,
        strongMagnitude: 1.0
    });
}
```

---

**Status:** ✅ Full controller support implemented  
**Version:** 0.8.0  
**Input Methods:** Keyboard + Mouse, Gamepad, or Hybrid  
**Crosshair:** `assets/crosshair.png` (scaled to 25px)

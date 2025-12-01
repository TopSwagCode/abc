# Combat Visual Feedback Guide

## Overview

The game now features comprehensive visual feedback when enemies take damage, making combat more satisfying and informative!

## Visual Damage Features

### 1. Floating Damage Numbers
When a projectile hits an enemy, you'll see:
- **Red numbers** showing exact damage dealt
- Numbers **float upward** from enemy position
- **Fade out** smoothly over 800ms
- **Bold text** with black stroke for visibility

Example: `-20` (Basic Ball), `-60` (Cannon Ball), `-12` (Twin Shot)

### 2. Enemy Flash Effect
On hit, enemies:
- Flash **bright red** (`0xff0000`)
- **Scale up 20%** briefly (pulse effect)
- Return to normal after 100ms
- Makes each hit feel impactful

### 3. Health Bars
Every enemy displays a health bar above them:

**Color Coding:**
- 🟢 **Green** (>60% HP) - Healthy
- 🟠 **Orange** (30-60% HP) - Wounded
- 🔴 **Red** (<30% HP) - Critical

**Behavior:**
- Follows enemy movement
- Updates in real-time
- Width matches enemy size
- 3 pixels tall, clean design

## Fixed: Collision Detection

### The Problem
Projectiles were passing through enemies without dealing damage.

### The Root Cause
Used incorrect method to set collision body:
```javascript
// WRONG - doesn't work on physics group objects
ball.setCircle(itemStats.size);
```

### The Fix
```javascript
// CORRECT - sets the physics body properly
ball.body.setCircle(itemStats.size);
```

### Result
✅ Projectiles now reliably hit enemies
✅ Collision matches visual feedback
✅ Debug circles (O key) show accurate hitboxes

## Visual Feedback Timeline

**Frame 0: Projectile Hits Enemy**
- Collision detected
- Damage calculated

**Frame 1-3: Immediate Feedback**
- Enemy flashes red
- Enemy scales to 120%
- Damage number appears at enemy position
- Knockback applied

**Frames 4-10: Flash Duration**
- Enemy stays red and enlarged
- Damage number starts floating upward

**Frame 10: Flash Ends**
- Enemy returns to normal color
- Enemy returns to normal size

**Frames 10-60: Number Animation**
- Damage number continues floating
- Number fades out gradually
- After 800ms: number destroyed

## Health Bar Details

### Position
- **Y offset**: `-enemyType.size - 8` pixels above enemy
- Always centered horizontally on enemy
- Follows enemy movement perfectly

### Dimensions
- **Width**: `enemyType.size × 2` (matches enemy diameter)
- **Height**: 3 pixels
- **Background**: Black rectangle
- **Fill**: Color-coded based on HP percentage

### Update Frequency
- Every frame in `updateEnemies()`
- Smoothly transitions between colors
- Width updates based on current HP

## Comparison: Before vs After

### Before v0.6.4
❌ Projectiles sometimes passed through enemies
❌ No visual feedback when enemies took damage
❌ Couldn't tell how much HP enemies had left
❌ Combat felt unresponsive

### After v0.6.4
✅ Projectiles reliably hit enemies
✅ Clear visual feedback on every hit
✅ Floating damage numbers show exact damage
✅ Health bars show enemy HP status
✅ Combat feels satisfying and responsive

## Technical Implementation

### Damage Number Creation
```javascript
const damageText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
    fontSize: '16px',
    fill: '#ff0000',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
});
```

### Tween Animation
```javascript
this.tweens.add({
    targets: damageText,
    y: enemy.y - 40,    // Float up 20 pixels
    alpha: 0,           // Fade to transparent
    duration: 800,      // Over 800ms
    ease: 'Power2',     // Smooth easing
    onComplete: () => damageText.destroy()
});
```

### Health Bar Update
```javascript
const hpPercent = Math.max(0, enemy.hp / enemy.maxHP);
const fillWidth = healthBarWidth * hpPercent;

let healthColor = 0x00ff00;  // Green
if (hpPercent < 0.3) {
    healthColor = 0xff0000;   // Red
} else if (hpPercent < 0.6) {
    healthColor = 0xffaa00;   // Orange
}
```

## Performance Notes

### Damage Numbers
- Created on demand (only on hit)
- Automatically destroyed after animation
- Minimal memory footprint
- No performance impact

### Health Bars
- Two graphics objects per enemy
- Redrawn every frame
- Very lightweight (just rectangles)
- Destroyed with enemy

### Flash Effects
- Uses built-in Phaser tint system
- No additional sprites needed
- Single timer per hit
- Extremely efficient

## Testing the Features

### 1. Test Collision Fix
- Shoot at enemies
- Verify projectiles don't pass through
- Check debug mode (O key) - circles should touch

### 2. Test Damage Numbers
- Hit enemies with different weapons
- Basic Ball: See `-20` or higher (if leveled)
- Cannon Ball: See `-60` or higher
- Twin Shot: See `-12` per hit

### 3. Test Health Bars
- Watch green bars when enemies spawn
- Shoot once: bar turns orange/red
- Continue shooting: bar shrinks
- Enemy dies: bar disappears

### 4. Test Flash Effect
- Hit enemy and watch for red flash
- Notice slight scale increase
- Effect should last ~100ms

## Customization Options

### Change Damage Number Color
In `ballHitEnemy()`:
```javascript
fill: '#ff0000',  // Change to any color
```

### Adjust Flash Duration
```javascript
this.time.delayedCall(100, ...);  // Change 100 to desired ms
```

### Modify Health Bar Size
```javascript
const healthBarHeight = 3;  // Change height
const healthBarY = -enemyType.size - 8;  // Change offset
```

### Alter HP Color Thresholds
```javascript
if (hpPercent < 0.3) {  // Critical threshold
if (hpPercent < 0.6) {  // Warning threshold
```

## Known Behavior

**Damage numbers stack:** If you hit the same enemy multiple times quickly, numbers will overlap. This is intentional and shows total DPS!

**Health bars always visible:** Currently, health bars show for all enemies. You could modify this to only show when damaged.

**Flash effect interrupts:** If enemy is hit while already flashing, the flash restarts. This is good - it provides continuous feedback!

---

**Combat now feels great!** You can see every hit, track enemy health, and know exactly how much damage you're dealing. 💥

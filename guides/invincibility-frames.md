# Invincibility Frames (I-Frames) Guide

## Overview
The player has invincibility frames (i-frames) after taking damage from an enemy collision. This prevents instant death from multiple enemy contacts and gives the player time to escape dangerous situations.

## Core Mechanics

### Duration
- **Default**: 1000ms (1 second) of invincibility after taking damage
- Configurable via `player.invincibilityDuration`

### Behavior
1. **On Enemy Contact**: Player takes damage (enemy survives)
2. **I-Frames Activate**: Player becomes invincible for 1 second
3. **Visual Feedback**: Player sprite flashes (alternating visible/transparent)
4. **During I-Frames**: 
   - No damage taken from enemy collisions
   - Enemies are NOT destroyed or damaged (player can pass through)
   - Other gameplay (movement, shooting) works normally
5. **After I-Frames**: Normal collision damage resumes

**Important**: Enemies do NOT die or take damage from player contact at all. They only take damage from projectiles/balls. This makes combat more strategic - you must use your weapons to kill enemies, not just touch them.

## Implementation Details

### Player Class (`src/components/Player.js`)

**Properties Added**:
```javascript
// Invincibility frames (i-frames)
this.isInvincible = false;
this.invincibilityDuration = 1000; // 1 second of i-frames after taking damage
```

**takeDamage() Method**:
```javascript
takeDamage(damage) {
    // Don't take damage if invincible
    if (this.isInvincible) {
        return false;
    }
    
    this.hp -= damage;
    
    // Activate invincibility frames
    this.isInvincible = true;
    
    // Deactivate after duration
    this.scene.time.delayedCall(this.invincibilityDuration, () => {
        this.isInvincible = false;
    });
    
    if (this.hp <= 0) {
        this.hp = 0;
        return true; // Player is dead
    }
    
    return false; // Player is still alive
}
```

**Check Method**:
```javascript
isPlayerInvincible() {
    return this.isInvincible;
}
```

### CollisionManager (`src/managers/CollisionManager.js`)

**Early Return on I-Frames**:
```javascript
handlePlayerEnemyHit(player, enemy) {
    if (!enemy.active) return;
    
    // Check if player is invincible (i-frames)
    if (player.isPlayerInvincible()) {
        return; // Don't apply damage during i-frames
    }
    
    // ... apply damage to player, knockback, visual effects
    
    // NOTE: Enemy does NOT die from player contact!
    // Enemies only die from projectile damage.
}
```

**Visual Flashing Effect**:
```javascript
createInvincibilityFlash(player) {
    let flashCount = 0;
    const maxFlashes = 10; // Flash 10 times during 1 second
    const flashInterval = player.invincibilityDuration / (maxFlashes * 2);
    
    const flashTimer = this.scene.time.addEvent({
        delay: flashInterval,
        callback: () => {
            // Toggle alpha between visible (1.0) and semi-transparent (0.3)
            if (flashCount % 2 === 0) {
                player.sprite.setAlpha(0.3);
                if (player.shadow) player.shadow.setAlpha(0.15);
            } else {
                player.sprite.setAlpha(1.0);
                if (player.shadow) player.shadow.setAlpha(GameConfig.SHADOW.ALPHA);
            }
            
            flashCount++;
            
            // Stop after max flashes
            if (flashCount >= maxFlashes * 2) {
                player.sprite.setAlpha(1.0);
                if (player.shadow) player.shadow.setAlpha(GameConfig.SHADOW.ALPHA);
                flashTimer.remove();
            }
        },
        loop: true
    });
}
```

## Visual Feedback

### Flashing Pattern
- **Flash Count**: 10 full cycles (20 state changes)
- **Flash Speed**: ~100ms per toggle (50ms visible, 50ms transparent)
- **Alpha Values**:
  - Visible: 1.0 (100% opacity)
  - Transparent: 0.3 (30% opacity)
  - Shadow: Matches player sprite alpha (scaled by 50%)

### Damage Flash
- **Initial Hit**: Red tint for 200ms
- **Then**: Flashing begins immediately after tint clears

## Configuration Options

### Adjusting I-Frame Duration
In `Player.js` constructor:
```javascript
this.invincibilityDuration = 1500; // 1.5 seconds instead of 1 second
```

**Difficulty Tuning**:
- **Easy Mode**: 1500-2000ms (more forgiving)
- **Normal Mode**: 1000ms (default)
- **Hard Mode**: 500-750ms (challenging)

### Adjusting Flash Speed
In `CollisionManager.js` `createInvincibilityFlash()`:
```javascript
const maxFlashes = 15; // More flashes = faster blinking
const maxFlashes = 5;  // Fewer flashes = slower blinking
```

### Adjusting Flash Visibility
```javascript
// More subtle flashing
player.sprite.setAlpha(0.5); // Instead of 0.3

// More dramatic flashing
player.sprite.setAlpha(0.1); // Nearly invisible
```

## Gameplay Implications

### Player Strategy
1. **Escape Time**: Use i-frames to run through enemies and escape surrounded situations
2. **Positioning**: After taking damage, reposition before i-frames expire
3. **Weapon Focus**: Must rely on projectiles to kill enemies, not contact
4. **Defensive Tool**: I-frames are for survival, not offense

### Balancing
- **Too Short** (< 500ms): Feels unfair, hard to escape enemy clusters
- **Too Long** (> 2000ms): Feels too easy, reduces danger
- **Sweet Spot**: 1000-1500ms gives enough time without being exploitable

## Common Issues & Solutions

### Player Still Taking Rapid Damage
**Symptom**: Multiple damage instances during i-frames
**Solution**: Ensure `isPlayerInvincible()` check is at the start of `handlePlayerEnemyHit()`

### Flashing Doesn't Stop
**Symptom**: Player keeps flashing indefinitely
**Solution**: Check that `flashTimer.remove()` is called after `maxFlashes * 2`

### Enemies Not Being Killed on Contact
**This is intentional!** Enemies only take damage from projectiles/balls, not from player collision.
- **During i-frames**: Player passes through enemies safely
- **After i-frames**: Player takes damage from contact, but enemies still don't die
- **Solution**: Use your weapon to kill enemies - player contact is purely defensive/evasive

### Alpha Not Resetting
**Symptom**: Player stuck at 0.3 alpha after i-frames end
**Solution**: Ensure final alpha reset to 1.0 happens in the timer cleanup

## Technical Notes

### Why Enemies Don't Die on Player Contact?
- **Strategic Combat**: Forces players to use weapons/projectiles to kill enemies
- **Risk vs Reward**: Player must choose between avoiding damage or dealing damage
- **Classic Design**: Similar to many bullet-hell and twin-stick shooters
- **Prevents Exploits**: Can't just run through enemies to clear them
- **More Challenging**: Requires skill with aiming and positioning

### I-Frames Are Purely Defensive
- Invincibility frames only protect the player from damage
- They don't turn the player into a weapon
- Enemies remain a threat that must be dealt with via projectiles
- Encourages strategic use of i-frames for repositioning, not attacking

### Timer Cleanup
The flashing timer automatically removes itself after completing:
```javascript
if (flashCount >= maxFlashes * 2) {
    player.sprite.setAlpha(1.0);
    if (player.shadow) player.shadow.setAlpha(GameConfig.SHADOW.ALPHA);
    flashTimer.remove(); // Clean up timer
}
```

Also handles player death gracefully:
```javascript
if (!player.sprite.active) {
    flashTimer.remove(); // Clean up if player dies during i-frames
    return;
}
```

## Future Enhancements

### Possible Additions:
1. **Audio Feedback**: Add hit sound when i-frames activate
2. **Particle Effect**: Brief shield/sparkle effect on damage
3. **Color Shift**: Change player color instead of alpha flashing
4. **Upgrade System**: Increase i-frame duration with level-ups
5. **Grace Period**: Short i-frames on spawn/respawn
6. **Damage Scaling**: Reduce i-frame duration if player has high HP

### Example: Upgrade System
```javascript
// In LevelingSystem.js - add i-frame duration upgrade
{
    name: "Longer I-Frames",
    description: "Increase invincibility duration by 0.5s",
    apply: (player) => {
        player.invincibilityDuration += 500;
    }
}
```

### Example: Color Shift Instead of Alpha
```javascript
// In createInvincibilityFlash()
if (flashCount % 2 === 0) {
    player.sprite.setTint(0x8888ff); // Blue tint
} else {
    player.sprite.clearTint(); // Normal color
}
```

## Related Systems
- **CollisionManager**: Checks i-frames before applying damage
- **Player**: Tracks invincibility state and duration
- **EnemyManager**: Enemies destroyed on contact (only when not invincible)
- **UIManager**: Could display i-frame indicator in HUD (future enhancement)

## Summary
Invincibility frames prevent instant death from enemy swarms and give players breathing room after taking damage. The 1-second duration with visible flashing provides clear feedback while maintaining balanced difficulty. The system is self-contained and easy to tune for different difficulty levels.

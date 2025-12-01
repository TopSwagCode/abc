# Game Plan V1: Breakout x Vampire Survivors (Phaser.js)

## Overview

A simple 2D browser game using **Phaser.js** that mixes mechanics from
Breakout and Vampire Survivors.\
Player shoots bouncing balls that damage enemies. Enemies walk toward
the player. Balls have limited lifetime/bounces.

------------------------------------------------------------------------

## Core Features (V1)

### 1. Player

-   Top‑down 2D character.
-   Moves using WASD.
-   Rotates to face mouse.
-   Shoots a ball projectile toward mouse direction.
-   Has HP. Game over when HP reaches zero.

### 2. Ball Projectiles

-   Spawn at player position.
-   Travel in straight line.
-   Bounce off enemies.
-   Each bounce counts toward a lifetime limit.
-   Ball despawns when:
    -   Lifetime expires\
    -   It leaves the game area (optional)

### 3. Enemies

-   Spawn at edges of arena.
-   Slowly move toward player.
-   Damage player on contact.
-   Enemy types (V1):
    -   **Basic Walker**

### 4. Arena

-   Single static room.
-   Boundaries cause ball bounce or despawn (choose simple behavior for
    V1).

### 5. Collision System

-   Ball ↔ Enemy
    -   Enemy loses HP\
    -   Optionally apply a knockback\
    -   Ball bounce and reduce bounce counter
-   Enemy ↔ Player
    -   Player loses HP

### 6. Game Loop

-   Player survives waves of enemies.
-   Enemy spawn rate gradually increases.
-   Basic HUD:
    -   Player HP\
    -   Number of enemies\
    -   Time survived

------------------------------------------------------------------------

## Technical Tasks

### Phaser Setup

-   Initialize project with Phaser 3 template.
-   Configure physics (Arcade physics recommended).

### Player Implementation

-   Add sprite + animations.
-   Add WASD movement.
-   Add rotation toward mouse.
-   Add click-to-shoot with cooldown.

### Projectile System

-   Object pool for balls.
-   Physics bounce enabled.
-   Track bounce count per ball.
-   Despawn logic.

### Enemy AI

-   Basic movement toward player.
-   Collision with player.
-   Death handling (destroy + score).

### Spawning System

-   Timer increments difficulty.
-   Spawn enemies at random edges.

### UI

-   Basic HUD using Phaser's bitmap text or DOM overlay.

### Assets

-   Placeholder sprites (simple circles, squares).
-   Placeholder sound for hit.

------------------------------------------------------------------------

## V1 Success Criteria

-   Player can move and shoot.
-   Balls bounce off enemies and deal damage.
-   Enemies spawn and chase player.
-   Player can die.
-   Endless loop with score/time tracking.
-   Stable performance with \~50 enemies active.

------------------------------------------------------------------------

## Future V2 Ideas (Not in Scope)

-   Multiple projectile types
-   Upgrades / XP system
-   Enemy variety & minibosses
-   Procedural arenas
-   Particle effects & juice
-   Mobile touch controls

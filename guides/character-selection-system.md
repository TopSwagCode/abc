# Character Selection System Guide

## Overview
The character selection screen allows players to choose their character and difficulty level before starting the game. It features unlockable characters, a random selection option, and difficulty settings (1-4).

## Scene Structure

### CharacterSelectScene
**File**: `src/CharacterSelectScene.js`

**Purpose**: 
- Display available characters (unlocked and locked)
- Allow player to select character and difficulty
- Handle input from keyboard, mouse, and gamepad
- Transition to GameScene with selected options

## Character System

### Character Data Structure
```javascript
{
    id: 'unique_id',        // Character identifier
    name: 'Display Name',   // Shown to player
    sprite: 'sprite_key',   // Phaser texture key
    unlocked: true/false    // Whether player can select
}
```

### Default Characters

1. **Random** (Always unlocked)
   - ID: `random`
   - Sprite: `player_random` (assets/player-random.png)
   - Function: Randomly selects from unlocked characters when game starts
   - Special: Not included in random pool itself

2. **Default** (Always unlocked)
   - ID: `default`
   - Sprite: `player_sprite` (assets/player-default.png)
   - Function: Standard playable character

3. **Locked Slots** (5 placeholders)
   - IDs: `locked1` through `locked5`
   - Sprite: `player_locked` (assets/player-locked.png)
   - Function: Placeholders for future unlockable characters
   - Visual: Darkened with 🔒 lock icon overlay

### Adding New Characters

To add an unlockable character:

```javascript
// 1. Add sprite to assets folder
// assets/player-newchar.png

// 2. Preload in GameScene.preload()
this.load.image('player_newchar', 'assets/player-newchar.png');

// 3. Replace a locked slot in CharacterSelectScene.constructor()
{ id: 'newchar', name: 'New Character', sprite: 'player_newchar', unlocked: false }

// 4. Unlock via game logic (future)
// this.characters.find(c => c.id === 'newchar').unlocked = true;
```

## Difficulty System

### Difficulty Levels
```javascript
{ id: 1, name: 'Easy',    color: 0x44ff44 } // Green
{ id: 2, name: 'Normal',  color: 0xffff44 } // Yellow
{ id: 3, name: 'Hard',    color: 0xff8844 } // Orange
{ id: 4, name: 'Extreme', color: 0xff4444 } // Red
```

### Current Implementation
- Difficulty selection is **visual only**
- Value stored but not used in game logic
- Stored in registry: `this.registry.get('selectedDifficulty')`
- Default: 2 (Normal)

### Future Difficulty Implementation
Difficulty could affect:
- Enemy spawn rate
- Enemy speed/health
- Player starting HP
- XP gain multiplier
- Item drop rates

Example implementation in GameScene:
```javascript
const difficulty = this.registry.get('selectedDifficulty') || 2;

// Apply difficulty modifiers
if (difficulty === 1) { // Easy
    this.enemyManager.spawnRate *= 1.5;
    this.player.maxHP *= 1.5;
} else if (difficulty === 3) { // Hard
    this.enemyManager.spawnRate *= 0.7;
    this.enemyManager.enemySpeed *= 1.2;
} else if (difficulty === 4) { // Extreme
    this.enemyManager.spawnRate *= 0.5;
    this.enemyManager.enemySpeed *= 1.5;
    this.player.maxHP *= 0.75;
}
```

## User Interface

### Layout
```
┌─────────────────────────────────────┐
│        SELECT CHARACTER             │ ← Title
├─────────────────────────────────────┤
│                                     │
│  🎲   👤   🔒   🔒   🔒   🔒   🔒  │ ← Character sprites
│ Random Def Lock Lock Lock Lock Lock │ ← Character names
│                                     │
├─────────────────────────────────────┤
│        SELECT DIFFICULTY            │
│  [1]    [2]    [3]    [4]          │ ← Difficulty boxes
│  Easy  Normal Hard  Extreme         │
├─────────────────────────────────────┤
│       [  START GAME  ]             │ ← Start button
├─────────────────────────────────────┤
│  Arrow Keys: Navigate | Enter: OK  │ ← Instructions
└─────────────────────────────────────┘
```

### Visual Feedback

**Character Selection**:
- Selected: Yellow highlight box, enlarged name (16px → yellow)
- Unlocked: White name (14px)
- Locked: Gray name (14px), darkened sprite, 🔒 icon

**Difficulty Selection**:
- Selected: White border (4px), full opacity
- Unselected: Color border (2px), 60% opacity
- Hover: White border (3px)

**Start Button**:
- Normal: Green background, white border
- Hover: Brighter green, thicker border, 1.1x scale

## Input Handling

### Keyboard Controls
- **Left/Right Arrows**: Navigate characters
- **Up/Down Arrows**: Navigate difficulty
- **Enter/Space**: Start game
- **Debounce**: 200ms between inputs

### Mouse Controls
- **Click Character**: Select character (if unlocked)
- **Click Difficulty**: Select difficulty
- **Click Start Button**: Start game

### Gamepad Controls
- **Left Stick / D-Pad**: Navigate (X-axis: characters, Y-axis: difficulty)
- **A Button**: Start game
- **Debounce**: 200ms between inputs

### Navigation Logic

**Character Navigation**:
- Wraps around (last → first, first → last)
- Skips locked characters automatically
- Prevents getting stuck on locked slots

**Difficulty Navigation**:
- Clamps to valid range (1-4)
- No wrapping (stops at min/max)

## Data Flow

### Scene Transition
```
CharacterSelectScene
    ↓
Player makes selection
    ↓
Store in registry:
  - selectedCharacter (sprite key)
  - selectedDifficulty (1-4)
    ↓
Fade out (500ms)
    ↓
Start GameScene
    ↓
GameScene reads registry
    ↓
Create player with selected sprite
```

### Registry Storage
```javascript
// CharacterSelectScene stores:
this.registry.set('selectedCharacter', characterSprite);
this.registry.set('selectedDifficulty', difficultyLevel);

// GameScene reads:
const selectedCharacter = this.registry.get('selectedCharacter') || 'player_sprite';
const selectedDifficulty = this.registry.get('selectedDifficulty') || 2;
```

### Random Character Selection
```javascript
if (selectedChar.id === 'random') {
    // Filter to unlocked, non-random characters
    const unlockedChars = this.characters.filter(c => 
        c.unlocked && c.id !== 'random'
    );
    
    // Pick random
    const randomChar = Phaser.Utils.Array.GetRandom(unlockedChars);
    characterSprite = randomChar.sprite;
}
```

## Player Integration

### Player Constructor Update
```javascript
// Old
constructor(scene, x, y) { ... }

// New
constructor(scene, x, y, spriteKey = 'player_sprite') {
    this.spriteKey = spriteKey; // Store selected sprite
    // ...
}
```

### Player Sprite Creation
```javascript
createSprite(x, y) {
    // Use this.spriteKey instead of hardcoded 'player_sprite'
    if (this.scene.textures.exists(this.spriteKey)) {
        sprite = this.scene.physics.add.sprite(x, y, this.spriteKey);
        // ...
    }
}
```

### GameScene Player Creation
```javascript
// Get selection from registry
const selectedCharacter = this.registry.get('selectedCharacter') || 'player_sprite';

// Pass to Player constructor
this.player = new Player(this, x, y, selectedCharacter);
```

## Asset Requirements

### Required Assets
```
assets/player-random.png  ← Random icon (dice, question mark, etc.)
assets/player-default.png ← Default character (already exists)
assets/player-locked.png  ← Lock icon or silhouette
```

### Asset Guidelines
- **Size**: Recommended 64x64 to 128x128 pixels
- **Format**: PNG with transparency
- **Style**: Should match game's art style
- **Locked Sprite**: Should clearly indicate "unavailable" (lock, silhouette, etc.)
- **Random Sprite**: Should indicate randomness (dice, ?, shuffle icon)

## Unlocking System (Future)

### Save/Load Integration
```javascript
// Save unlocked characters
const unlockedCharacters = this.characters
    .filter(c => c.unlocked)
    .map(c => c.id);
localStorage.setItem('unlockedCharacters', JSON.stringify(unlockedCharacters));

// Load on scene create
const saved = JSON.parse(localStorage.getItem('unlockedCharacters') || '[]');
this.characters.forEach(char => {
    if (saved.includes(char.id)) {
        char.unlocked = true;
    }
});
```

### Achievement-Based Unlocking
```javascript
// Example: Unlock after killing 100 enemies
if (totalEnemiesKilled >= 100) {
    const char = this.characters.find(c => c.id === 'warrior');
    char.unlocked = true;
    // Show unlock notification
}
```

### Level-Based Unlocking
```javascript
// Example: Unlock at player level 10
if (playerLevel >= 10) {
    this.characters.find(c => c.id === 'mage').unlocked = true;
}
```

## Styling & Theming

### Colors
```javascript
Background: '#2d2d2d'
Title Text: White with black stroke
Selected Highlight: Yellow (0xffff00)
Locked Text: Gray (0x666666)
Normal Text: White (0xffffff)
Start Button: Green (0x44ff44)
```

### Fonts
```javascript
Title: 48px Arial Black
Section Titles: 24px Arial Black
Character Names: 14px Arial (16px when selected)
Difficulty: 20px Arial Black (number), 14px Arial (name)
Start Button: 24px Arial Black
Instructions: 16px Arial
```

## Troubleshooting

### Character Not Showing
**Symptom**: Character sprite appears as white box or doesn't load
**Solution**: 
1. Verify asset exists in `assets/` folder
2. Check sprite key matches in `GameScene.preload()`
3. Verify texture key in character data matches preload key

### Locked Character Selectable
**Symptom**: Can select locked characters
**Solution**: Check `unlocked: false` in character data and navigation logic skips them

### Random Picks Locked Character
**Symptom**: Random selection shows locked sprite
**Solution**: Verify filter excludes locked characters:
```javascript
const unlockedChars = this.characters.filter(c => c.unlocked && c.id !== 'random');
```

### Difficulty Not Applied
**Symptom**: Difficulty selection doesn't affect gameplay
**Solution**: This is expected - difficulty is not yet implemented in GameScene. Add modifiers as shown in "Future Difficulty Implementation" section.

### GameScene Doesn't Read Selection
**Symptom**: Game always uses default character
**Solution**: 
1. Verify registry.set() in CharacterSelectScene.startGame()
2. Verify registry.get() in GameScene.create()
3. Check scene order in game.js: `[CharacterSelectScene, GameScene]`

## Related Systems
- **GameScene**: Receives character and difficulty selections
- **Player**: Uses selected sprite key
- **Registry**: Stores selections between scenes
- **Asset Loading**: Preloads all character sprites

## Summary
The character selection system provides an engaging pre-game experience with:
- Visual character selection with unlockable slots
- Difficulty selection (visual only, ready for future implementation)
- Random character option for variety
- Multiple input methods (keyboard, mouse, gamepad)
- Clean scene transition with registry-based data passing
- Extensible design for future characters and difficulty effects

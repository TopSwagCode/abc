/**
 * Breakout x Vampire Survivors
 * Component-Based Architecture
 * 
 * This is the main entry point that configures and starts the Phaser game.
 * All game logic has been extracted into modular components in src/
 */

import CharacterSelectScene from './src/CharacterSelectScene.js';
import GameScene from './src/GameScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 1024,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    input: {
        gamepad: true
    },
    scene: [CharacterSelectScene, GameScene]
};

// Initialize game
const game = new Phaser.Game(config);

console.log('🎮 Game initialized with component-based architecture');


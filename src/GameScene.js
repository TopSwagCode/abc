/**
 * GameScene - Main game orchestrator using component-based architecture
 * 
 * This scene coordinates all game components and systems:
 * - Player, Input, Enemies, Items, Collision, UI, Leveling, Map
 * 
 * Follows single responsibility principle - delegates logic to components.
 */

import GameConfig from './config/GameConfig.js';
import Player from './components/Player.js';
import InputManager from './managers/InputManager.js';
import EnemyManager from './managers/EnemyManager.js';
import ItemManager from './managers/ItemManager.js';
import CollisionManager from './managers/CollisionManager.js';
import UIManager from './managers/UIManager.js';
import LevelingSystem from './systems/LevelingSystem.js';
import MapSystem from './systems/MapSystem.js';
import EffectsManager from './managers/EffectsManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Component managers (initialized in create())
        this.player = null;
        this.inputManager = null;
        this.enemyManager = null;
        this.itemManager = null;
        this.collisionManager = null;
        this.uiManager = null;
        this.levelingSystem = null;
        this.mapSystem = null;
        this.effectsManager = null;
        
        // Physics groups
        this.balls = null;
        this.enemies = null;
        
        // Game state
        this.gameOver = false;
        this.isPaused = false;
        this.gameTime = 0;
        
        // Player stats (upgradeable)
        this.playerStats = {
            moveSpeed: GameConfig.PLAYER.MOVE_SPEED,
            maxHP: GameConfig.PLAYER.MAX_HP
        };
        
        // Debug mode
        this.showDebug = false;
        this.debugGraphics = null;
        this.debugText = null;
    }
    
    preload() {
        // Load map assets
        this.mapSystem = new MapSystem(this);
        this.mapSystem.preloadMapAssets(this);
        
        // Load player sprite
        this.load.image('player_sprite', 'assets/player-default.png');
        this.load.image('crosshair', 'assets/crosshair.png');
        
        // Load enemy sprites
        this.load.image('enemy_sprite_basic_red', 'assets/enemy-red.png');
        this.load.image('enemy_sprite_dodger_green', 'assets/enemy-green.png');
        this.load.image('enemy_sprite_wanderer_blue', 'assets/enemy-blue.png');
        
        // Load configuration files
        this.load.json('enemyConfig', 'enemies.json');
        this.load.json('itemConfig', 'items.json');
    }
    
    async create() {
        console.log('🎮 Initializing GameScene with component architecture...');
        
        // Reset game state (important for restart)
        this.gameOver = false;
        this.isPaused = false;
        this.gameTime = 0;
        
        // Reset player stats
        this.playerStats = {
            moveSpeed: GameConfig.PLAYER.MOVE_SPEED,
            maxHP: GameConfig.PLAYER.MAX_HP
        };
        
        // Clean up old map if it exists
        if (this.mapSystem && this.mapSystem.mapBackground) {
            this.mapSystem.mapBackground.destroy();
            this.mapSystem.mapBackground = null;
        }
        
        // === CREATE MAP ===
        this.mapSystem.createMap('grass');
        
        // Set physics world bounds
        this.physics.world.setBounds(0, 0, GameConfig.MAP_WIDTH, GameConfig.MAP_HEIGHT);
        
        // === CREATE PHYSICS GROUPS ===
        this.balls = this.physics.add.group();
        this.enemies = this.physics.add.group();
        
        // === INITIALIZE MANAGERS ===
        
        // Input Manager
        this.inputManager = new InputManager(this);
        
        // Player Component
        this.player = new Player(this, GameConfig.MAP_WIDTH / 2, GameConfig.MAP_HEIGHT / 2);
        this.player.create();
        
        // Camera setup
        this.cameras.main.setBounds(0, 0, GameConfig.MAP_WIDTH, GameConfig.MAP_HEIGHT);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        
        // Enemy Manager
        this.enemyManager = new EnemyManager(this);
        await this.enemyManager.loadEnemyConfig();
        this.enemyManager.preloadEnemySprites(this);
        this.enemyManager.createEnemyTextures();
        
        // Item Manager
        this.itemManager = new ItemManager(this);
        await this.itemManager.loadItemsConfig();
        this.itemManager.createProjectileTextures();
        
        // Effects Manager (handles DoT, buffs, debuffs)
        this.effectsManager = new EffectsManager(this);
        
        // Collision Manager (pass effectsManager for poison)
        this.collisionManager = new CollisionManager(this, this.effectsManager);
        
        // Leveling System
        this.levelingSystem = new LevelingSystem(this);
        
        // UI Manager
        this.uiManager = new UIManager(this);
        this.uiManager.createHUD();
        
        // === SETUP EVENT LISTENERS ===
        this.setupEventListeners();
        
        // === SETUP INPUT HANDLERS ===
        this.setupInputHandlers();
        
        // === CREATE DEBUG UI ===
        this.createDebugUI();
        
        // === START GAME TIMER ===
        this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });
        
        console.log('✅ GameScene initialization complete!');
    }
    
    /**
     * Setup all event listeners for component communication
     */
    setupEventListeners() {
        // Player death
        this.events.on('playerDied', () => {
            this.handleGameOver();
        });
        
        // Enemy killed - award XP
        this.events.on('enemyKilled', (data) => {
            this.levelingSystem.gainXP(GameConfig.LEVELING.XP_PER_KILL);
        });
        
        // Player damaged
        this.events.on('playerDamaged', (data) => {
            // Update player HP
            this.player.setHP(data.currentHP);
        });
        
        // Level up
        this.events.on('levelUp', (data) => {
            this.handleLevelUp();
        });
        
        // Stat upgrades
        this.events.on('statUpgrade', (data) => {
            this.handleStatUpgrade(data);
        });
        
        // Input mode changed
        this.events.on('inputModeChanged', (mode) => {
            this.player.setCrosshairVisible(mode === 'controller');
        });
        
        // Level up complete
        this.events.on('levelUpComplete', () => {
            this.physics.resume();
        });
        
        // Emit items changed event for UI
        this.events.on('levelUp', () => {
            this.events.emit('itemsChanged', this.itemManager.getPlayerItems());
        });
    }
    
    /**
     * Setup keyboard and mouse input handlers
     */
    setupInputHandlers() {
        // Remove existing listeners to prevent duplicates on restart
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners('pointerdown');
        
        // Pause toggle (P key)
        this.input.keyboard.on('keydown-P', () => {
            if (!this.gameOver && !this.levelingSystem.isLevelUpPending()) {
                this.isPaused = !this.isPaused;
                if (this.isPaused) {
                    this.physics.pause();
                } else {
                    this.physics.resume();
                }
                this.uiManager.setPauseVisible(this.isPaused);
            }
        });
        
        // Debug toggle (O key)
        this.input.keyboard.on('keydown-O', () => {
            this.showDebug = !this.showDebug;
            if (this.debugGraphics) {
                this.debugGraphics.setVisible(this.showDebug);
            }
        });
        
        // Auto-fire toggle (F key)
        this.input.keyboard.on('keydown-F', () => {
            if (!this.gameOver) {
                this.itemManager.toggleAutoFire();
                console.log('🔫 Auto-fire:', this.itemManager.isAutoFireEnabled() ? 'ON' : 'OFF');
            }
        });
        
        // Mouse shooting and game restart
        this.input.on('pointerdown', () => {
            // Game over - click to restart
            if (this.gameOver) {
                // Reset game state without destroying scene
                this.resetGameState();
                return;
            }
            
            // Mouse shooting (when not in level up, not auto-firing, and not game over)
            if (!this.levelingSystem.isLevelUpPending() && !this.itemManager.isAutoFireEnabled()) {
                const currentTime = this.time.now;
                this.itemManager.handleItemShooting(
                    currentTime,
                    this.player.getRotation(),
                    this.player.getPosition(),
                    this.balls
                );
            }
        });
    }
    
    /**
     * Create debug UI
     */
    createDebugUI() {
        this.debugText = this.add.text(20, 520, '', {
            fontSize: '14px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 10 }
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(GameConfig.DEPTH.DEBUG);
        this.debugText.setVisible(false);
        
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(GameConfig.DEPTH.DEBUG);
        this.debugGraphics.setVisible(false);
    }
    
    /**
     * Main update loop
     */
    update(time, delta) {
        // Don't update until all managers are initialized
        if (!this.uiManager || !this.inputManager || !this.player) {
            return;
        }
        
        if (this.gameOver) {
            return;
        }
        
        // Update input manager FIRST (so button states are tracked)
        this.inputManager.update();
        
        // Handle gamepad buttons that should work even when paused
        this.handleGamepadButtonsAlways(time);
        
        // Handle level up input (works even when paused) - BEFORE updateButtonStates
        if (this.levelingSystem.isLevelUpPending()) {
            this.uiManager.handleLevelUpInput(this.inputManager);
        }
        
        // Update button states for next frame (AFTER checking buttons)
        this.inputManager.updateButtonStates();
        
        // Update pause indicator
        this.uiManager.setPauseVisible(this.isPaused);
        
        // Update UI animations (runs even when paused for smooth bar transitions)
        this.uiManager.update(delta);
        
        // Don't update game if paused or level up is pending
        if (this.isPaused || this.levelingSystem.isLevelUpPending()) {
            return;
        }
        
        // Update player
        this.player.update(this.inputManager);
        
        // Handle gamepad buttons (gameplay)
        this.handleGamepadButtons(time);
        
        // Auto-fire items
        if (this.itemManager.isAutoFireEnabled()) {
            this.itemManager.handleItemShooting(
                time,
                this.player.getRotation(),
                this.player.getPosition(),
                this.balls
            );
        }
        
        // Update enemies (includes spawning)
        this.enemyManager.update(time, this.player);
        
        // Update effects (poison, buffs, debuffs, etc.)
        this.effectsManager.update(time, this.enemyManager.getEnemies(), this.player);
        
        // Check collisions BEFORE updating positions
        this.collisionManager.checkBallEnemyCollisions(this.balls, this.enemyManager.getEnemies());
        this.collisionManager.checkPlayerEnemyCollisions(this.player, this.enemyManager.getEnemies());
        
        // Update previous positions AFTER collision checks
        this.updateBalls();
        this.player.updatePreviousPosition();
        
        // Update HUD
        this.updateHUD();
        
        // Update debug info
        if (this.showDebug) {
            this.updateDebug();
        }
    }
    
    /**
     * Handle gamepad buttons that should work even when paused
     */
    handleGamepadButtonsAlways(time) {
        // X Button - Toggle auto-fire (works even when paused)
        if (this.inputManager.wasButtonJustPressed('X')) {
            console.log('🎮 X button detected in handleGamepadButtonsAlways');
            const wasEnabled = this.itemManager.isAutoFireEnabled();
            this.itemManager.toggleAutoFire();
            const isEnabled = this.itemManager.isAutoFireEnabled();
            console.log('🔫 Auto-fire toggle:', wasEnabled, '=>', isEnabled);
        }
        
        // START Button - Toggle pause
        if (this.inputManager.wasButtonJustPressed('START')) {
            if (!this.gameOver && !this.levelingSystem.isLevelUpPending()) {
                this.isPaused = !this.isPaused;
                if (this.isPaused) {
                    this.physics.pause();
                } else {
                    this.physics.resume();
                }
                this.uiManager.setPauseVisible(this.isPaused);
            }
        }
    }
    
    /**
     * Handle gamepad button input (gameplay only)
     */
    handleGamepadButtons(time) {
        // A Button - Manual shooting
        if (this.inputManager.isButtonPressed('A') && !this.itemManager.isAutoFireEnabled()) {
            this.itemManager.handleItemShooting(
                time,
                this.player.getRotation(),
                this.player.getPosition(),
                this.balls
            );
        }
        
        // Right Trigger - Auto-fire while held
        if (this.inputManager.isButtonPressed('RT')) {
            this.itemManager.handleItemShooting(
                time,
                this.player.getRotation(),
                this.player.getPosition(),
                this.balls
            );
        }
    }
    
    /**
     * Update balls (remove out of bounds)
     */
    updateBalls() {
        this.balls.children.entries.forEach(ball => {
            // Update previous position for collision detection
            ball.prevX = ball.x;
            ball.prevY = ball.y;
            
            // Remove if out of bounds
            if (ball.x < -100 || ball.x > GameConfig.MAP_WIDTH + 100 ||
                ball.y < -100 || ball.y > GameConfig.MAP_HEIGHT + 100) {
                // Clean up hit tracking before destroying
                this.collisionManager.cleanupBallHits(ball);
                ball.destroy();
            }
        });
    }
    
    /**
     * Update HUD elements
     */
    updateHUD() {
        this.uiManager.updateHealthBar(this.player.getHP(), this.player.getMaxHP());
        this.uiManager.updateXPBar(this.levelingSystem.getXP(), this.levelingSystem.getXPToNextLevel());
        this.uiManager.updateStats({
            level: this.levelingSystem.getLevel(),
            enemyCount: this.enemyManager.getEnemies().countActive(),
            time: this.gameTime,
            autoFire: this.itemManager.isAutoFireEnabled()
        });
    }
    
    /**
     * Update debug information
     */
    updateDebug() {
        const debugInfo = [
            '=== DEBUG STATS ===',
            `Active Items: ${this.itemManager.getPlayerItems().length}`,
        ];
        
        this.itemManager.getPlayerItems().forEach(pi => {
            const stats = this.itemManager.getItemStats(pi);
            debugInfo.push(`  ${pi.itemType.name} Lv${pi.level}:`);
            debugInfo.push(`    DMG: ${stats.damage} | FR: ${stats.fireRate}ms`);
        });
        
        debugInfo.push(`Move Speed: ${Math.round(this.playerStats.moveSpeed)}`);
        debugInfo.push(`Active Balls: ${this.balls.countActive()}`);
        debugInfo.push(`Active Enemies: ${this.enemies.countActive()}`);
        debugInfo.push(`FPS: ${Math.round(this.game.loop.actualFps)}`);
        debugInfo.push('');
        debugInfo.push('Press O to hide');
        
        this.debugText.setText(debugInfo.join('\n'));
        this.debugText.setVisible(true);
        
        // Draw collision circles
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
        
        // Player
        this.debugGraphics.lineStyle(2, 0x00ff00, 1);
        const playerPos = this.player.getPosition();
        this.debugGraphics.strokeCircle(playerPos.x, playerPos.y, GameConfig.PLAYER.SIZE);
        
        // Enemies
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            this.debugGraphics.lineStyle(2, 0xff0000, 1);
            // Use body.radius if available, otherwise use enemyType.size
            const radius = enemy.body && enemy.body.radius ? enemy.body.radius : enemy.enemyType.size;
            this.debugGraphics.strokeCircle(enemy.x, enemy.y, radius);
        });
        
        // Balls
        this.balls.children.entries.forEach(ball => {
            if (!ball.active) return;
            this.debugGraphics.lineStyle(2, 0xffff00, 1);
            // Use body.radius if available
            const radius = ball.body && ball.body.radius ? ball.body.radius : ball.displayWidth / 2;
            this.debugGraphics.strokeCircle(ball.x, ball.y, radius);
        });
    }
    
    /**
     * Update game time
     */
    updateGameTime() {
        if (!this.isPaused && !this.gameOver) {
            this.gameTime++;
        }
    }
    
    /**
     * Handle level up
     */
    handleLevelUp() {
        this.physics.pause();
        
        const upgrades = this.levelingSystem.generateUpgradeOptions(
            this.itemManager,
            this.playerStats
        );
        
        this.uiManager.showLevelUpScreen(upgrades, () => {
            this.levelingSystem.completeLevelUp();
            this.events.emit('itemsChanged', this.itemManager.getPlayerItems());
        });
    }
    
    /**
     * Handle stat upgrades
     */
    handleStatUpgrade(data) {
        switch (data.stat) {
            case 'moveSpeed':
                this.playerStats.moveSpeed = data.value;
                this.player.setMoveSpeed(data.value);
                break;
            case 'maxHP':
                this.playerStats.maxHP = data.value;
                this.player.increaseMaxHP(data.value - this.player.getMaxHP());
                this.player.heal(20); // Also heal when getting max HP
                break;
            case 'heal':
                this.player.heal(data.value);
                break;
        }
    }
    
    /**
     * Handle game over
     */
    handleGameOver() {
        this.gameOver = true;
        this.uiManager.setGameOverVisible(true);
        console.log('💀 Game Over!');
    }
    
    /**
     * Reset game state
     */
    resetGameState() {
        this.gameOver = false;
        this.isPaused = false;
        this.gameTime = 0;
        
        // Reset player
        this.player.reset();
        this.playerStats = {
            moveSpeed: GameConfig.PLAYER.MOVE_SPEED,
            maxHP: GameConfig.PLAYER.MAX_HP
        };
        
        // Reset managers (this will clear enemies properly with their graphics)
        this.enemyManager.reset();
        this.itemManager.reset();
        this.levelingSystem.reset();
        
        // Clear physics groups (enemies already cleared above, just clear balls)
        this.balls.clear(true, true);
        
        // Reset UI
        this.uiManager.setGameOverVisible(false);
        this.uiManager.hideLevelUpScreen();
        this.events.emit('itemsChanged', this.itemManager.getPlayerItems());
    }
}

// Breakout x Vampire Survivors - Phaser 3 Game

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Map/World settings
        this.mapWidth = 1024;
        this.mapHeight = 1024;
        this.currentMap = 'grass'; // Default map type
        
        // Game state
        this.playerHP = 100;
        this.maxPlayerHP = 100;
        this.gameOver = false;
        this.score = 0;
        this.gameTime = 0;
        
        // Shooting
        this.shootCooldown = 300; // ms
        this.lastShootTime = 0;
        this.autoFire = false; // Auto-fire toggle
        
        // Enemy spawning
        this.enemySpawnRate = 2000; // ms
        this.lastSpawnTime = 0;
        this.enemySpeed = 50;
        this.minSpawnRate = 500;
        
        // Ball settings
        this.maxBounces = 5;
        this.ballSpeed = 400;
        this.ballDamage = 20;
        
        // XP and Leveling
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.xpPerKill = 20;
        this.levelUpPending = false;
        
        // Player stats (can be upgraded)
        this.playerMoveSpeed = 200;
        
        // Pause state
        this.isPaused = false;
        this.showDebug = false;
        
        // Input mode tracking
        this.inputMode = 'mouse'; // 'mouse' or 'controller'
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Enemy types configuration
        this.enemyTypes = [];
        this.enemyConfig = null;
        
        // Item system configuration
        this.itemTypes = [];
        this.itemConfig = null;
        this.playerItems = []; // Array of {itemType, level, lastFireTime}
    }
    
    preload() {
        // Load enemy configuration
        this.load.json('enemyConfig', 'enemies.json');
        // Load items configuration
        this.load.json('itemConfig', 'items.json');
        
        // Load environment/map sprite
        this.load.image('map_grass', 'assets/environment-grass.png');
        
        // Load player sprite
        this.load.image('player_sprite', 'assets/player-default.png');
        
        // Load crosshair sprite
        this.load.image('crosshair', 'assets/crosshair.png');
        
        // Load enemy sprites
        this.load.image('enemy_sprite_basic_red', 'assets/enemy-red.png');
        this.load.image('enemy_sprite_dodger_green', 'assets/enemy-green.png');
        this.load.image('enemy_sprite_wanderer_blue', 'assets/enemy-blue.png');
    }
    
    create() {
        // Load enemy configuration
        this.enemyConfig = this.cache.json.get('enemyConfig');
        this.enemyTypes = this.enemyConfig.enemyTypes;
        
        // Load items configuration
        this.itemConfig = this.cache.json.get('itemConfig');
        this.itemTypes = this.itemConfig.items;
        
        // Initialize with starting item
        const startingItem = this.itemTypes.find(i => i.isStarting);
        this.playerItems.push({
            itemType: startingItem,
            level: 1,
            lastFireTime: 0
        });
        
        // Create graphics for sprites
        this.createGraphics();
        
        // Create map/environment
        this.createMap();
        
        // Set up world bounds to match map size
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
        
        // Create player at center of map
        this.player = this.physics.add.sprite(this.mapWidth / 2, this.mapHeight / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setCircle(15); // Set collision circle (radius 15)
        
        // Scale player sprite to match collision size (diameter = 30 pixels)
        const playerTargetSize = 30; // 2 * radius
        if (this.player.texture.key === 'player' && this.textures.exists('player_sprite')) {
            // If using the loaded sprite, scale it to match collision size
            const spriteWidth = this.player.width;
            const scale = playerTargetSize / spriteWidth;
            this.player.setScale(scale);
        }
        
        // Add visual effects to make player stand out
        this.player.setTint(0xffffff); // Ensure full brightness
        this.player.setDepth(10); // Above most things
        
        // Add a subtle shadow under player
        this.playerShadow = this.add.circle(this.player.x, this.player.y + 3, 15, 0x000000, 0.3);
        this.playerShadow.setDepth(9); // Just below player
        
        // Create crosshair for aiming indicator
        this.crosshair = this.add.sprite(this.player.x, this.player.y, 'crosshair');
        this.crosshair.setScale(0.05); // Scale down from 512x512 to ~25 pixels
        this.crosshair.setDepth(11); // Above player
        this.crosshair.setAlpha(0.8); // Slightly transparent
        this.crosshair.setVisible(false); // Hidden by default (mouse mode)
        this.crosshairDistance = 40; // Distance from player
        
        // Track previous position for continuous collision
        this.player.prevX = this.player.x;
        this.player.prevY = this.player.y;
        
        // Camera shows entire map (no following, static view)
        // this.cameras.main.startFollow(this.player); // Disabled - showing full map
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        
        // Create groups
        this.balls = this.physics.add.group();
        this.enemies = this.physics.add.group();
        
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Set up gamepad/controller support
        this.gamepad = null;
        
        // Add browser-level gamepad detection
        console.log('🎮 Gamepad API available:', !!navigator.getGamepads);
        
        // Check for already connected gamepads
        const existingGamepads = navigator.getGamepads();
        existingGamepads.forEach((gp, i) => {
            if (gp) {
                console.log(`🎮 Gamepad ${i} already connected:`, gp.id);
            }
        });
        
        // Start the gamepad plugin
        if (this.input.gamepad) {
            this.input.gamepad.on('connected', (pad) => {
                console.log('✅ Controller connected via Phaser:', pad.id);
                console.log('   Buttons:', pad.buttons.length);
                console.log('   Axes:', pad.axes.length);
                this.gamepad = pad;
                
                // Hide controller hint if it exists
                if (this.controllerHint) {
                    this.controllerHint.destroy();
                    this.controllerHint = null;
                }
                
                // Show on-screen notification
                const connectText = this.add.text(this.mapWidth / 2, this.mapHeight / 2 - 100, '🎮 Controller Connected!', {
                    fontSize: '32px',
                    fill: '#00ff00',
                    stroke: '#000000',
                    strokeThickness: 4
                });
                connectText.setOrigin(0.5);
                connectText.setScrollFactor(0);
                connectText.setDepth(300);
                
                this.time.delayedCall(2000, () => {
                    connectText.destroy();
                });
            });
            
            this.input.gamepad.on('disconnected', (pad) => {
                console.log('❌ Controller disconnected:', pad.id);
                this.gamepad = null;
            });
        }
        
        // Controller button indices (Xbox/PlayStation layout)
        this.BUTTONS = {
            A: 0,        // A/Cross
            B: 1,        // B/Circle
            X: 2,        // X/Square
            Y: 3,        // Y/Triangle
            LB: 4,
            RB: 5,
            LT: 6,
            RT: 7,
            SELECT: 8,
            START: 9
        };
        
        // Auto-fire toggle
        this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.fKey.on('down', () => {
            this.autoFire = !this.autoFire;
            console.log('Auto-fire:', this.autoFire ? 'ON' : 'OFF');
        });
        
        // Pause toggle
        this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.pKey.on('down', () => {
            if (!this.gameOver && !this.levelUpPending) {
                this.isPaused = !this.isPaused;
                if (this.isPaused) {
                    this.physics.pause();
                } else {
                    this.physics.resume();
                }
            }
        });
        
        // Debug toggle (O key)
        this.oKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        this.oKey.on('down', () => {
            this.showDebug = !this.showDebug;
            this.debugGraphics.setVisible(this.showDebug);
        });
        
        // Mouse input - manual fire all items
        this.input.on('pointerdown', () => {
            if (!this.levelUpPending && !this.autoFire) {
                const currentTime = this.time.now;
                this.handleItemShooting(currentTime);
            }
        });
        
        // Track mouse movement to detect input mode switch
        this.input.on('pointermove', (pointer) => {
            const mouseMoveThreshold = 5; // pixels
            const deltaX = Math.abs(pointer.x - this.lastMouseX);
            const deltaY = Math.abs(pointer.y - this.lastMouseY);
            
            if (deltaX > mouseMoveThreshold || deltaY > mouseMoveThreshold) {
                if (this.inputMode !== 'mouse') {
                    console.log('🖱️ Switched to mouse control');
                    this.inputMode = 'mouse';
                    this.crosshair.setVisible(false);
                }
            }
            
            this.lastMouseX = pointer.x;
            this.lastMouseY = pointer.y;
        });
        
        // Initialize mouse position tracking
        this.lastMouseX = this.input.activePointer.x;
        this.lastMouseY = this.input.activePointer.y;
        
        // Set up collisions
        // Note: Ball-enemy collision now uses continuous collision in updateBalls()
        // this.physics.add.overlap(this.balls, this.enemies, this.ballHitEnemy, null, this);
        
        // Note: Player-enemy collision now uses continuous collision in update()
        // this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        
        // Create HUD
        this.createHUD();
        
        // Add controller activation hint
        this.controllerHint = this.add.text(this.mapWidth / 2, 50, 
            'Press any button on your controller to activate it', {
            fontSize: '18px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        });
        this.controllerHint.setOrigin(0.5);
        this.controllerHint.setScrollFactor(0);
        this.controllerHint.setDepth(250);
        
        // Hide hint after 5 seconds or when controller connects
        this.time.delayedCall(5000, () => {
            if (this.controllerHint) {
                this.controllerHint.destroy();
            }
        });
        
        // Start game timer
        this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });
    }
    
    createGraphics() {
        // Create player sprite - use image if available, otherwise generate texture
        if (!this.textures.exists('player')) {
            if (this.textures.exists('player_sprite')) {
                // Player sprite loaded, we'll use 'player_sprite' key but create 'player' alias
                // by copying the frame data
                const spriteTexture = this.textures.get('player_sprite');
                const frame = spriteTexture.get();
                
                // Create a new texture key 'player' that references the same image
                this.textures.addImage('player', frame.source.image);
            } else {
                // Fallback: Create procedural player sprite (blue circle)
                const playerGraphics = this.add.graphics();
                playerGraphics.fillStyle(0x4444ff, 1);
                playerGraphics.fillCircle(16, 16, 15);
                playerGraphics.generateTexture('player', 32, 32);
                playerGraphics.destroy();
            }
        }
        
        // Create projectile sprites for each item type
        this.itemTypes.forEach(itemType => {
            const size = itemType.visual.size;
            const color = parseInt(itemType.visual.color, 16);
            const glowColor = parseInt(itemType.visual.glowColor, 16);
            const diameter = size * 2 + 6; // Bigger for stronger glow
            
            const projGraphics = this.add.graphics();
            
            // Outer glow effect (stronger)
            projGraphics.fillStyle(glowColor, 0.5);
            projGraphics.fillCircle(diameter / 2, diameter / 2, size + 3);
            
            // Inner glow
            projGraphics.fillStyle(glowColor, 0.7);
            projGraphics.fillCircle(diameter / 2, diameter / 2, size + 1);
            
            // Main ball (brighter)
            projGraphics.fillStyle(color, 1);
            projGraphics.fillCircle(diameter / 2, diameter / 2, size);
            
            // Stronger highlight
            projGraphics.fillStyle(0xffffff, 0.8);
            projGraphics.fillCircle(diameter / 2 - size / 3, diameter / 2 - size / 3, size / 2.5);
            
            projGraphics.generateTexture(`projectile_${itemType.id}`, diameter, diameter);
            projGraphics.destroy();
        });
        
        // Create enemy sprites for each type
        this.enemyTypes.forEach(enemyType => {
            // Skip if sprite image is defined (will use loaded sprite instead)
            if (enemyType.sprite) {
                console.log(`Using sprite for ${enemyType.id}: ${enemyType.sprite}`);
                return;
            }
            
            const size = enemyType.size;
            const color = parseInt(enemyType.color, 16);
            const diameter = size * 2 + 4;
            
            const enemyGraphics = this.add.graphics();
            enemyGraphics.fillStyle(color, 1);
            enemyGraphics.fillCircle(diameter / 2, diameter / 2, size);
            
            // Add outline
            enemyGraphics.lineStyle(2, 0xffffff, 0.3);
            enemyGraphics.strokeCircle(diameter / 2, diameter / 2, size);
            
            enemyGraphics.generateTexture(`enemy_${enemyType.id}`, diameter, diameter);
            enemyGraphics.destroy();
        });
    }
    
    createMap() {
        // Create map background based on current map type
        // Future: Add support for different map types (grass, desert, snow, etc.)
        
        const mapConfigs = {
            grass: {
                sprite: 'map_grass',
                fallbackColor: 0x4a7c3b // Green fallback
            },
            // Future maps can be added here:
            // desert: { sprite: 'map_desert', fallbackColor: 0xd4a574 },
            // snow: { sprite: 'map_snow', fallbackColor: 0xf0f8ff }
        };
        
        const config = mapConfigs[this.currentMap] || mapConfigs.grass;
        
        if (this.textures.exists(config.sprite)) {
            // Use the loaded map sprite
            this.mapBackground = this.add.image(0, 0, config.sprite);
            this.mapBackground.setOrigin(0, 0);
            this.mapBackground.setDisplaySize(this.mapWidth, this.mapHeight);
            this.mapBackground.setDepth(-100); // Behind everything
            
            // Dim the background to make game elements stand out more
            this.mapBackground.setAlpha(0.65); // 65% visible (35% darker)
            this.mapBackground.setTint(0xcccccc); // Slight desaturation
        } else {
            // Fallback to solid color background
            this.mapBackground = this.add.rectangle(
                this.mapWidth / 2,
                this.mapHeight / 2,
                this.mapWidth,
                this.mapHeight,
                config.fallbackColor
            );
            this.mapBackground.setDepth(-100);
            this.mapBackground.setAlpha(0.65); // Dim fallback too
        }
    }
    
    createHUD() {
        // === HEALTH BAR ===
        const hpBarX = 20;
        const hpBarY = 20;
        const hpBarWidth = 200;
        const hpBarHeight = 25;
        
        // HP Bar background
        this.hpBarBg = this.add.rectangle(hpBarX, hpBarY, hpBarWidth, hpBarHeight, 0x333333);
        this.hpBarBg.setOrigin(0, 0);
        this.hpBarBg.setStrokeStyle(2, 0x000000);
        this.hpBarBg.setScrollFactor(0);
        this.hpBarBg.setDepth(100);
        
        // HP Bar fill
        this.hpBarFill = this.add.rectangle(hpBarX + 2, hpBarY + 2, hpBarWidth - 4, hpBarHeight - 4, 0x00ff00);
        this.hpBarFill.setOrigin(0, 0);
        this.hpBarFill.setScrollFactor(0);
        this.hpBarFill.setDepth(101);
        
        // HP Text overlay
        this.hpText = this.add.text(hpBarX + hpBarWidth / 2, hpBarY + hpBarHeight / 2, `${this.playerHP}/${this.maxPlayerHP}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.hpText.setOrigin(0.5);
        this.hpText.setScrollFactor(0);
        this.hpText.setDepth(102);
        
        // === XP BAR ===
        const xpBarX = 20;
        const xpBarY = 55;
        const xpBarWidth = 200;
        const xpBarHeight = 20;
        
        // XP Bar background
        this.xpBarBg = this.add.rectangle(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 0x222244);
        this.xpBarBg.setOrigin(0, 0);
        this.xpBarBg.setStrokeStyle(2, 0x4444ff);
        this.xpBarBg.setScrollFactor(0);
        this.xpBarBg.setDepth(100);
        
        // XP Bar fill (will be animated)
        this.xpBarFill = this.add.rectangle(xpBarX + 2, xpBarY + 2, 0, xpBarHeight - 4, 0x00aaff);
        this.xpBarFill.setOrigin(0, 0);
        this.xpBarFill.setScrollFactor(0);
        this.xpBarFill.setDepth(101);
        
        // XP gradient effect (overlay)
        this.xpBarGlow = this.add.rectangle(xpBarX + 2, xpBarY + 2, 0, xpBarHeight - 4, 0x66ccff);
        this.xpBarGlow.setOrigin(0, 0);
        this.xpBarGlow.setScrollFactor(0);
        this.xpBarGlow.setDepth(101);
        this.xpBarGlow.setAlpha(0.5);
        
        // XP Text overlay
        this.xpText = this.add.text(xpBarX + xpBarWidth / 2, xpBarY + xpBarHeight / 2, `XP: ${this.xp}/${this.xpToNextLevel}`, {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.xpText.setOrigin(0.5);
        this.xpText.setScrollFactor(0);
        this.xpText.setDepth(102);
        
        // === LEVEL TEXT ===
        this.levelText = this.add.text(230, 20, `Level: ${this.level}`, {
            fontSize: '20px',
            fill: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.levelText.setScrollFactor(0);
        this.levelText.setDepth(101);
        
        // === STATS TEXT ===
        this.enemyCountText = this.add.text(230, 50, 'Enemies: 0', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        this.enemyCountText.setScrollFactor(0);
        this.enemyCountText.setDepth(101);
        
        this.timeText = this.add.text(230, 70, 'Time: 0s', {
            fontSize: '16px',
            fill: '#aaaaaa'
        });
        this.timeText.setScrollFactor(0);
        this.timeText.setDepth(101);
        
        // Auto-fire indicator
        this.autoFireText = this.add.text(780, 20, 'Auto: OFF', {
            fontSize: '18px',
            fill: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.autoFireText.setOrigin(1, 0);
        this.autoFireText.setScrollFactor(0);
        this.autoFireText.setDepth(101);
        
        // Active items display
        this.itemsContainer = this.add.container(20, 120);
        this.itemsContainer.setScrollFactor(0);
        this.itemsContainer.setDepth(101);
        this.itemIcons = []; // Will hold item icon displays
        
        // Pause indicator (hidden initially)
        this.pauseText = this.add.text(400, 250, 'PAUSED\nPress P to Resume', {
            fontSize: '48px',
            fill: '#ffff00',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.pauseText.setOrigin(0.5);
        this.pauseText.setVisible(false);
        this.pauseText.setDepth(150);
        
        // Debug info (hidden initially)
        this.debugText = this.add.text(20, 520, '', {
            fontSize: '14px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 10 }
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(102);
        
        // Debug collision graphics
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(100);
        this.debugGraphics.setVisible(false);
        this.debugText.setDepth(101);
        this.debugText.setVisible(false);
        
        // Game over text (hidden initially) - fixed to camera center
        this.gameOverText = this.add.text(0, 0, 'GAME OVER\nClick to Restart', {
            fontSize: '48px',
            fill: '#ff0000',
            align: 'center'
        });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setVisible(false);
        this.gameOverText.setScrollFactor(0);
        this.gameOverText.setDepth(102);
        
        // Position at camera center
        this.gameOverText.setPosition(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );
        
        // Level up UI (hidden initially)
        this.createLevelUpUI();
        
        // Initialize items display
        this.updateItemsDisplay();
    }
    
    createLevelUpUI() {
        // Dark overlay - covers entire camera view
        const camWidth = this.cameras.main.width;
        const camHeight = this.cameras.main.height;
        
        this.levelUpOverlay = this.add.rectangle(camWidth / 2, camHeight / 2, camWidth, camHeight, 0x000000, 0.8);
        this.levelUpOverlay.setScrollFactor(0);
        this.levelUpOverlay.setDepth(200);
        this.levelUpOverlay.setVisible(false);
        
        // Title
        this.levelUpTitle = this.add.text(camWidth / 2, 100, 'LEVEL UP!', {
            fontSize: '48px',
            fill: '#ffff00',
            fontStyle: 'bold'
        });
        this.levelUpTitle.setOrigin(0.5);
        this.levelUpTitle.setScrollFactor(0);
        this.levelUpTitle.setDepth(201);
        this.levelUpTitle.setVisible(false);
        
        // Subtitle
        this.levelUpSubtitle = this.add.text(camWidth / 2, 160, 'Choose an upgrade:', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        this.levelUpSubtitle.setOrigin(0.5);
        this.levelUpSubtitle.setScrollFactor(0);
        this.levelUpSubtitle.setDepth(201);
        this.levelUpSubtitle.setVisible(false);
        
        // Upgrade option containers
        this.upgradeOptions = [];
        const upgradeY = camHeight / 2;
        const spacing = 250;
        const startX = camWidth / 2 - spacing;
        
        for (let i = 0; i < 3; i++) {
            const x = startX + (i * spacing);
            
            // Button background
            const btn = this.add.rectangle(x, upgradeY, 200, 150, 0x333333, 1);
            btn.setStrokeStyle(3, 0xffffff);
            btn.setScrollFactor(0);
            btn.setDepth(201);
            btn.setVisible(false);
            btn.setInteractive();
            
            // Button text
            const text = this.add.text(x, upgradeY, '', {
                fontSize: '20px',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: 180 }
            });
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(202);
            text.setVisible(false);
            
            // Hover effects
            btn.on('pointerover', () => {
                btn.setFillStyle(0x555555);
            });
            btn.on('pointerout', () => {
                btn.setFillStyle(0x333333);
            });
            
            this.upgradeOptions.push({ btn, text });
        }
    }

    
    update(time, delta) {
        // Debug: Check gamepad status every second
        if (time % 1000 < 16) { // Roughly once per second
            const gp = navigator.getGamepads()[0];
            if (gp) {
                console.log('🎮 Gamepad detected:', gp.id);
                console.log('   Left stick X:', gp.axes[0].toFixed(2), 'Y:', gp.axes[1].toFixed(2));
                console.log('   Right stick X:', gp.axes[2].toFixed(2), 'Y:', gp.axes[3].toFixed(2));
                console.log('   A button:', gp.buttons[0].pressed ? 'PRESSED' : 'not pressed');
            } else {
                console.log('❌ No gamepad detected in browser');
            }
        }
        
        if (this.gameOver) {
            // Check for restart
            if (this.input.activePointer.isDown) {
                this.scene.restart();
                this.resetGameState();
            }
            return;
        }
        
        // Update pause indicator
        this.pauseText.setVisible(this.isPaused);
        
        // Don't update game if paused or level up is pending
        if (this.isPaused || this.levelUpPending) {
            return;
        }
        
        // Player movement
        this.handlePlayerMovement();
        
        // Check player-enemy continuous collision
        this.checkPlayerContinuousCollision();
        
        // Update player previous position after collision check
        this.player.prevX = this.player.x;
        this.player.prevY = this.player.y;
        
        // Player rotation toward mouse
        this.handlePlayerRotation();
        
        // Update player shadow position
        if (this.playerShadow) {
            this.playerShadow.setPosition(this.player.x, this.player.y + 3);
        }
        
        // Handle gamepad button input
        this.handleGamepadButtons(time);
        
        // Auto-fire all items
        if (this.autoFire) {
            this.handleItemShooting(time);
        }
        
        // Spawn enemies
        this.handleEnemySpawning(time);
        
        // Update enemies
        this.updateEnemies();
        
        // Update balls
        this.updateBalls();
        
        // Update HUD
        this.updateHUD();
        
        // Update debug info and collision visualization
        this.updateDebug();
    }
    
    handlePlayerMovement() {
        let velocityX = 0;
        let velocityY = 0;
        
        // Keyboard input
        if (this.wasd.a.isDown) {
            velocityX = -this.playerMoveSpeed;
        } else if (this.wasd.d.isDown) {
            velocityX = this.playerMoveSpeed;
        }
        
        if (this.wasd.w.isDown) {
            velocityY = -this.playerMoveSpeed;
        } else if (this.wasd.s.isDown) {
            velocityY = this.playerMoveSpeed;
        }
        
        // Gamepad left stick input (overrides keyboard if present)
        if (this.gamepad) {
            const leftStick = this.gamepad.leftStick;
            const deadzone = 0.15; // Ignore small movements
            
            if (Math.abs(leftStick.x) > deadzone) {
                velocityX = leftStick.x * this.playerMoveSpeed;
            }
            if (Math.abs(leftStick.y) > deadzone) {
                velocityY = leftStick.y * this.playerMoveSpeed;
            }
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        this.player.setVelocity(velocityX, velocityY);
    }
    
    handlePlayerRotation() {
        let angle;
        let usingGamepad = false;
        
        // Gamepad right stick aiming (priority)
        if (this.gamepad) {
            const rightStick = this.gamepad.rightStick;
            const deadzone = 0.2;
            
            if (Math.abs(rightStick.x) > deadzone || Math.abs(rightStick.y) > deadzone) {
                angle = Math.atan2(rightStick.y, rightStick.x);
                usingGamepad = true;
                
                // Switch to controller mode
                if (this.inputMode !== 'controller') {
                    console.log('🎮 Switched to controller control');
                    this.inputMode = 'controller';
                    this.crosshair.setVisible(true);
                }
            }
        }
        
        // Mouse aiming (fallback)
        if (!usingGamepad) {
            const pointer = this.input.activePointer;
            angle = Phaser.Math.Angle.Between(
                this.player.x,
                this.player.y,
                pointer.x,
                pointer.y
            );
        }
        
        this.player.rotation = angle;
        
        // Update crosshair position to show aim direction
        if (this.crosshair) {
            this.crosshair.x = this.player.x + Math.cos(angle) * this.crosshairDistance;
            this.crosshair.y = this.player.y + Math.sin(angle) * this.crosshairDistance;
            this.crosshair.rotation = angle;
        }
    }
    
    handleGamepadButtons(time) {
        if (!this.gamepad) return;
        
        // A Button (0) - Manual shooting (when auto-fire is off)
        if (this.gamepad.buttons[this.BUTTONS.A].pressed && !this.autoFire) {
            this.handleItemShooting(time);
        }
        
        // X Button (2) - Toggle auto-fire
        if (this.gamepad.buttons[this.BUTTONS.X].justDown) {
            this.autoFire = !this.autoFire;
            console.log('🎮 Auto-fire:', this.autoFire ? 'ON' : 'OFF');
        }
        
        // START Button (9) - Toggle pause
        if (this.gamepad.buttons[this.BUTTONS.START].justDown) {
            if (!this.gameOver && !this.levelUpPending) {
                this.isPaused = !this.isPaused;
                if (this.isPaused) {
                    this.physics.pause();
                } else {
                    this.physics.resume();
                }
                console.log('🎮 Pause:', this.isPaused ? 'ON' : 'OFF');
            }
        }
        
        // Right Trigger (RT) - Auto-fire while held
        if (this.gamepad.buttons[this.BUTTONS.RT].pressed) {
            this.handleItemShooting(time);
        }
    }
    
    handleItemShooting(currentTime) {
        if (this.gameOver) return;
        
        // Fire each item independently based on its own timer
        this.playerItems.forEach(playerItem => {
            const itemStats = this.getItemStats(playerItem);
            const fireRate = itemStats.fireRate;
            
            // Check if this item is ready to fire
            if (currentTime - playerItem.lastFireTime >= fireRate) {
                this.shootItem(playerItem, currentTime);
                playerItem.lastFireTime = currentTime;
            }
        });
    }
    
    shootItem(playerItem, currentTime) {
        const itemType = playerItem.itemType;
        const itemStats = this.getItemStats(playerItem);
        const behavior = this.getItemBehavior(playerItem);
        
        const numProjectiles = behavior.projectilesPerShot;
        const spreadAngle = behavior.spreadAngle;
        
        // Use player rotation as base angle (which already handles mouse/controller)
        const baseAngle = this.player.rotation;
        
        // Shoot multiple projectiles if needed
        for (let i = 0; i < numProjectiles; i++) {
            // Calculate spread angle for this projectile
            let angleOffset = 0;
            if (numProjectiles > 1) {
                // Distribute projectiles evenly across spread angle
                const angleStep = spreadAngle / (numProjectiles - 1);
                angleOffset = (i * angleStep - spreadAngle / 2) * (Math.PI / 180);
            }
            
            const shootAngle = baseAngle + angleOffset;
            
            // Create ball at player position
            const ball = this.balls.create(
                this.player.x, 
                this.player.y, 
                `projectile_${itemType.id}`
            );
            
            // Set collision circle - need to use body.setCircle for physics groups
            ball.body.setCircle(itemStats.size);
            
            // Make projectiles bright and stand out
            ball.setTint(0xffffff); // Full brightness
            ball.setDepth(15); // Above player and enemies
            ball.setAlpha(1.0); // Fully opaque
            
            // Set velocity
            ball.setVelocity(
                Math.cos(shootAngle) * itemStats.speed,
                Math.sin(shootAngle) * itemStats.speed
            );
            
            // Ball properties from item stats
            ball.bounceCount = 0;
            ball.maxBounces = itemStats.maxBounces;
            ball.damage = itemStats.damage;
            ball.knockback = itemStats.knockback;
            ball.itemType = itemType;
            ball.itemLevel = playerItem.level;
            
            // Set bounce enabled
            ball.setBounce(1, 1);
        }
    }
    
    getItemStats(playerItem) {
        const baseStats = playerItem.itemType.baseStats;
        const levelUpBonus = playerItem.itemType.levelUpBonus;
        const level = playerItem.level;
        
        // Calculate stats with level bonuses
        return {
            damage: baseStats.damage + (levelUpBonus.damage * (level - 1)),
            speed: baseStats.speed + (levelUpBonus.speed * (level - 1)),
            maxBounces: baseStats.maxBounces + (levelUpBonus.maxBounces * (level - 1)),
            size: baseStats.size,
            knockback: baseStats.knockback,
            fireRate: Math.max(100, baseStats.fireRate + (levelUpBonus.fireRate * (level - 1)))
        };
    }
    
    getItemBehavior(playerItem) {
        const baseBehavior = playerItem.itemType.behavior;
        const level = playerItem.level;
        const levelUpBehavior = playerItem.itemType.levelUpBehavior;
        
        // Check for level-specific behavior changes
        if (levelUpBehavior) {
            const levelKey = `level${level}`;
            if (levelUpBehavior[levelKey]) {
                return { ...baseBehavior, ...levelUpBehavior[levelKey] };
            }
        }
        
        return baseBehavior;
    }
    
    handleEnemySpawning(time) {
        if (time - this.lastSpawnTime < this.enemySpawnRate) return;
        
        this.lastSpawnTime = time;
        
        // Select random enemy type based on spawn weight
        const enemyType = this.selectRandomEnemyType();
        
        // Spawn at random edge of map
        const edge = Phaser.Math.Between(0, 3);
        let x, y;
        
        switch(edge) {
            case 0: // Top
                x = Phaser.Math.Between(0, this.mapWidth);
                y = -20;
                break;
            case 1: // Right
                x = this.mapWidth + 20;
                y = Phaser.Math.Between(0, this.mapHeight);
                break;
            case 2: // Bottom
                x = Phaser.Math.Between(0, this.mapWidth);
                y = this.mapHeight + 20;
                break;
            case 3: // Left
                x = -20;
                y = Phaser.Math.Between(0, this.mapHeight);
                break;
        }
        
        // Create enemy with type - use sprite if available, otherwise use generated texture
        const textureKey = enemyType.sprite ? `enemy_sprite_${enemyType.id}` : `enemy_${enemyType.id}`;
        const enemy = this.enemies.create(x, y, textureKey);
        
        // Scale sprite to match collision size if using sprite
        if (enemyType.sprite) {
            // Scale the sprite to fit the collision circle diameter
            const targetDiameter = enemyType.size * 2;
            const scale = targetDiameter / Math.max(enemy.width, enemy.height);
            enemy.setScale(scale);
            
            // After scaling, set the physics body to match
            // The body should be a circle centered on the scaled sprite
            const bodySize = targetDiameter;
            const offsetX = (enemy.displayWidth - bodySize) / 2;
            const offsetY = (enemy.displayHeight - bodySize) / 2;
            enemy.body.setCircle(enemyType.size, offsetX, offsetY);
        } else {
            // For generated textures, use simple circle
            enemy.setCircle(enemyType.size);
        }
        
        enemy.hp = enemyType.hp;
        enemy.maxHP = enemyType.hp;
        enemy.damage = enemyType.damage;
        enemy.speed = enemyType.baseSpeed + (this.enemySpeed - 50); // Add difficulty scaling
        enemy.enemyType = enemyType;
        
        // Add shadow under enemy for depth
        enemy.shadow = this.add.circle(x, y + 3, enemyType.size, 0x000000, 0.25);
        enemy.shadow.setDepth(8); // Below enemies but above ground
        
        // Make enemy stand out with brightness
        enemy.setTint(0xffffff);
        enemy.setDepth(10);
        
        // Create health bar for enemy
        const healthBarWidth = enemyType.size * 2;
        const healthBarHeight = 3;
        const healthBarY = -enemyType.size - 8;
        
        // Health bar background
        enemy.healthBarBg = this.add.graphics();
        enemy.healthBarBg.setDepth(50);
        
        // Health bar fill
        enemy.healthBarFill = this.add.graphics();
        enemy.healthBarFill.setDepth(51);
        
        // Initialize behavior-specific properties
        if (enemyType.behavior.movementPattern === 'sinusoidal_chase') {
            enemy.sinOffset = Math.random() * Math.PI * 2; // Random phase
            enemy.sinTime = 0;
        } else if (enemyType.behavior.movementPattern === 'random_wander') {
            enemy.wanderAngle = Math.random() * Math.PI * 2;
            enemy.lastDirectionChange = time;
        }
    }
    
    selectRandomEnemyType() {
        // Calculate total weight
        const totalWeight = this.enemyTypes.reduce((sum, type) => sum + type.spawnWeight, 0);
        
        // Pick random value
        let random = Math.random() * totalWeight;
        
        // Select enemy type
        for (const enemyType of this.enemyTypes) {
            random -= enemyType.spawnWeight;
            if (random <= 0) {
                return enemyType;
            }
        }
        
        // Fallback to first type
        return this.enemyTypes[0];
    }
    
    updateEnemies() {
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active || !enemy.enemyType) return;
            
            const behavior = enemy.enemyType.behavior;
            
            // Handle different movement patterns
            switch(behavior.movementPattern) {
                case 'direct_chase':
                    this.moveEnemyDirectChase(enemy);
                    break;
                    
                case 'sinusoidal_chase':
                    this.moveEnemySinusoidalChase(enemy, behavior);
                    break;
                    
                case 'random_wander':
                    this.moveEnemyRandomWander(enemy, behavior);
                    break;
            }
            
            // Update shadow position
            if (enemy.shadow) {
                enemy.shadow.setPosition(enemy.x, enemy.y + 3);
            }
            
            // Update health bar position and appearance
            if (enemy.healthBarBg && enemy.healthBarFill) {
                const healthBarWidth = enemy.enemyType.size * 2;
                const healthBarHeight = 3;
                const healthBarY = enemy.y - enemy.enemyType.size - 8;
                
                // Update background
                enemy.healthBarBg.clear();
                enemy.healthBarBg.fillStyle(0x000000, 1);
                enemy.healthBarBg.fillRect(
                    enemy.x - healthBarWidth / 2,
                    healthBarY - healthBarHeight / 2,
                    healthBarWidth,
                    healthBarHeight
                );
                
                // Update fill based on HP
                const hpPercent = Math.max(0, enemy.hp / enemy.maxHP);
                const fillWidth = healthBarWidth * hpPercent;
                
                enemy.healthBarFill.clear();
                
                // Color based on HP
                let healthColor = 0x00ff00;
                if (hpPercent < 0.3) {
                    healthColor = 0xff0000;
                } else if (hpPercent < 0.6) {
                    healthColor = 0xffaa00;
                }
                
                enemy.healthBarFill.fillStyle(healthColor, 1);
                enemy.healthBarFill.fillRect(
                    enemy.x - healthBarWidth / 2,
                    healthBarY - healthBarHeight / 2,
                    fillWidth,
                    healthBarHeight
                );
            }
            
            // Remove if too far from map bounds (100px margin)
            if (enemy.x < -100 || enemy.x > this.mapWidth + 100 || 
                enemy.y < -100 || enemy.y > this.mapHeight + 100) {
                if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                if (enemy.healthBarFill) enemy.healthBarFill.destroy();
                if (enemy.shadow) enemy.shadow.destroy();
                enemy.destroy();
            }
        });
    }
    
    moveEnemyDirectChase(enemy) {
        // Standard direct movement toward player
        const angle = Phaser.Math.Angle.Between(
            enemy.x,
            enemy.y,
            this.player.x,
            this.player.y
        );
        
        enemy.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
        );
    }
    
    moveEnemySinusoidalChase(enemy, behavior) {
        // Move toward player but with sinusoidal wave pattern
        const angleToPlayer = Phaser.Math.Angle.Between(
            enemy.x,
            enemy.y,
            this.player.x,
            this.player.y
        );
        
        // Update sin time
        enemy.sinTime += 0.1;
        
        // Calculate perpendicular angle
        const perpAngle = angleToPlayer + Math.PI / 2;
        
        // Add sinusoidal offset
        const sinOffset = Math.sin(enemy.sinTime * behavior.frequency + enemy.sinOffset) * behavior.amplitude;
        
        // Calculate velocity with wave
        const baseVx = Math.cos(angleToPlayer) * enemy.speed;
        const baseVy = Math.sin(angleToPlayer) * enemy.speed;
        
        const offsetVx = Math.cos(perpAngle) * sinOffset;
        const offsetVy = Math.sin(perpAngle) * sinOffset;
        
        enemy.setVelocity(baseVx + offsetVx, baseVy + offsetVy);
    }
    
    moveEnemyRandomWander(enemy, behavior) {
        // Change direction periodically
        const currentTime = this.time.now;
        if (currentTime - enemy.lastDirectionChange > behavior.directionChangeInterval) {
            // Pick new random direction
            enemy.wanderAngle = Math.random() * Math.PI * 2;
            enemy.lastDirectionChange = currentTime;
        }
        
        // Move in current wander direction
        enemy.setVelocity(
            Math.cos(enemy.wanderAngle) * enemy.speed,
            Math.sin(enemy.wanderAngle) * enemy.speed
        );
    }

    
    updateBalls() {
        this.balls.children.entries.forEach(ball => {
            if (!ball.active) return;
            
            // Store previous position for swept collision
            if (!ball.prevX) {
                ball.prevX = ball.x;
                ball.prevY = ball.y;
            }
            
            // Perform continuous collision detection
            this.checkBallContinuousCollision(ball);
            
            // Update previous position for next frame
            ball.prevX = ball.x;
            ball.prevY = ball.y;
            
            // Remove if out of bounds (with 50px margin outside map)
            if (ball.x < -50 || ball.x > this.mapWidth + 50 || 
                ball.y < -50 || ball.y > this.mapHeight + 50) {
                ball.destroy();
            }
        });
    }
    
    checkBallContinuousCollision(ball) {
        // Get ball movement vector
        const dx = ball.x - ball.prevX;
        const dy = ball.y - ball.prevY;
        
        // If ball hasn't moved much, skip expensive collision check
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
        
        let closestCollision = null;
        let closestT = 1.0; // Parametric time (0 = start, 1 = end)
        
        // Check collision with all enemies
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            
            // Swept circle-circle collision
            const collision = this.sweptCircleCircle(
                ball.prevX, ball.prevY, ball.displayWidth / 2,
                ball.x, ball.y,
                enemy.x, enemy.y, enemy.enemyType.size
            );
            
            if (collision && collision.t < closestT) {
                closestT = collision.t;
                closestCollision = { enemy: enemy, t: collision.t };
            }
        });
        
        // Handle the earliest collision
        if (closestCollision) {
            // Move ball to collision point
            ball.x = ball.prevX + dx * closestCollision.t;
            ball.y = ball.prevY + dy * closestCollision.t;
            
            // Handle collision
            this.ballHitEnemy(ball, closestCollision.enemy);
        }
    }
    
    checkPlayerContinuousCollision() {
        // Get player movement vector
        const dx = this.player.x - this.player.prevX;
        const dy = this.player.y - this.player.prevY;
        
        let closestCollision = null;
        let closestT = 1.0; // Parametric time (0 = start, 1 = end)
        
        // Check collision with all enemies
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            
            // If player hasn't moved, check for direct overlap
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    enemy.x, enemy.y
                );
                const combinedRadius = 15 + enemy.enemyType.size;
                
                if (dist < combinedRadius) {
                    // Already overlapping
                    closestT = 0;
                    closestCollision = { enemy: enemy, t: 0 };
                }
            } else {
                // Swept circle-circle collision for moving player
                const collision = this.sweptCircleCircle(
                    this.player.prevX, this.player.prevY, 15, // player radius
                    this.player.x, this.player.y,
                    enemy.x, enemy.y, enemy.enemyType.size
                );
                
                if (collision && collision.t < closestT) {
                    closestT = collision.t;
                    closestCollision = { enemy: enemy, t: collision.t };
                }
            }
        });
        
        // Handle the earliest collision
        if (closestCollision) {
            // Move player to collision point (if moving)
            if (Math.abs(dx) >= 0.1 || Math.abs(dy) >= 0.1) {
                this.player.x = this.player.prevX + dx * closestCollision.t;
                this.player.y = this.player.prevY + dy * closestCollision.t;
            }
            
            // Handle collision
            this.enemyHitPlayer(this.player, closestCollision.enemy);
        }
    }
    
    sweptCircleCircle(x1, y1, r1, x2, y2, cx, cy, r2) {
        // Swept collision between moving circle (x1,y1 -> x2,y2 with radius r1)
        // and static circle (cx,cy with radius r2)
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Vector from start to circle center
        const fx = x1 - cx;
        const fy = y1 - cy;
        
        const combinedRadius = r1 + r2;
        
        // Quadratic equation coefficients for swept collision
        // ||f + t*d|| = r
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = (fx * fx + fy * fy) - combinedRadius * combinedRadius;
        
        const discriminant = b * b - 4 * a * c;
        
        // No collision if discriminant is negative
        if (discriminant < 0) return null;
        
        // Calculate both possible collision times
        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);
        
        // We want the earliest collision in range [0, 1]
        if (t1 >= 0 && t1 <= 1) {
            return { t: t1 };
        }
        
        if (t2 >= 0 && t2 <= 1) {
            return { t: t2 };
        }
        
        // Check if already overlapping at start
        if (t1 < 0 && t2 > 1) {
            return { t: 0 };
        }
        
        return null;
    }
    
    ballHitEnemy(ball, enemy) {
        if (!ball.active || !enemy.active) return;
        
        // Damage enemy
        const damage = ball.damage;
        enemy.hp -= damage;
        
        // Visual feedback - flash red and scale pulse
        enemy.setTint(0xff0000);
        const originalScale = enemy.scaleX;

        
        this.time.delayedCall(250, () => {
            if (enemy.active) {
                enemy.clearTint();

            }
        });
        
        // Damage number popup
        const damageText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
            fontSize: '16px',
            fill: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        damageText.setOrigin(0.5);
        damageText.setDepth(200);
        
        // Animate damage text
        this.tweens.add({
            targets: damageText,
            y: enemy.y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
        
        // Knockback (use ball's knockback property)
        const angle = Phaser.Math.Angle.Between(ball.x, ball.y, enemy.x, enemy.y);
        const knockback = ball.knockback || 100;
        enemy.setVelocity(
            Math.cos(angle) * knockback,
            Math.sin(angle) * knockback
        );
        
        // Kill enemy if HP <= 0
        if (enemy.hp <= 0) {
            // Destroy health bars and shadow
            if (enemy.healthBarBg) enemy.healthBarBg.destroy();
            if (enemy.healthBarFill) enemy.healthBarFill.destroy();
            if (enemy.shadow) enemy.shadow.destroy();
            
            enemy.destroy();
            this.score += 10;
            this.gainXP(this.xpPerKill);
        }
        
        // Ball bounce
        ball.bounceCount++;
        
        // Bounce ball away from enemy (use ball's speed from item type)
        const bounceAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, ball.x, ball.y);
        const currentSpeed = ball.body.speed; // Use current physics speed
        ball.setVelocity(
            Math.cos(bounceAngle) * currentSpeed,
            Math.sin(bounceAngle) * currentSpeed
        );
        
        // Destroy ball if max bounces reached
        if (ball.bounceCount >= ball.maxBounces) {
            ball.destroy();
        }
    }
    
    enemyHitPlayer(player, enemy) {
        if (!enemy.active || this.gameOver) return;
        
        // Damage player
        this.playerHP -= enemy.damage;
        
        // Visual feedback
        player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            if (!this.gameOver) {
                player.clearTint();
            }
        });
        
        // Destroy enemy and its health bar and shadow
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        if (enemy.healthBarFill) enemy.healthBarFill.destroy();
        if (enemy.shadow) enemy.shadow.destroy();
        enemy.destroy();
        
        // Check game over
        if (this.playerHP <= 0) {
            this.playerHP = 0;
            this.triggerGameOver();
        }
    }
    
    triggerGameOver() {
        this.gameOver = true;
        this.player.setTint(0x666666);
        this.player.setVelocity(0, 0);
        this.gameOverText.setVisible(true);
        
        // Stop all enemies
        this.enemies.children.entries.forEach(enemy => {
            enemy.setVelocity(0, 0);
        });
        
        // Stop all balls
        this.balls.children.entries.forEach(ball => {
            ball.setVelocity(0, 0);
        });
    }
    
    updateGameTime() {
        if (!this.gameOver) {
            this.gameTime++;
            
            // Increase difficulty over time
            if (this.gameTime % 10 === 0) {
                this.enemySpawnRate = Math.max(this.minSpawnRate, this.enemySpawnRate - 100);
                this.enemySpeed = Math.min(100, this.enemySpeed + 2);
            }
        }
    }
    
    updateHUD() {
        // Update HP Bar
        const hpPercent = this.playerHP / this.maxPlayerHP;
        const hpBarMaxWidth = 196; // 200 - 4 (for padding)
        this.hpBarFill.width = hpBarMaxWidth * hpPercent;
        
        // Update HP color based on health percentage
        if (hpPercent > 0.6) {
            this.hpBarFill.setFillStyle(0x00ff00);
        } else if (hpPercent > 0.3) {
            this.hpBarFill.setFillStyle(0xffaa00);
        } else {
            this.hpBarFill.setFillStyle(0xff0000);
        }
        
        this.hpText.setText(`${this.playerHP}/${this.maxPlayerHP}`);
        
        // Update XP Bar with animation
        const xpPercent = this.xp / this.xpToNextLevel;
        const xpBarMaxWidth = 196; // 200 - 4 (for padding)
        const targetWidth = xpBarMaxWidth * xpPercent;
        
        // Smooth animation
        if (this.xpBarFill.width < targetWidth) {
            this.xpBarFill.width = Phaser.Math.Linear(this.xpBarFill.width, targetWidth, 0.1);
        } else {
            this.xpBarFill.width = targetWidth;
        }
        
        // Wobble effect on XP glow
        const wobble = Math.sin(this.time.now / 200) * 0.3 + 0.7;
        this.xpBarGlow.width = this.xpBarFill.width;
        this.xpBarGlow.setAlpha(wobble * 0.5);
        
        this.xpText.setText(`XP: ${this.xp}/${this.xpToNextLevel}`);
        this.enemyCountText.setText(`Enemies: ${this.enemies.countActive()}`);
        this.timeText.setText(`Time: ${this.gameTime}s`);
        this.levelText.setText(`Level: ${this.level}`);
        this.autoFireText.setText(`Auto: ${this.autoFire ? 'ON' : 'OFF'}`);
        this.autoFireText.setColor(this.autoFire ? '#00ff00' : '#aaaaaa');
        
        // Update debug info
        if (this.showDebug) {
            const debugInfo = [
                '=== DEBUG STATS ===',
                `Active Items: ${this.playerItems.length}`,
            ];
            
            // Show each item
            this.playerItems.forEach(pi => {
                const stats = this.getItemStats(pi);
                debugInfo.push(`  ${pi.itemType.name} Lv${pi.level}:`);
                debugInfo.push(`    DMG: ${stats.damage} | FR: ${stats.fireRate}ms`);
            });
            
            debugInfo.push(`Move Speed: ${Math.round(this.playerMoveSpeed)}`);
            debugInfo.push(`Enemy Spawn Rate: ${this.enemySpawnRate}ms`);
            debugInfo.push(`Enemy Speed: ${this.enemySpeed}`);
            debugInfo.push(`Active Balls: ${this.balls.countActive()}`);
            debugInfo.push(`Active Enemies: ${this.enemies.countActive()}`);
            debugInfo.push(`FPS: ${Math.round(this.game.loop.actualFps)}`);
            debugInfo.push('');
            debugInfo.push('Press O to hide');
            
            this.debugText.setText(debugInfo.join('\n'));
            this.debugText.setVisible(true);
        } else {
            this.debugText.setVisible(false);
        }
    }
    
    updateDebug() {
        if (!this.showDebug) {
            return;
        }
        
        // Clear previous debug drawings
        this.debugGraphics.clear();
        
        // Draw player collision circle
        this.debugGraphics.lineStyle(2, 0x00ff00, 1);
        this.debugGraphics.strokeCircle(this.player.x, this.player.y, 15);
        
        // Draw enemy collision circles
        this.enemies.children.entries.forEach(enemy => {
            this.debugGraphics.lineStyle(2, 0xff0000, 1);
            this.debugGraphics.strokeCircle(enemy.x, enemy.y, enemy.enemyType.size);
        });
        
        // Draw ball collision circles
        this.balls.children.entries.forEach(ball => {
            this.debugGraphics.lineStyle(2, 0xffff00, 1);
            this.debugGraphics.strokeCircle(ball.x, ball.y, ball.displayWidth / 2);
        });
    }
    
    gainXP(amount) {
        this.xp += amount;
        
        // Check for level up
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); // Increase XP requirement
            this.showLevelUpScreen();
        }
    }
    
    updateItemsDisplay() {
        // Clear existing icons
        this.itemIcons.forEach(icon => icon.destroy());
        this.itemIcons = [];
        
        // Create icon for each active item
        this.playerItems.forEach((playerItem, index) => {
            const itemType = playerItem.itemType;
            
            // Create icon background
            const iconBg = this.add.rectangle(index * 60, 0, 50, 50, 0x333333);
            iconBg.setStrokeStyle(2, parseInt(itemType.visual.color));
            
            // Create item preview (small ball)
            const iconBall = this.add.circle(index * 60, 0, 12, parseInt(itemType.visual.color));
            iconBall.setStrokeStyle(2, 0xffffff, 0.6);
            
            // Add level text
            const levelText = this.add.text(index * 60 + 15, -15, `Lv${playerItem.level}`, {
                fontSize: '12px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            levelText.setOrigin(0, 0);
            
            // Add to container
            this.itemsContainer.add(iconBg);
            this.itemsContainer.add(iconBall);
            this.itemsContainer.add(levelText);
            
            // Track for cleanup
            this.itemIcons.push(iconBg, iconBall, levelText);
        });
    }

    
    showLevelUpScreen() {
        this.levelUpPending = true;
        
        // Pause physics
        this.physics.pause();
        
        // Show overlay
        this.levelUpOverlay.setVisible(true);
        this.levelUpTitle.setVisible(true);
        this.levelUpSubtitle.setVisible(true);
        
        // Build upgrade options
        const upgrades = [];
        
        // Add options to unlock new items
        this.itemTypes.forEach(itemType => {
            const hasItem = this.playerItems.find(pi => pi.itemType.id === itemType.id);
            
            if (!hasItem && itemType.unlockLevel <= this.level) {
                // New item unlock
                upgrades.push({
                    name: `🔫 ${itemType.name}`,
                    description: `${itemType.description}\n+${itemType.baseStats.damage} DMG`,
                    type: 'new_item',
                    apply: () => {
                        this.playerItems.push({
                            itemType: itemType,
                            level: 1,
                            lastFireTime: 0
                        });
                        console.log(`Unlocked: ${itemType.name}`);
                        this.updateItemsDisplay();
                    }
                });
            } else if (hasItem && hasItem.level < itemType.maxLevel) {
                // Level up existing item
                const nextLevel = hasItem.level + 1;
                const bonus = itemType.levelUpBonus;
                upgrades.push({
                    name: `⬆️ ${itemType.name} Lv${nextLevel}`,
                    description: `+${bonus.damage} DMG, ${bonus.fireRate < 0 ? '+' : ''}${Math.abs(bonus.fireRate)}ms fire rate`,
                    type: 'level_up_item',
                    apply: () => {
                        hasItem.level++;
                        console.log(`${itemType.name} leveled up to ${hasItem.level}`);
                        this.updateItemsDisplay();
                    }
                });
            }
        });
        
        // Add stat upgrades as fallback
        const statUpgrades = [
            {
                name: '⚡ Faster Fire Rate',
                description: 'Shoot 20% faster',
                type: 'stat',
                apply: () => {
                    this.shootCooldown = Math.max(100, this.shootCooldown * 0.8);
                }
            },
            {
                name: '🏃 Move Speed',
                description: 'Move 20% faster',
                type: 'stat',
                apply: () => {
                    this.playerMoveSpeed *= 1.2;
                }
            },
            {
                name: '❤️ Max HP +20',
                description: 'Increases maximum health',
                type: 'stat',
                apply: () => {
                    this.maxPlayerHP += 20;
                    this.playerHP += 20;
                }
            }
        ];
        
        // Add stat upgrades to pool
        upgrades.push(...statUpgrades);
        
        // Randomly select 3 upgrades (or all if less than 3)
        const selectedUpgrades = Phaser.Utils.Array.Shuffle([...upgrades]).slice(0, 3);
        
        // Display options
        selectedUpgrades.forEach((upgrade, index) => {
            const option = this.upgradeOptions[index];
            option.btn.setVisible(true);
            option.text.setVisible(true);
            option.text.setText(`${upgrade.name}\n\n${upgrade.description}`);
            
            // Highlight item upgrades
            if (upgrade.type === 'new_item') {
                option.btn.setStrokeStyle(3, 0xffff00);
            } else if (upgrade.type === 'level_up_item') {
                option.btn.setStrokeStyle(3, 0x00ffff);
            } else {
                option.btn.setStrokeStyle(3, 0xffffff);
            }
            
            // Remove previous listeners
            option.btn.removeAllListeners('pointerdown');
            
            // Add click handler
            option.btn.on('pointerdown', () => {
                upgrade.apply();
                this.hideLevelUpScreen();
            });
        });
    }
    
    hideLevelUpScreen() {
        this.levelUpPending = false;
        
        // Resume physics
        this.physics.resume();
        
        this.levelUpOverlay.setVisible(false);
        this.levelUpTitle.setVisible(false);
        this.levelUpSubtitle.setVisible(false);
        
        this.upgradeOptions.forEach(option => {
            option.btn.setVisible(false);
            option.text.setVisible(false);
        });
    }

    
    resetGameState() {
        this.playerHP = 100;
        this.gameOver = false;
        this.score = 0;
        this.gameTime = 0;
        this.enemySpawnRate = 2000;
        this.enemySpeed = 50;
        this.gameOverText.setVisible(false);
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.autoFire = false;
        this.shootCooldown = 300;
        this.ballSpeed = 400;
        this.playerMoveSpeed = 200;
        this.levelUpPending = false;
        this.isPaused = false;
        this.showDebug = false;
        this.hideLevelUpScreen();
        
        // Reset item system
        const startingItem = this.itemTypes.find(i => i.isStarting);
        this.playerItems = [{
            itemType: startingItem,
            level: 1,
            lastFireTime: 0
        }];
        
        // Reset XP bar width
        this.xpBarFill.width = 0;
        this.xpBarGlow.width = 0;
    }
}

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
        gamepad: true  // Enable gamepad plugin
    },
    scene: [GameScene]
};

// Initialize game
const game = new Phaser.Game(config);

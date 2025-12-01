/**
 * UIManager - Manages all UI elements and HUD
 * 
 * Responsibilities:
 * - Create and manage health bar
 * - Create and manage XP bar
 * - Create and manage level up screen
 * - Display active items
 * - Display game stats (level, time, enemy count)
 * - Handle pause screen
 * - Handle game over screen
 * - Update UI elements in response to game events
 */

import GameConfig from '../config/GameConfig.js';

export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.uiElements = {};
    }
    
    /**
     * Create all HUD elements
     */
    createHUD() {
        this.createHealthBar();
        this.createXPBar();
        this.createStatsDisplay();
        this.createItemsDisplay();
        this.createPauseScreen();
        this.createGameOverScreen();
        this.createLevelUpScreen();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Create health bar
     */
    createHealthBar() {
        const x = 20;
        const y = 20;
        const width = 200;
        const height = 25;
        
        // Background
        this.uiElements.hpBarBg = this.scene.add.rectangle(x, y, width, height, 0x333333);
        this.uiElements.hpBarBg.setOrigin(0, 0);
        this.uiElements.hpBarBg.setStrokeStyle(2, 0x000000);
        this.uiElements.hpBarBg.setScrollFactor(0);
        this.uiElements.hpBarBg.setDepth(GameConfig.DEPTH.HUD);
        
        // Fill
        this.uiElements.hpBarFill = this.scene.add.rectangle(x + 2, y + 2, width - 4, height - 4, 0x00ff00);
        this.uiElements.hpBarFill.setOrigin(0, 0);
        this.uiElements.hpBarFill.setScrollFactor(0);
        this.uiElements.hpBarFill.setDepth(GameConfig.DEPTH.HUD + 1);
        
        // Text
        this.uiElements.hpText = this.scene.add.text(x + width / 2, y + height / 2, '100/100', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.uiElements.hpText.setOrigin(0.5);
        this.uiElements.hpText.setScrollFactor(0);
        this.uiElements.hpText.setDepth(GameConfig.DEPTH.HUD + 2);
    }
    
    /**
     * Update health bar display
     */
    updateHealthBar(currentHP, maxHP) {
        const hpPercent = Math.max(0, currentHP / maxHP);
        const maxWidth = 196; // 200 - 4 (padding)
        
        this.uiElements.hpBarFill.width = maxWidth * hpPercent;
        this.uiElements.hpText.setText(`${Math.max(0, Math.floor(currentHP))}/${maxHP}`);
        
        // Color based on health
        if (hpPercent > 0.5) {
            this.uiElements.hpBarFill.setFillStyle(0x00ff00);
        } else if (hpPercent > 0.25) {
            this.uiElements.hpBarFill.setFillStyle(0xffaa00);
        } else {
            this.uiElements.hpBarFill.setFillStyle(0xff0000);
        }
    }
    
    /**
     * Create XP bar
     */
    createXPBar() {
        const x = 20;
        const y = 55;
        const width = 200;
        const height = 20;
        
        // Background
        this.uiElements.xpBarBg = this.scene.add.rectangle(x, y, width, height, 0x222244);
        this.uiElements.xpBarBg.setOrigin(0, 0);
        this.uiElements.xpBarBg.setStrokeStyle(2, 0x4444ff);
        this.uiElements.xpBarBg.setScrollFactor(0);
        this.uiElements.xpBarBg.setDepth(GameConfig.DEPTH.HUD);
        
        // Fill
        this.uiElements.xpBarFill = this.scene.add.rectangle(x + 2, y + 2, 0, height - 4, 0x00aaff);
        this.uiElements.xpBarFill.setOrigin(0, 0);
        this.uiElements.xpBarFill.setScrollFactor(0);
        this.uiElements.xpBarFill.setDepth(GameConfig.DEPTH.HUD + 1);
        
        // Glow effect
        this.uiElements.xpBarGlow = this.scene.add.rectangle(x + 2, y + 2, 0, height - 4, 0x66ccff);
        this.uiElements.xpBarGlow.setOrigin(0, 0);
        this.uiElements.xpBarGlow.setScrollFactor(0);
        this.uiElements.xpBarGlow.setDepth(GameConfig.DEPTH.HUD + 1);
        this.uiElements.xpBarGlow.setAlpha(0.5);
        
        // Text
        this.uiElements.xpText = this.scene.add.text(x + width / 2, y + height / 2, 'XP: 0/100', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiElements.xpText.setOrigin(0.5);
        this.uiElements.xpText.setScrollFactor(0);
        this.uiElements.xpText.setDepth(GameConfig.DEPTH.HUD + 2);
    }
    
    /**
     * Update XP bar display
     */
    updateXPBar(currentXP, requiredXP) {
        const xpPercent = Math.min(1, currentXP / requiredXP);
        const maxWidth = 196; // 200 - 4 (padding)
        
        this.uiElements.xpBarFill.width = maxWidth * xpPercent;
        this.uiElements.xpBarGlow.width = maxWidth * xpPercent;
        this.uiElements.xpText.setText(`XP: ${currentXP}/${requiredXP}`);
    }
    
    /**
     * Create stats display (level, time, enemy count)
     */
    createStatsDisplay() {
        // Level text
        this.uiElements.levelText = this.scene.add.text(230, 20, 'Level: 1', {
            fontSize: '20px',
            fill: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.uiElements.levelText.setScrollFactor(0);
        this.uiElements.levelText.setDepth(GameConfig.DEPTH.HUD + 1);
        
        // Enemy count
        this.uiElements.enemyCountText = this.scene.add.text(230, 50, 'Enemies: 0', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        this.uiElements.enemyCountText.setScrollFactor(0);
        this.uiElements.enemyCountText.setDepth(GameConfig.DEPTH.HUD + 1);
        
        // Time
        this.uiElements.timeText = this.scene.add.text(230, 70, 'Time: 0s', {
            fontSize: '16px',
            fill: '#aaaaaa'
        });
        this.uiElements.timeText.setScrollFactor(0);
        this.uiElements.timeText.setDepth(GameConfig.DEPTH.HUD + 1);
        
        // Auto-fire indicator
        this.uiElements.autoFireText = this.scene.add.text(780, 20, 'Auto: OFF', {
            fontSize: '18px',
            fill: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiElements.autoFireText.setOrigin(1, 0);
        this.uiElements.autoFireText.setScrollFactor(0);
        this.uiElements.autoFireText.setDepth(GameConfig.DEPTH.HUD + 1);
    }
    
    /**
     * Update stats display
     */
    updateStats(stats) {
        if (stats.level !== undefined) {
            this.uiElements.levelText.setText(`Level: ${stats.level}`);
        }
        if (stats.enemyCount !== undefined) {
            this.uiElements.enemyCountText.setText(`Enemies: ${stats.enemyCount}`);
        }
        if (stats.time !== undefined) {
            this.uiElements.timeText.setText(`Time: ${stats.time}s`);
        }
        if (stats.autoFire !== undefined) {
            this.uiElements.autoFireText.setText(`Auto: ${stats.autoFire ? 'ON' : 'OFF'}`);
            this.uiElements.autoFireText.setColor(stats.autoFire ? '#00ff00' : '#aaaaaa');
        }
    }
    
    /**
     * Create items display
     */
    createItemsDisplay() {
        this.uiElements.itemsContainer = this.scene.add.container(20, 120);
        this.uiElements.itemsContainer.setScrollFactor(0);
        this.uiElements.itemsContainer.setDepth(GameConfig.DEPTH.HUD + 1);
        this.uiElements.itemIcons = [];
    }
    
    /**
     * Update items display
     */
    updateItemsDisplay(playerItems) {
        // Clear existing icons
        this.uiElements.itemIcons.forEach(icon => icon.destroy());
        this.uiElements.itemIcons = [];
        
        // Create icon for each active item
        playerItems.forEach((playerItem, index) => {
            const itemType = playerItem.itemType;
            
            // Icon background
            const iconBg = this.scene.add.rectangle(index * 60, 0, 50, 50, 0x333333);
            iconBg.setStrokeStyle(2, parseInt(itemType.visual.color, 16));
            
            // Item preview
            const iconBall = this.scene.add.circle(index * 60, 0, 12, parseInt(itemType.visual.color, 16));
            iconBall.setStrokeStyle(2, 0xffffff, 0.6);
            
            // Level text
            const levelText = this.scene.add.text(index * 60 + 15, -15, `Lv${playerItem.level}`, {
                fontSize: '12px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            levelText.setOrigin(0, 0);
            
            // Add to container
            this.uiElements.itemsContainer.add(iconBg);
            this.uiElements.itemsContainer.add(iconBall);
            this.uiElements.itemsContainer.add(levelText);
            
            // Track for cleanup
            this.uiElements.itemIcons.push(iconBg, iconBall, levelText);
        });
    }
    
    /**
     * Create pause screen
     */
    createPauseScreen() {
        this.uiElements.pauseText = this.scene.add.text(400, 250, 'PAUSED\nPress P to Resume', {
            fontSize: '48px',
            fill: '#ffff00',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.uiElements.pauseText.setOrigin(0.5);
        this.uiElements.pauseText.setVisible(false);
        this.uiElements.pauseText.setDepth(GameConfig.DEPTH.PAUSE);
    }
    
    /**
     * Show/hide pause screen
     */
    setPauseVisible(visible) {
        this.uiElements.pauseText.setVisible(visible);
    }
    
    /**
     * Create game over screen
     */
    createGameOverScreen() {
        const camWidth = this.scene.cameras.main.width;
        const camHeight = this.scene.cameras.main.height;
        
        this.uiElements.gameOverText = this.scene.add.text(camWidth / 2, camHeight / 2, 'GAME OVER\nClick to Restart', {
            fontSize: '48px',
            fill: '#ff0000',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.uiElements.gameOverText.setOrigin(0.5);
        this.uiElements.gameOverText.setVisible(false);
        this.uiElements.gameOverText.setScrollFactor(0);
        this.uiElements.gameOverText.setDepth(GameConfig.DEPTH.GAME_OVER);
    }
    
    /**
     * Show/hide game over screen
     */
    setGameOverVisible(visible) {
        this.uiElements.gameOverText.setVisible(visible);
    }
    
    /**
     * Create level up screen
     */
    createLevelUpScreen() {
        const camWidth = this.scene.cameras.main.width;
        const camHeight = this.scene.cameras.main.height;
        
        // Dark overlay
        this.uiElements.levelUpOverlay = this.scene.add.rectangle(
            camWidth / 2, camHeight / 2, camWidth, camHeight, 0x000000, 0.8
        );
        this.uiElements.levelUpOverlay.setScrollFactor(0);
        this.uiElements.levelUpOverlay.setDepth(GameConfig.DEPTH.LEVEL_UP);
        this.uiElements.levelUpOverlay.setVisible(false);
        
        // Title
        this.uiElements.levelUpTitle = this.scene.add.text(camWidth / 2, 100, 'LEVEL UP!', {
            fontSize: '48px',
            fill: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.uiElements.levelUpTitle.setOrigin(0.5);
        this.uiElements.levelUpTitle.setScrollFactor(0);
        this.uiElements.levelUpTitle.setDepth(GameConfig.DEPTH.LEVEL_UP + 1);
        this.uiElements.levelUpTitle.setVisible(false);
        
        // Subtitle
        this.uiElements.levelUpSubtitle = this.scene.add.text(camWidth / 2, 160, 'Choose an upgrade:', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        this.uiElements.levelUpSubtitle.setOrigin(0.5);
        this.uiElements.levelUpSubtitle.setScrollFactor(0);
        this.uiElements.levelUpSubtitle.setDepth(GameConfig.DEPTH.LEVEL_UP + 1);
        this.uiElements.levelUpSubtitle.setVisible(false);
        
        // Upgrade option containers
        this.uiElements.upgradeOptions = [];
        const upgradeY = camHeight / 2;
        const spacing = 250;
        const startX = camWidth / 2 - spacing;
        
        for (let i = 0; i < 3; i++) {
            const x = startX + (i * spacing);
            
            // Button background
            const btn = this.scene.add.rectangle(x, upgradeY, 200, 150, 0x333333, 1);
            btn.setStrokeStyle(3, 0xffffff);
            btn.setScrollFactor(0);
            btn.setDepth(GameConfig.DEPTH.LEVEL_UP + 1);
            btn.setVisible(false);
            btn.setInteractive();
            
            // Button text
            const text = this.scene.add.text(x, upgradeY, '', {
                fontSize: '20px',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: 180 }
            });
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(GameConfig.DEPTH.LEVEL_UP + 2);
            text.setVisible(false);
            
            // Hover effects
            btn.on('pointerover', () => btn.setFillStyle(0x555555));
            btn.on('pointerout', () => btn.setFillStyle(0x333333));
            
            this.uiElements.upgradeOptions.push({ btn, text });
        }
    }
    
    /**
     * Show level up screen with upgrade options
     */
    showLevelUpScreen(upgrades, onSelect) {
        // Show UI elements
        this.uiElements.levelUpOverlay.setVisible(true);
        this.uiElements.levelUpTitle.setVisible(true);
        this.uiElements.levelUpSubtitle.setVisible(true);
        
        // Display options
        upgrades.forEach((upgrade, index) => {
            const option = this.uiElements.upgradeOptions[index];
            option.btn.setVisible(true);
            option.text.setVisible(true);
            option.text.setText(`${upgrade.name}\n\n${upgrade.description}`);
            
            // Color based on upgrade type
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
                onSelect();
                this.hideLevelUpScreen();
            });
        });
    }
    
    /**
     * Hide level up screen
     */
    hideLevelUpScreen() {
        this.uiElements.levelUpOverlay.setVisible(false);
        this.uiElements.levelUpTitle.setVisible(false);
        this.uiElements.levelUpSubtitle.setVisible(false);
        
        this.uiElements.upgradeOptions.forEach(option => {
            option.btn.setVisible(false);
            option.text.setVisible(false);
        });
    }
    
    /**
     * Set up event listeners for game events
     */
    setupEventListeners() {
        // Health updates
        this.scene.events.on('playerDamaged', (data) => {
            this.updateHealthBar(data.currentHP, data.maxHP);
        });
        
        // XP updates
        this.scene.events.on('xpGained', (data) => {
            this.updateXPBar(data.currentXP, data.requiredXP);
        });
        
        // Level updates
        this.scene.events.on('levelUp', (data) => {
            this.updateStats({ level: data.level });
        });
        
        // Item updates
        this.scene.events.on('itemsChanged', (playerItems) => {
            this.updateItemsDisplay(playerItems);
        });
    }
    
    /**
     * Clean up UI elements
     */
    destroy() {
        Object.values(this.uiElements).forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
    }
}

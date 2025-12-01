/**
 * MapSystem - Manages map rendering and environment
 * 
 * Responsibilities:
 * - Load and render map backgrounds
 * - Handle different map types (grass, desert, snow, etc.)
 * - Configure map dimensions
 * - Apply visual effects to maps
 */

import GameConfig from '../config/GameConfig.js';

export default class MapSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentMap = 'grass';
        this.mapBackground = null;
        
        // Map configurations
        this.mapConfigs = {
            grass: {
                sprite: 'map_grass',
                fallbackColor: 0x4a7c3b
            },
            // Future maps can be added here:
            // desert: { sprite: 'map_desert', fallbackColor: 0xd4a574 },
            // snow: { sprite: 'map_snow', fallbackColor: 0xf0f8ff }
        };
    }
    
    /**
     * Preload map assets
     */
    preloadMapAssets(scene) {
        // Load all map sprites
        Object.entries(this.mapConfigs).forEach(([mapName, config]) => {
            if (config.sprite) {
                scene.load.image(config.sprite, `assets/environment-${mapName}.png`);
            }
        });
    }
    
    /**
     * Create and render the map
     */
    createMap(mapType = 'grass') {
        this.currentMap = mapType;
        const config = this.mapConfigs[mapType] || this.mapConfigs.grass;
        
        if (this.scene.textures.exists(config.sprite)) {
            // Use the loaded map sprite
            this.mapBackground = this.scene.add.image(0, 0, config.sprite);
            this.mapBackground.setOrigin(0, 0);
            this.mapBackground.setDisplaySize(GameConfig.MAP_WIDTH, GameConfig.MAP_HEIGHT);
            this.mapBackground.setDepth(GameConfig.DEPTH.BACKGROUND);
            
            // Apply visual effects
            this.mapBackground.setAlpha(0.65); // Dim for better game element visibility
            this.mapBackground.setTint(0xcccccc); // Slight desaturation
        } else {
            // Fallback to solid color background
            this.mapBackground = this.scene.add.rectangle(
                GameConfig.MAP_WIDTH / 2,
                GameConfig.MAP_HEIGHT / 2,
                GameConfig.MAP_WIDTH,
                GameConfig.MAP_HEIGHT,
                config.fallbackColor
            );
            this.mapBackground.setDepth(GameConfig.DEPTH.BACKGROUND);
            this.mapBackground.setAlpha(0.65);
        }
        
        console.log(`🗺️ Map created: ${mapType}`);
        return this.mapBackground;
    }
    
    /**
     * Change the current map
     */
    changeMap(mapType) {
        if (this.mapBackground) {
            this.mapBackground.destroy();
        }
        
        return this.createMap(mapType);
    }
    
    /**
     * Get current map type
     */
    getCurrentMap() {
        return this.currentMap;
    }
    
    /**
     * Get map dimensions
     */
    getMapDimensions() {
        return {
            width: GameConfig.MAP_WIDTH,
            height: GameConfig.MAP_HEIGHT
        };
    }
    
    /**
     * Get center position of map
     */
    getMapCenter() {
        return {
            x: GameConfig.MAP_WIDTH / 2,
            y: GameConfig.MAP_HEIGHT / 2
        };
    }
    
    /**
     * Clean up map resources
     */
    destroy() {
        if (this.mapBackground) {
            this.mapBackground.destroy();
            this.mapBackground = null;
        }
    }
}

/**
 * Game Configuration
 * Contains all game constants, settings, and default values
 */

export const GameConfig = {
    // Display settings
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 1024,
    
    // Map/World settings
    MAP_WIDTH: 1024,
    MAP_HEIGHT: 1024,
    DEFAULT_MAP: 'grass',
    
    // Shadow settings (global for all entities)
    SHADOW: {
        ALPHA: 0.5,         // Darkness of all shadows
        OFFSET_Y: 3,        // Vertical offset below entity
        SIZE_MULTIPLIER: 1.0 // Shadow is 20% bigger than entity
    },
    
    // Collision settings (adjust hitboxes relative to sprite size)
    COLLISION: {
        PLAYER_MULTIPLIER: 0.6,   // Player collision is 60% of sprite size
        ENEMY_MULTIPLIER: 0.7,    // Enemy collision is 70% of sprite size
        LOOT_MULTIPLIER: 0.7      // Loot collision is 70% of sprite size
    },
    
    // Player defaults
    PLAYER: {
        MAX_HP: 100,
        STARTING_HP: 100,
        MOVE_SPEED: 200,
        SIZE: 40
    },
    
    // Shooting defaults
    SHOOTING: {
        COOLDOWN: 300, // ms
        AUTO_FIRE: false
    },
    
    // Enemy spawning
    ENEMY: {
        SPAWN_RATE: 2000, // ms
        MIN_SPAWN_RATE: 500,
        SPEED: 50
    },
    
    // XP and leveling
    LEVELING: {
        STARTING_LEVEL: 1,
        STARTING_XP: 0,
        XP_TO_NEXT_LEVEL: 100,
        XP_PER_KILL: 20
    },
    
    // Input settings
    INPUT: {
        GAMEPAD: {
            LEFT_STICK_DEADZONE: 0.15,
            RIGHT_STICK_DEADZONE: 0.2,
            BUTTONS: {
                A: 0,
                B: 1,
                X: 2,
                Y: 3,
                LB: 4,
                RB: 5,
                LT: 6,
                RT: 7,
                SELECT: 8,
                START: 9,
                LEFT: 14,   // D-pad left
                RIGHT: 15,  // D-pad right
                UP: 12,     // D-pad up
                DOWN: 13    // D-pad down
            }
        },
        MOUSE: {
            MOVEMENT_THRESHOLD: 5 // pixels
        }
    },
    
    // Crosshair settings
    CROSSHAIR: {
        SCALE: 0.05, // 512x512 -> ~25px
        DISTANCE: 40, // pixels from player
        ALPHA: 0.8,
        DEPTH: 11
    },
    
    // Depth layers
    DEPTH: {
        BACKGROUND: -100,
        MAP: -50,
        SHADOW: 8,
        ENEMY_SHADOW: 9,
        PLAYER: 10,
        CROSSHAIR: 11,
        PROJECTILE: 15,
        UI: 100,
        DEBUG: 250,
        NOTIFICATION: 300
    },
    
    // Debug settings
    DEBUG: {
        SHOW_STATS: false,
        SHOW_COLLISION: false
    }
};

export default GameConfig;

# Documentation

Welcome to the Breakout x Vampire Survivors documentation! This folder contains comprehensive guides, technical documentation, and troubleshooting resources.

## 📖 Table of Contents

### Getting Started

- **[Quick Start Guide](QUICKSTART.md)** - Get the game running in minutes
- **[Project Overview](PROJECT_OVERVIEW.md)** - Architecture and design philosophy
- **[Testing Guide](TESTING.md)** - How to test features and mechanics

### Core Systems

#### Controls & Input
- **[Controller Support Guide](CONTROLLER_GUIDE.md)** - Complete gamepad/controller documentation
- **[Hybrid Input System](HYBRID_INPUT_SYSTEM.md)** - Auto-switching between mouse and controller
- **[Gamepad macOS Issues](GAMEPAD_MACOS_ISSUE.md)** - Platform-specific controller issues
- **[Chrome Gamepad Fix](CHROME_GAMEPAD_FIX.md)** - Browser compatibility fixes
- **[Firefox Gamepad Setup](FIREFOX_GAMEPAD_SETUP.md)** - Firefox configuration

#### Graphics & Visuals
- **[Sprite Guide](SPRITE_GUIDE.md)** - Adding and customizing sprites
- **[Sprite Implementation](SPRITE_IMPLEMENTATION.md)** - Technical sprite system details
- **[Player Sprite Guide](PLAYER_SPRITE_GUIDE.md)** - Customizing player character
- **[Map System Guide](MAP_SYSTEM_GUIDE.md)** - Creating custom maps and environments
- **[Combat Feedback](COMBAT_FEEDBACK.md)** - Visual effects and feedback systems

#### Gameplay Systems
- **[Item Guide](ITEM_GUIDE.md)** - Weapons, items, and loadout system
- **[Collision Technical](COLLISION_TECHNICAL.md)** - Continuous collision detection math

### Technical Documentation

#### Architecture & Code
- **[Architecture](ARCHITECTURE.md)** - Code structure and organization
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Feature implementation notes
- **[Debug Guide](DEBUG_GUIDE.md)** - Debugging tools and techniques

### Version History

- **[Changelog](CHANGELOG.md)** - Complete version history
- **[Version 0.8.1 Summary](VERSION_0.8.1_SUMMARY.md)** - Latest release notes
- **[Bug Fixes v0.7.1](BUGFIX_v0.7.1.md)** - Major bug fix release

### Planning & Ideas

- **[Game Plan v1](game_plan_v1.md)** - Original feature roadmap
- **[Ideas](ideas.md)** - Feature brainstorming and future concepts

---

## Quick Navigation by Topic

### I want to...

**Play the game:**
→ Start with [Quick Start Guide](QUICKSTART.md)

**Use a controller:**
→ Read [Controller Support Guide](CONTROLLER_GUIDE.md)

**Add custom sprites:**
→ Follow [Sprite Guide](SPRITE_GUIDE.md) and [Player Sprite Guide](PLAYER_SPRITE_GUIDE.md)

**Create custom maps:**
→ Check [Map System Guide](MAP_SYSTEM_GUIDE.md)

**Fix controller issues:**
→ See [Gamepad macOS Issues](GAMEPAD_MACOS_ISSUE.md) or [Chrome Gamepad Fix](CHROME_GAMEPAD_FIX.md)

**Understand the code:**
→ Read [Architecture](ARCHITECTURE.md) and [Project Overview](PROJECT_OVERVIEW.md)

**Debug a problem:**
→ Use [Debug Guide](DEBUG_GUIDE.md)

**See what's changed:**
→ Check [Changelog](CHANGELOG.md)

---

## Documentation Standards

All documentation follows these guidelines:

### Structure
- Clear headings and sections
- Table of contents for long documents
- Code examples with syntax highlighting
- Visual diagrams where helpful

### Code Examples
```javascript
// Always include context
function exampleFunction() {
    // Explain what the code does
    return result;
}
```

### File Naming
- UPPERCASE for major guides (e.g., `CONTROLLER_GUIDE.md`)
- lowercase for plans/ideas (e.g., `game_plan_v1.md`)
- Version numbers in filenames (e.g., `BUGFIX_v0.7.1.md`)

---

## Contributing to Documentation

When adding new documentation:

1. **Place it in this folder** - Keep all docs in `/docs/`
2. **Update this README** - Add your doc to the relevant section
3. **Update main README** - Add link in main `/README.md` if it's a major guide
4. **Follow formatting** - Use markdown best practices
5. **Include examples** - Show, don't just tell

---

## Need Help?

- Check the [Quick Start Guide](QUICKSTART.md) first
- Review [Testing Guide](TESTING.md) for verification steps
- Consult [Troubleshooting](#troubleshooting) section above
- Look through [Changelog](CHANGELOG.md) for recent changes

---

*Last updated: Version 0.8.1*

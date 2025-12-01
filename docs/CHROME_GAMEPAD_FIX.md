# Chrome Gamepad API Issue on macOS

## The Problem
Chrome on macOS sometimes fails to detect Xbox controllers even when:
- ✅ Controller is physically connected
- ✅ macOS recognizes it (System Settings shows it)
- ✅ Chrome has Input Monitoring permission
- ✅ Navigator.getGamepads() returns empty slots

## Solutions to Try

### Solution 1: Enable Chrome Flags
1. Open Chrome and go to: `chrome://flags`
2. Search for: **"gamepad"**
3. Enable these flags:
   - `#enable-gamepad-extensions` → Enabled
   - `#enable-generic-sensor-extra-classes` → Enabled
4. Click "Relaunch" button
5. Test again

### Solution 2: Try Firefox or Safari
Chrome has known issues with gamepad support on macOS. Try:
- **Firefox** (best gamepad support on macOS)
- **Safari** (sometimes works better than Chrome)

### Solution 3: Use a Local Server
Some browsers restrict gamepad API when opening files directly.

Run from terminal in your project folder:
```bash
python3 -m http.server 8000
```

Then open: http://localhost:8000/controller-test.html

### Solution 4: Check Chrome Version
Make sure you're running latest Chrome:
- Menu → Chrome → About Google Chrome
- Should be version 120+ (December 2025)

### Solution 5: Try Chrome Canary
Download Chrome Canary (development version):
- Has newer/better gamepad support
- https://www.google.com/chrome/canary/

## Recommended: Use Firefox
Firefox has the best gamepad support on macOS. Download from:
https://www.mozilla.org/firefox/

Your game will work identically in Firefox since it's using standard Phaser 3.

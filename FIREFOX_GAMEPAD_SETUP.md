## Firefox Gamepad Setup for macOS

### Step 1: Enable Gamepad API in Firefox
1. Open Firefox
2. Type in address bar: `about:config`
3. Click "Accept the Risk and Continue"
4. Search for: `dom.gamepad.enabled`
5. Make sure it's set to: **true**
6. Search for: `dom.gamepad.extensions.enabled`
7. Make sure it's set to: **true**

### Step 2: Grant Firefox Permissions
1. Open **System Settings**
2. Go to **Privacy & Security** → **Input Monitoring**
3. Add **Firefox** and check it ✅
4. **FULLY QUIT Firefox** (Cmd+Q)
5. Relaunch Firefox

### Step 3: Test Again
Open: http://localhost:8000/controller-test.html

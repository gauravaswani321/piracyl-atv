# PiracyL ATV 📺
An Android TV & Web app built with **Ionic React + Capacitor** to stream personal videos directly from Google Drive via a serverless **Cloudflare Worker** proxy.

Designed specifically for **10-foot Leanback UI (Android TV)**, featuring hardware-accelerated **`.mkv`** video playback (with ExoPlayer), full D-Pad remote navigation, and automated cloud builds via GitHub Actions.

---

## 🌟 Key Features

1. **Android TV D-Pad Remote Navigation**:
   - Seamless spatial navigation across rows, columns, and controls using `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, and `Back`.
   - Glowing high-contrast focus rings and TV-optimized card sizes.
2. **Native MKV & Multi-Format Playback**:
   - Integrates `@capgo/capacitor-video-player` (backed by Android **ExoPlayer**) for hardware-accelerated MKV, MP4, WebM, and AC3/EAC3/DTS audio streaming directly on Android TV.
   - Built-in HTML5 fallback player for web/browser use.
   - Automatic resume playback feature remembering where you left off.
3. **Cloudflare Worker Backend (GDI-JS)**:
   - Communicates with your serverless Google Drive Index worker without exposing credentials or refresh tokens to client devices.
   - Built-in folder traversal, search, and dynamic stream URL generator.
4. **No Local Android Build Tools Needed**:
   - Pre-configured GitHub Actions workflow (`.github/workflows/build-apk.yml`) that builds the Android TV `.apk` automatically in the cloud on every git push.

---

## 🎮 Android TV Remote Key Mapping

| Remote Button | Action |
| :--- | :--- |
| **D-Pad Directional Arrows** | Navigate focus between folder cards, video cards, search bar, and controls. |
| **Select / Center Button / Enter** | Open folder / Play selected video / Activate button. |
| **Back Button / Return** | Go back up one folder level / Exit full-screen video player / Close settings modal. |
| **D-Pad Left / Right (in video player)** | Rewind 10s / Fast Forward 10s. |
| **D-Pad Up / Down (in video player)** | Volume Up / Volume Down. |
| **Play / Pause (Media Key / Enter)** | Toggle playback pause/resume. |

---

## ⚙️ Configuration

1. In the app, click the **Settings** gear icon (or navigate to it with the TV remote).
2. Set your **Cloudflare Worker URL**:
   ```
   https://YOUR_WORKER_NAME.workers.dev
   ```
3. Set your **Root Path** (default is `0:/`).
4. Click **Test Connection** to verify that your worker is returning your Google Drive folders and files.
5. Click **Save & Apply**. Your settings are stored safely in persistent local storage.

> **Note regarding CORS**: In your Cloudflare Worker script, make sure `cors_domain: "*"` is set so the TV app can query the worker API without origin blocking.

---

## 🚀 Building the APK in the Cloud (GitHub Actions)

You don't need Android Studio or SDKs installed locally.

1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for PiracyL ATV"
   git remote add origin https://github.com/YOUR_USERNAME/PiracyL-ATV.git
   git push -u origin main
   ```
2. Navigate to the **Actions** tab in your GitHub repository.
3. The **"Build Android TV APK"** workflow will trigger automatically.
4. Once completed (approx. 3-4 minutes), click the run summary and download the generated **`piracyl-atv-debug-apk`** artifact.
5. Sideload the `.apk` onto your Android TV or Chromecast with Google TV using an app like *Send Files to TV* or ADB:
   ```bash
   adb connect YOUR_TV_IP:5555
   adb install app-debug.apk
   ```

---

## 💻 Local Web Development (Previewing in Browser)

To test the web interface locally on your computer:
```bash
npm run dev
```
Open `http://localhost:3000` in Chrome/Edge. You can test D-pad navigation right on your PC using the keyboard arrow keys and Enter!


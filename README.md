# Ayoub Social (ئەیوب سۆشیاڵ)

پلاتفۆرمی فەرمی ئەیوب سۆشیاڵ بۆ خزمەتگوزارییەکانی بازرگانی، دروستکردنی وێبسایت و ئەپ، دیزاینی وێنە و ڤیدیۆ، و سیستمە دەستکردەکان.

## Features (تایبەتمەندییەکان)
- **Framework**: React 18 SPA built with Vite & TypeScript.
- **Styling & Aesthetics**: High-fidelity glassmorphism, responsive Bento grid layout with interactive mouse spotlight and hover glow effects, dark/light theme support.
- **Kurdish Typography & RTL**: Full RTL layout (`dir="rtl"`) utilizing Kurdish fonts (K24, Vazirmatn, Noto Sans Arabic) and Space Grotesk / JetBrains Mono for code.
- **Interactive Code Window**: Animated `ayoub.js` code mockup with line-by-line reveal and blinking cursor.
- **Firebase Integration**:
  - Live visitor analytics (Unique visitors, Today's visitors, Total opens) backed by Firestore.
  - Live posts stream with support for text, code snippets (with expandable toggle), images, and videos.
  - Secret 5-tap Admin entrance on copyright text.
  - Admin authentication with failed attempts rate-limiting lockout timer.
  - Admin management panel: post creation (text, code, image/video upload to Firebase Storage with progress tracking) and post deletion.
- **Contact & Direct Actions**: Telegram contact integration (`https://t.me/amin_rst00`).

## Development
```bash
npm run dev
```
Dev server listens on `http://0.0.0.0:3000`.

## Build
```bash
npm run build
```

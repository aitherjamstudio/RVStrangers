# UI/UX Design Specification: Rvstrangers
**Project:** Rvstrangers (Turn-Based Conversation Card Game)  
**Brand Identity:** `Rvstrangers` / `RVStranger?`  
**Primary Typography:** `Comfortaa`  
**Official Logo:** [no bg logo.png](file:///D:/cards%20app/Img/no%20bg%20logo.png)  
**Styleboard Reference:** [RVStranger Purple Neon Styleboard.png](file:///D:/cards%20app/Img/RVStranger%20Purple%20Neon%20Styleboard.png)  
**Color Palette Source:** [Color Palette](file:///C:/Users/admin/.gemini/antigravity/brain/aab36a8c-7678-41eb-8cf1-02d8e1b14780/.user_uploaded/media_1795003715317_91b5d80a.jpg)  

---

## 1. Brand & Aesthetic Overview

**Rvstrangers** is a modern, intimate, turn-based conversation card game designed to spark deep, playful, and genuine connections between friends, couples, and online strangers.

The brand persona is warm, welcoming, modern, and cosmic. It combines the friendly rounded character of the **Comfortaa** typeface with a striking **Purple Neon** aesthetic:
- **Dark Neon Mode:** Deep midnight amethyst background (`#1A052B`) paired with luminous electric violet (`#5B0DAD`) and vivid magenta neon highlights (`#C026D3`).
- **Light Mode:** Ethereal lavender background (`#F6EEFF`) with crisp white elevated cards (`#FFFFFF`) and deep aubergine typography (`#1F1726`).
- **Tactile Depth:** Floating rounded cards with glowing 3D emojis (💬 Chat, 💖 Romantic Heart, 🔥 Fun/Fire), 3D flipping animation, and pill-shaped interactive controls.

---

## 2. Official Color Palette & Token System

```
┌────────────────────────────────────────────────────────────────────────┐
│                      RVSTRANGERS COLOR PALETTE                         │
├────────────────────┬───────────┬───────────────────────────────────────┤
│ Primary            │ #5B0DAD   │ Deep royal purple for headers & CTA   │
│ Accent / Highlight │ #C026D3   │ Vivid fuchsia/magenta for glows & tags│
│ Background (Dark)  │ #1A052B   │ Midnight violet app canvas            │
│ Background (Light) │ #F6EEFF   │ Soft lavender daytime surface         │
│ Surface / Card     │ #FFFFFF   │ Crisp white cards / translucent glass │
│ Text (Primary)     │ #1F1726   │ High-contrast dark aubergine          │
│ Text (Secondary)   │ #6B5F76   │ Elegant muted lavender-grey           │
└────────────────────┴───────────┴───────────────────────────────────────┘
```

### 2.1 Extended Functional Tokens

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `primary-gradient` | `linear-gradient(135deg, #5B0DAD 0%, #C026D3 100%)` | Primary action buttons ("Start Playing >", "Sign Up") |
| `secondary-outline`| `border 1.5px solid #C026D3, color #FFFFFF` | Secondary actions ("How It Works") |
| `glass-dark-card` | `rgba(35, 12, 57, 0.70)` with `blur(16px)` | Elevated dark cards with `border: 1px solid rgba(192, 38, 211, 0.20)` |
| `glass-light-card`| `rgba(255, 255, 255, 0.90)` with `blur(12px)` | Crisp light mode cards with subtle purple drop shadows |
| `coin-gold` | `#FBBF24` | Soft currency indicators |
| `diamond-sky` | `#38BDF8` | Hard currency IAP indicators |
| `online-emerald` | `#22C55E` | Real-time presence indicator |

---

## 3. Typography: Comfortaa

The entire application standardizes on **Comfortaa** across all viewports for a playful, friendly, and distinctive identity.

```css
@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Comfortaa', cursive, sans-serif;
  letter-spacing: -0.01em;
}
```

### Typographic Hierarchy:
* **Hero Headline:** 28px - 36px, `font-weight: 700`, leading-tight ("Meet • Talk • Play with Strangers").
* **Card Prompt:** 18px - 22px, `font-weight: 600`, leading-relaxed.
* **Section Titles:** 14px - 16px, `font-weight: 700`, uppercase tracking-wider.
* **Button Labels:** 12px - 14px, `font-weight: 700`.
* **Body / Meta:** 11px - 13px, `font-weight: 400 - 500`.

---

## 4. Logo & Visual Assets Integration

* **Master Logo:** Located at [no bg logo.png](file:///D:/cards%20app/Img/no%20bg%20logo.png).
  - Shape: Rounded squircle badge with deep violet-to-magenta radial gradient and crisp white `RVStranger?` Comfortaa logotype.
  - Sizing:
    - App Header / Navbar: 36px height.
    - Splash / Welcome Hero: 84px - 120px height.
    - App Icon (PWA & Android): 512x512 adaptive icon.

---

## 5. Screen Architecture & Core Views

### 5.1 Welcome & Landing Screen (from Styleboard)
- **Header:** `RVStranger?` logo, navigation links (`Home`, `Play`, `Cards`, `Community`), and action pills (`Log In`, `Sign Up` gradient button).
- **Hero Banner:** Wavy glowing purple neon ribbons on `#1A052B`.
  - Headline: "Meet • Talk • Play with Strangers".
  - Subtitle: "A fun and safe space for real conversations, playful cards, and new connections."
  - Dual CTAs: `Start Playing >` (Primary gradient pill) and `How It Works` (Secondary outline pill).
  - Hero Floating Cards: 3 glossy cards showing glowing 3D 💬 Chat, 💖 Heart, and 🔥 Flame icons.

### 5.2 Main Dashboard (Mobile & PWA)
- Top Bar with `RVStranger?` logo, user avatar greeting ("Hi, Alex 👋"), and dual wallet pills (`🪙 2,450`, `💎 120`).
- Quick Game Modes: **Play Online** (`#5B0DAD` gradient) and **Play Local** (`#E85D04` sunset gradient).
- Live Friends reel with online status dots.
- Themed Card Collections:
  - *Top Played*: Deep Conversations, Relationships, Mind & Psychology, Friends & Fun.
  - *Premium Decks*: Self Discovery, Emotional Wellness, Couples Talk, Life Goals.
  - *Recently Added*: Work & Life Balance, Gratitude, What If? Scenarios.

### 5.3 3D Card Game Room
- 3D flippable card stage with celestial star and arch backface.
- Comfortaa question prompt rendered in high contrast.
- 90-second answer countdown timer.
- Live character counter (0/300) and submission button.
- Reaction stage with floating emoji bursts (`❤️`, `😂`, `😮`, `👏`, `🔥`).

### 5.4 Friends & Social Center
- Friends list with instant search and in-game invite triggers.
- Detailed Profile view with celestial twilight mountain banner, ownership metrics, and mutual friends.
- Friend Requests queue with quick Accept/Reject buttons.

### 5.5 Matchmaker & Deck Store
- Online Stranger Matchmaking with Language, Category, and Gender filters.
- Temporary preview lobby with **Accept / Skip** deck flow.
- Virtual store with Rewarded Ad coin claims (`+50 Coins`) and Google Play In-App Purchase diamond packs.

---

## 6. Theme Switching: Dark Mode & Light Mode

Because both **Background (Dark) `#1A052B`** and **Background (Light) `#F6EEFF`** are defined in the palette:
- **Dark Mode:** `#1A052B` background, `#230C39` cards, white primary text, magenta glowing borders.
- **Light Mode:** `#F6EEFF` background, `#FFFFFF` cards with soft purple drop-shadows, `#1F1726` dark text, `#5B0DAD` primary accents.

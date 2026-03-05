# AnthrosAI v8 — Modular PWA

## Architecture
```
/
├── index.html          # Shell with all pages & modals
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline support)
├── apple-touch-icon.png
├── package.json
├── css/
│   └── style.css       # All styles
├── js/
│   ├── app.js          # Core: state, nav, AI coach, persistence
│   ├── auth.js         # Onboarding, macro calculation
│   ├── stripe.js       # Payments, AdSense
│   ├── nutrition.js    # Food tracking, AI scanner, encyclopedia
│   └── workout.js      # Exercise log, library, set tracking
└── api/
    └── checkout.js     # Vercel serverless → Stripe Checkout
```

## Environment Variables (Vercel)
```
STRIPE_SECRET_KEY=sk_live_...
MONTHLYSTRIPE_PRICE_ID=price_...
YEARLYSTRIPE_PRICE_ID=price_...
```

## Deploy
```bash
npm install
vercel --prod
```

## Features
- **PWA**: Install to iPhone home screen as native app
- **AI Food Scanner**: Groq Vision (llama-4-scout) — works anywhere
- **Symmetric Nav**: Home · Nutrition · [📷] · Workouts · More
- **Water Widget**: 8-glass interactive tracker with Elite mode (12 glasses)
- **Workout Page**: 50+ exercise library with muscle filter + search
- **Supplements**: Daily tracking for Creatine, Mg, Vit D, etc.
- **Notes**: Title + content with date history
- **Stripe**: Real `/api/checkout` POST → redirect to Stripe hosted page
- **AdSense**: Auto-injected for FREE users, hidden for PRO
- **Notifications**: Web Push API — hydration, meal, workout reminders
- **Persistence**: localStorage — resets food only on new day

# Permanent Tier Dual-Persistence & Instant Restore Plan

## User Review & Critical Decisions

> [!IMPORTANT]
> To ensure your subscription tier (`pro` or `promax`) stays active permanently whenever you visit `https://clipcloud-one.vercel.app` (without needing URL parameters), we will implement **Dual-Persistence** (Firestore Database + Local Account Storage).

- **Confirmed Decisions**:
  1. **Instant Local Cache**: Tier is cached in `localStorage` keyed by user ID (`clipcloud_tier_${uid}`) for 0ms delay upon opening the app.
  2. **Firestore Document Sync**: Every time the app opens or a user signs in, the app immediately reads the user document from Firestore (`users/${uid}`) and updates the state.
  3. **Real-time Listener**: `onSnapshot` listener on `users/${uid}` ensures any backend or Stripe webhook update immediately propagates to the browser.
  4. **Url Callback Lock**: When returning from `?payment=success&tier=pro`, both Firestore AND `localStorage` are updated simultaneously.

---

## 1. Overview & Core Concept

- **What It Does**: Permanently attaches subscription tiers to your account across sessions, browsers, and devices. When you open `https://clipcloud-one.vercel.app` directly, your Pro or Pro Max tier is loaded instantly.

---

## 2. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      App Initialization                      │
└─────────────────────────────────────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│  1. Read Local Cache    │             │  2. Fetch Firestore Doc │
│  clipcloud_tier_${uid}  │             │  users/${uid}.tier      │
└─────────────────────────┘             └─────────────────────────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Instant UI Unlock: Pro / Pro Max Features Active           │
└─────────────────────────────────────────────────────────────┘
```

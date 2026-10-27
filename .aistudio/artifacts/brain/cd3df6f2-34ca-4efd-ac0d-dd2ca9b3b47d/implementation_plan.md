# Robust Stripe Subscription & Error-Resilient Sync Architecture

## User Review & Critical Decisions

> [!IMPORTANT]
> To prevent app crashes, race conditions, or missed subscription updates when users return from Stripe Checkout, we will implement a production-grade **Webhook-First + Client Verification + Auto-Sync & Restore** architecture.

- **Confirmed Architecture**:
  1. **Webhook-First (`/api/webhook`)**: Stripe server securely pushes `checkout.session.completed` events to update Firestore asynchronously, independent of browser redirects.
  2. **Client-Side Verification (`/api/verify-checkout-session`)**: When redirected back with `?payment=success&session_id=...`, the app verifies the session immediately for instant gratification.
  3. **Auto-Sync on Login (`/api/sync-user-subscription`)**: Automatically checks recent Stripe sessions when a user logs in.
  4. **Manual Restore Purchases Button**: Added to the upgrade modal so users can manually trigger a sync if their network dropped during redirection.

---

## 1. Overview & Core Concept

- **What It Does**: Decouples payment fulfillment from browser redirects so that even if the browser closes or loses connection during checkout, the subscription is successfully recorded by Stripe webhooks and auto-synced upon the user's return.
- **Key Value**: Zero lost subscriptions, zero crash states, and robust fault tolerance.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - Instant success redirect with verification toast.
  - Automatic background sync on login.
  - "Restore Purchases" button in the subscription modal for manual recovery.
- **Visual Identity & Theme**:
  - Brutalist editorial styling matching ClipCloud.

---

## 3. Technical Architecture & Data Strategy

```
┌──────────────────────┐      1. Checkout     ┌──────────────────────┐
│  Client App          │ ───────────────────> │  Stripe Checkout     │
└──────────────────────┘                      └──────────────────────┘
   ▲                                                      │
   │ 2. Success Redirect                                  │ 3. Webhook (checkout.session.completed)
   │    (?payment=success)                                ▼
   │                                           ┌──────────────────────┐
   └────────────────────────────────────────── │  Express Backend     │
        (Verify & Sync via Admin SDK)          │  (/api/webhook)      │
                                               └──────────────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │  Firestore (users)   │
                                               │  tier: 'promax'      │
                                               └──────────────────────┘
```

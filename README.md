# 🎓 UniDeal - Dedicated Campus Marketplace for Students

> **Good stuff, closer than you think.**  
> UniDeal is a full-stack, purpose-built campus web marketplace designed to rescue university commerce from chaotic WhatsApp groups.

---

## 🏆 Hackathon Problem Statement & Solution Mapping

> *"Campus life runs on WhatsApp groups: buy and sell, laundry, late-night food, rentals, tutoring. They work until messages get buried, prices get lost, and every deal begins with 'is this still available?'"*  
> *"Your mission: pick one campus business (existing, or one that should exist) and give it a proper home on the web."*  
> *"Must have: sellers who post what they offer, buyers who can browse it, and a way for buyer and seller to chat and bargain on a price."*  
> *"Make it yours: Who is the real owner of this business and what annoys them? What does the WhatsApp version get wrong? What would make students trust it?"*  
> *"No AI is needed inside the app."*

| Hackathon Requirement | How UniDeal Solves It |
|---|---|
| **Campus Business Chosen** | **Peer-to-Peer Campus Buy & Sell (Textbooks, Tech, Hostel Gear, Cycles)** |
| **Sellers post what they offer** | Clean sell modal to upload item photos, set asking price, condition, category, and exact campus/hostel pickup location. |
| **Buyers browse it** | 8 structured categories, instant search, condition tags, and hostel filters. Everything has a persistent web home. |
| **Chat & Bargain on a price** | Integrated campus chat with an active **Bargaining & Offer Engine**: Buyers propose custom ₹ offers; Sellers have a one-click **"Accept Offer (₹...)"** or **"Decline"** button. |
| **Kill "Is this still available?"** | Real-time status lifecycle: `● Available` ➔ `⏳ Processing (Deal Agreed & Reserved)` ➔ `✓ Sold Out`. No more guessing or ghosting. |
| **The Real Owner & What Annoys Them** | **Persona: Graduating Senior & Hostel Room Reseller** (e.g. Rohan Sharma, Hostel 7). Annoys them: Answering 40 DMs asking "available?", messages buried under 500+ group memes, and buyers re-haggling at the hostel gate. |
| **What WhatsApp gets wrong** | Messages get buried in 15 minutes; prices are lost across messy screenshots; no price lock-in; zero inventory tracking. |
| **What makes students trust it** | Campus-verified student accounts, verified hostel block locations, and transparent transaction state tracking. |
| **No AI needed inside app** | 100% human-to-human peer commerce built with modern web speed, direct communication, and real student trust. |

---

## 🌟 WhatsApp Groups vs. UniDeal

```
+-----------------------------------+-----------------------------------+
|  Chaotic WhatsApp Groups (Before) |       UniDeal Web Home (Now)      |
+-----------------------------------+-----------------------------------+
| ❌ Buried under 300+ memes & spam | ✅ Permanent catalog & 8 category |
|    within 15 minutes.             |    search by hostel & subject.    |
| ❌ "Is this still available?" on  | ✅ Live status: Available,        |
|    repeat for days after sale.    |    Processing (Held), Sold.       |
| ❌ Haggling lost in chat DMs with | ✅ Structured Offer system with   |
|    zero price lock-in.            |    1-click seller acceptance.     |
| ❌ Random unverified phone        | ✅ Campus student verification &  |
|    numbers and hostel gate ghost. |    exact campus meetup locations. |
+-----------------------------------+-----------------------------------+
```

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Tailwind CSS v4, Vite 8, TypeScript |
| **Backend API** | Node.js 22, Express 5, RESTful architecture |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt password hashing |
| **Storage / Database** | Persistent JSON store with ACID-safe writes & auto-seeding |
| **File Handling** | Multer for campus item image attachments |
| **Cloud Deployment** | Multi-stage Dockerfile, Render Blueprint, Railway, Fly.io |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18, 20, or 22+)
- `pnpm` or `npm`

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Backend Server
```bash
# Starts Express API server on http://localhost:5000
pnpm run server
```

### 3. Start Frontend Dev Server
In a separate terminal:
```bash
# Starts Vite React development server on http://localhost:8443
pnpm run dev
```

### 4. Build for Production
```bash
pnpm run build
```

### 5. Run Full-Stack Unified Production Server
In production mode, the Express backend automatically serves both the API endpoints (`/api/*`) and the built React frontend (`dist/`) from a single port!
```bash
pnpm start
```
Open **http://localhost:5000** in your browser.

---

## 📡 Complete REST API Documentation

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new campus student profile | No |
| `POST` | `/api/auth/login` | Student login (returns JWT token) | No |
| `GET` | `/api/auth/me` | Current profile with listings & offers stats | Yes (Bearer) |

### 📦 Campus Listings (`/api/listings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/listings` | Search & filter listings (`?q=`, `?category=`, `?tab=`, `?campus=`, `?condition=`) | Optional |
| `GET` | `/api/listings/:id` | Detailed listing info with seller profile | Optional |
| `POST` | `/api/listings` | Post new campus item (`title`, `price`, `category`, `condition`, `place`, `image`) | Yes (Bearer) |
| `PUT` | `/api/listings/:id` | Update listing or mark as processing / sold | Yes (Owner) |
| `DELETE` | `/api/listings/:id` | Delete listing from marketplace | Yes (Owner) |
| `POST` | `/api/listings/:id/save` | Toggle save / bookmark listing | Yes (Bearer) |
| `GET` | `/api/listings/saved` | Get user's saved wishlist | Yes (Bearer) |

### 🤝 Bargaining & Offers (`/api/offers`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/offers` | Get student's incoming and outgoing offers | Yes (Bearer) |
| `GET` | `/api/offers/listing/:listingId` | Get all offers on a specific listing | Yes (Seller) |
| `POST` | `/api/offers` | Propose an offer (`listingId`, `offerAmount`, `message`) | Yes (Bearer) |
| `PATCH` | `/api/offers/:id/status` | Accept or reject offer (`status: "accepted" \| "rejected"`) | Yes (Seller) |

### 💬 In-App Campus Messaging (`/api/messages`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/messages/conversations` | List user's active chats with last message | Yes (Bearer) |
| `GET` | `/api/messages/conversations/:id` | Full chat history for a conversation | Yes (Bearer) |
| `POST` | `/api/messages/start` | Start conversation for an item | Yes (Bearer) |
| `POST` | `/api/messages/send` | Send a message to buyer/seller | Yes (Bearer) |

### 📊 Platform Metadata & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/meta` | Live category counts, campus locations, stats |
| `GET` | `/api/health` | Service uptime, status, database health probe |

---

## ☁️ Cloud Deployment Guide (Render / Docker)

UniDeal is containerized and cloud-ready with native Docker and Render support:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Update UniDeal for hackathon problem statement"
   git push origin main
   ```
2. Render detects the commit and triggers a zero-downtime automatic build & deploy via Docker.

---

## 📄 License
MIT License. Built for university student communities everywhere.

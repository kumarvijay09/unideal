# 🎓 UniDeal - Peer-to-Peer University Student Marketplace

> **Good stuff, closer than you think.**  
> UniDeal is a full-stack campus marketplace platform built specifically to solve university students' problems when buying and selling second-hand textbooks, electronics, hostel dorm essentials, bicycles, and accessories within their verified student community.

---

## 🌟 Problems Solved for University Students

1. **Scam Prevention & Trust**: Traditional classifieds are unsafe. UniDeal provides **campus-verified student profiles** tied to their university email, hostel block, and student identity.
2. **Eliminates Buried WhatsApp/Telegram Chaos**: Students no longer have to search through thousands of cluttered spam messages in class groups. UniDeal categorizes everything with search, condition tags, and pickup points.
3. **Frictionless Bargaining ("Bargain Built-in")**: College students love to negotiate. UniDeal features an interactive bargaining and offer system where buyers propose custom prices with notes, and sellers can instantly accept, reject, or negotiate.
4. **Campus Proximity & Safe Hand-off**: Items are mapped directly to familiar campus spots (*"North Campus"*, *"Hostel Block B"*, *"Library Gate"*, *"Girls Hostel 2"*), enabling zero-shipping, hand-to-hand student deals between lectures.
5. **Real-Time Student Chat**: Direct in-app messaging connected to the exact item listing.

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

## ⚡ Instant 1-Click Demo Accounts

All demo accounts come pre-seeded with password: `student123`

| Name | Campus Email | Role | Campus Location |
|---|---|---|---|
| **Aarav Sharma** | `aarav@campus.edu` | Seller (Headphones, Calculator) | North Campus |
| **Meera Patel** | `meera@campus.edu` | Seller (Backpack, Bicycle) | Hostel Block B |
| **Kabir Sen** | `kabir@campus.edu` | Seller (Textbooks, Kettle) | Library Gate |
| **Rahul Sharma** | `rahul@campus.edu` | Buyer (Active ₹650 Offer) | South Campus |

*(You can also register a brand new student profile directly in the Auth Modal!)*

---

## 📡 Complete REST API Documentation

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new campus student profile | No |
| `POST` | `/api/auth/login` | Student login (returns JWT token) | No |
| `POST` | `/api/auth/demo-login` | 1-click login as a demo student | No |
| `GET` | `/api/auth/demo-users` | List available demo accounts | No |
| `GET` | `/api/auth/me` | Current profile with listings & offers stats | Yes (Bearer) |

### 📦 Campus Listings (`/api/listings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/listings` | Search & filter listings (`?q=`, `?category=`, `?tab=`, `?campus=`, `?condition=`) | Optional |
| `GET` | `/api/listings/:id` | Detailed listing info with seller profile | Optional |
| `POST` | `/api/listings` | Post new campus item (`title`, `price`, `category`, `condition`, `place`, `image`) | Yes (Bearer) |
| `PUT` | `/api/listings/:id` | Update listing or mark as reserved/sold | Yes (Owner) |
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

## ☁️ Cloud Deployment Guide

UniDeal is completely containerized and cloud-ready for immediate deployment on any cloud provider:

### Option 1: Render.com (1-Click Blueprint)
1. Push this repository to GitHub / GitLab.
2. Go to **Render Dashboard** -> **New** -> **Blueprint**.
3. Select this repo (`render.yaml` will be auto-detected).
4. Click **Apply**. Render will install dependencies, build the Vite bundle, and deploy the unified web service with automatic SSL!

### Option 2: Railway.app
1. Go to **Railway.app** -> **New Project** -> **Deploy from GitHub repo**.
2. Railway detects `railway.json` and `Dockerfile`.
3. Set environment variable `JWT_SECRET` (optional).
4. Deployed and live in ~60 seconds!

### Option 3: Docker / Google Cloud Run / AWS / Fly.io
Build and run the production container:
```bash
# Build image
docker build -t unideal-app .

# Run container
docker run -p 8080:8080 -e PORT=8080 unideal-app
```
Or using Docker Compose:
```bash
docker compose up -d
```
Access the application at `http://localhost:8080`.

---

## 🧪 Automated Testing

Run the included end-to-end API verification suite:
```bash
# With the server running on port 5000:
pnpm run test:api
```
All 15 core API endpoints are verified: health, categories, student auth, listing creation, search queries, bookmarking, bargaining lifecycle, and messaging.

---

## 📄 License
MIT License. Built for university student communities everywhere.

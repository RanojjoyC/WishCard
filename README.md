# WishCard — Hyperlocal Campus Credit Card Proxy & Escrow Marketplace

**WishCard** is a peer-to-peer campus escrow marketplace designed for university ecosystems. It bridges the gap between students who want to purchase products online using exclusive bank credit card discounts (e.g., HDFC, ICICI, SBI, Axis, Amex) and nearby campus peers who hold those cards and are willing to place proxy orders in exchange for a fair commission and reward points.

To eliminate counterparty default and scam risks on campus, WishCard uses a **custody-protected escrow model with Razorpay integration, real-time geolocation proximity sorting, encrypted 1-on-1 deal chatrooms, and two-party in-person handoff OTP verification**.

Video Demonstration Link - https://drive.google.com/file/d/1Yj3z52dhjZkK2Unm74J4TZ-S0JJVMQDv/view?usp=sharing

---

## What Problem Does WishCard Solve?

1. **Credit Inaccessibility for Students**: Most college students do not have credit cards, missing out on seasonal festival discounts (Amazon Great Indian Festival, Flipkart Big Billion Days, Croma, etc.) that often offer ₹1,500 – ₹10,000 off.
2. **Cardholder Inactivity & Limit Waste**: Campus peers with credit cards often have unused monthly limits and desire to earn cashback, reward points, and commissions.
3. **P2P Trust & Fraud Risk**: Sending money directly to an unverified student on UPI before an order is placed risks default. Conversely, cardholders buying an item upfront risk the buyer backing out after delivery.
4. **Resolution**: WishCard holds buyer funds in **Escrow custody (via Razorpay Gateway)** and releases payouts to the cardholder only after the buyer has physically verified the sealed package in person and shared the single-use **Handoff OTP**.

---

## End-to-End Workflow & Lifecycle

The platform enforces a strict finite state progression with role-based authorization:

```
[ REQUESTED ] ──(Cardholder Claims Slot)──> [ MATCHED ]
                                                │
                                    (Buyer Funds Escrow via Razorpay)
                                                ▼
[ DELIVERED_TO_HOLDER ] <──(Item Arrives)── [ ESCROW_FUNDED ]
          │                                     │
(In-person Meetup)                  (Holder Buys on Retailer & Uploads Receipt)
          ▼                                     ▼
[ HANDOFF_COMPLETED ]                      [ PURCHASED ]
          │
  (Automatic Settlement)
          ▼
 [ ESCROW_RELEASED ] ──(Mutual Ratings & Reviews)
```

### 1. Account Creation & Nearby Discovery
- Students register with their campus details, address, and optionally list up to 5 verified credit cards.
- **Geospatial Proximity**: Browser Geolocation captures GPS coordinates and MongoDB `2dsphere` indexes sort nearest cardholders and requests in real time using the spherical Haversine formula.

### 2. Posting a Purchase Request
- A student (Buyer) inputs:
  - Product URL link and Retailer (Amazon, Flipkart, Apple, etc.).
  - Required Bank Card (e.g. HDFC, Axis, ICICI).
  - Retail MRP and Price with Card Discount.
  - Safe campus meetup location (e.g., Hostel Block B, Student Activity Center).
  - Optional product image (with instant image preview confirmation and upload lock).
- The system automatically calculates:
  - **Holder Profit (3% commission)**.
  - **Platform Escrow Fee (1.5%, min ₹15, max ₹100)**.
  - **Total Escrow Amount** and displays a live **"You Save ₹X"** banner.

### 3. Claiming the Slot (Matching)
- Only a student who holds the exact required bank card in their registered wallet can claim the slot.
- Self-matching is strictly prohibited.
- Atomic conditional database updates prevent multiple users from claiming the same slot concurrently.

### 4. 1-on-1 Deal Chatroom
- As soon as a request moves to `MATCHED`, a private, encrypted deal chatroom is established between Buyer and Cardholder to coordinate item specifics (color, variant) and delivery details.

### 5. Escrow Funding (Razorpay Test Mode)
- The Buyer deposits the total amount into Escrow custody.
- The interactive **Razorpay Checkout SDK modal** opens directly on the page, supporting test UPI, netbanking, and credit cards.
- Once the signature is verified, the order moves to `ESCROW_FUNDED`.

### 6. Cardholder Purchase & Receipt Proof
- With funds safely locked in escrow, the Cardholder purchases the item on the retailer website using their credit card.
- The Cardholder inputs the Retailer Order ID and uploads proof of invoice/receipt (persisted via Cloudinary or high-performance base64 Data URI).
- Order status progresses to `PURCHASED`.

### 7. Package Arrival on Campus
- When the courier delivers the parcel to the Cardholder's room/hostel, the Cardholder inspects the exterior packaging, uploads a photo of the package, and confirms arrival.
- Order transitions to `DELIVERED_TO_HOLDER`.

### 8. Campus Meetup & Secure OTP Handoff
- Both students meet at the agreed campus location.
- **Strict Role Separation**:
  - The **Buyer** inspects the item and is displayed a 6-digit **Secret Handoff OTP**.
  - The **Cardholder** is given the OTP input box to enter the code shown by the buyer.
- Upon correct OTP verification, the deal transitions to `HANDOFF_COMPLETED` and immediately triggers `ESCROW_RELEASED`.

### 9. Payout Settlement & Mutual Trust Ratings
- Escrow funds (Discounted Item Price + 3% Holder Profit) are released to the Cardholder's registered UPI ID with a unique settlement reference.
- Both parties rate and review each other (1–5 stars with written feedback), dynamically updating their campus Trust Score and completed deal counts.
- **Dispute Protection**: At any stage before handoff, either party can raise a dispute, freezing escrow payout pending Administrative Vault review and refund.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Vite)                       │
│  React 19 • Lucide Icons • Razorpay Checkout SDK • Axios    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON & Socket.io
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node / Express)                 │
│  REST API Endpoints • JWT Auth • Rate Limiting • Helmet     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      MongoDB Atlas           │ │     External Integrations  │
│  - User & Credit Cards       │ │  - Razorpay Payment Gateway│
│  - Purchase Requests & Escrow│ │  - Cloudinary Storage      │
│  - 2dsphere GeoJSON Indexes  │ │  - Socket.io Real-time     │
│  - Messages & Reviews        │ └────────────────────────────┘
└──────────────────────────────┘
```

- **Backend**: Node.js & Express 5, MongoDB (Mongoose), JWT authentication with HTTP cookies/headers, Helmet security headers, rate limiting, and Socket.io for live chat.
- **Frontend**: React 19, Vite, Vanilla CSS design tokens (warm editorial cream & dark aesthetic), Lucide React iconography.
- **Payments & Media**: Razorpay payment order generation and cryptographic HMAC signature validation; Cloudinary + base64 fallback for verified image storage.

---

## Directory Structure

```
WishCard/
├── backend/
│   ├── config/             # MongoDB, Cloudinary, and bank definitions
│   ├── controllers/        # userController, requestController, holderController, chatController
│   ├── middlewares/        # JWT auth protection and role check
│   ├── models/             # User, PurchaseRequest, Message schemas
│   ├── routes/             # Express API routes
│   ├── utils/              # Haversine distance, Razorpay client, fee calculator
│   ├── server.js           # Server entry point & Socket.io setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # OrderDetailsView, CreateRequestModal, BuyerHolderChatroom, etc.
│   │   ├── context/        # AuthContext (state management & local persistence)
│   │   ├── constants/      # Supported banks & canonical definitions
│   │   ├── api.js          # Centralized Axios client with token interceptors
│   │   ├── App.jsx         # Main router & tab navigator
│   │   └── main.jsx
│   ├── index.html          # HTML5 entry with Razorpay SDK & Outfit Google fonts
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Setup & Running Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (MongoDB Atlas connection string or local MongoDB)
- npm or yarn

---

### Step 1: Backend Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` if not already present:
   ```bash
   cp .env.example .env
   ```
   Ensure the following environment variables are set in `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/wishcard?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_here
   CLIENT_URL=http://localhost:5173

   # Razorpay API Keys (Test mode keys work out of the box)
   RAZORPAY_KEY_ID=rzp_test_TlV5uGSAtXOZJh
   RAZORPAY_KEY_SECRET=sUQFyvPFuSVMUo34JwcmaRwK

   # Cloudinary (Optional - automatic base64 fallback active if omitted)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Default Admin Credentials
   ADMIN_NAME="Platform Administrator"
   ADMIN_EMAIL=admin@wishcard.com
   ADMIN_PASSWORD=adminSecure2026!Pass
   ADMIN_UPI_ID=escrow@wishcard
   ```

4. Start the backend server:
   ```bash
   # Development mode with nodemon
   npm run dev

   # Or standard production mode
   npm start
   ```
   *The server runs on `http://localhost:5000` and automatically connects to MongoDB Atlas.*

---

### Step 2: Frontend Setup

1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and access the app at:
   ```
   http://localhost:5173
   ```

---

## Default Roles & Test Credentials

| Role | Email | Password | Access Details |
|---|---|---|---|
| **Platform Administrator** | `admin@wishcard.com` | `adminSecure2026!Pass` | Full Escrow Vault, dispute resolutions, and manual payouts |
| **Student (Buyer / Cardholder)** | Any registered email | Min 6 characters | Full campus marketplace, proxy buying, and card listing |

---

## Security & Reliability Considerations
- **No Infinite Uploads**: File inputs lock upon single file selection with image preview confirmation and explicit remove/replace actions.
- **Secret OTP Scoping**: The handoff secret OTP is stripped from API responses for everyone except the buyer and platform admin.
- **Race Condition Prevention**: Database-level atomic transitions ensure two peers cannot accept the same purchase request simultaneously.
- **Zero-Dep Upload Fallback**: If Cloudinary keys are missing or offline, uploads gracefully fallback to client-safe base64 URIs so the app never fails.

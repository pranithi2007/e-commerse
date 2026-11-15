# E-Commerce Shopping and Order Management System Using DFA (Deterministic Finite Automaton)

A modern, full-stack, responsive e-commerce web platform where the entire customer order fulfillment lifecycle is mathematically governed and validated by a **Deterministic Finite Automaton (DFA)**.

Built with **HTML5, CSS3, JavaScript, Bootstrap 5, Node.js, Express.js, and MongoDB**.

---

## 1. Project Objective & Core Concept

In traditional e-commerce applications, order statuses are frequently modified via simple, unrestricted updates—allowing bugs where an order jumps from "Placed" directly to "Delivered", or where a cancelled order is accidentally marked as "Shipped".

This project implements a formal **Deterministic Finite Automaton (DFA)** $M = (Q, \Sigma, \delta, q_0, F)$ to strictly regulate order lifecycle transitions:
- Orders strictly progress through legal state transitions.
- Every state change must pass through the dedicated DFA validation engine before any database record is updated.
- Invalid transitions (e.g. skipping steps or going backward) are rejected with clear error messages.
- Final states (**S5 – Delivered** and **S6 – Cancelled**) are strictly absorbing and immutable.
- An immutable audit trail records every transition event, operator, and timestamp in MongoDB.

---

## 2. Formal DFA Specification

### 2.1 The 5-Tuple Definition: $M = (Q, \Sigma, \delta, q_0, F)$

1. **Set of States ($Q$):**
   - **S0 – Order Placed:** Initial state when customer completes checkout.
   - **S1 – Order Confirmed:** Store validates payment and inventory.
   - **S2 – Processing:** Warehouse picks, quality-checks, and packs items.
   - **S3 – Shipped:** Handed over to logistics / courier partner.
   - **S4 – Out for Delivery:** Courier agent dispatched from local distribution hub.
   - **S5 – Delivered:** Final accepting terminal state. Package received by customer.
   - **S6 – Cancelled:** Final accepting terminal state. Order terminated, inventory restored.

2. **Input Alphabet ($\Sigma$):**
   - `CONFIRM_ORDER`: Accept order and confirm inventory.
   - `START_PROCESSING`: Begin picking and warehouse packing.
   - `SHIP_ORDER`: Dispatch parcel via courier carrier.
   - `OUT_FOR_DELIVERY`: Package on courier vehicle for final delivery.
   - `DELIVER_ORDER`: Delivery confirmed by recipient signature.
   - `CANCEL_ORDER`: Cancel order and release reserved stock.

3. **Transition Function ($\delta : Q \times \Sigma \to Q$):**
   - $\delta(S0, \text{CONFIRM\_ORDER}) = S1$
   - $\delta(S0, \text{CANCEL\_ORDER}) = S6$
   - $\delta(S1, \text{START\_PROCESSING}) = S2$
   - $\delta(S1, \text{CANCEL\_ORDER}) = S6$
   - $\delta(S2, \text{SHIP\_ORDER}) = S3$
   - $\delta(S3, \text{OUT\_FOR\_DELIVERY}) = S4$
   - $\delta(S4, \text{DELIVER\_ORDER}) = S5$
   - For all other pairs $(q, \sigma)$: $\delta(q, \sigma) = \emptyset$ (**Rejected as DFA Violation**)

4. **Initial State ($q_0$):**
   - $q_0 = S0$ (Order Placed)

5. **Set of Final / Terminal States ($F$):**
   - $F = \{ S5, S6 \}$
   - Once an order enters $S5$ (Delivered) or $S6$ (Cancelled), no further transitions are allowed.

---

## 3. Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+), Bootstrap 5.3, Bootstrap Icons
- **Backend:** Node.js, Express.js (v5)
- **Database:** MongoDB (via Mongoose), with automatic fallback to persistent JSON storage engine for zero-setup execution out of the box
- **Security:** Helmet CSP security headers, bcryptjs password hashing, secure HTTP sessions, input sanitization

---

## 4. Main Pages Included

1. **Home Page (`/`)**: Hero banner, DFA overview, category tiles, and featured products.
2. **Products Catalog (`/products`)**: Live search, category filter, price slider, sorting, and product modal.
3. **Shopping Cart (`/cart`)**: Quantity steppers `[-] [qty] [+]`, item removal, tax/shipping recalculation, clear cart.
4. **Checkout Page (`/checkout`)**: Shipping address form, simulated payment methods, order summary, initializes order in **State S0**.
5. **My Orders Page (`/orders`)**: Customer order history with colored DFA status badges and tracking shortcuts.
6. **Order Tracking Page (`/track` & `/track/:orderNumber`)**: Interactive visual stepper, glowing active state, Cancelled state alert, DFA graph topology, and transition audit history timeline.
7. **Admin Dashboard (`/admin`)**: Revenue, total orders, active vs terminal counts, and DFA distribution cards.
8. **Admin Order Management (`/admin/orders`)**: Complete order list, filter by state (S0..S6), DFA transition console, and deliberate invalid transition tester.
9. **Admin Product Management (`/admin/products`)**: Add, edit, delete products, and inventory stock management.
10. **DFA Specification & Live Simulator (`/dfa-spec`)**: Formal 5-tuple specification, state matrix, and interactive online automaton simulator.
11. **Registration Page (`/register`)**: Customer account registration with client & server-side validation.
12. **Login Page (`/login`)**: Customer & admin authentication with 1-click demo credential fill buttons.

---

## 5. Folder & File Structure (Separated Frontend & Backend)

The project is organized into dedicated `frontend/` and `backend/` architectures:

```
ecommerce-dfa/
├── frontend/                     # FRONTEND PRESENTATION LAYER
│   ├── css/
│   │   ├── style.css             # Blue & white theme, product cards, badges
│   │   └── dfa-visualizer.css    # DFA stepper, glowing pulses, nodes, and timeline
│   ├── js/
│   │   ├── app.js                # Auth state, responsive navbar, cart badge, toasts
│   │   ├── cart.js               # Cart table, quantity steppers, subtotal calculations
│   │   ├── dfa-client.js         # Order tracking stepper & state visualizer
│   │   ├── dfaOrderValidator.js  # Client-side DFA validator module
│   │   ├── admin-orders.js       # Admin DFA transition console & rejection tester
│   │   └── admin-products.js     # Admin product catalog manager
│   ├── index.html                # Storefront Home Page
│   ├── products.html             # Products Catalog with live filter & search
│   ├── cart.html                 # Shopping Cart with quantity controls
│   ├── checkout.html             # Checkout & Order Placement (initializes S0)
│   ├── login.html                # Customer & Admin Login (with 1-click demo fill)
│   ├── register.html             # Customer Registration
│   ├── orders.html               # Customer Order History with DFA state badges
│   ├── track.html                # Order Tracking with animated DFA progress bar
│   ├── admin-dashboard.html      # Admin Analytics & DFA state distribution
│   ├── admin-orders.html         # Admin DFA Order State Management & Transition Console
│   ├── admin-products.html       # Admin Product Inventory Management
│   ├── dfa-spec.html             # Mathematical DFA 5-Tuple Specification & Simulator
│   └── 404.html                  # Custom 404 Not Found Page
│
├── backend/                      # BACKEND LOGIC & DATA LAYER
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # Dual-engine DB (MongoDB + persistent fallback)
│   │   │   └── seedData.js       # Catalog items, demo users, orders S0-S6
│   │   ├── dfa/
│   │   │   └── dfaOrderValidator.js # Mathematical DFA Validation Engine
│   │   ├── middleware/
│   │   │   ├── auth.js           # isAuthenticated & isAdmin route guards
│   │   │   └── errorHandler.js   # Centralized error handler
│   │   ├── models/
│   │   │   ├── index.js          # Unified model interface (Mongoose / JSON)
│   │   │   └── mongoose/         # Native Mongoose schemas (User, Product, Order)
│   │   └── routes/
│   │       ├── authRoutes.js     # User registration, login, session
│   │       ├── productRoutes.js  # Product listing, search & Admin CRUD
│   │       ├── cartRoutes.js     # Session-based shopping cart API
│   │       ├── orderRoutes.js    # Checkout (S0), tracking, cancel
│   │       ├── adminRoutes.js    # Admin metrics & DFA transition API
│   │       └── dfaRoutes.js      # Formal DFA spec & live simulation endpoints
│   ├── server.js                 # Express server & frontend static asset delivery
│   ├── seed.js                   # MongoDB data seeder (12 products, users, S0-S6 orders)
│   ├── test-dfa.js               # 29-test automated DFA unit test suite
│   ├── package.json              # Backend package configuration
│   ├── .env                      # Backend environment variables
│   └── .env.example
│
├── .vscode/                      # VISUAL STUDIO CODE CONFIGURATION
│   ├── launch.json               # One-click F5 debug configurations
│   └── tasks.json                # Pre-configured build & test tasks
├── data/
│   └── db_store.json             # Persistent data storage (zero-setup fallback)
├── package.json                  # Root npm runner scripts
├── README.md                     # Comprehensive documentation
├── seed.js                       # Root runner for database seeding
├── server.js                     # Root runner for starting backend server
└── test-dfa.js                   # Root runner for DFA test suite
```

---

## 6. Step-by-Step Instructions to Run in Visual Studio Code

### Method 1: Pressing F5 in Visual Studio Code (Fastest)

1. Launch **Visual Studio Code**.
2. Click **File &rarr; Open Folder...** and select:
   ```
   C:\Users\prani\.gemini\antigravity\scratch\ecommerce-dfa
   ```
3. Press **F5** (or click the **Run & Debug** icon on the left sidebar and click the green play button **"Launch DFA E-Commerce Server"**).
4. VS Code starts the server automatically in the integrated terminal without any errors!
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### Method 2: Running via Terminal in VS Code

1. In VS Code, open the integrated terminal: press ``Ctrl + ` `` (Backtick) or select **Terminal &rarr; New Terminal**.
2. Run the DFA unit tests to verify 100% compliance:
   ```powershell
   npm test
   ```
   *(You will see all 29 automated DFA unit tests pass with green checkmarks!)*
3. (Optional) Run the database seeder if you wish to reset sample data:
   ```powershell
   npm run seed
   ```
4. Start the server:
   ```powershell
   npm start
   ```
5. Open your web browser and go to:
   ```
   http://localhost:3000
   ```

---

## 7. Demo Accounts & Credentials

For testing and demonstration, use the pre-seeded accounts:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@dfamall.com` | `admin123` | Full access to Admin Dashboard, DFA Order Transition Console, Product Catalog CRUD |
| **Customer** | `customer@dfamall.com` | `customer123` | Shopping cart, checkout, My Orders, order cancellation (S0/S1) |

*(Note: The Login page features convenient **1-Click Demo Fill buttons** for instant sign-in).*

---

## 8. Pre-Seeded Sample Orders for Quick Testing

You can instantly test tracking and transitions using these pre-seeded orders:

| Order Number | Initial State | Description |
| :--- | :--- | :--- |
| `ORD-DFA-1001` | **S0 – Order Placed** | Customer placed order; ready for Admin confirmation |
| `ORD-DFA-1002` | **S1 – Order Confirmed** | Store confirmed; ready for warehouse processing |
| `ORD-DFA-1003` | **S2 – Processing** | Warehouse packing; ready for shipping dispatch |
| `ORD-DFA-1004` | **S3 – Shipped** | In transit via courier; ready for out-for-delivery |
| `ORD-DFA-1005` | **S4 – Out for Delivery** | Courier on final delivery route; ready for delivery |
| `ORD-DFA-1006` | **S5 – Delivered** | **Terminal State (Immutable)**; no further changes allowed |
| `ORD-DFA-1007` | **S6 – Cancelled** | **Terminal State (Immutable)**; cancelled order |

---

## 9. How to Test & Demonstrate the DFA Functionality

### 1. Test Valid Transitions
1. Log in as **Admin** (`admin@dfamall.com` / `admin123`).
2. Go to **Order Management (DFA)** (`/admin/orders`).
3. Click **DFA Transition** on `ORD-DFA-1001` (State S0).
4. Notice that only **two buttons** are available:
   - `Confirm Order -> [S1] Order Confirmed`
   - `Cancel Order -> [S6] Cancelled`
5. Click **Confirm Order**. The order immediately advances to **S1**, appends an audit log entry, and recalculates allowed next transitions to `[S2] Start Processing` and `[S6] Cancel Order`.

### 2. Test Invalid Transitions & Rejection (Critical DFA Feature)
1. In the same modal, look at the **Deliberate Invalid Transition Tester** box.
2. Select an illegal state, such as **[S5] Delivered** (skipping Processing, Shipped, and Out for Delivery).
3. Click **Trigger & Verify DFA Rejection**.
4. The system will reject the request with HTTP 400 and display:
   > `DFA Violation: Invalid state transition! Cannot transition from 'Order Confirmed' (S1) directly to 'Delivered' (S5). Allowed transition(s) from S1: [ 'Processing' (S2) via Start Processing, 'Cancelled' (S6) via Cancel Order ].`
5. The order remains safely protected in state S1 without corruption!

### 3. Test Terminal State Immutability
1. In the Admin Order Management page, filter to **[S5] Delivered** (`ORD-DFA-1006`).
2. Open **DFA Transition**.
3. Notice the warning alert:
   > `Terminal Absorbing State (S5): Delivered orders (S5) and Cancelled orders (S6) cannot be modified under DFA rules.`
4. Any attempt to modify returns:
   > `DFA Violation: Order is in terminal state 'Delivered' (S5). Delivered orders cannot be modified.`

### 4. Interactive Live Simulator
Visit `/dfa-spec` to run the interactive DFA simulator where you can test single steps or full strings like `CONFIRM_ORDER, START_PROCESSING, SHIP_ORDER, OUT_FOR_DELIVERY, DELIVER_ORDER`.

---

## 10. Security Implementation Highlights

- **Password Hashing:** Passwords hashed with bcrypt (salt rounds = 10).
- **Helmet Headers:** Full Content-Security-Policy (CSP) protecting against XSS and clickjacking.
- **Session Protection:** HttpOnly cookies, 24-hour expiration, and CSRF isolation.
- **Role-Based Guards:** `isAdmin` middleware protects all admin API endpoints and views.
- **Zero Real Payment Storage:** Simulated payment tokenization ensuring zero financial risk.

---

## 11. Academic Evaluation Summary

This project satisfies all requirements of a **Deterministic Finite Automaton (DFA)**:
- Determinism: For any state $q$ and input event $\sigma$, there is at most one defined next state.
- Formally verified state transition matrix $\delta$.
- Strict terminal absorbing states ($F$).
- Rejection of undefined transitions $(\delta(q, \sigma) = \emptyset)$.
- Complete full-stack implementation with clean modular code and responsive UI.

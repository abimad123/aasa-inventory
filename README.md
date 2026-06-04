
# Aasa Inventory Management System

A high-precision, enterprise-grade B2B SaaS platform designed to manage product catalogs, complex decimal unit conversions, seller quotation workflows, and transaction-audited orders with database-controlled pricing.

---

## 1. Project Overview

Aasa Inventory solves the operational and financial discrepancies that arise in inventory management when dealing with variable weights, volumes, and counts. It implements a robust role-based workflow (Admin vs. Seller) with a strict separation of concerns, secure server-side arithmetic, and complete auditable tracking of all inventory adjustments.

### Core Workflows

*   **Inventory Workflow:** Products are defined and updated exclusively by Administrators. Administrators configure the stock levels, base units, and price per base unit. Soft deletion (`isActive` flag) is enforced to preserve historical records of orders and quotations.
*   **Quotation Workflow:** Sellers select products from the catalog, input desired quantities in multiple user-friendly units (e.g., KG, L, ITEM), and compile a quotation draft. Once submitted, the quotation status is set to `PENDING` and awaits Administrator review. Administrators can transition it to `APPROVED` or `REJECTED`.
*   **Order Workflow:** Upon quotation approval, sellers can convert it directly to a `PENDING` order. Administrators track, process, and transition the order through its status cycle. 
*   **Unit Conversion Workflow:** The system normalizes all input units (e.g., KG, L) to their respective base units (e.g., G, ML) for database consistency. Pricing is calculated using these normalized quantities.
*   **Role-Based Access Control (RBAC):** NextAuth.js validates sessions, enforcing page-level, API-level, and database-level boundaries between `ADMIN` and `SELLER` permissions.

---

## 2. System Architecture

The application is structured as a decoupled serverless monolith utilizing Next.js, running client-side state engines in the browser and secure transaction engines in Next.js Serverless API routes.

```
                  ┌─────────────────────────────────────────┐
                  │              User (Browser)             │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS (JSON / Session JWT)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │             Next.js Frontend            │
                  │   (Pages, Dashboards, Client-side JS)   │
                  └────────────────────┬────────────────────┘
                                       │ 
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Next.js API Routes             │
                  │  (Role Check, Decimal.js, Validation)   │
                  └────────────────────┬────────────────────┘
                                       │ Prisma Queries
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │               Prisma ORM                │
                  │    (Type-Safe Client & Transactions)    │
                  └────────────────────┬────────────────────┘
                                       │ TCP / Connection Pool
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Neon Serverless PostgreSQL      │
                  │    (Relational Database, Decimals)      │
                  └─────────────────────────────────────────┘
```

### Architectural Layers

1.  **Presentation Layer (Next.js Frontend):** Implemented using Tailwind CSS and components from shadcn/ui. Handles dashboard routing, Catalog browsing, interactive Quotation Builder drafting, and the live math simulator.
2.  **Application / API Layer (Next.js API Routes):** Exposes JSON API endpoints. Performs session token validation (RBAC checks), pulls fresh records inside secure transactions, and runs anti-tamper logic.
3.  **Data Access Layer (Prisma ORM):** Generates a type-safe database client. Manages transactional integrity via `prisma.$transaction()` to prevent partial database updates or stock discrepancies.
4.  **Persistence Layer (Neon PostgreSQL):** A serverless PostgreSQL instance storing user accounts, product lists, order histories, quotation logs, and transaction ledgers.

---

## 3. Database Design

The schema uses a relational PostgreSQL database to ensure strict transactional consistency.

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Quotation : creates
    Product ||--o{ QuotationItem : itemized-in
    Product ||--o{ OrderItem : itemized-in
    Product ||--o{ InventoryTransaction : logs
    Quotation ||--o{ QuotationItem : contains
    Order ||--o{ OrderItem : contains

    User {
        string id PK
        string name
        string email UK
        string password
        Role role
        datetime createdAt
    }

    Product {
        string id PK
        string sku UK
        string name
        string category
        string baseUnit
        Decimal pricePerBaseUnit
        Decimal stockQuantity
        boolean isActive
        datetime createdAt
    }

    Quotation {
        string id PK
        string userId FK
        QuotationStatus status
        Decimal totalAmount
        datetime createdAt
    }

    QuotationItem {
        string id PK
        string quotationId FK
        string productId FK
        Decimal enteredQuantity
        string enteredUnit
        Decimal convertedQuantity
        Decimal unitPrice
        Decimal lineTotal
    }

    Order {
        string id PK
        string userId FK
        OrderStatus status
        Decimal totalAmount
        datetime createdAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        Decimal enteredQuantity
        string enteredUnit
        Decimal convertedQuantity
        Decimal unitPrice
        Decimal lineTotal
    }

    InventoryTransaction {
        string id PK
        string productId FK
        string type
        Decimal quantity
        string notes
        datetime createdAt
    }
```

### Table Definitions & Purposes

*   **User:** Stores system credentials, emails, names, and roles (`ADMIN` or `SELLER`).
*   **Product:** Holds master records of all goods, unique SKUs, active statuses, base units, and prices.
*   **Quotation:** Tracks compiled sales proposals submitted by sellers.
*   **QuotationItem:** Line-level quotation records detailing the user's entered unit, converted quantity, base unit price, and total line cost.
*   **Order:** Tracks orders converted from approved quotations or created directly.
*   **OrderItem:** Line-level order records preserving quantities, units, and historical prices.
*   **InventoryTransaction:** The master audit log tracking all additions (`IN`) or deductions (`OUT`) of stock.

---

## 4. Features

### Authentication & Security
*   **Split-Screen Interface:** Branded, responsive authentication pages built with custom graphite theme overlays.
*   **Password Hashing:** Hashes user credentials using `bcryptjs` with a cost factor of 10.
*   **Dynamic Role Routing:** Middleware intercepts requests to automatically direct `ADMIN` and `SELLER` users to their respective portals.
*   **Registration System:** Enables fast self-registration strictly for the `SELLER` role, validating email uniqueness and password rules before redirecting to the login screen with a success banner.

### Admin Console
*   **Soft Deletion:** Toggles product active states instead of removing records, preserving references in historical quotes and orders.
*   **Real-time Metrics:** Displays overall Inventory Value (₹), low-stock items, active products count, and total transactions.
*   **Quotation Review:** Allows approving or rejecting pending seller quotes.
*   **Order Management Desk:** Allows transitioning orders through the lifecycle, tracking progress, and inspecting unit-to-stock math conversion charts.

### Seller Portal
*   **Product Catalog:** Implements instantaneous text search and category filtration.
*   **Interactive Quotation Builder:** Enables adding items to a draft cart, displaying real-time unit conversion steps, price calculations, and line subtotals.
*   **My Past Orders / Quotes:** Lists historical documents with statuses and actionable triggers.
*   **Quotation-to-Order Conversion:** Allows converting approved quotations to a finalized `PENDING` order with a single click.

---

## 5. Unit Conversion Strategy

To support arbitrary input units while keeping database records consistent, Aasa Inventory maps all entries to normalized base units.

### Conversion Grid

| Unit Type | Supported Input Units | Normalization Base Unit | Conversion Factor |
| :--- | :--- | :--- | :--- |
| **Weight** | Grams (`G`), Kilograms (`KG`) | **Grams (`G`)** | $1 \text{ KG} = 1000 \text{ G}$ |
| **Volume** | Milliliters (`ML`), Liters (`L`) | **Milliliters (`ML`)** | $1 \text{ L} = 1000 \text{ ML}$ |
| **Count** | Item (`ITEM`) | **Item (`ITEM`)** | $1 \text{ ITEM} = 1 \text{ ITEM}$ |

### Rationale for Base Units
Storing quantities in the smallest base unit (Grams, Milliliters) ensures that fractional values (like $2.567 \text{ KG}$) can be represented cleanly in the database without floating-point representation limits. This simplifies math calculations to basic multiplications and divisions against integer conversion factors.

### Conversion Pipeline

```
  [User inputs 2.5 KG] 
           │
           ▼
  (Client-side preview math: 2.5 * 1000 = 2500 G)
           │
           ▼
  [Seller submits Quotation/Order]
           │
           ▼
  (Backend Normalization: convertToBaseUnit(2.5, "KG") => 2500 G)
           │
           ▼
  [Database writes to QuotationItem/OrderItem: enteredUnit: "KG", convertedQuantity: 2500]
           │
           ▼
  [Order status transitioned to COMPLETED]
           │
           ▼
  (Stock Deduction: Product.stockQuantity = Product.stockQuantity - 2500 G)
```

---

## 6. Pricing Strategy & Anti-Tampering

Product pricing is controlled exclusively by Admin users. The system protects against client-side price manipulation through the following mechanisms:

1.  **Read-Only UI:** Seller interfaces display product pricing as read-only. There are no inputs to modify prices on the client side.
2.  **Ignored Client Inputs:** The `POST /api/orders` and `POST /api/quotations` endpoints ignore any price fields passed in the request body.
3.  **Database Lookup Verification:** The backend fetches the authoritative `pricePerBaseUnit` from the database inside a transaction block, recalculating all line totals and order totals server-side.

### Example Conversion & Pricing Flow

$$\text{User enters } 2.5 \text{ KG of Alphonso Mangoes (Base Unit: G, Price: } \text{₹}0.50 \text{ / Gram)}$$

$$2.5 \text{ KG} \times 1000 = 2500 \text{ G (Normalized Base Quantity)}$$

$$2500 \text{ G} \times \text{₹}0.50 \text{ per Gram} = \text{₹}1,250.00 \text{ (Authorized Total Amount)}$$

---

## 7. Decimal Precision

Using Javascript's native floating-point numbers (`number` type, based on IEEE 754) introduces cumulative rounding errors (e.g., $0.1 + 0.2 = 0.30000000000000004$). For inventory records and financial transactions, this behavior is unacceptable.

### Our Precision Stack
*   **Database Level:** Pricing and quantities use the `Decimal(10,2)` and `Decimal(12,4)` types in PostgreSQL.
*   **ORM Level:** Prisma maps PostgreSQL `Decimal` types to its own `Decimal` client class.
*   **Runtime Level:** The application uses `decimal.js` to perform arbitrary-precision arithmetic. All database decimals are converted to `decimal.js` instances before calculations are performed.

```typescript
// Example precision calculation from src/lib/units.ts
import { Decimal } from "decimal.js";

export function calculatePrice(qty: number | Decimal, unit: string, pricePerBase: number | Decimal): Decimal {
  const quantity = new Decimal(qty.toString());
  const price = new Decimal(pricePerBase.toString());
  
  if (unit === "KG" || unit === "L") {
    // 1 KG = 1000 G, 1 L = 1000 ML. Price is per base unit (G/ML).
    return quantity.mul(1000).mul(price);
  }
  return quantity.mul(price);
}
```

---

## 8. Order Lifecycle & Inventory Deduction

The order lifecycle consists of the following states:

```
        ┌───────────────┐          ┌───────────────┐
        │    PENDING    ├─────────►│   CANCELLED   │
        └───────┬───────┘          └───────────────┘
                │                          ▲
                ▼                          │
        ┌───────────────┐                  │
        │  PROCESSING   ├──────────────────┘
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │   COMPLETED   │ (Stock Deducted, Transaction Logged)
        └───────────────┘
```

### Lifecycle Rules

*   **Deduction Execution:** Inventory is **only** deducted from a product's `stockQuantity` when the order's status transitions to `COMPLETED`. Orders in `PENDING` or `PROCESSING` states do not affect stock levels.
*   **Overselling Prevention:** Before an order can transition to `COMPLETED`, the system runs a stock check inside a database transaction:
    $$\text{If } \text{Product.stockQuantity} < \text{OrderItem.convertedQuantity} \rightarrow \text{Abort Transaction and return error.}$$
*   **Transaction Logging:** Upon transition to `COMPLETED`, the system creates an `InventoryTransaction` record of type `OUT` to maintain the audit trail.

---

## 9. API Documentation

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Registers a new user with the `SELLER` role. |
| `/api/products` | `GET` | Authenticated | Fetches active products. |
| `/api/products` | `POST` | `ADMIN` | Creates a new product. |
| `/api/products/[id]` | `PUT` | `ADMIN` | Updates product details or toggles active status. |
| `/api/quotations` | `GET` | Authenticated | Fetches quotations (Admins see all; Sellers see their own). |
| `/api/quotations` | `POST` | `SELLER` | Submits a new quotation draft. |
| `/api/quotations/[id]` | `PUT` | `ADMIN` | Approves or rejects a pending quotation. |
| `/api/orders` | `GET` | Authenticated | Fetches orders (Admins see all; Sellers see their own). |
| `/api/orders` | `POST` | `SELLER` | Submits a direct order or converts an approved quotation. |
| `/api/orders/[id]` | `PUT` | `ADMIN` | Updates order status (e.g., transitions to `COMPLETED`). |
| `/api/transactions` | `GET` | `ADMIN` | Fetches the full inventory transaction ledger. |
| `/api/stats` | `GET` | Public | Returns aggregate metrics for the landing page. |

---

## 10. Key Design Decisions

*   **Why Prisma?** Provides a type-safe client that maps database schemas directly to TypeScript interfaces, reducing runtime syntax errors.
*   **Why Neon?** A serverless PostgreSQL database that offers rapid scaling, branchable environments, and fast query execution.
*   **Why NextAuth.js?** Simplifies session management by handling JWT cookies, authentication state, and role claims securely.
*   **Why Base Units?** Normalizing inventory to base units (like Grams and Milliliters) ensures consistency across varying packaging sizes and avoids rounding discrepancies during stock deductions.
*   **Why Decimal Precision?** Prevents floating-point rounding errors in calculations, protecting the integrity of pricing and stock levels.
*   **Why Database-Controlled Pricing?** Ensures pricing security by ignoring client-submitted price values and recalculating totals on the server.

---

## 11. Setup & Installation Guide

### Prerequisites
*   Node.js 18+ installed
*   PostgreSQL database or Neon account

### Installation Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/aasa-inventory.git
    cd aasa-inventory
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
    NEXTAUTH_SECRET="your-32-character-secret-key"
    NEXTAUTH_URL="http://localhost:3000"
    ```

4.  **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```

5.  **Sync Database Schema:**
    ```bash
    npx prisma db push
    ```

6.  **Seed Database (Creates Admin and Seller Test Accounts):**
    ```bash
    npx prisma db seed
    ```

7.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser.

---

## 12. Test Credentials

### Administrator Account
*   **Email:** `admin@aasa.com`
*   **Password:** `Admin123`

### Seller Account
*   **Email:** `seller@aasa.com`
*   **Password:** `Seller123`

---

## Vercel Deployment

Step-by-step instructions:

1. Push to GitHub
2. Import repository into Vercel
3. Configure environment variables
4. Deploy
5. Run database sync if required (e.g. `npx prisma db push` or integration during build)

---

## 14. Future Improvements

*   **Multi-Warehouse Inventory:** Add support for tracking stock across multiple locations.
*   **Advanced Analytics:** Add charts and reporting to track product velocity and sales performance.
*   **Automated Email Notifications:** Notify admins of low stock levels or new quotation submissions.
*   **Approval Workflows:** Implement customizable approval hierarchies for large orders.

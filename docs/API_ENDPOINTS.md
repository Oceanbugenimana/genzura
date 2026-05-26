# GENZURA REST API — Endpoint Reference

Base URL: `http://localhost:5000/api`  
Auth: `Authorization: Bearer <accessToken>`

---

## 🔐 Authentication

| Method | Endpoint                  | Auth | Description              |
|--------|---------------------------|------|--------------------------|
| POST   | `/auth/register`          | ❌   | Register new user        |
| POST   | `/auth/login`             | ❌   | Login, get tokens        |
| POST   | `/auth/refresh`           | ❌   | Refresh access token     |
| POST   | `/auth/logout`            | ✅   | Logout, clear token      |
| GET    | `/auth/me`                | ✅   | Get current user         |
| POST   | `/auth/change-password`   | ✅   | Change password          |

---

## 👥 Users (Admin only)

| Method | Endpoint         | Role  | Description        |
|--------|------------------|-------|--------------------|
| GET    | `/users`         | Admin | List all users     |
| GET    | `/users/:id`     | Admin | Get user by ID     |
| PUT    | `/users/profile` | Any   | Update own profile |
| PUT    | `/users/:id`     | Admin | Update any user    |
| DELETE | `/users/:id`     | Admin | Soft delete user   |

---

## 🏪 Stores

| Method | Endpoint       | Role    | Description       |
|--------|----------------|---------|-------------------|
| GET    | `/stores`      | Any     | List stores       |
| GET    | `/stores/:id`  | Any     | Get store by ID   |
| POST   | `/stores`      | Manager | Create store      |
| PUT    | `/stores/:id`  | Manager | Update store      |
| DELETE | `/stores/:id`  | Manager | Delete store      |

---

## 🏷️ Categories

| Method | Endpoint            | Role    | Description          |
|--------|---------------------|---------|----------------------|
| GET    | `/categories`       | Any     | List categories      |
| GET    | `/categories/:id`   | Any     | Get category by ID   |
| POST   | `/categories`       | Manager | Create category      |
| PUT    | `/categories/:id`   | Manager | Update category      |
| DELETE | `/categories/:id`   | Manager | Delete category      |

---

## 📦 Products

| Method | Endpoint                          | Role    | Description           |
|--------|-----------------------------------|---------|-----------------------|
| GET    | `/products`                       | Any     | List products         |
| GET    | `/products/:id`                   | Any     | Get product by ID     |
| GET    | `/products/search/barcode/:code`  | Any     | Find by barcode       |
| POST   | `/products`                       | Manager | Create product        |
| PUT    | `/products/:id`                   | Manager | Update product        |
| DELETE | `/products/:id`                   | Manager | Delete product        |

**Query params for GET /products:**
- `search` — name, SKU, barcode
- `storeId` — filter by store
- `categoryId` — filter by category
- `lowStock=true` — only low stock items
- `page`, `limit` — pagination

---

## 📊 Inventory Transactions

| Method | Endpoint                       | Role    | Description                  |
|--------|--------------------------------|---------|------------------------------|
| GET    | `/inventory/summary`           | Any     | Inventory summary stats      |
| GET    | `/inventory/transactions`      | Any     | Transaction history          |
| GET    | `/inventory/transactions/:id`  | Any     | Single transaction           |
| POST   | `/inventory/transaction`       | Any     | Record IN / OUT / ADJUSTMENT |
| POST   | `/inventory/bulk`              | Manager | Bulk transactions            |

**POST /inventory/transaction body:**
```json
{
  "productId": "uuid",
  "type": "IN | OUT | ADJUSTMENT",
  "quantity": 10,
  "notes": "Optional notes",
  "referenceNo": "PO-001"
}
```

---

## 📈 Reports

| Method | Endpoint                    | Role    | Description              |
|--------|-----------------------------|---------|--------------------------|
| GET    | `/reports/dashboard`        | Any     | Dashboard stats          |
| GET    | `/reports/stock-movement`   | Any     | Movement chart data      |
| GET    | `/reports/low-stock`        | Any     | Low stock report         |
| GET    | `/reports/top-products`     | Any     | Most sold products       |
| GET    | `/reports/dead-stock`       | Any     | Dead stock report        |
| GET    | `/reports/store-analytics`  | Manager | Per-store analytics      |
| GET    | `/reports/audit-logs`       | Admin   | Full audit log           |

---

## 🔔 Notifications

| Method | Endpoint                  | Role  | Description              |
|--------|---------------------------|-------|--------------------------|
| GET    | `/notifications`          | Any   | Notification history     |
| GET    | `/notifications/stats`    | Admin | Notification stats       |
| GET    | `/notifications/:id`      | Any   | Single notification      |
| POST   | `/notifications/retry`    | Admin | Retry failed alerts      |

---

## 🤖 AI Service

| Method | Endpoint                          | Role    | Description                  |
|--------|-----------------------------------|---------|------------------------------|
| GET    | `/ai/health`                      | Any     | AI service health check      |
| POST   | `/ai/restock-recommendations`     | Manager | Restock recommendations      |
| POST   | `/ai/demand-prediction`           | Manager | Demand prediction            |
| POST   | `/ai/insights`                    | Any     | Full inventory insights      |

---

## 🔑 Role Permissions Summary

| Feature              | Admin | Stock Manager | Staff |
|----------------------|-------|---------------|-------|
| View products        | ✅    | ✅            | ✅    |
| Create/edit products | ✅    | ✅            | ❌    |
| Stock transactions   | ✅    | ✅            | ✅    |
| Bulk transactions    | ✅    | ✅            | ❌    |
| Manage stores        | ✅    | ✅            | ❌    |
| Manage categories    | ✅    | ✅            | ❌    |
| View reports         | ✅    | ✅            | ✅    |
| Store analytics      | ✅    | ✅            | ❌    |
| Audit logs           | ✅    | ❌            | ❌    |
| Manage users         | ✅    | ❌            | ❌    |
| Retry notifications  | ✅    | ❌            | ❌    |
| AI insights          | ✅    | ✅            | ✅    |

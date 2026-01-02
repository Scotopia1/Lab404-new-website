# Lab404 Admin Dashboard - Comprehensive Test Plan

## Overview
This document outlines all features and test cases for the Lab404 Electronics Admin Dashboard. The test plan covers authentication, all dashboard modules, and critical user flows.

**Test Environment:**
- Admin URL: http://localhost:3001
- API URL: http://localhost:4000
- Admin Credentials: `admin@lab404electronics.com` / `Lab404Admin2024!`

---

## 1. Authentication Module

### 1.1 Login Page (`/login`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-001 | Valid login | 1. Navigate to /login<br>2. Enter valid email and password<br>3. Click "Sign in" | Redirect to dashboard (/) | Critical |
| AUTH-002 | Invalid email format | 1. Enter invalid email format<br>2. Click Sign in | Show validation error "Please enter a valid email" | High |
| AUTH-003 | Empty password | 1. Enter valid email<br>2. Leave password empty<br>3. Click Sign in | Show validation error "Password is required" | High |
| AUTH-004 | Wrong credentials | 1. Enter wrong email/password<br>2. Click Sign in | Show error message from API | High |
| AUTH-005 | Loading state | 1. Submit valid credentials | Show loading spinner and "Signing in..." text | Medium |
| AUTH-006 | Protected routes | 1. Without login, navigate to /products | Redirect to /login | Critical |

---

## 2. Dashboard Home (`/`)

### 2.1 Stats Cards

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DASH-001 | Page loads | Navigate to / after login | Dashboard page displays with title "Dashboard" | Critical |
| DASH-002 | Revenue card displays | View dashboard | Shows Total Revenue with formatted currency | High |
| DASH-003 | Orders card displays | View dashboard | Shows Orders count with pending indicator | High |
| DASH-004 | Products card displays | View dashboard | Shows Products count with low stock warning | High |
| DASH-005 | Customers card displays | View dashboard | Shows Customers count with new customers indicator | High |

### 2.2 Charts

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DASH-006 | Revenue chart renders | View dashboard | Area chart displays revenue data | Medium |
| DASH-007 | Orders donut chart | View dashboard | Donut chart shows orders by status | Medium |
| DASH-008 | Top products list | View dashboard | Bar list shows top 5 selling products | Medium |
| DASH-009 | Inventory status | View dashboard | Progress bars show stock levels | Medium |

---

## 3. Products Module (`/products`)

### 3.1 Products List

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-001 | List page loads | Navigate to /products | DataTable displays with products | Critical |
| PROD-002 | Search products | 1. Type in search box<br>2. Press enter | Filter products by name | High |
| PROD-003 | Pagination | Click page navigation buttons | Navigate between pages | High |
| PROD-004 | Change page size | Select different limit (10/20/50/100) | Table updates with new page size | Medium |
| PROD-005 | Add product button | Click "Add Product" | Navigate to /products/new | High |

### 3.2 Bulk Operations

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-006 | Select single row | Click checkbox on a row | Row selected, selection count updates | High |
| PROD-007 | Select all rows | Click header checkbox | All visible rows selected | High |
| PROD-008 | Bulk delete | 1. Select rows<br>2. Click Delete<br>3. Confirm | Products deleted, toast shown | High |
| PROD-009 | Bulk export CSV | 1. Select rows<br>2. Click Export | CSV file downloads | Medium |
| PROD-010 | Bulk publish | 1. Select draft products<br>2. Click Publish | Products status changed to active | Medium |
| PROD-011 | Bulk unpublish | 1. Select active products<br>2. Click Unpublish | Products status changed to draft | Medium |
| PROD-012 | Clear selection | Click "Clear selection" | All selections cleared | Low |

### 3.3 Product Actions

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-013 | Edit product | Click Edit on a product | Navigate to /products/[id] | High |
| PROD-014 | View product | Click View on a product | Opens product in new tab | Medium |
| PROD-015 | Delete single product | 1. Click Delete<br>2. Confirm dialog | Product deleted, toast shown | High |

### 3.4 Create/Edit Product (`/products/new`, `/products/[id]`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PROD-016 | Create form loads | Navigate to /products/new | Empty form displays | Critical |
| PROD-017 | Edit form loads | Navigate to /products/[id] | Form pre-filled with product data | Critical |
| PROD-018 | Required field validation | Submit empty form | Show validation errors for required fields | High |
| PROD-019 | Save product | Fill form and submit | Product saved, redirect to list | Critical |
| PROD-020 | Image upload | Upload product images | Images displayed in preview | Medium |

---

## 4. Orders Module (`/orders`)

### 4.1 Orders List

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-001 | List page loads | Navigate to /orders | DataTable displays with orders | Critical |
| ORD-002 | Search orders | Search by order number | Filter orders by order number | High |
| ORD-003 | Filter by status | Select status from dropdown | Filter orders by selected status | High |
| ORD-004 | Order link | Click order number | Navigate to /orders/[id] | High |
| ORD-005 | Status badge | View order row | Shows colored status badge | Medium |

### 4.2 Bulk Operations

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-006 | Bulk export | Select orders and export | CSV file downloads | Medium |
| ORD-007 | Bulk mark processing | Select and mark as processing | Status updated, toast shown | High |
| ORD-008 | Bulk mark shipped | Select and mark as shipped | Status updated, toast shown | High |
| ORD-009 | Bulk mark delivered | Select and mark as delivered | Status updated, toast shown | High |
| ORD-010 | Bulk cancel | Select and cancel orders | Status updated to cancelled | High |

### 4.3 Order Detail (`/orders/[id]`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ORD-011 | Detail page loads | Navigate to /orders/[id] | Order details displayed | Critical |
| ORD-012 | Customer info | View order detail | Customer information shown | High |
| ORD-013 | Order items | View order detail | List of ordered items with prices | High |
| ORD-014 | Order totals | View order detail | Subtotal, tax, shipping, total shown | High |
| ORD-015 | Update status | Change order status | Status updated, notification sent | High |

---

## 5. Customers Module (`/customers`)

### 5.1 Customers List

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CUST-001 | List page loads | Navigate to /customers | DataTable displays with customers | Critical |
| CUST-002 | Search customers | Search by email | Filter customers by email | High |
| CUST-003 | Status badge | View customer row | Shows Active/Inactive badge | Medium |
| CUST-004 | View details | Click View Details | Navigate to /customers/[id] | High |

### 5.2 Bulk Operations

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CUST-005 | Bulk export | Select and export | CSV file downloads | Medium |
| CUST-006 | Copy emails | Select and copy emails | Emails copied to clipboard, toast shown | Medium |
| CUST-007 | Bulk activate | Select inactive customers and activate | Status changed to active | High |
| CUST-008 | Bulk deactivate | Select active customers and deactivate | Status changed to inactive | High |

### 5.3 Customer Detail (`/customers/[id]`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CUST-009 | Detail page loads | Navigate to /customers/[id] | Customer details displayed | Critical |
| CUST-010 | Order history | View customer detail | List of customer's orders shown | High |
| CUST-011 | Customer stats | View customer detail | Total orders and spent shown | Medium |

---

## 6. Categories Module (`/categories`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CAT-001 | List page loads | Navigate to /categories | Categories displayed | Critical |
| CAT-002 | Create category | Click Add, fill form, save | Category created | High |
| CAT-003 | Edit category | Click Edit, modify, save | Category updated | High |
| CAT-004 | Delete category | Click Delete, confirm | Category deleted | High |
| CAT-005 | Category hierarchy | View categories | Parent/child relationships shown | Medium |

---

## 7. Blogs Module (`/blogs`)

### 7.1 Blogs List

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BLOG-001 | List page loads | Navigate to /blogs | Blog posts displayed | Critical |
| BLOG-002 | Search blogs | Search by title | Filter blogs by title | High |
| BLOG-003 | Create blog button | Click "New Post" | Navigate to /blogs/new | High |

### 7.2 Create/Edit Blog (`/blogs/new`, `/blogs/[id]`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| BLOG-004 | Create form loads | Navigate to /blogs/new | Blog editor displays | Critical |
| BLOG-005 | Edit form loads | Navigate to /blogs/[id] | Form pre-filled with blog data | Critical |
| BLOG-006 | Save as draft | Fill form, save as draft | Blog saved with draft status | High |
| BLOG-007 | Publish blog | Fill form, publish | Blog saved with published status | High |
| BLOG-008 | Featured image | Upload featured image | Image displayed in preview | Medium |

---

## 8. Promo Codes Module (`/promo-codes`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PROMO-001 | List page loads | Navigate to /promo-codes | Promo codes displayed | Critical |
| PROMO-002 | Create promo code | Click Add, fill form, save | Promo code created | High |
| PROMO-003 | Edit promo code | Click Edit, modify, save | Promo code updated | High |
| PROMO-004 | Delete promo code | Click Delete, confirm | Promo code deleted | High |
| PROMO-005 | Percentage discount | Create with percentage type | Shows percentage value | Medium |
| PROMO-006 | Fixed discount | Create with fixed type | Shows fixed amount | Medium |
| PROMO-007 | Expiration date | Set expiration date | Date displayed correctly | Medium |
| PROMO-008 | Usage limit | Set usage limit | Limit shown with current usage | Medium |

---

## 9. Quotations Module (`/quotations`)

### 9.1 Quotations List

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| QUOT-001 | List page loads | Navigate to /quotations | Quotations displayed | Critical |
| QUOT-002 | Search quotations | Search by customer | Filter quotations | High |
| QUOT-003 | Status filter | Filter by status | Shows filtered results | Medium |

### 9.2 Quotation Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| QUOT-004 | Create quotation | Navigate to /quotations/new, fill form | Quotation created | High |
| QUOT-005 | Edit quotation | Navigate to /quotations/[id]/edit | Quotation updated | High |
| QUOT-006 | View quotation | Navigate to /quotations/[id] | Quotation details shown | High |
| QUOT-007 | Add line items | Add products to quotation | Items added with prices | High |
| QUOT-008 | Generate PDF | Click generate PDF | PDF downloads | Medium |

---

## 10. Analytics Module (`/analytics`)

### 10.1 Overview (`/analytics`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ANA-001 | Page loads | Navigate to /analytics | Analytics overview displayed | Critical |
| ANA-002 | Date range filter | Change date range | Data updates for selected period | High |
| ANA-003 | Export report | Click export | Report downloads | Medium |

### 10.2 Sales Analytics (`/analytics/sales`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ANA-004 | Sales page loads | Navigate to /analytics/sales | Sales analytics displayed | High |
| ANA-005 | Revenue chart | View sales page | Revenue trend chart shown | Medium |
| ANA-006 | Sales by category | View sales page | Category breakdown shown | Medium |

### 10.3 Products Analytics (`/analytics/products`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ANA-007 | Products page loads | Navigate to /analytics/products | Product analytics displayed | High |
| ANA-008 | Top products | View products page | Top selling products listed | Medium |
| ANA-009 | Low stock alerts | View products page | Low stock products highlighted | Medium |

---

## 11. Settings Module (`/settings`)

### 11.1 General Settings (`/settings`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-001 | Page loads | Navigate to /settings | Settings form displayed | Critical |
| SET-002 | Store name | Edit store name, save | Setting updated | High |
| SET-003 | Store email | Edit store email, save | Setting updated | High |
| SET-004 | Currency | Change currency, save | Currency updated | Medium |
| SET-005 | Tax settings | Enable/disable tax, set rate | Tax settings saved | High |
| SET-006 | Shipping settings | Set shipping rates | Shipping settings saved | High |
| SET-007 | Low stock threshold | Set threshold value | Threshold saved | Medium |
| SET-008 | Reset changes | Click Reset | Form reverts to saved values | Low |

### 11.2 Notification Settings (`/settings/notifications`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-009 | Notifications page loads | Navigate to /settings/notifications | Notification settings displayed | High |
| SET-010 | Toggle notifications | Enable/disable notification types | Settings saved | High |
| SET-011 | Add admin email | Add new admin email | Email added to list | Medium |
| SET-012 | Remove admin email | Remove an admin email | Email removed from list | Medium |
| SET-013 | Test notification | Click test notification | Test email sent (if SMTP configured) | Medium |
| SET-014 | SMTP status | View notifications page | Shows SMTP configured status | Medium |

### 11.3 Activity Logs (`/settings/activity`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-015 | Activity page loads | Navigate to /settings/activity | Activity logs displayed | High |
| SET-016 | Filter by action | Filter logs by action type | Filtered results shown | Medium |
| SET-017 | Pagination | Navigate between pages | Logs paginated correctly | Medium |

---

## 12. Import/Export Module (`/import-export`)

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IE-001 | Page loads | Navigate to /import-export | Import/Export options displayed | Critical |
| IE-002 | Export products | Click export products | CSV file downloads | High |
| IE-003 | Export orders | Click export orders | CSV file downloads | High |
| IE-004 | Export customers | Click export customers | CSV file downloads | High |
| IE-005 | Import products | Upload CSV file | Products imported | High |
| IE-006 | Import validation | Upload invalid CSV | Error message shown | Medium |

---

## 13. Navigation & Layout

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NAV-001 | Sidebar navigation | Click sidebar menu items | Navigate to correct pages | Critical |
| NAV-002 | Breadcrumbs | View any page | Breadcrumbs show current location | Medium |
| NAV-003 | User menu | Click user avatar | Dropdown menu appears | High |
| NAV-004 | Logout | Click logout from user menu | Session ended, redirect to login | Critical |
| NAV-005 | Responsive sidebar | Resize to mobile width | Sidebar collapses/hamburger appears | Medium |
| NAV-006 | Dark mode toggle | Toggle theme | Theme changes between light/dark | Low |

---

## 14. Error Handling & Edge Cases

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ERR-001 | API error handling | Trigger API error | Error toast displayed | High |
| ERR-002 | Network error | Disconnect network, perform action | Appropriate error message | High |
| ERR-003 | Session expiry | Let session expire, perform action | Redirect to login | High |
| ERR-004 | 404 page | Navigate to non-existent route | 404 page displayed | Medium |
| ERR-005 | Empty states | View page with no data | Empty state message shown | Medium |
| ERR-006 | Loading states | Load data-heavy page | Loading spinner shown | Medium |

---

## Test Execution Summary

### Priority Distribution
- **Critical**: 25 test cases
- **High**: 55 test cases
- **Medium**: 35 test cases
- **Low**: 5 test cases

### Total Test Cases: 120

### Test Execution Order
1. Authentication (Critical path)
2. Navigation & Layout
3. Dashboard
4. Products (CRUD + Bulk)
5. Orders (CRUD + Bulk)
6. Customers (CRUD + Bulk)
7. Categories
8. Blogs
9. Promo Codes
10. Quotations
11. Analytics
12. Settings
13. Import/Export
14. Error Handling

---

## Playwright Test Configuration

```typescript
// playwright.config.ts recommendations
{
  baseURL: 'http://localhost:3001',
  testDir: './tests',
  timeout: 30000,
  retries: 2,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
}
```

## Test Data Requirements
- At least 5 products with various statuses
- At least 10 orders with different statuses
- At least 5 customers (active and inactive)
- At least 3 categories
- At least 2 blog posts
- At least 2 promo codes

---

*Document Version: 1.0*
*Last Updated: December 29, 2024*

# Email Notifications Testing Guide

**Phase:** 4 - Email Notification System
**Feature:** Order Confirmation Emails
**Created:** 2026-01-08

---

## Overview

This document outlines the testing approach for order confirmation emails and admin notifications. The email system sends HTML emails for customer order confirmations and admin order notifications after successful order creation.

---

## Prerequisites

### SMTP Configuration

Before testing, configure SMTP in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=Lab404 Electronics
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS`

**Alternative SMTP Providers:**
- SendGrid (recommended for production)
- AWS SES
- Mailgun
- Any SMTP-compatible service

### Admin Notification Email Setup

Configure admin email via settings API:

```bash
curl -X PUT http://localhost:4000/api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_ADMIN_TOKEN" \
  -d '{
    "store": {
      "orderNotificationEmail": "admin@lab404electronics.com"
    }
  }'
```

Or set directly in database:
```sql
UPDATE settings
SET value = jsonb_set(value, '{orderNotificationEmail}', '"admin@lab404electronics.com"')
WHERE key = 'store';
```

---

## Test Scenarios

### 1. Customer Order Confirmation Email

**Test:** Create an order and verify customer receives confirmation email

**Steps:**
1. Start API server: `npm run dev` (in apps/api)
2. Add items to cart via website or API
3. Complete checkout with valid customer email
4. Verify order created successfully (HTTP 201)
5. Check customer email inbox for confirmation

**Expected Results:**
- ✅ Customer receives email within 1-2 minutes
- ✅ Email subject: "Order Confirmation - {orderNumber}"
- ✅ Email from: "Lab404 Electronics <your_email@gmail.com>"
- ✅ Email contains:
  - Order number prominently displayed
  - Customer name and shipping address
  - Complete list of items with quantities and prices
  - Subtotal, tax, shipping, discount (if applicable), and total
  - COD payment instructions (yellow box)
  - Contact email in footer
- ✅ Email renders correctly on mobile and desktop
- ✅ All data matches order created

**Validation Checklist:**
- [ ] Email delivered successfully
- [ ] Order number correct
- [ ] All items listed with correct quantities
- [ ] Prices calculated correctly
- [ ] Tax amount matches order (11% if enabled)
- [ ] Shipping address formatted properly
- [ ] COD payment notice visible
- [ ] No broken HTML or styling issues
- [ ] Email readable on mobile device
- [ ] Links (if any) work correctly

### 2. Admin New Order Notification

**Test:** Verify admin receives notification when order placed

**Steps:**
1. Configure `orderNotificationEmail` in settings (see Prerequisites)
2. Create a new order via checkout
3. Check admin email inbox for notification

**Expected Results:**
- ✅ Admin receives email within 1-2 minutes
- ✅ Email subject: "New Order: {orderNumber}"
- ✅ Email contains:
  - Order number in blue highlight box
  - Customer name, email, and phone
  - Order summary table with items
  - Total amount
  - COD payment indicator
  - Complete shipping address
  - Customer notes (if provided)
- ✅ Email simpler than customer email (functional, not marketing)

**Validation Checklist:**
- [ ] Email delivered to configured admin email
- [ ] Order number prominent and correct
- [ ] Customer contact info complete
- [ ] All order items listed
- [ ] Total amount correct
- [ ] Shipping address complete
- [ ] Email readable and professional

### 3. Email Rendering Across Clients

**Test:** Verify emails render correctly in different email clients

**Email Clients to Test:**
- Gmail Web (Chrome, Firefox, Safari)
- Gmail Mobile App (iOS, Android)
- Outlook Web
- Outlook Desktop (if available)
- Apple Mail (if available)
- Mobile browsers (iPhone Safari, Android Chrome)

**Validation for Each Client:**
- [ ] Layout not broken
- [ ] Tables render correctly
- [ ] Colors display properly
- [ ] Fonts readable
- [ ] Spacing consistent
- [ ] Text not cut off
- [ ] Images load (if any)
- [ ] Links work

### 4. Email Failure Scenarios

**Test:** Verify email failures don't break order creation

#### 4.1 Invalid Customer Email

**Steps:**
1. Create order with invalid email (e.g., "invalid-email")
2. Verify order still created successfully
3. Check API logs for error

**Expected Results:**
- ✅ Order created (HTTP 201)
- ✅ Order ID and number returned
- ✅ Cart cleared
- ✅ Error logged: "Failed to send customer order confirmation email"
- ✅ Log includes order ID, order number, and error details
- ✅ Customer still redirected to success page

**Log Example:**
```json
{
  "level": "error",
  "message": "Failed to send customer order confirmation email",
  "error": { "message": "Invalid email address" },
  "orderId": 123,
  "orderNumber": "ORD-2024-0001",
  "customerEmail": "invalid-email"
}
```

#### 4.2 SMTP Not Configured

**Steps:**
1. Comment out SMTP configuration in `.env`
2. Restart API server
3. Create an order
4. Check logs

**Expected Results:**
- ✅ Order created successfully
- ✅ Warning logged on server startup: "SMTP not configured. Email notifications will be disabled."
- ✅ Info logged on email attempt: "Email not sent - SMTP not configured"
- ✅ No error thrown
- ✅ Order creation completes normally

#### 4.3 SMTP Server Unreachable

**Steps:**
1. Set invalid SMTP_HOST in `.env` (e.g., "smtp.invalid-domain.com")
2. Restart API server
3. Create an order
4. Check logs

**Expected Results:**
- ✅ Order created successfully
- ✅ Error logged: "Failed to send customer order confirmation email"
- ✅ Error details include SMTP connection failure
- ✅ Order creation not affected

### 5. Email Content Validation

**Test:** Verify all order data appears correctly in emails

**Test Data:**
- Order with multiple items
- Order with promo code discount
- Order with customer notes
- Order with international address
- Order with long product names

**Validation:**
- [ ] Multiple items all listed
- [ ] Promo code shown with discount amount
- [ ] Customer notes included
- [ ] International addresses formatted correctly
- [ ] Long product names don't break layout
- [ ] All special characters escaped (no XSS)

### 6. Asynchronous Email Sending

**Test:** Verify emails don't block order creation response

**Steps:**
1. Configure valid SMTP
2. Create an order
3. Measure response time
4. Compare with SMTP disabled

**Expected Results:**
- ✅ Order creation response time < 500ms
- ✅ Email sending happens after response
- ✅ No noticeable delay in API response
- ✅ Logs show email sent after order created

**Performance Validation:**
- [ ] API response immediate (< 500ms)
- [ ] Email delivery within 1-2 minutes
- [ ] No timeout errors
- [ ] No blocking behavior

### 7. Admin Email Only When Configured

**Test:** Verify admin email only sent if orderNotificationEmail set

**Steps:**
1. Remove `orderNotificationEmail` from settings
2. Create an order
3. Check logs

**Expected Results:**
- ✅ Customer email sent
- ✅ Admin email NOT sent
- ✅ No error logged for missing admin email
- ✅ Log shows "Order confirmation email sent" (customer)
- ✅ No log for admin notification

### 8. Plain Text Fallback

**Test:** Verify plain text version generated

**Steps:**
1. Send test email
2. Check email source/headers
3. Verify plain text version exists

**Expected Results:**
- ✅ Email includes both HTML and plain text versions
- ✅ Plain text is readable (HTML stripped)
- ✅ Plain text includes key order info
- ✅ Email clients support both versions

---

## Logging Verification

### Success Logs

**Customer Email Sent:**
```json
{
  "level": "info",
  "message": "Order confirmation email sent",
  "orderId": 123,
  "orderNumber": "ORD-2024-0001",
  "customerEmail": "customer@example.com"
}
```

**Admin Email Sent:**
```json
{
  "level": "info",
  "message": "Admin order notification email sent",
  "orderId": 123,
  "orderNumber": "ORD-2024-0001",
  "adminEmail": "admin@lab404electronics.com"
}
```

### Error Logs

**Email Failure:**
```json
{
  "level": "error",
  "message": "Failed to send customer order confirmation email",
  "error": { "message": "SMTP connection failed" },
  "orderId": 123,
  "orderNumber": "ORD-2024-0001",
  "customerEmail": "customer@example.com"
}
```

**Email Process Error:**
```json
{
  "level": "error",
  "message": "Error in email notification process",
  "error": { "message": "Cannot read property 'items' of null" },
  "orderId": 123,
  "orderNumber": "ORD-2024-0001"
}
```

---

## Manual Testing Checklist

### Before Testing
- [ ] SMTP configured in `.env`
- [ ] API server running
- [ ] Database accessible
- [ ] Test email addresses ready
- [ ] Email clients accessible

### Customer Email Tests
- [ ] Email received
- [ ] Subject correct
- [ ] From address correct
- [ ] Order number displayed
- [ ] Items listed correctly
- [ ] Prices calculated correctly
- [ ] Tax shown (if enabled)
- [ ] Discount shown (if applicable)
- [ ] COD notice visible
- [ ] Shipping address correct
- [ ] Footer with contact email
- [ ] Mobile rendering good
- [ ] Desktop rendering good

### Admin Email Tests
- [ ] Email received (when configured)
- [ ] Subject correct
- [ ] Order details complete
- [ ] Customer info visible
- [ ] Simpler format (not marketing)
- [ ] No email sent when not configured

### Error Handling Tests
- [ ] Invalid email doesn't break order
- [ ] Missing SMTP doesn't break order
- [ ] SMTP failure doesn't break order
- [ ] All errors logged properly
- [ ] Order creation always succeeds

### Performance Tests
- [ ] Response time < 500ms
- [ ] Emails sent asynchronously
- [ ] No blocking behavior
- [ ] Logs show correct timing

---

## Known Limitations

1. **Email Delivery Time:** Emails may take 1-2 minutes to deliver (SMTP server dependent)
2. **Email Client Compatibility:** Some advanced CSS may not work in all clients (using safe table layouts)
3. **No Email Retry:** Failed emails are not retried (logged only)
4. **No Email Queue:** Emails sent immediately (not queued for later)
5. **No Email Preview:** Cannot preview email before sending (templates are static)

---

## Troubleshooting

### Email Not Received

**Check:**
1. SMTP configuration in `.env`
2. API server logs for errors
3. Spam/junk folder
4. Email provider limits (Gmail: 500/day)
5. Firewall blocking port 587

**Common Issues:**
- Gmail blocking "less secure apps" → Use App Password
- Spam filters → Check spam folder
- SMTP credentials wrong → Verify in Gmail settings
- Port blocked → Try port 465 (SSL)

### Email Rendering Issues

**Check:**
1. Use Gmail/Outlook for best compatibility
2. Test on mobile device
3. Check email source for HTML errors
4. Verify inline CSS used (not external styles)

### Email Failures Breaking Orders

**If this happens:**
1. Check logs for error details
2. Verify try-catch blocks in orders.routes.ts
3. Ensure `.catch()` on email promises
4. This should NOT happen (bug if it does)

---

## Future Enhancements

- Email templates with images/logos
- Email preview in admin dashboard
- Email queue with retry logic
- Email delivery status tracking
- Template customization by admin
- Order status update emails (processing, shipped, delivered)
- Email analytics (open rates, click rates)

---

## Testing Completion Criteria

Before marking email notifications as complete, verify:

- ✅ Customer emails sent successfully
- ✅ Admin emails sent when configured
- ✅ Emails render correctly in Gmail (web + mobile)
- ✅ All order data accurate in emails
- ✅ Email failures don't break order creation
- ✅ Comprehensive logging in place
- ✅ Asynchronous sending confirmed
- ✅ Performance acceptable (<500ms response)
- ✅ Documentation complete

---

*Testing Guide Created: 2026-01-08*
*Ready for Manual Testing: Yes*

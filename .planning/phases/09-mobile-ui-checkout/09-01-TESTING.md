# Testing Documentation: Mobile-First UI - Cart & Checkout

**Phase:** 9 - Mobile-First UI Optimization
**Plan:** 09-01
**Date:** 2026-01-09

---

## Overview

This document provides comprehensive testing procedures for the mobile-optimized cart and checkout flow. All tests should be performed on real devices whenever possible, with browser DevTools mobile emulation as a secondary option.

---

## Device Testing Matrix

### Required Test Devices

#### iOS Devices
- **iPhone SE (2nd gen)** - Small screen (375x667px)
- **iPhone 12/13/14** - Standard size (390x844px)
- **iPhone 14 Pro Max** - Large screen (430x932px)
- **iPad Mini** - Tablet (744x1133px)

#### Android Devices
- **Small Phone** - 360x640px (e.g., Galaxy S8)
- **Standard Phone** - 393x851px (e.g., Pixel 5)
- **Large Phone** - 412x915px (e.g., Galaxy S21)
- **Tablet** - 800x1280px (e.g., Galaxy Tab)

### Browsers to Test
- **iOS:** Safari (primary), Chrome
- **Android:** Chrome (primary), Firefox, Samsung Internet
- **Desktop:** Chrome, Firefox, Safari, Edge (for responsive testing)

---

## 1. Cart Drawer/Sheet Testing

### 1.1 Visual Verification

**Test on:** All devices

- [ ] Cart sheet opens from right side smoothly
- [ ] Sheet is full-height on mobile (no gaps at top/bottom)
- [ ] Header shows correct item count
- [ ] Empty state displays properly:
  - [ ] Shopping cart icon visible and centered
  - [ ] "Your cart is empty" message clear
  - [ ] "Add some products to get started" subtitle visible
  - [ ] "Start Shopping" button is prominent (min 44px height)
- [ ] Product thumbnails are appropriately sized:
  - [ ] Mobile: 96x96px (24x24 in Tailwind)
  - [ ] Desktop: 80x80px (20x20 in Tailwind)
- [ ] All text is readable without zooming
- [ ] Checkout button sticky at bottom and always visible

### 1.2 Touch Interaction Testing

**Test on:** Physical iOS and Android devices

#### Quantity Controls
- [ ] Plus (+) button is easy to tap without mistakes (44x44px)
- [ ] Minus (-) button is easy to tap without mistakes (44x44px)
- [ ] Adequate spacing between plus and minus buttons (no accidental taps)
- [ ] Visual feedback on button press (button depression/highlight)
- [ ] Minus button disabled when quantity = 1
- [ ] Plus button works up to stock limit
- [ ] Quantity number is clearly visible between buttons
- [ ] No lag or delay when adjusting quantity

#### Remove Item
- [ ] Trash icon button is 44x44px (easy to tap)
- [ ] Button is positioned to avoid accidental taps
- [ ] Loading spinner shows while removing item
- [ ] Item removed smoothly without jarring animations
- [ ] Cart total updates immediately
- [ ] Toast notification confirms removal

#### Checkout Button
- [ ] Button is prominent and clearly labeled
- [ ] Button is minimum 52px height
- [ ] Button has good contrast and visible text
- [ ] Tapping button navigates to checkout page
- [ ] Sheet closes automatically when navigating

### 1.3 Scroll Behavior

**Test with:** Multiple items in cart (5+ items)

- [ ] Cart items scroll smoothly
- [ ] Header remains visible while scrolling
- [ ] Totals and checkout button remain sticky at bottom
- [ ] No bounce/elastic scrolling issues
- [ ] Scrollbar not obtrusive on mobile

---

## 2. Checkout Form Testing

### 2.1 Input Field Testing

**Critical:** Test on real devices - this verifies correct keyboards appear

#### Email Field
- [ ] Tapping field shows email keyboard (with @ and .com)
- [ ] `type="email"` attribute present
- [ ] `autocomplete="email"` works (suggests saved emails)
- [ ] Font size is 16px minimum (no zoom on iOS)
- [ ] Placeholder text visible: "you@example.com"
- [ ] Field validates email format
- [ ] Error message displays inline below field

#### Name Fields (First Name, Last Name)
- [ ] Standard keyboard appears
- [ ] `autocomplete="given-name"` and `autocomplete="family-name"` work
- [ ] Font size is 16px minimum
- [ ] Fields side-by-side on larger phones, stacked on small screens
- [ ] Autofill suggests names from device
- [ ] Error messages visible when required and empty

#### Phone Field
- [ ] Tapping field shows numeric keyboard with phone layout
- [ ] `type="tel"` attribute present
- [ ] `autocomplete="tel"` works
- [ ] Placeholder shows format: "+1 (555) 000-0000"
- [ ] Font size is 16px minimum
- [ ] Accepts various phone formats

#### Address Line 1 & 2
- [ ] Standard keyboard appears
- [ ] `autocomplete="address-line1"` and `autocomplete="address-line2"` work
- [ ] Font size is 16px minimum
- [ ] Address suggestions appear (browser autofill)
- [ ] Required field validation on Line 1
- [ ] Line 2 properly labeled as optional

#### City
- [ ] Standard keyboard appears
- [ ] `autocomplete="address-level2"` works
- [ ] Font size is 16px minimum
- [ ] Autofill suggests city based on address

#### State
- [ ] Standard keyboard appears
- [ ] `autocomplete="address-level1"` works
- [ ] Font size is 16px minimum
- [ ] Labeled as optional
- [ ] Autofill suggests state

#### Postal Code
- [ ] Numeric keyboard appears (due to `inputMode="numeric"`)
- [ ] `type="text"` with `inputMode="numeric"` attributes present
- [ ] `autocomplete="postal-code"` works
- [ ] Font size is 16px minimum
- [ ] Accepts alphanumeric codes (UK, Canada)

#### Country
- [ ] Standard keyboard appears
- [ ] `autocomplete="country-name"` works
- [ ] Font size is 16px minimum
- [ ] Required field validation

#### Order Notes (Textarea)
- [ ] Standard keyboard appears
- [ ] Font size is 16px minimum
- [ ] Minimum height appropriate (80px)
- [ ] Expands naturally with content
- [ ] Placeholder text visible

### 2.2 Saved Address Selection

**Test on:** Devices after saving addresses in account

#### Radio Button Selection
- [ ] Radio buttons are 20x20px (easy to tap)
- [ ] Clicking anywhere in address card selects it
- [ ] Selected state is clearly visible (border color change)
- [ ] Default address badge visible
- [ ] Address details readable
- [ ] No accidental selections when scrolling

#### Buttons
- [ ] "Use a different address" button is min 44px height
- [ ] "Choose from saved addresses" button is min 44px height
- [ ] Buttons switch between manual entry and saved addresses smoothly
- [ ] Form resets when switching modes

### 2.3 Form Submission

**Test scenarios:**
1. New user with manual address entry
2. Returning user with saved addresses
3. Error conditions (validation failures)

#### Place Order Button
- [ ] Button is minimum 52px height (prominent)
- [ ] Button text clear: "Place Order - Pay on Delivery"
- [ ] Loading spinner shows when submitting
- [ ] Button disabled during submission (prevents double-submit)
- [ ] Button re-enables if error occurs

#### Loading States
- [ ] Loading spinner visible immediately on submit
- [ ] User cannot interact with form during submission
- [ ] No flash of content or layout shift
- [ ] Clear visual feedback that something is happening

#### Error Handling
- [ ] Error messages appear inline below fields
- [ ] Error messages are red/destructive color
- [ ] Error messages are readable (adequate size)
- [ ] Multiple errors can be shown at once
- [ ] Errors clear when field is corrected
- [ ] Toast notification for general errors

#### Success Redirect
- [ ] Redirects to success page immediately
- [ ] Order number passed in URL
- [ ] Success page displays correctly

---

## 3. Checkout Success Page Testing

### 3.1 Visual Verification

**Test on:** All devices

- [ ] Success icon (checkmark) is visible and centered
- [ ] Icon is responsive (16x16 mobile, 20x20 desktop)
- [ ] "Order Placed Successfully!" title is prominent
- [ ] Order number is large and clearly visible
- [ ] Order number is selectable (for copy-paste)
- [ ] "What's Next?" steps are clear and numbered
- [ ] All text is readable without zooming
- [ ] Proper spacing on mobile (py-8) and desktop (py-16)

### 3.2 Button Testing

- [ ] "View Orders" button is min 44px height
- [ ] "Continue Shopping" button is min 44px height
- [ ] Buttons stack on mobile, side-by-side on larger screens
- [ ] Both buttons are easily tappable
- [ ] Buttons navigate to correct pages
- [ ] No layout shift when buttons are tapped

### 3.3 Edge Cases

- [ ] Missing order number: Shows error state with "Return to Home" button
- [ ] Direct access (no order): Shows appropriate message
- [ ] Order number is displayed consistently across page refresh

---

## 4. Complete Checkout Flow Testing

### 4.1 End-to-End Happy Path

**Scenario:** New customer, complete checkout with COD

1. **Browse & Add to Cart**
   - [ ] Navigate to products page
   - [ ] Select a product
   - [ ] Add to cart (verify toast notification)
   - [ ] Open cart sheet from header
   - [ ] Verify item appears in cart

2. **Adjust Quantity in Cart**
   - [ ] Increase quantity using + button
   - [ ] Verify price updates
   - [ ] Decrease quantity using - button
   - [ ] Verify minus button disabled at quantity 1
   - [ ] Verify total updates correctly

3. **Proceed to Checkout**
   - [ ] Tap "Checkout" button in cart
   - [ ] Cart sheet closes
   - [ ] Checkout page loads
   - [ ] Order summary shows correct items and totals

4. **Fill Shipping Information**
   - [ ] Fill email field (test keyboard)
   - [ ] Fill first name (test keyboard and autofill)
   - [ ] Fill last name (test keyboard and autofill)
   - [ ] Fill address line 1 (test autofill)
   - [ ] Fill city (test autofill)
   - [ ] Fill postal code (test numeric keyboard)
   - [ ] Fill country
   - [ ] Fill phone (test tel keyboard)
   - [ ] All fields accept input without issues
   - [ ] No iOS zoom when focusing fields

5. **Submit Order**
   - [ ] Tap "Place Order - Pay on Delivery" button
   - [ ] Loading spinner appears
   - [ ] Button disabled during submission
   - [ ] Redirect to success page

6. **Verify Success Page**
   - [ ] Order number displayed
   - [ ] Success message clear
   - [ ] Next steps visible
   - [ ] Buttons functional

### 4.2 Saved Address Flow

**Scenario:** Returning customer with saved addresses

1. **Select Saved Address**
   - [ ] Navigate to checkout
   - [ ] Saved addresses displayed
   - [ ] Default address pre-selected
   - [ ] Tap different address to select
   - [ ] Email field visible
   - [ ] Fill email only

2. **Switch to Manual Entry**
   - [ ] Tap "Use a different address"
   - [ ] Form fields appear
   - [ ] Form is empty (not pre-filled)
   - [ ] Fill out new address
   - [ ] Submit order

3. **Switch Back to Saved**
   - [ ] Start new checkout
   - [ ] Tap "Use a different address"
   - [ ] Tap "Choose from saved addresses"
   - [ ] Saved addresses reappear
   - [ ] Can select and complete order

---

## 5. Edge Cases & Error Testing

### 5.1 Empty Cart Scenarios

- [ ] Direct URL access to checkout with empty cart
- [ ] Shows "Your cart is empty" message
- [ ] "Continue Shopping" button visible and works
- [ ] Removing last item from cart
- [ ] Cart shows empty state

### 5.2 Validation Errors

- [ ] Submit form with all fields empty
- [ ] Verify all required fields show errors
- [ ] Submit with invalid email
- [ ] Submit with invalid phone format
- [ ] Error messages visible and helpful

### 5.3 Network Errors

- [ ] Slow network (test with DevTools throttling)
- [ ] Loading states appear appropriately
- [ ] Timeout handling
- [ ] Error message displayed
- [ ] User can retry submission

### 5.4 Stock Issues

- [ ] Item goes out of stock while in cart
- [ ] Appropriate error message
- [ ] User can remove item or continue shopping

### 5.5 Session Expiry

- [ ] Long session on checkout page
- [ ] Session expires before submission
- [ ] Appropriate error handling
- [ ] User redirected to login if needed

---

## 6. Performance Testing

### 6.1 Load Time Metrics

**Test on:** 3G, 4G, and WiFi connections

- [ ] Cart sheet opens within 200ms
- [ ] Checkout page loads within 2 seconds
- [ ] Success page loads within 1 second
- [ ] No layout shifts (CLS)
- [ ] Smooth animations (60 FPS)

### 6.2 Interaction Performance

- [ ] Quantity updates feel instant (< 100ms perceived)
- [ ] Form inputs respond immediately
- [ ] Button taps provide instant visual feedback
- [ ] No lag when scrolling cart items
- [ ] No janky animations

### 6.3 Bundle Size

- [ ] Checkout page JavaScript < 200KB (gzipped)
- [ ] Cart component loads quickly
- [ ] Images optimized and lazy-loaded

---

## 7. Accessibility Testing

### 7.1 Screen Reader Testing

**Test with:** VoiceOver (iOS), TalkBack (Android)

- [ ] Cart item count announced
- [ ] Quantity controls have proper labels
- [ ] Form fields have associated labels
- [ ] Error messages announced
- [ ] Button purposes clear
- [ ] Navigation logical and sequential

### 7.2 Keyboard Navigation

**Test on:** Desktop browsers

- [ ] Can tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Can submit form with Enter key
- [ ] Can close cart with Escape key
- [ ] Logical tab order

### 7.3 Color Contrast

- [ ] All text meets WCAG AA standards (4.5:1)
- [ ] Button text readable
- [ ] Error messages clearly distinguishable
- [ ] Focus indicators visible

---

## 8. Cross-Browser Testing

### 8.1 iOS Safari Specific

- [ ] No zoom on input focus (16px font verified)
- [ ] Tel keyboard for phone input
- [ ] Email keyboard for email input
- [ ] Numeric keyboard for postal code
- [ ] Autofill works correctly
- [ ] Smooth scrolling in cart
- [ ] No rubber-band overscroll issues

### 8.2 Android Chrome Specific

- [ ] Correct keyboards appear
- [ ] Autofill works correctly
- [ ] Material ripple effect on buttons
- [ ] Bottom navigation doesn't obscure content
- [ ] Back button works correctly

### 8.3 Samsung Internet

- [ ] All input types work
- [ ] Layout renders correctly
- [ ] Buttons functional
- [ ] Autofill compatible

---

## 9. Test Results Checklist

### Pre-Launch Requirements

- [ ] All critical tests passed on iOS Safari (iPhone 12)
- [ ] All critical tests passed on Android Chrome (Pixel 5)
- [ ] No P0 bugs in cart functionality
- [ ] No P0 bugs in checkout flow
- [ ] Success page working on all devices
- [ ] Touch targets verified (all >= 44x44px)
- [ ] Input font sizes verified (all >= 16px)
- [ ] Autocomplete working on all fields
- [ ] Loading states working correctly
- [ ] Error handling tested and working
- [ ] Performance acceptable on 3G network

### Known Issues

*Document any known issues here:*

**Example:**
- Issue: [Description]
- Severity: P1/P2/P3
- Affected: [Devices/Browsers]
- Workaround: [If any]
- Planned Fix: [Timeline]

---

## 10. Testing Sign-Off

### Test Execution Summary

**Tested By:** _________________
**Date:** _________________
**Devices Used:**
- iOS: _________________
- Android: _________________

**Test Coverage:**
- [ ] Cart Testing: ___% passed
- [ ] Checkout Form: ___% passed
- [ ] Success Page: ___% passed
- [ ] End-to-End Flow: ___% passed
- [ ] Edge Cases: ___% passed
- [ ] Performance: ___% passed

**Overall Status:** ☐ PASS ☐ PASS WITH ISSUES ☐ FAIL

**Approver:** _________________
**Date:** _________________

---

## Notes

- Test early and test often on real devices
- Browser DevTools emulation is not a substitute for real device testing
- Pay special attention to iOS Safari - it's the most restrictive browser
- Document any device-specific quirks or workarounds
- Retest after any changes to cart or checkout components
- Performance testing should be done on mid-range devices, not high-end flagships
- Test in different network conditions (3G especially important)
- Get feedback from actual users when possible

---

**Last Updated:** 2026-01-09
**Version:** 1.0
**Phase:** 9 - Mobile-First UI Optimization

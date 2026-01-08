# Testing Documentation: Plan 06-01 - Customer Address Management

**Phase:** 6 - Customer Account - Address Management
**Plan:** 06-01
**Date:** 2026-01-09

---

## Overview

This document provides comprehensive testing procedures for the Customer Address Management feature. This includes address CRUD operations, default address logic, form validation, and checkout integration.

---

## Test Environment Setup

```bash
# 1. Start the API server
cd apps/api
npm run dev

# 2. Start the website development server
cd apps/lab404-website
npm run dev

# 3. Navigate to http://localhost:3000
# 4. Log in with a test customer account
# 5. Navigate to Account > Addresses (/account/addresses)
```

---

## Testing Checklist

### 1. Address List Page

#### Loading and Data Display
- [ ] Page loads without errors
- [ ] Loading spinner displays while fetching addresses
- [ ] Addresses load from API successfully
- [ ] Address cards display in 2-column grid on desktop
- [ ] Address cards display in 1-column on mobile
- [ ] Each card shows:
  - [ ] Type badge (Shipping/Billing)
  - [ ] Default badge (if isDefault is true)
  - [ ] Full name (firstName + lastName)
  - [ ] Company (if present)
  - [ ] Address Line 1
  - [ ] Address Line 2 (if present)
  - [ ] City, State, Postal Code
  - [ ] Country
  - [ ] Phone (if present)
  - [ ] Edit button
  - [ ] Delete button

#### Empty State
- [ ] Empty state displays when no addresses exist
- [ ] MapPin icon displays
- [ ] Helpful message displays
- [ ] "Add Address" button is visible and functional

#### Error State
- [ ] Error message displays when API fails
- [ ] Retry button is present
- [ ] Retry button reloads the page

---

### 2. Add Address

#### Dialog Functionality
- [ ] "Add Address" button opens dialog
- [ ] Dialog displays "Add New Address" title
- [ ] Dialog is scrollable on small screens
- [ ] Dialog closes when clicking outside (if enabled)
- [ ] Form is visible and properly styled

#### Form Fields
- [ ] Address type selector defaults to "Shipping"
- [ ] Can select "Billing" type
- [ ] First Name field is present and required
- [ ] Last Name field is present and required
- [ ] Company field is present and optional
- [ ] Address Line 1 field is present and required
- [ ] Address Line 2 field is present and optional
- [ ] City field is present and required
- [ ] State field is present and optional
- [ ] Postal Code field is present and optional
- [ ] Country field is present and required
- [ ] Phone field is present and optional
- [ ] "Set as default" checkbox is present
- [ ] Checkbox label updates based on selected type

#### Validation
- [ ] Required fields show error when empty
- [ ] First name validation: min 1, max 100 characters
- [ ] Last name validation: min 1, max 100 characters
- [ ] Company validation: max 255 characters
- [ ] Address line 1 validation: min 1, max 255 characters
- [ ] Address line 2 validation: max 255 characters
- [ ] City validation: min 1, max 100 characters
- [ ] State validation: max 100 characters
- [ ] Postal code validation: max 20 characters
- [ ] Country validation: min 1, max 100 characters
- [ ] Phone validation: max 50 characters, regex `/^[+]?[\d\s\-().]*$/`
- [ ] Error messages display inline below fields
- [ ] Form submission blocked when validation fails

#### Submission
- [ ] Submit button shows "Add Address" text
- [ ] Submit button shows "Saving..." when submitting
- [ ] Submit button is disabled while submitting
- [ ] API receives correct data format
- [ ] Success toast appears after creation
- [ ] Dialog closes after successful creation
- [ ] Address list updates with new address
- [ ] New address appears in the list immediately
- [ ] Error toast appears if API fails
- [ ] Form remains open if submission fails

---

### 3. Edit Address

#### Dialog Functionality
- [ ] Edit button (pencil icon) opens edit dialog
- [ ] Dialog displays "Edit Address" title
- [ ] Dialog is scrollable on small screens
- [ ] Form pre-populates with current address values
- [ ] All fields show existing data correctly

#### Form Pre-population
- [ ] Type field shows current type
- [ ] First name shows current value
- [ ] Last name shows current value
- [ ] Company shows current value (or empty if null)
- [ ] Address Line 1 shows current value
- [ ] Address Line 2 shows current value (or empty if null)
- [ ] City shows current value
- [ ] State shows current value (or empty if null)
- [ ] Postal code shows current value (or empty if null)
- [ ] Country shows current value
- [ ] Phone shows current value (or empty if null)
- [ ] Default checkbox shows current isDefault status

#### Modification
- [ ] Can modify all fields
- [ ] Can change address type
- [ ] Can toggle default status
- [ ] Validation works same as add form
- [ ] Submit button shows "Update Address" text
- [ ] Submit button shows "Saving..." when submitting

#### Submission
- [ ] API receives correct update data
- [ ] Success toast appears after update
- [ ] Dialog closes after successful update
- [ ] Address card updates immediately with new data
- [ ] Error toast appears if API fails
- [ ] Form remains open if submission fails

---

### 4. Delete Address

#### Dialog Functionality
- [ ] Delete button (trash icon) opens confirmation dialog
- [ ] AlertDialog displays "Delete Address" title
- [ ] Warning message is clear and informative
- [ ] Cancel button is present
- [ ] Delete button is present with destructive styling

#### Confirmation
- [ ] Cancel button closes dialog without deleting
- [ ] Delete button triggers deletion
- [ ] Delete button shows "Deleting..." when submitting
- [ ] Delete button is disabled while submitting
- [ ] API endpoint called correctly

#### Post-Deletion
- [ ] Success toast appears after deletion
- [ ] Dialog closes after successful deletion
- [ ] Address removed from list immediately
- [ ] List updates without page reload
- [ ] Error toast appears if API fails
- [ ] Dialog remains open if deletion fails

---

### 5. Default Address Logic

#### Setting Default
- [ ] Can set an address as default
- [ ] Default badge appears on the address card
- [ ] Setting a new default unsets the previous default (same type)
- [ ] Can have separate defaults for shipping and billing
- [ ] Setting shipping default doesn't affect billing default
- [ ] Setting billing default doesn't affect shipping default

#### Persistence
- [ ] Default status persists after page reload
- [ ] Default status persists after edit
- [ ] Default badge updates immediately without reload
- [ ] Only one address per type shows as default

---

### 6. Checkout Integration

#### Saved Addresses Display
- [ ] Saved shipping addresses display in checkout
- [ ] Only shipping addresses shown (billing addresses excluded)
- [ ] Each address displays as a radio button option
- [ ] Address shows: full name, address line 1, city, state, postal code, country
- [ ] Default badge displays on default address
- [ ] MapPin icon displays on each address

#### Address Selection
- [ ] Default shipping address is auto-selected on page load
- [ ] Can click anywhere on address card to select
- [ ] Radio button updates when card is clicked
- [ ] Selected address has visual highlight (border and background)
- [ ] Form fields auto-populate when address is selected
- [ ] All address fields populate correctly

#### Form Population
- [ ] First name populates from selected address
- [ ] Last name populates from selected address
- [ ] Company populates from selected address
- [ ] Address line 1 populates from selected address
- [ ] Address line 2 populates from selected address
- [ ] City populates from selected address
- [ ] State populates from selected address
- [ ] Postal code populates from selected address
- [ ] Country populates from selected address
- [ ] Phone populates from selected address
- [ ] Email field remains visible and required

#### Manual Entry Toggle
- [ ] "Use a different address" button is present
- [ ] Button switches to manual entry mode
- [ ] Manual entry form displays all fields
- [ ] Form is empty when switching to manual entry
- [ ] "Choose from saved addresses" button appears in manual mode
- [ ] Button switches back to saved addresses view
- [ ] Address selection restores when switching back

#### Checkout Flow
- [ ] Can complete checkout with saved address
- [ ] Can complete checkout with manual address
- [ ] Order submission includes correct address data
- [ ] Email is included in order data
- [ ] Validation works same as before
- [ ] Success redirect works correctly

#### No Addresses Scenario
- [ ] Manual entry shows by default if no addresses
- [ ] No "Choose from saved addresses" button shown
- [ ] Checkout flow works normally
- [ ] No errors when addresses array is empty

---

### 7. Edge Cases

#### Empty States
- [ ] No addresses: empty state with helpful message
- [ ] No shipping addresses: checkout uses manual entry
- [ ] Only billing addresses: checkout uses manual entry

#### Network Errors
- [ ] Loading error shows retry option
- [ ] Create error shows error toast
- [ ] Update error shows error toast
- [ ] Delete error shows error toast
- [ ] Fetch error in checkout doesn't break page

#### Validation Edge Cases
- [ ] Empty phone number is valid (optional)
- [ ] Phone with international prefix (+) is valid
- [ ] Phone with spaces is valid
- [ ] Phone with dashes is valid
- [ ] Phone with parentheses is valid
- [ ] Phone with dots is valid
- [ ] Invalid phone characters show error
- [ ] Very long addresses handle gracefully
- [ ] Special characters in addresses work correctly

#### UI Edge Cases
- [ ] Long company name doesn't break layout
- [ ] Long address doesn't break card
- [ ] Many addresses display in scrollable grid
- [ ] Dialog scrolls on small screens
- [ ] Mobile layout stacks properly
- [ ] Touch targets are adequate (min 44x44px)

#### Concurrent Operations
- [ ] Multiple rapid clicks don't cause duplicate requests
- [ ] Loading states prevent double-submission
- [ ] React Query cache updates correctly
- [ ] Optimistic updates work smoothly

---

### 8. API Integration

#### Endpoints
- [ ] GET `/api/customers/me/addresses` returns addresses
- [ ] POST `/api/customers/me/addresses` creates address
- [ ] PUT `/api/customers/me/addresses/:id` updates address
- [ ] DELETE `/api/customers/me/addresses/:id` deletes address
- [ ] All endpoints require authentication
- [ ] Unauthorized requests redirect to login

#### Request/Response
- [ ] Create request sends correct data format
- [ ] Update request sends correct data format
- [ ] API returns created address with id
- [ ] API returns updated address
- [ ] API validates required fields
- [ ] API enforces max length constraints
- [ ] API validates phone regex
- [ ] API handles default address logic correctly

#### React Query
- [ ] Addresses cache with key `['addresses']`
- [ ] Create mutation invalidates cache
- [ ] Update mutation invalidates cache
- [ ] Delete mutation invalidates cache
- [ ] Loading states accurate
- [ ] Error states handled
- [ ] Refetch works correctly

---

### 9. Responsive Design

#### Desktop (≥1024px)
- [ ] 2-column grid layout for addresses
- [ ] Dialog displays centered
- [ ] Form fields display properly
- [ ] All buttons accessible
- [ ] Checkout layout: form left, summary right

#### Tablet (768px - 1023px)
- [ ] 2-column or 1-column grid (responsive)
- [ ] Dialog fits on screen
- [ ] Form fields stack properly
- [ ] Buttons accessible
- [ ] Checkout layout adjusts

#### Mobile (<768px)
- [ ] 1-column layout for addresses
- [ ] Dialog full-width or near full-width
- [ ] Form fields stack vertically
- [ ] Buttons full-width where appropriate
- [ ] Checkout stacks: form top, summary bottom
- [ ] Address cards full-width
- [ ] Touch targets adequate

---

### 10. Accessibility

#### Keyboard Navigation
- [ ] Can tab through all form fields
- [ ] Can activate buttons with Enter
- [ ] Can close dialogs with Escape
- [ ] Focus visible on all interactive elements
- [ ] Focus trapped in dialogs
- [ ] Tab order is logical

#### Screen Readers
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Button labels descriptive
- [ ] ARIA labels on icon buttons
- [ ] Dialog title announced
- [ ] Alert dialogs announced

#### Visual
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Error states clearly indicated
- [ ] Required fields marked
- [ ] Disabled states clearly indicated

---

## Manual Testing Steps

### Test 1: Complete Address CRUD Flow

```bash
# Prerequisites: Logged in as customer

# Step 1: Navigate to Addresses
1. Go to http://localhost:3000/account/addresses
2. Verify page loads without errors
3. Verify loading state appears

# Step 2: Add First Address
1. Click "Add Address" button
2. Verify dialog opens
3. Fill in all required fields:
   - Type: Shipping
   - First Name: John
   - Last Name: Doe
   - Address Line 1: 123 Main St
   - City: New York
   - Country: USA
   - Check "Set as default"
4. Click "Add Address"
5. Verify success toast
6. Verify dialog closes
7. Verify address appears in list
8. Verify "Default" badge displays

# Step 3: Add Second Address
1. Click "Add Address" button
2. Fill in different address:
   - Type: Shipping
   - First Name: Jane
   - Last Name: Smith
   - Address Line 1: 456 Oak Ave
   - City: Los Angeles
   - State: CA
   - Postal Code: 90001
   - Country: USA
   - Check "Set as default"
3. Click "Add Address"
4. Verify success toast
5. Verify second address appears
6. Verify "Default" badge moved to new address
7. Verify first address no longer shows "Default"

# Step 4: Edit Address
1. Click edit button on first address
2. Verify dialog opens with pre-filled data
3. Change City to "Boston"
4. Change State to "MA"
5. Click "Update Address"
6. Verify success toast
7. Verify address card updates with new data

# Step 5: Delete Address
1. Click delete button on second address
2. Verify confirmation dialog appears
3. Click "Cancel"
4. Verify dialog closes without deleting
5. Click delete button again
6. Click "Delete" in confirmation
7. Verify success toast
8. Verify address removed from list

# Step 6: Add Billing Address
1. Click "Add Address"
2. Select "Billing" type
3. Fill in address details
4. Check "Set as default billing address"
5. Submit
6. Verify billing address added
7. Verify can have default shipping and default billing
```

### Test 2: Checkout Integration

```bash
# Prerequisites: Have at least one shipping address saved

# Step 1: Navigate to Checkout
1. Add items to cart
2. Go to http://localhost:3000/checkout
3. Verify saved addresses section appears
4. Verify default address is pre-selected
5. Verify all shipping addresses display

# Step 2: Select Saved Address
1. Click on a different saved address
2. Verify visual highlight updates
3. Scroll down to form fields (if using saved address)
4. Verify email field is visible
5. Enter email address
6. Scroll to order notes
7. Verify form is ready to submit

# Step 3: Switch to Manual Entry
1. Click "Use a different address"
2. Verify manual entry form appears
3. Verify all address fields are empty
4. Fill in a new address
5. Submit order
6. Verify checkout completes successfully

# Step 4: Test with No Saved Addresses
1. Delete all saved addresses
2. Go to checkout
3. Verify manual entry form displays by default
4. Verify no saved addresses section
5. Complete checkout
6. Verify checkout works normally
```

### Test 3: Validation Testing

```bash
# Test Form Validation

# Required Fields
1. Open "Add Address" dialog
2. Click "Add Address" without filling anything
3. Verify all required fields show errors
4. Fill in required fields one by one
5. Verify errors disappear as fields are filled

# Max Length Validation
1. Enter 101 characters in First Name
2. Verify error appears
3. Reduce to 100 characters
4. Verify error disappears
5. Repeat for other fields with max lengths

# Phone Number Validation
1. Enter valid phone: +1 (555) 123-4567
2. Verify no error
3. Enter invalid phone: abc-def-ghij
4. Verify error appears
5. Enter valid phone with spaces: +1 555 123 4567
6. Verify no error
7. Leave phone empty
8. Verify no error (optional field)
```

---

## API Testing (Optional)

For direct API testing, use the following curl commands:

### Get All Addresses
```bash
curl -X GET http://localhost:4000/api/customers/me/addresses \
  -H "Cookie: sessionId=<your-session-id>" \
  -H "Content-Type: application/json"
```

### Create Address
```bash
curl -X POST http://localhost:4000/api/customers/me/addresses \
  -H "Cookie: sessionId=<your-session-id>" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: <csrf-token>" \
  -d '{
    "type": "shipping",
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "country": "USA",
    "isDefault": true
  }'
```

### Update Address
```bash
curl -X PUT http://localhost:4000/api/customers/me/addresses/<address-id> \
  -H "Cookie: sessionId=<your-session-id>" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: <csrf-token>" \
  -d '{
    "city": "Boston",
    "state": "MA"
  }'
```

### Delete Address
```bash
curl -X DELETE http://localhost:4000/api/customers/me/addresses/<address-id> \
  -H "Cookie: sessionId=<your-session-id>" \
  -H "x-csrf-token: <csrf-token>"
```

---

## Browser Testing

Test in the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Performance Testing

- [ ] Page loads in under 2 seconds
- [ ] Address list renders quickly with many addresses (>10)
- [ ] Form validation is instant (no lag)
- [ ] Mutations complete in under 1 second
- [ ] No memory leaks (check DevTools)
- [ ] React Query cache works efficiently

---

## Security Testing

- [ ] Unauthenticated requests redirect to login
- [ ] Cannot access other customers' addresses
- [ ] CSRF token required for mutations
- [ ] Input sanitization prevents XSS
- [ ] SQL injection attempts blocked by API
- [ ] Max length constraints enforced

---

## Known Issues

Document any issues found during testing:

1. **Issue:** [Description]
   - **Severity:** Critical / High / Medium / Low
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Status:** Open / In Progress / Resolved

---

## Test Results Summary

**Date Tested:** _________________
**Tested By:** _________________
**Environment:** Development / Staging / Production

**Results:**
- Total Tests: _______
- Passed: _______
- Failed: _______
- Skipped: _______

**Overall Status:** ✅ Pass / ❌ Fail / ⚠️ Pass with Issues

**Notes:**
_______________________________________
_______________________________________
_______________________________________

---

## Sign-off

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Feature ready for QA review
- [ ] Feature ready for deployment

**Signed:** _________________
**Date:** _________________

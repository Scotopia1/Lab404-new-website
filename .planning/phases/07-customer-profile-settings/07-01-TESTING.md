# Testing Plan: Customer Profile & Settings (07-01)

**Phase:** 7 - Customer Account - Profile & Settings
**Plan:** 07-01
**Date:** 2026-01-09

---

## Overview

This document outlines comprehensive testing procedures for the customer profile management system, including profile updates and password change functionality.

---

## 1. Profile Display Testing

### 1.1 Loading States
- [ ] Loading skeleton displays while fetching profile data
- [ ] Loading skeleton shows correct layout (header + card structure)
- [ ] No data flashing or content jumps after loading completes

### 1.2 Data Accuracy
- [ ] Profile displays correct customer name (firstName + lastName)
- [ ] Email address shown correctly and is read-only
- [ ] Phone number displays correctly (or empty if not set)
- [ ] Member Since date formatted as "MMM yyyy" (e.g., "Jan 2026")
- [ ] Total Orders count matches database value
- [ ] Email stat card shows correct email address

### 1.3 Account Stats Cards
- [ ] Three stat cards display: Member Since, Total Orders, Email
- [ ] Each card has correct icon (Calendar, ShoppingBag, Mail)
- [ ] Cards are responsive (stacked on mobile, 3 columns on desktop)
- [ ] Font sizes and styling are consistent

### 1.4 Error Handling
- [ ] Error message displays if profile fetch fails
- [ ] Error state is user-friendly (not technical error messages)
- [ ] Page doesn't crash on network error
- [ ] Retry mechanism (refresh page) works

---

## 2. Profile Update Testing

### 2.1 Form Validation
- [ ] First name required (error shown if empty)
- [ ] Last name required (error shown if empty)
- [ ] First name max 100 characters
- [ ] Last name max 100 characters
- [ ] Phone optional (can be empty)
- [ ] Phone max 50 characters
- [ ] Email field is disabled (read-only)
- [ ] Help text shown: "Contact support to change your email address"

### 2.2 Form Submission
- [ ] Save button disabled during submission
- [ ] Loading spinner shows in button during submission
- [ ] Success toast notification on successful update
- [ ] Error toast notification on failure
- [ ] Profile data refreshes after successful update
- [ ] Form retains values if update fails

### 2.3 API Integration
- [ ] PUT /api/customers/me endpoint called with correct data
- [ ] Request includes firstName, lastName, phone
- [ ] Request excludes email (not editable)
- [ ] Auth token sent in request headers
- [ ] Response updates React Query cache
- [ ] Profile data re-rendered with new values

### 2.4 Edge Cases
- [ ] Updating only first name works
- [ ] Updating only last name works
- [ ] Updating only phone works
- [ ] Clearing phone (making it empty) works
- [ ] Special characters in names handled correctly
- [ ] Unicode characters in names handled correctly
- [ ] Very long names (near limit) display correctly

---

## 3. Password Change Testing

### 3.1 Dialog Functionality
- [ ] Dialog opens when "Change Password" button clicked
- [ ] Dialog displays correct title and description
- [ ] Dialog can be closed with X button
- [ ] Dialog can be closed with Cancel button
- [ ] Dialog closes automatically on successful password change
- [ ] Form resets when dialog closes

### 3.2 Password Visibility Toggles
- [ ] Current password toggle works (Eye/EyeOff icon)
- [ ] New password toggle works (Eye/EyeOff icon)
- [ ] Confirm password toggle works (Eye/EyeOff icon)
- [ ] Each toggle is independent
- [ ] Icons change correctly (Eye when hidden, EyeOff when visible)

### 3.3 Password Validation - Client Side
- [ ] Current password required (error if empty)
- [ ] New password min 8 characters
- [ ] New password max 72 characters
- [ ] New password requires uppercase letter
- [ ] New password requires lowercase letter
- [ ] New password requires number
- [ ] Confirm password required
- [ ] Passwords must match (error if different)
- [ ] Help text shown: "Must be 8+ characters with uppercase, lowercase, and number"

### 3.4 Password Validation - Server Side
- [ ] Weak passwords rejected (123456, password, etc.)
- [ ] Password strength requirements enforced
- [ ] Current password verification required
- [ ] Invalid current password returns error
- [ ] Error message: "Current password is incorrect"

### 3.5 Password Change Success Flow
- [ ] Submit button disabled during submission
- [ ] Loading spinner shows in button
- [ ] Success toast: "Password changed successfully"
- [ ] Dialog closes on success
- [ ] Form resets on success
- [ ] User remains logged in after password change

### 3.6 Password Change Error Flow
- [ ] Error toast shown on failure
- [ ] Error message from API displayed
- [ ] Dialog remains open on error
- [ ] Form values retained on error
- [ ] User can retry after fixing error

### 3.7 API Integration
- [ ] PUT /api/customers/me/password endpoint called
- [ ] Request includes currentPassword, newPassword, confirmPassword
- [ ] Auth token sent in request headers
- [ ] Bcrypt comparison performed for current password
- [ ] New password hashed with bcrypt (12 rounds)
- [ ] Password hash updated in database
- [ ] Old password no longer works after change

---

## 4. Edge Cases & Security Testing

### 4.1 Authentication
- [ ] Unauthenticated users redirected to login
- [ ] Expired token handled gracefully
- [ ] Invalid token returns 401 error
- [ ] Customer can only access their own profile

### 4.2 Concurrent Updates
- [ ] Multiple profile updates in quick succession handled
- [ ] Last update wins (optimistic updates)
- [ ] No race conditions in profile data

### 4.3 Network Errors
- [ ] Timeout handled gracefully
- [ ] Network offline handled gracefully
- [ ] Server error (500) displays user-friendly message
- [ ] Retry logic works for failed requests

### 4.4 Data Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts in names sanitized
- [ ] Empty strings vs null handled correctly
- [ ] Whitespace-only names rejected

### 4.5 Password Security
- [ ] Password never exposed in API responses
- [ ] Password hash never exposed to frontend
- [ ] Old password required to change password
- [ ] Passwords transmitted over HTTPS
- [ ] Password validation happens server-side too
- [ ] Weak password list enforced

---

## 5. UI/UX Testing

### 5.1 Responsive Design
- [ ] Profile page works on mobile (320px+)
- [ ] Profile page works on tablet (768px+)
- [ ] Profile page works on desktop (1024px+)
- [ ] Stat cards stack on mobile, 3 columns on desktop
- [ ] Form fields stack on mobile, 2 columns on desktop
- [ ] Dialog is responsive and scrollable

### 5.2 Accessibility
- [ ] All form fields have labels
- [ ] Error messages associated with fields
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Screen reader friendly (aria labels)
- [ ] Color contrast meets WCAG AA standards

### 5.3 Visual Feedback
- [ ] Loading states clear and consistent
- [ ] Error states highlighted in red
- [ ] Success feedback immediate (toast)
- [ ] Button states clear (disabled, loading, active)
- [ ] Form validation errors show near fields

---

## 6. API Integration Testing

### 6.1 GET /api/customers/me
- [ ] Returns customer profile data
- [ ] Returns: id, email, firstName, lastName, phone, orderCount, createdAt
- [ ] Does NOT return: passwordHash, authUserId
- [ ] Requires authentication
- [ ] Returns 401 if not authenticated
- [ ] Returns 404 if customer not found

### 6.2 PUT /api/customers/me
- [ ] Updates profile successfully
- [ ] Accepts: firstName, lastName, phone
- [ ] Returns updated customer data
- [ ] Requires authentication
- [ ] Returns 401 if not authenticated
- [ ] Returns 400 if validation fails
- [ ] Returns 404 if customer not found

### 6.3 PUT /api/customers/me/password
- [ ] Changes password successfully
- [ ] Requires: currentPassword, newPassword, confirmPassword
- [ ] Validates current password
- [ ] Returns 400 if current password incorrect
- [ ] Returns 400 if new password weak
- [ ] Returns 400 if passwords don't match
- [ ] Returns 200 with success message
- [ ] Updates passwordHash in database
- [ ] Uses bcrypt.hash with 12 rounds

---

## 7. Performance Testing

### 7.1 Load Times
- [ ] Profile page loads in < 2 seconds
- [ ] Profile update completes in < 1 second
- [ ] Password change completes in < 2 seconds (bcrypt is slow)
- [ ] No unnecessary re-renders
- [ ] React Query cache prevents duplicate requests

### 7.2 Optimization
- [ ] React Query used for caching
- [ ] Profile data cached after first load
- [ ] Optimistic updates for better UX
- [ ] Minimal bundle size impact

---

## 8. Test Scenarios

### Scenario 1: New Customer Updates Profile
1. Customer logs in for first time
2. Navigates to Profile page
3. Sees account stats (0 orders, recent join date)
4. Updates first name, last name, phone
5. Clicks "Save Changes"
6. Sees success toast
7. Profile updates immediately
8. Refresh page - changes persist

### Scenario 2: Customer Changes Password
1. Customer navigates to Profile page
2. Clicks "Change Password" button
3. Dialog opens
4. Enters current password (incorrect)
5. Enters new password (weak: "password")
6. Sees validation error: "Password is too common"
7. Enters new strong password
8. Confirms password
9. Clicks "Change Password"
10. Sees success toast
11. Dialog closes
12. Logs out and logs back in with new password
13. Login succeeds

### Scenario 3: Network Error During Update
1. Customer updates profile
2. Network connection lost before request completes
3. Error toast shows: "Failed to update profile"
4. Form retains entered values
5. Network restored
6. Customer clicks "Save Changes" again
7. Update succeeds

### Scenario 4: Concurrent Updates
1. Customer has profile page open in two tabs
2. Updates first name in Tab 1, saves successfully
3. Updates last name in Tab 2, saves successfully
4. Both tabs reflect final state (both updates applied)
5. No data loss

---

## 9. Regression Testing

After any changes to profile or auth system:
- [ ] Re-run all profile display tests
- [ ] Re-run all profile update tests
- [ ] Re-run all password change tests
- [ ] Verify no breaking changes to API
- [ ] Verify backward compatibility

---

## 10. Manual Testing Checklist

### Pre-deployment
- [ ] Test with real customer account
- [ ] Test with account with no phone number
- [ ] Test with account with 0 orders
- [ ] Test with account with many orders
- [ ] Test all validation errors
- [ ] Test all success paths
- [ ] Test all error paths
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile device (iOS + Android)
- [ ] Test with screen reader

### Post-deployment
- [ ] Smoke test: Load profile page
- [ ] Smoke test: Update profile
- [ ] Smoke test: Change password
- [ ] Monitor error logs for issues
- [ ] Check analytics for error rates

---

## Success Criteria

All tests must pass before marking Phase 07-01 as complete:
- ✅ Profile displays live data from API
- ✅ Profile updates work with validation
- ✅ Password change works with strong password requirements
- ✅ All loading and error states handled
- ✅ All toast notifications display correctly
- ✅ Email field is disabled (read-only)
- ✅ Phone field is optional
- ✅ Account stats displayed correctly
- ✅ No security vulnerabilities
- ✅ Responsive design works on all devices
- ✅ No console errors
- ✅ API endpoints return correct data
- ✅ Database updates persist correctly

---

## Known Issues

None at this time.

---

## Future Enhancements

- Email change workflow (requires email verification)
- Two-factor authentication
- Account deletion
- Profile picture upload
- Password strength meter
- Recent login history
- Account activity log

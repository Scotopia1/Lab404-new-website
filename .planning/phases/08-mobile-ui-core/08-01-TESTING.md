# Mobile UI Testing Documentation
**Date:** 2026-01-09
**Phase:** 08-01 Mobile-First UI Optimization - Core Pages
**Pages:** Homepage, Product Listing, Product Detail

---

## Overview

This document provides comprehensive testing procedures for mobile UI optimization across Lab404's three core customer-facing pages. All tests should be performed before deploying to production.

---

## Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Page Load Time (3G)** | <3s | <4s |
| **Lighthouse Score** | >90 | >85 |
| **LCP (Largest Contentful Paint)** | <2.5s | <3s |
| **FID (First Input Delay)** | <100ms | <150ms |
| **CLS (Cumulative Layout Shift)** | <0.1 | <0.15 |
| **TTI (Time to Interactive)** | <3s | <4s |
| **Speed Index** | <3s | <3.5s |

---

## Device Testing Matrix

### Required Devices (Minimum)

#### iOS Devices
1. **iPhone SE (2nd/3rd gen)** - 375x667px
   - Small screen edge case
   - iOS Safari
   - Test compact layouts

2. **iPhone 12/13/14** - 390x844px
   - Standard modern iPhone
   - iOS Safari
   - Most common mobile viewport

3. **iPhone 14 Pro Max** - 430x932px
   - Large mobile viewport
   - iOS Safari
   - Test upper bound of mobile

#### Android Devices
1. **Samsung Galaxy S21** - 360x800px
   - Standard Android viewport
   - Chrome Mobile
   - Common Samsung device

2. **Google Pixel 5/6** - 393x851px
   - Standard Android viewport
   - Chrome Mobile
   - Pure Android experience

3. **Samsung Galaxy S22 Ultra** - 412x915px
   - Large Android viewport
   - Chrome Mobile
   - Test larger screens

### Tablet Testing (Optional but Recommended)
- **iPad Mini** - 768x1024px (tablet breakpoint)
- **iPad Pro 11"** - 834x1194px (large tablet)

---

## Network Condition Testing

### 1. Fast 3G (Primary Target)
```
Download: 1.5 Mbps
Upload: 750 Kbps
RTT: 750ms
```
**Target:** <3s page load time

### 2. Slow 3G (Minimum Acceptable)
```
Download: 400 Kbps
Upload: 400 Kbps
RTT: 2000ms
```
**Target:** <6s page load time (acceptable degradation)

### 3. 4G (Typical Mobile)
```
Download: 10 Mbps
Upload: 5 Mbps
RTT: 100ms
```
**Target:** <2s page load time

### 4. WiFi (Baseline)
```
Download: 50+ Mbps
Upload: 10+ Mbps
RTT: 20ms
```
**Target:** <1.5s page load time

---

## Testing Procedures

## 1. Homepage Testing (`/`)

### A. Performance Testing

#### Lighthouse Mobile Test
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Select "Mobile" device
4. Select "Performance" category
5. Clear cache and run audit
6. **Verify:** Score >90

**Key Metrics to Check:**
- LCP <2.5s (should be first featured product image)
- FID <100ms
- CLS <0.1 (no layout shifts)
- TTI <3s

#### Network Performance Test (Fast 3G)
1. Open Chrome DevTools → Network tab
2. Throttle to "Fast 3G"
3. Hard reload (Cmd/Ctrl+Shift+R)
4. Monitor load time in Network tab
5. **Verify:** Full load <3s

**What to observe:**
- Only 2 featured product images load initially (priority)
- Remaining 2 load on scroll (lazy)
- Hero section loads immediately
- Trust badges load fast (SVG icons)

### B. Functional Testing

#### Hero Section
- [ ] Hero text scales appropriately on mobile (text-3xl md:text-5xl)
- [ ] CTA buttons are full-width on mobile, inline on tablet+
- [ ] Both buttons are minimum 44x44px touch targets
- [ ] Badge displays correctly ("New Arrivals Weekly")
- [ ] No horizontal scroll on mobile

#### Trust Badges
- [ ] Shows 1 column on mobile (< 640px)
- [ ] Shows 2 columns on tablet (640-1024px)
- [ ] Shows 4 columns on desktop (> 1024px)
- [ ] Icons are visible and properly sized
- [ ] Text is readable on all screen sizes

#### Featured Products
- [ ] Shows 1 column on mobile (< 640px)
- [ ] Shows 2 columns on tablet (640-1024px)
- [ ] Shows 4 columns on desktop (> 1024px)
- [ ] First 2 product images load immediately
- [ ] Last 2 product images lazy load on scroll
- [ ] Product cards are touch-friendly (easy to tap)
- [ ] "View Details" button meets 44x44px minimum
- [ ] Hover effects work on desktop, not intrusive on mobile
- [ ] Images don't cause layout shifts while loading
- [ ] Sale badges display correctly

#### CTA Section
- [ ] Text scales appropriately on mobile
- [ ] Button is touch-friendly (44x44px minimum)
- [ ] Background color renders correctly
- [ ] Text is readable on colored background

### C. Touch Interaction Testing

#### Tap Testing
- [ ] All buttons respond immediately to tap (no delay)
- [ ] No accidental taps (buttons properly spaced)
- [ ] Visual feedback on tap (button press state)
- [ ] Links are easily tappable (not too small)

#### Scroll Testing
- [ ] Smooth scroll on mobile
- [ ] No jank or lag during scroll
- [ ] Lazy images load progressively
- [ ] No layout shifts during scroll

---

## 2. Product Listing Testing (`/products`)

### A. Performance Testing

#### Lighthouse Mobile Test
1. Navigate to `/products`
2. Run Lighthouse mobile audit
3. **Verify:** Score >90

**Key Metrics:**
- LCP <2.5s (first product image row)
- CLS <0.1 (grid should be stable)
- TTI <3s

#### Network Performance Test (Fast 3G)
1. Throttle to "Fast 3G"
2. Hard reload
3. **Verify:** Initial render <3s

**What to observe:**
- First 4 product images load immediately (first row)
- Remaining 8 images lazy load on scroll
- Grid layout stable (no shifts)
- Pagination loads fast

### B. Functional Testing

#### Product Grid
- [ ] Shows 1 column on mobile (< 640px)
- [ ] Shows 2 columns on tablet (640-1024px)
- [ ] Shows 3 columns on desktop (1024-1280px)
- [ ] Shows 4 columns on large desktop (> 1280px)
- [ ] Grid gaps are appropriate for screen size
- [ ] Product cards are consistent height
- [ ] Images maintain aspect ratio (square)
- [ ] No horizontal scroll

#### Product Cards
- [ ] Product name displays correctly (truncates if long)
- [ ] Category name shows
- [ ] Price displays with proper formatting
- [ ] Sale price shows strikethrough correctly
- [ ] "View Details" button is 44x44px minimum
- [ ] Entire card is clickable/tappable
- [ ] Cards have hover effect on desktop
- [ ] Short description hidden on mobile, visible on tablet+

#### Pagination
- [ ] Previous/Next buttons are 44x44px minimum
- [ ] Buttons are easily tappable
- [ ] Current page indicator visible
- [ ] Disabled state clear when on first/last page
- [ ] Page navigation works correctly
- [ ] Button spacing adequate on mobile

#### Header
- [ ] Title scales appropriately (text-2xl md:text-3xl)
- [ ] Product count displays correctly
- [ ] Header layout doesn't break on small screens

### C. Image Loading Testing

#### Priority Loading
1. Open Network tab
2. Filter to "Img"
3. Hard reload
4. **Verify:** First 4 product images load with high priority
5. **Verify:** Remaining images have "lazy" attribute

#### Lazy Loading
1. Scroll down slowly
2. Watch Network tab
3. **Verify:** Images load as they come into viewport
4. **Verify:** Images below fold don't load until scrolled to

### D. Touch Interaction Testing

#### Product Card Taps
- [ ] Cards respond immediately to tap
- [ ] No accidental taps between cards
- [ ] Visual feedback on tap
- [ ] Navigation to product detail smooth

#### Pagination Taps
- [ ] Buttons respond to tap
- [ ] No delay in page change
- [ ] Disabled buttons don't respond

---

## 3. Product Detail Testing (`/products/[slug]`)

### A. Performance Testing

#### Lighthouse Mobile Test
1. Navigate to any product detail page
2. Run Lighthouse mobile audit
3. **Verify:** Score >90

**Key Metrics:**
- LCP <2s (main product image should be fast with priority)
- CLS <0.1
- FID <100ms

#### Network Performance Test (Fast 3G)
1. Throttle to "Fast 3G"
2. Hard reload
3. **Verify:** Main image loads <2s
4. **Verify:** Page interactive <3s

**What to observe:**
- Main product image loads immediately (priority)
- Gallery thumbnails lazy load
- Related products lazy load
- Sticky cart bar loads fast on mobile

### B. Functional Testing

#### Breadcrumb Navigation
- [ ] Breadcrumb displays correctly on mobile
- [ ] Links are tappable (44x44px minimum)
- [ ] Truncates gracefully on small screens
- [ ] No horizontal scroll from long product names

#### Product Image Gallery
- [ ] Main image displays correctly
- [ ] Main image has priority loading (no delay)
- [ ] Navigation arrows ALWAYS visible on mobile (not hover-only)
- [ ] Navigation arrows are 44x44px minimum
- [ ] Previous/Next buttons work correctly
- [ ] Image counter displays (e.g., "1 / 4")
- [ ] Gallery thumbnails displayed below main image
- [ ] Thumbnails are scrollable horizontally
- [ ] Thumbnails use snap scrolling on mobile
- [ ] Thumbnails are 16x16 on mobile, 20x20 on desktop
- [ ] Selected thumbnail has border highlight
- [ ] Tap thumbnail to change main image works
- [ ] No layout shift when changing images

#### Product Information
- [ ] Category badge displays
- [ ] Product title scales appropriately (text-2xl md:text-3xl lg:text-4xl)
- [ ] Description text readable on mobile (text-base md:text-lg)
- [ ] Price section formatted correctly
- [ ] Sale price and savings badge display
- [ ] Tags display in responsive grid
- [ ] All text fits without overflow

#### Mobile Add to Cart (Sticky Bar)
- [ ] Sticky bar displays on mobile (< 1024px)
- [ ] Sticky bar hidden on desktop (≥ 1024px)
- [ ] Sticky bar fixed to bottom of screen
- [ ] Sticky bar doesn't cover content
- [ ] Quantity buttons are 44x44px minimum
- [ ] Add to Cart button is 44x44px minimum
- [ ] Quantity adjusts correctly (1-10)
- [ ] Add to Cart shows loading state
- [ ] Success toast appears after adding to cart
- [ ] Stock status visible

#### Desktop Add to Cart Section
- [ ] Section hidden on mobile (< 1024px)
- [ ] Section visible on desktop (≥ 1024px)
- [ ] Quantity selector works
- [ ] All buttons are 44x44px minimum
- [ ] Stock badge displays
- [ ] Trust badges display in 3-column grid

#### Trust Badges
- [ ] Mobile: Shows 3-column grid with larger icons (h-6 w-6)
- [ ] Desktop: Shows 3-column grid in cart section
- [ ] Icons are visible and sized correctly
- [ ] Text is readable

#### Key Features Section
- [ ] Displays if product has features
- [ ] Shows 1 column on mobile
- [ ] Shows 2 columns on tablet+
- [ ] Features have checkmark icon
- [ ] Text is readable (text-sm md:text-base)
- [ ] Section has bottom margin on mobile (mb-24 for sticky bar)

#### Technical Specifications
- [ ] Displays if product has specs
- [ ] Shows 1 column on mobile
- [ ] Shows 2 columns on desktop
- [ ] Spec items are readable
- [ ] Responsive layout works
- [ ] Section has bottom margin on mobile (mb-24)

#### Related Products
- [ ] Shows if related products exist
- [ ] Shows 1 column on mobile
- [ ] Shows 2 columns on tablet
- [ ] Shows 4 columns on desktop
- [ ] Images lazy load (not priority)
- [ ] Product cards are touch-friendly
- [ ] "View Details" button is 44x44px minimum
- [ ] "View All Products" button is touch-friendly
- [ ] Section has bottom margin on mobile (mb-24)

### C. Touch Interaction Testing

#### Image Gallery Swipe
- [ ] Can swipe main image to navigate (if implemented)
- [ ] Arrows respond immediately to tap
- [ ] Thumbnails scroll smoothly with finger
- [ ] Snap scrolling works on thumbnails

#### Quantity Selector
- [ ] Plus button increases quantity
- [ ] Minus button decreases quantity
- [ ] Buttons provide visual feedback on tap
- [ ] Buttons are easy to tap (44x44px)
- [ ] Disabled states clear (at min/max)

#### Add to Cart
- [ ] Button responds immediately
- [ ] Loading state shows
- [ ] Success feedback appears
- [ ] Cart updates correctly

#### Sticky Bar Interaction
- [ ] Doesn't interfere with scrolling
- [ ] Doesn't cover important content
- [ ] Easy to interact with while reading specs
- [ ] Stays fixed when scrolling

---

## 4. Cross-Page Testing

### Navigation Flow
- [ ] Home → Products → Product Detail works smoothly
- [ ] Back navigation works (browser back button)
- [ ] Forward navigation works
- [ ] Link taps have no delay

### Consistency Checks
- [ ] Button styles consistent across pages
- [ ] Touch target sizes consistent (44x44px minimum)
- [ ] Spacing patterns consistent
- [ ] Typography scales consistently
- [ ] Color scheme consistent

---

## 5. Responsive Breakpoint Testing

### Critical Breakpoints
Test at exactly these widths:

#### 1. 375px (iPhone SE - Minimum Mobile)
- [ ] All content fits without horizontal scroll
- [ ] Buttons are full-width or properly sized
- [ ] Text is readable
- [ ] Images display correctly

#### 2. 390px (iPhone 12/13 - Standard Mobile)
- [ ] Optimal mobile experience
- [ ] All touch targets accessible
- [ ] Layouts work correctly

#### 3. 640px (Tablet Breakpoint - `sm`)
- [ ] Grids change from 1 to 2 columns
- [ ] Trust badges adjust layout
- [ ] Buttons may change from full-width to inline

#### 4. 768px (iPad Portrait)
- [ ] 2-column layouts display correctly
- [ ] Touch targets still accessible
- [ ] Text sizes appropriate

#### 5. 1024px (Desktop Breakpoint - `lg`)
- [ ] Sticky cart bar disappears
- [ ] Desktop cart section appears
- [ ] Grids change to 3-4 columns
- [ ] Hover effects become visible

#### 6. 1280px (Large Desktop - `xl`)
- [ ] 4-column grids display
- [ ] Maximum content width maintained
- [ ] Large screens don't look empty

---

## 6. Layout Shift Testing

### Cumulative Layout Shift (CLS) Testing
1. Open Chrome DevTools → Performance
2. Start recording
3. Load page
4. Scroll slowly down entire page
5. Stop recording
6. Check "Experience" section for layout shifts
7. **Verify:** Total CLS <0.1

### Visual Stability Checklist
- [ ] Images don't shift when loading (have explicit dimensions)
- [ ] Fonts don't cause shift (Next.js optimizes)
- [ ] Async content doesn't cause shift
- [ ] Dynamic content reserves space
- [ ] Ads don't cause shifts (if applicable)

---

## 7. Image Optimization Testing

### Verify Next.js Image Optimization
1. Open Network tab
2. Filter to "Img"
3. Load page
4. **Check each image:**
   - [ ] Format is WebP (if browser supports)
   - [ ] Has srcset attribute (responsive)
   - [ ] Appropriate size for viewport
   - [ ] Priority images load first
   - [ ] Lazy images have loading="lazy"

### Image Size Verification

#### Mobile (375-640px)
- [ ] Product images ~400-500px wide
- [ ] Hero images ~600px wide
- [ ] Thumbnails ~100px wide

#### Tablet (640-1024px)
- [ ] Product images ~600-800px wide
- [ ] Hero images ~1000px wide

#### Desktop (1024px+)
- [ ] Product images ~800-1200px wide
- [ ] Hero images ~1600px wide

### Lazy Loading Verification
1. Open Network tab
2. Load page
3. **Verify:** Only above-fold images load
4. Scroll down
5. **Verify:** Below-fold images load as they enter viewport
6. **Verify:** No images load that aren't in viewport

---

## 8. Accessibility Testing (Touch Targets)

### Touch Target Size Testing
Use a ruler or measurement tool to verify:

#### All Interactive Elements Must Meet:
- [ ] Minimum height: 44px
- [ ] Minimum width: 44px
- [ ] Adequate spacing between targets (8px minimum)

#### Specific Elements to Check:
- [ ] All buttons (CTA, View Details, Add to Cart)
- [ ] Pagination Previous/Next
- [ ] Image gallery navigation arrows
- [ ] Quantity selector +/- buttons
- [ ] Thumbnail images
- [ ] Product cards (entire card tappable)
- [ ] Navigation links
- [ ] Close buttons (if any)

### Spacing Testing
- [ ] No accidental taps (buttons well-spaced)
- [ ] Easy to tap intended targets
- [ ] No overlapping tap areas

---

## 9. Browser Compatibility Testing

### Mobile Browsers
- [ ] iOS Safari (latest)
- [ ] iOS Safari (iOS 15+)
- [ ] Chrome Mobile (Android)
- [ ] Samsung Internet (Android)
- [ ] Firefox Mobile

### Features to Test:
- [ ] Next.js Image works in all browsers
- [ ] Lazy loading works
- [ ] WebP format served with fallbacks
- [ ] CSS Grid layouts work
- [ ] Flexbox layouts work
- [ ] Touch events work
- [ ] Sticky positioning works

---

## 10. Real Device Testing Checklist

### Pre-Deployment Testing

#### iPhone Testing (Safari)
1. Test on iPhone SE (small)
2. Test on iPhone 12/13 (standard)
3. Test on iPhone 14 Pro Max (large)

**For each device:**
- [ ] Load homepage on Fast 3G
- [ ] Verify <3s load time
- [ ] Test all interactions
- [ ] Navigate to products page
- [ ] Navigate to product detail
- [ ] Test add to cart flow
- [ ] Verify sticky cart bar works
- [ ] Test image gallery
- [ ] Test quantity selector
- [ ] Verify no layout shifts

#### Android Testing (Chrome)
1. Test on Samsung Galaxy S21
2. Test on Google Pixel 5/6
3. Test on Samsung Galaxy S22 Ultra

**For each device:**
- [ ] Same checklist as iPhone testing
- [ ] Verify browser-specific features work

---

## 11. Performance Monitoring Tools

### Lighthouse CI (Automated)
```bash
# Run Lighthouse on all pages
npm run lighthouse:mobile

# Expected results:
# Homepage:         >90 score
# Products:         >90 score
# Product Detail:   >90 score
```

### WebPageTest (Real Device)
1. Go to https://www.webpagetest.org
2. Enter page URL
3. Select mobile device (e.g., "Moto G4")
4. Select "3G Fast" connection
5. Run test
6. **Verify:**
   - Load time <3s
   - Start render <2s
   - Speed Index <3s

### Chrome DevTools Performance
1. Open DevTools → Performance
2. Select "Mobile" device
3. Throttle to "Fast 3G"
4. Record page load
5. **Check:**
   - FCP <2s
   - LCP <2.5s
   - TTI <3s
   - No long tasks >50ms

---

## 12. Regression Testing Checklist

### After Any Changes, Verify:
- [ ] Lighthouse score still >90
- [ ] Load time still <3s on Fast 3G
- [ ] No new layout shifts introduced
- [ ] Touch targets still meet 44x44px
- [ ] Images still lazy load correctly
- [ ] Priority images still load first
- [ ] Responsive layouts still work
- [ ] Sticky bar still works on mobile

---

## 13. Common Issues to Watch For

### Performance Issues
- ❌ Too many images loading initially
- ❌ Large unoptimized images
- ❌ No lazy loading on below-fold content
- ❌ Missing priority on above-fold images
- ❌ Render-blocking resources

### Layout Issues
- ❌ Horizontal scroll on mobile
- ❌ Text overflow
- ❌ Images without explicit dimensions
- ❌ Layout shifts during load
- ❌ Grids breaking at breakpoints

### Touch Issues
- ❌ Buttons too small (<44px)
- ❌ Buttons too close together
- ❌ Accidental taps
- ❌ Tap delay
- ❌ Hover-only interactions on mobile

### Image Issues
- ❌ Images not lazy loading
- ❌ Wrong image sizes served
- ❌ Missing WebP format
- ❌ Layout shifts from images
- ❌ Slow LCP from large images

---

## 14. Sign-Off Checklist

Before marking testing complete:

### Performance
- [ ] All pages score >90 on Lighthouse Mobile
- [ ] All pages load <3s on Fast 3G
- [ ] LCP <2.5s on all pages
- [ ] CLS <0.1 on all pages
- [ ] TTI <3s on all pages

### Functionality
- [ ] All pages tested on iOS Safari
- [ ] All pages tested on Android Chrome
- [ ] All touch interactions work
- [ ] All buttons meet touch target size
- [ ] Image gallery works on mobile
- [ ] Sticky cart bar works
- [ ] Lazy loading verified

### Responsive Design
- [ ] All breakpoints tested (375, 640, 768, 1024, 1280)
- [ ] No horizontal scroll
- [ ] Grids adjust correctly
- [ ] Text scales appropriately
- [ ] Images responsive

### Optimization
- [ ] Images use Next.js Image component
- [ ] Priority loading on above-fold
- [ ] Lazy loading on below-fold
- [ ] Responsive image sizes
- [ ] WebP format served

---

## 15. Testing Report Template

```markdown
# Mobile UI Testing Report
**Date:** [YYYY-MM-DD]
**Tester:** [Name]
**Environment:** [Production/Staging]

## Lighthouse Scores
- Homepage: [Score]/100
- Products: [Score]/100
- Product Detail: [Score]/100

## Load Times (Fast 3G)
- Homepage: [X.X]s
- Products: [X.X]s
- Product Detail: [X.X]s

## Devices Tested
- [ ] iPhone SE
- [ ] iPhone 12/13
- [ ] iPhone 14 Pro Max
- [ ] Samsung Galaxy S21
- [ ] Google Pixel 5/6

## Issues Found
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Pages affected: [List]
   - Steps to reproduce: [Steps]
   - Screenshot: [Link]

## Sign-Off
- [ ] All critical issues resolved
- [ ] Performance targets met
- [ ] Touch targets compliant
- [ ] Responsive design verified
- [ ] Ready for production

**Approved by:** [Name]
**Date:** [YYYY-MM-DD]
```

---

## Conclusion

This testing documentation ensures comprehensive validation of mobile UI optimizations across all three core pages. Follow these procedures before each deployment to maintain high performance and excellent mobile UX.

**Remember:** Mobile-first means mobile users get the best experience. These tests ensure we deliver on that promise.

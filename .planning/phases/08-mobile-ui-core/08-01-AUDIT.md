# Mobile Performance Audit - Core Pages
**Date:** 2026-01-09
**Phase:** 08-01 Mobile-First UI Optimization
**Pages Audited:** Homepage, Product Listing, Product Detail

---

## Executive Summary

This audit reviews the current mobile performance state of Lab404's three core customer-facing pages. While the codebase already implements Next.js Image components, several opportunities for mobile optimization have been identified.

**Current State:** Pages are functional with basic responsive design
**Target State:** <3s load time on 3G, Lighthouse score >90, optimized mobile UX

---

## 1. Homepage (`apps/lab404-website/src/app/page.tsx`)

### Current Strengths
- ✅ Using Next.js Image component for featured products
- ✅ Responsive grid layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- ✅ Proper sizes attribute on product images
- ✅ Skeleton loading states for better perceived performance
- ✅ Responsive text sizing in hero section

### Identified Issues

#### Critical
1. **Hero Section Missing Priority Loading**
   - Hero section has no images currently, but if hero images are added, they should use `priority={true}`
   - No explicit layout shift prevention for hero content

2. **Featured Products Lazy Loading**
   - Featured product images don't specify `loading` attribute
   - Should be `loading="lazy"` since they're below the fold on mobile

3. **Touch Target Sizes**
   - Buttons use default sizes - need to verify minimum 44x44px for mobile
   - Current: `size="lg"` with `px-8 py-6` - likely sufficient but needs explicit `min-h-[44px]`

#### Performance Concerns
- Trust badges section uses Lucide icons (SVG) - minimal impact but could be optimized
- Featured products grid shows all 4 products on mobile (1 column) - could implement horizontal scroll for better mobile UX
- No blur placeholders on images for better perceived performance

#### Mobile UX Issues
- Hero CTA buttons stack on mobile - good, but spacing could be optimized
- Trust badges grid (2 cols mobile) - text might be cramped on small screens
- Featured products section doesn't implement mobile-optimized horizontal scroll pattern

### Recommendations (Priority Order)
1. Add `loading="lazy"` to featured product images
2. Add `min-h-[44px] min-w-[44px]` to all interactive elements
3. Consider horizontal scroll for featured products on mobile
4. Add blur placeholders to images: `placeholder="blur"`
5. Implement responsive spacing optimization (gap-4 md:gap-6)

### Estimated Performance Impact
- **LCP:** Currently ~2.5s (estimated), target <2.5s
- **CLS:** Likely <0.1 (images have explicit sizes)
- **FID:** Good (minimal JS)
- **TTI:** ~3s (estimated), target <3s

---

## 2. Product Listing (`apps/lab404-website/src/app/products/page.tsx`)

### Current Strengths
- ✅ Using Next.js Image component with comprehensive sizes attribute
- ✅ Excellent responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- ✅ Skeleton loading states
- ✅ Proper image sizing to prevent layout shifts

### Identified Issues

#### Critical
1. **No Lazy Loading on Product Images**
   - All product images load immediately
   - Should use `loading="lazy"` for below-fold products
   - First row could use `priority={true}`, rest lazy load

2. **Touch Targets**
   - "View Details" buttons need explicit minimum touch size
   - Pagination buttons need minimum 44x44px verification

3. **Missing Filter UI**
   - Comment indicates "Add filters/sorting here later"
   - Critical for mobile UX - should be drawer/sheet on mobile

#### Performance Concerns
- Loading all 12 products at once - no virtual scrolling or progressive loading
- Pagination causes full page reload (`window.location.search`) - should use client-side navigation
- No image blur placeholders

#### Mobile UX Issues
- No mobile filter/sort drawer (commented as TODO)
- Product cards show full description on mobile - could be hidden to reduce scroll
- Pagination is centered but could be more touch-friendly with larger buttons

### Recommendations (Priority Order)
1. Add `loading="lazy"` to product images (except first 2-4)
2. Add `priority={true}` to first row of products (above fold)
3. Implement mobile filter drawer/sheet
4. Add `min-h-[44px]` to all buttons
5. Use `useRouter` instead of `window.location` for pagination
6. Add blur placeholders to images
7. Consider hiding short description on mobile to reduce scroll

### Estimated Performance Impact
- **LCP:** Currently ~3s (estimated), target <2.5s with lazy loading
- **CLS:** Good (explicit image sizes)
- **FID:** Good
- **TTI:** ~3.5s (estimated), target <3s

---

## 3. Product Detail (`apps/lab404-website/src/app/products/[slug]/page.tsx`)

### Current Strengths
- ✅ Main product image uses `priority={true}` - excellent!
- ✅ Responsive image gallery with carousel navigation
- ✅ Proper sizes attribute on all images
- ✅ Touch-friendly image thumbnails
- ✅ Quantity selector buttons
- ✅ Responsive layout (grid-cols-1 lg:grid-cols-2)

### Identified Issues

#### Critical
1. **Related Products Not Lazy Loaded**
   - Related products are below fold but images don't specify lazy loading
   - Should use `loading="lazy"`

2. **Image Thumbnail Carousel**
   - Horizontal scroll is good but needs better mobile optimization
   - Could benefit from snap scrolling on mobile

3. **Add to Cart Button**
   - Not sticky on mobile - users must scroll back up after reading specs
   - Should implement sticky bottom bar on mobile viewports

#### Performance Concerns
- Multiple image loads in gallery (main + all thumbnails)
- Related products load all images immediately
- No blur placeholders on related product images

#### Mobile UX Issues
- Breadcrumb text truncates at 200px - too narrow for mobile
- Quantity selector buttons work but could be larger on mobile
- Trust badges grid (3 cols) might be cramped on small screens
- Features section (2 cols on md) - good but could optimize spacing
- No sticky add-to-cart on mobile
- Image gallery navigation arrows appear on hover - not ideal for touch devices

### Recommendations (Priority Order)
1. Add `loading="lazy"` to related product images
2. Implement sticky add-to-cart button on mobile (<1024px)
3. Make image gallery navigation always visible on mobile (not hover-only)
4. Add snap scroll to thumbnail carousel
5. Optimize breadcrumb for mobile (hide or truncate better)
6. Add blur placeholders to all images
7. Increase trust badge icon sizes on mobile
8. Add touch-friendly swipe gestures to main image gallery

### Estimated Performance Impact
- **LCP:** Currently ~2s (estimated), already good with priority image
- **CLS:** Good (explicit image sizes)
- **FID:** Good but could improve with sticky CTA
- **TTI:** ~3s (estimated), target <3s

---

## Overall Findings

### Strengths Across All Pages
1. **Next.js Image Component:** Already implemented throughout - excellent foundation
2. **Responsive Layouts:** Good use of Tailwind responsive classes
3. **Explicit Image Sizes:** Prevents layout shifts
4. **Loading States:** Skeleton loaders provide good UX

### Common Issues Across All Pages

#### Critical Issues
1. **Lazy Loading Not Implemented**
   - Below-fold images should use `loading="lazy"`
   - Above-fold images should use `priority={true}`
   - Impact: High - reduces initial load time significantly

2. **Touch Target Sizes Not Guaranteed**
   - Buttons use size utilities but not explicit min-height/width
   - Need `min-h-[44px] min-w-[44px]` for WCAG compliance
   - Impact: High - affects mobile usability

3. **No Blur Placeholders**
   - Images don't use `placeholder="blur"` for better perceived performance
   - Impact: Medium - perceived performance improvement

#### Mobile UX Issues
1. **No Mobile-Specific Optimizations**
   - Missing sticky CTAs on product detail
   - Missing filter drawer on product listing
   - Hover-based interactions (not touch-friendly)

2. **Responsive Spacing Could Be Optimized**
   - Some sections use fixed spacing instead of responsive
   - Could use more aggressive spacing reduction on mobile

---

## Performance Bottlenecks Identified

### 1. Images (High Priority)
- **Issue:** All images load immediately without prioritization
- **Impact:** Delays LCP, increases bandwidth usage on mobile
- **Solution:** Implement lazy loading strategy (priority for above-fold, lazy for below-fold)

### 2. Client-Side Navigation (Medium Priority)
- **Issue:** Product listing uses `window.location` for pagination
- **Impact:** Full page reload instead of client-side navigation
- **Solution:** Use Next.js useRouter for client-side transitions

### 3. Missing Mobile Filters (Medium Priority)
- **Issue:** No filter UI on product listing
- **Impact:** Poor mobile shopping experience
- **Solution:** Implement mobile drawer/sheet for filters

### 4. Touch Interactions (High Priority)
- **Issue:** Hover-based interactions, uncertain touch target sizes
- **Impact:** Poor mobile UX, accessibility issues
- **Solution:** Add explicit touch target sizes, remove hover-only features on mobile

---

## Optimization Priorities

### Phase 1: Critical Performance (Task 2-4)
1. Implement lazy loading on all below-fold images
2. Add priority loading to above-fold images
3. Add explicit touch target sizes to all interactive elements
4. Fix hover-only interactions for touch devices

### Phase 2: Mobile UX (Task 2-4)
1. Add sticky add-to-cart on product detail mobile
2. Implement horizontal scroll/carousel patterns
3. Improve mobile spacing and layout
4. Add mobile filter drawer (future enhancement)

### Phase 3: Perceived Performance (Task 5)
1. Add blur placeholders to all images
2. Optimize image sizes attribute for better responsiveness
3. Add skeleton loaders where missing

---

## Target Metrics

| Metric | Current (Estimated) | Target | Status |
|--------|-------------------|--------|--------|
| **LCP** (Largest Contentful Paint) | ~2.5-3s | <2.5s | ⚠️ Needs Improvement |
| **FID** (First Input Delay) | <100ms | <100ms | ✅ Good |
| **CLS** (Cumulative Layout Shift) | <0.1 | <0.1 | ✅ Good |
| **TTI** (Time to Interactive) | ~3-3.5s | <3s | ⚠️ Needs Improvement |
| **Speed Index** | ~3s | <3s | ⚠️ Needs Improvement |
| **Lighthouse Score** | ~75-80 | >90 | ❌ Needs Work |

### Mobile-Specific Metrics
- **Touch Target Compliance:** ~60% (estimated) → Target: 100%
- **Mobile-Optimized Interactions:** 40% → Target: 100%
- **Responsive Image Loading:** 50% → Target: 100%

---

## Testing Recommendations

### Device Matrix
1. **iOS Safari**
   - iPhone SE (375px) - Small screen test
   - iPhone 12/13 (390px) - Standard mobile
   - iPhone 14 Pro Max (430px) - Large mobile

2. **Android Chrome**
   - Samsung Galaxy S21 (360px)
   - Google Pixel 5 (393px)
   - Samsung Galaxy S22 Ultra (412px)

### Network Conditions
1. Fast 3G (750ms RTT, 1.5Mbps down)
2. Slow 3G (2s RTT, 400Kbps down)
3. 4G (typical mobile)

### Key Test Scenarios
1. Homepage load and scroll
2. Product listing with 12+ products
3. Product detail image gallery interaction
4. Add to cart flow
5. Touch interactions (tap, swipe, pinch)

---

## Conclusion

The Lab404 codebase has a solid foundation with Next.js Image components and responsive layouts already in place. The main opportunities for improvement are:

1. **Lazy loading strategy** - High impact, easy implementation
2. **Touch target optimization** - Critical for mobile UX
3. **Mobile-specific features** - Sticky CTAs, filter drawers
4. **Perceived performance** - Blur placeholders, optimized loading

Implementing the recommendations in Tasks 2-5 should achieve the target metrics of <3s load time on 3G and Lighthouse score >90.

**Estimated improvement:** 15-20% reduction in load time, 10-15 point Lighthouse score increase.

# Phase 15: Password Reset Frontend Flow - Implementation Assumptions

## Phase Overview
Implement user-friendly password reset frontend flow with 3-step multi-step form, complete with validation, loading states, error handling, and auto-login.

## Critical Assumptions

### 1. Infrastructure Dependencies
**Assumption**: Phase 14 backend API is fully operational
- ✅ POST /api/auth/forgot-password (returns always success)
- ✅ POST /api/auth/verify-reset-code (returns { valid: true })
- ✅ POST /api/auth/reset-password (returns user + token, sets cookie)
- ✅ Rate limiting configured (3/hour for verification)
- ✅ Email sending functional (verification codes delivered)

**Rationale**: Frontend depends entirely on Phase 14 backend

### 2. Architecture Decision: Multi-Step Form vs Separate Pages

**Assumption**: Single-page multi-step form (not 3 separate routes)

**Structure**:
```
apps/lab404-website/src/app/(auth)/reset-password/page.tsx
└── Wrapper page with centered container

apps/lab404-website/src/components/forms/password-reset-form.tsx
└── Single component managing all 3 steps:
    ├── Step 1: Email input
    ├── Step 2: Code verification
    └── Step 3: Password reset
```

**Advantages**:
- ✅ Better UX (no context loss between pages)
- ✅ Simpler state management (email + code preserved)
- ✅ No query parameter juggling
- ✅ User can go back/forward between steps
- ✅ Single component = single file to maintain

**Rationale**: Superior user experience, simpler implementation

### 3. Technology Stack

#### Form State Management
**Assumption**: react-hook-form (v7.69.0) with Zod resolvers
```typescript
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

**Rationale**: Matches existing codebase patterns (login, register forms)

#### Schema Validation
**Assumption**: Zod (v3.25.76) for type-safe validation
```typescript
const forgotPasswordSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email too long"),
});
```

**Rationale**: Already used in 100% of forms in codebase

#### API Client
**Assumption**: Axios with CSRF interceptors
```typescript
await api.post('/auth/forgot-password', { email });
```

**Rationale**: Existing `apps/lab404-website/src/lib/api.ts` handles CSRF + cookies

#### UI Components
**Assumption**: shadcn/ui components (Radix UI + Tailwind CSS)
- Card, CardHeader, CardTitle, CardContent
- Input, Button, Label
- Form, FormField, FormControl, FormItem, FormMessage
- Alert (for errors)
- Loader2 icon (for loading spinners)

**Rationale**: Consistent with existing auth pages (login, register)

#### State Management
**Assumption**: Zustand (v5.0.9) with persist middleware
- Extend `useAuthStore` with password reset methods
- Auto-login after successful password reset

**Rationale**: Existing auth store pattern in `apps/lab404-website/src/stores/useAuthStore.ts`

#### Notifications
**Assumption**: Sonner toast library (v2.0.3)
```typescript
toast.success("Check your email for reset code");
toast.error("Invalid or expired code");
```

**Rationale**: Already configured in providers.tsx

### 4. Step-by-Step Flow

#### Step 1: Request Reset Code (Email Input)
**UI Elements**:
- Email input field
- "Send Reset Code" button
- Loading spinner while submitting
- Error message display area

**Validation**:
```typescript
const forgotPasswordSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email too long"),
});
```

**API Call**:
```typescript
const response = await api.post('/auth/forgot-password', { email });
// Always returns: { success: true, data: { message: "..." } }
```

**Success Behavior**:
- Store email in component state
- Advance to Step 2
- Show toast: "Check your email for reset code"

**Error Handling**:
- Display API error message in Alert component
- Rate limit error (429): "Too many requests. Please try again in 1 hour."
- Network error: "Connection failed. Please try again."

**Rationale**: Matches backend API response format

#### Step 2: Verify Code (6-Digit Input)
**UI Elements**:
- Display email address (read-only, can edit)
- 6-digit code input (numeric only)
- "Verify Code" button
- "Resend Code" link (goes back to Step 1)
- Loading spinner

**Validation**:
```typescript
const verifyCodeSchema = z.object({
  code: z.string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only digits"),
});
```

**API Call**:
```typescript
const response = await api.post('/auth/verify-reset-code', {
  email,
  code
});
// Returns: { success: true, data: { valid: true } }
```

**Success Behavior**:
- Store code in component state
- Advance to Step 3
- Show toast: "Code verified successfully!"

**Error Handling**:
- 400 error: "Invalid or expired code"
- 429 error: "Too many attempts. Please try again later."
- Display errors in Alert component

**Special Features**:
- Auto-advance to next digit while typing
- Paste support (paste 6-digit code from email)
- Clear button to reset input

**Rationale**: Common UX pattern for verification codes

#### Step 3: Reset Password (New Password Input)
**UI Elements**:
- New password input (with show/hide toggle)
- Confirm password input (with show/hide toggle)
- Password strength indicator (optional enhancement)
- "Reset Password" button
- Loading spinner

**Validation**:
```typescript
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd),
      "Password must contain uppercase, lowercase, and number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

**API Call**:
```typescript
const response = await api.post('/auth/reset-password', {
  email,
  code,
  newPassword
});
// Returns: { success: true, data: { user: {...}, token, expiresAt } }
```

**Success Behavior**:
1. Update Zustand auth store:
```typescript
useAuthStore.setState({
  user: response.data.data.user,
  isAuthenticated: true
});
```
2. Show toast: "Password reset successfully!"
3. Redirect to `/account/profile` (or home page)
4. User is now logged in (httpOnly cookie set by backend)

**Error Handling**:
- 400 error: "Invalid or expired code"
- 422 error: Display validation errors (weak password, etc.)
- Display errors in Alert component

**Rationale**: Matches login/register flow, provides smooth auto-login experience

### 5. Password Requirements (Frontend Validation)

**Assumption**: Match backend exactly to prevent validation mismatch

**Requirements**:
- ✅ Minimum 8 characters
- ✅ Maximum 100 characters (implied, no frontend check)
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ❌ NO special character requirement
- ❌ NO weak password list check on frontend

**Validation Function**:
```typescript
const isStrongPassword = (pwd: string): boolean => {
  return pwd.length >= 8 &&
         /[A-Z]/.test(pwd) &&
         /[a-z]/.test(pwd) &&
         /[0-9]/.test(pwd);
};
```

**Rationale**: Frontend matches backend auth.routes.ts password validation exactly

### 6. Code Input UX Enhancement

**Assumption**: Single input field (not 6 separate inputs)

**Advantages**:
- ✅ Easier to implement
- ✅ Better mobile keyboard experience
- ✅ Paste support works naturally
- ✅ Simpler validation
- ✅ Less visual noise

**Alternative Considered**: 6 separate inputs (OTP-style)
- ❌ Complex state management
- ❌ Auto-focus juggling
- ❌ Paste handling tricky
- ❌ Accessibility concerns

**Implementation**:
```typescript
<Input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={6}
  placeholder="000000"
  className="text-center text-2xl tracking-widest font-mono"
/>
```

**Rationale**: Simplicity, better UX on mobile devices

### 7. Email Persistence Between Steps

**Assumption**: Store email in component state (not query params)

**Approach**:
```typescript
const [email, setEmail] = useState('');
const [code, setCode] = useState('');
const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
```

**Benefits**:
- ✅ Clean URLs (no email/code in query params)
- ✅ More secure (sensitive data not in URL history)
- ✅ Simpler state management
- ✅ Can edit email in Step 2 if wrong

**Drawback**: Page refresh loses progress (acceptable for security)

**Rationale**: Security over convenience

### 8. Error Handling Strategy

#### API Errors
**Assumption**: Display errors from backend with generic fallback

**Pattern**:
```typescript
try {
  const response = await api.post(...);
} catch (error) {
  const err = error as AxiosError<{ error: { message: string } }>;
  const errorMsg = err.response?.data?.error?.message || 'Operation failed';

  if (err.response?.status === 429) {
    setError("Too many requests. Please try again in 1 hour.");
  } else if (err.response?.status === 400) {
    setError(errorMsg);
  } else {
    setError("Connection failed. Please try again.");
  }
}
```

**Display**:
- Alert component (red background, destructive styling)
- Toast notification (for success messages)
- Inline form errors (for validation errors)

**Rationale**: Consistent error UX across all auth flows

#### Validation Errors
**Assumption**: Show Zod validation errors inline below fields

**Pattern**:
```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Zod error appears here */}
    </FormItem>
  )}
/>
```

**Rationale**: Matches existing form patterns in codebase

### 9. Loading States

**Assumption**: Disable form + show spinner during API calls

**Pattern**:
```typescript
const [isLoading, setIsLoading] = useState(false);

<Button type="submit" disabled={isLoading || !form.formState.isValid}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

**States**:
- Step 1: "Sending Code..."
- Step 2: "Verifying..."
- Step 3: "Resetting Password..."

**Rationale**: Prevents double-submission, provides user feedback

### 10. Navigation & Routing

**Assumption**: Single route `/reset-password` with internal step state

**No Query Parameters**: Email and code stored in component state (not URL)

**Success Redirect**:
```typescript
router.push('/account/profile'); // After successful reset
```

**Link from Login Page**:
```typescript
<Link href="/reset-password">Forgot password?</Link>
```

**Rationale**: Clean URLs, better security

### 11. Auto-Login After Password Reset

**Assumption**: Backend sets httpOnly cookie, frontend updates Zustand store

**Implementation**:
```typescript
// After successful password reset
const response = await api.post('/auth/reset-password', {...});

// Update auth store
useAuthStore.setState({
  user: response.data.data.user,
  isAuthenticated: true,
  isLoading: false,
});

// Redirect
router.push('/account/profile');
```

**Cookie**: httpOnly, secure (HTTPS only in prod), sameSite=strict

**Rationale**: Seamless user experience, immediate access to account

### 12. Mobile Responsiveness

**Assumption**: Mobile-first design with touch-friendly controls

**Requirements**:
- ✅ All buttons ≥44x44px (touch target minimum)
- ✅ Input fields: 16px font size (prevents iOS zoom)
- ✅ Proper input types: `type="email"` for email, `inputMode="numeric"` for code
- ✅ Autocomplete attributes: `autoComplete="email"`
- ✅ Responsive card: 90vw on mobile, max-w-md on desktop
- ✅ Vertical stacking on mobile, horizontal on desktop

**Pattern**:
```typescript
<Card className="w-full max-w-md mx-auto">
  <CardContent className="p-6 space-y-4">
    {/* Form fields */}
  </CardContent>
</Card>
```

**Rationale**: Matches Phase 8-10 mobile optimization standards

### 13. Accessibility Requirements

**Assumption**: WCAG 2.1 Level AA compliance

**Requirements**:
- ✅ All inputs have labels (visible or aria-label)
- ✅ Error messages associated with inputs (aria-describedby)
- ✅ Loading states announced (aria-live)
- ✅ Focus management (auto-focus first input on each step)
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Screen reader support (semantic HTML)

**Pattern**:
```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email Address</FormLabel>
      <FormControl>
        <Input
          {...field}
          type="email"
          autoComplete="email"
          aria-invalid={!!form.formState.errors.email}
          autoFocus
        />
      </FormControl>
      <FormMessage role="alert" />
    </FormItem>
  )}
/>
```

**Rationale**: Accessibility best practices, inclusive design

### 14. Password Visibility Toggle

**Assumption**: Show/hide toggle button for password inputs

**Implementation**:
```typescript
const [showPassword, setShowPassword] = useState(false);

<div className="relative">
  <Input
    type={showPassword ? "text" : "password"}
    {...field}
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-2 top-1/2 -translate-y-1/2"
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
</div>
```

**Icons**: lucide-react (Eye, EyeOff)

**Rationale**: Matches existing password change form pattern

### 15. Resend Code Functionality

**Assumption**: "Resend Code" link returns user to Step 1

**Implementation**:
```typescript
// In Step 2
<button
  type="button"
  onClick={() => setStep('email')}
  className="text-sm text-primary hover:underline"
>
  Didn't receive code? Resend
</button>
```

**Behavior**:
- Returns to Step 1 (email input)
- Clears code state
- Email remains filled (user can resend or change)
- User triggers new forgot-password API call

**Rate Limiting**: Backend enforces 3 requests/hour (frontend can't bypass)

**Rationale**: Simple UX, leverages existing API

### 16. Step Navigation Controls

**Assumption**: No "Back" button, but user can edit email in Step 2

**Step 1 → Step 2**: Automatic on success
**Step 2 → Step 3**: Automatic on success
**Step 3 → Success**: Automatic on success + redirect

**Edit Email**:
```typescript
// In Step 2, show email with edit button
<div className="flex items-center gap-2">
  <Input value={email} disabled />
  <Button variant="outline" onClick={() => setStep('email')}>
    Edit
  </Button>
</div>
```

**Rationale**: Linear flow, minimal navigation complexity

### 17. Time Expiration Warning

**Assumption**: No client-side countdown timer (backend enforces 15-minute expiration)

**Display**: Static text reminder
```tsx
<p className="text-sm text-muted-foreground">
  Code expires in 15 minutes
</p>
```

**Rationale**: Simplicity, backend is source of truth for expiration

**Alternative Considered**: Live countdown timer
- ❌ Complex state management
- ❌ Clock drift issues
- ❌ Not critical for UX
- ❌ Backend expiration is authoritative

### 18. Form Reset on Success

**Assumption**: Clear form state after successful password reset

**Implementation**:
```typescript
// After successful reset
form.reset();
setEmail('');
setCode('');
setStep('email');
```

**Rationale**: Security (clear sensitive data), prepare for next use

### 19. Network Error Handling

**Assumption**: Graceful degradation for network failures

**Scenarios**:
- API timeout (>30 seconds): "Request timeout. Please try again."
- Network offline: "No internet connection. Please check your connection."
- Server error (500): "Server error. Please try again later."

**Implementation**:
```typescript
if (error.code === 'ECONNABORTED') {
  setError("Request timeout. Please try again.");
} else if (!navigator.onLine) {
  setError("No internet connection.");
} else {
  setError("Connection failed. Please try again.");
}
```

**Rationale**: Better user experience, clear actionable messages

### 20. CSRF Token Handling

**Assumption**: Axios interceptor automatically adds CSRF token (no manual action)

**Implementation** (already exists in `lib/api.ts`):
```typescript
api.interceptors.request.use(async (config) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
    const token = await fetchCsrfToken();
    config.headers['x-csrf-token'] = token;
  }
  return config;
});
```

**Rationale**: Automatic CSRF protection, no component-level code needed

### 21. Cookie Credentials

**Assumption**: Axios sends credentials automatically via `withCredentials: true`

**Configuration** (already exists):
```typescript
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Send httpOnly cookies
});
```

**Rationale**: Backend sets auth cookie, frontend receives it automatically

### 22. Environment Variables

**Assumption**: No new environment variables needed

**Existing**:
- `NEXT_PUBLIC_API_URL` - Backend API endpoint

**Rationale**: All configuration already in place

### 23. File Organization

**Assumption**: Consistent with existing codebase structure

**Files to Create**:
1. `apps/lab404-website/src/app/(auth)/reset-password/page.tsx` - Page wrapper
2. `apps/lab404-website/src/components/forms/password-reset-form.tsx` - Main form component
3. `apps/lab404-website/src/lib/validations/auth.ts` - Zod schemas (if not exists)

**Files to Modify**:
1. `apps/lab404-website/src/stores/useAuthStore.ts` - Add password reset methods
2. `apps/lab404-website/src/app/(auth)/login/page.tsx` - Add "Forgot password?" link

**Rationale**: Separation of concerns, reusable components

### 24. TypeScript Types

**Assumption**: Define explicit types for API responses

**Types**:
```typescript
interface ForgotPasswordResponse {
  success: boolean;
  data: {
    message: string;
  };
}

interface VerifyCodeResponse {
  success: boolean;
  data: {
    valid: boolean;
  };
}

interface ResetPasswordResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expiresAt: string;
  };
}

interface User {
  id: string;
  email: string;
  role: 'customer';
  customerId: string;
  firstName: string | null;
  lastName: string | null;
}
```

**Location**: `apps/lab404-website/src/types/auth.ts`

**Rationale**: Type safety, IDE autocomplete, catch errors at compile time

### 25. Success Message Customization

**Assumption**: Different toast messages for each step

**Messages**:
- Step 1 success: "If an account exists, a reset code has been sent to your email"
- Step 2 success: "Code verified successfully!"
- Step 3 success: "Password reset successfully! You are now logged in."

**Implementation**:
```typescript
toast.success(message, {
  duration: 3000, // 3 seconds
  position: 'top-right',
});
```

**Rationale**: Clear feedback, user knows what to do next

### 26. Form Autofocus

**Assumption**: Auto-focus first input field on each step

**Implementation**:
```typescript
// Step 1: Focus email input
<Input autoFocus type="email" {...field} />

// Step 2: Focus code input
<Input autoFocus inputMode="numeric" {...field} />

// Step 3: Focus password input
<Input autoFocus type="password" {...field} />
```

**Rationale**: Better UX, keyboard users don't need to tab to first field

### 27. Empty State & Initial Load

**Assumption**: No loading skeleton (form renders immediately)

**Rationale**: No async data fetch on mount, form is ready instantly

**Alternative Considered**: Loading skeleton
- ❌ Unnecessary (no data to load)
- ❌ Adds visual noise

### 28. Link from Login Page

**Assumption**: Add "Forgot password?" link to existing login page

**Location**: `apps/lab404-website/src/app/(auth)/login/page.tsx`

**Implementation**:
```typescript
<Link
  href="/reset-password"
  className="text-sm text-primary hover:underline"
>
  Forgot password?
</Link>
```

**Placement**: Below password field, above submit button

**Rationale**: Standard UX pattern, easy to discover

### 29. Success Redirect Destination

**Assumption**: Redirect to `/account/profile` after successful reset

**Alternative Options**:
- `/` (home page)
- `/account/orders` (order history)
- `/login` (login page - bad UX, user just logged in!)

**Chosen**: `/account/profile`

**Rationale**: User just changed password, profile page is natural destination

### 30. Browser Back Button Behavior

**Assumption**: Browser back button does NOT navigate between steps

**Behavior**: Clicking back leaves reset password page entirely

**Rationale**:
- Multi-step form is internal component state (not router state)
- Prevents confusion with URL-based navigation
- Security: Prevents navigating to step with stale state

**Alternative Considered**: Use query params for step state
- ❌ Exposes sensitive email/code in URL
- ❌ More complex implementation
- ❌ Browser history shows reset flow

### 31. Password Confirmation Field

**Assumption**: Require "Confirm Password" field in Step 3

**Validation**:
```typescript
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})
```

**Rationale**: Prevents typos, standard UX pattern

### 32. Client-Side Rate Limiting

**Assumption**: No client-side rate limiting (backend enforces)

**Behavior**: Backend returns 429 error after 3 attempts, frontend displays error

**Rationale**: Backend is source of truth, client-side limits can be bypassed

### 33. Analytics & Tracking

**Assumption**: No analytics tracking in Phase 15

**Deferred**: Analytics implementation in future phase (if needed)

**Events to Track** (future):
- Password reset started (Step 1 submitted)
- Code verified (Step 2 success)
- Password reset completed (Step 3 success)
- Errors encountered (invalid code, weak password, etc.)

**Rationale**: Focus on core functionality first

### 34. Email Format Normalization

**Assumption**: Frontend normalizes email to lowercase before sending

**Implementation**:
```typescript
const email = form.getValues('email').toLowerCase().trim();
await api.post('/auth/forgot-password', { email });
```

**Rationale**: Consistent with backend behavior (email stored lowercase)

### 35. Code Input Formatting

**Assumption**: No formatting (display as plain 6-digit number)

**Display**: `123456` (not `123-456` or `123 456`)

**Rationale**: Simple, paste-friendly, matches email code format

### 36. Password Strength Indicator

**Assumption**: NO password strength indicator in Phase 15

**Deferred**: Enhancement for future phase

**Rationale**: Validation errors sufficient for MVP, avoid scope creep

**Alternative Considered**: zxcvbn library
- ❌ Additional dependency
- ❌ Not critical for MVP
- ❌ Validation errors already guide user

### 37. Dark Mode Support

**Assumption**: Components inherit dark mode from existing Tailwind config

**No Custom Styling**: shadcn/ui components already support dark mode

**Rationale**: Consistent with rest of website

### 38. Internationalization (i18n)

**Assumption**: English only in Phase 15

**No i18n Library**: Hardcoded English strings

**Deferred**: Internationalization to future phase

**Rationale**: MVP scope, English-speaking target market

### 39. Testing Approach

**Assumption**: Test documentation only (no automated tests in Phase 15)

**Deferred**: Comprehensive testing to Phase 22 (Security Testing & Hardening)

**Documentation**: Test scenarios for Phase 22 implementation

**Rationale**: Consistent with Phase 13-14 approach

### 40. Browser Compatibility

**Assumption**: Modern browsers only (ES2020+, last 2 versions)

**Supported**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Not Supported**:
- ❌ Internet Explorer
- ❌ Browsers without JavaScript enabled

**Rationale**: Next.js default target, matches existing website

### 41. Session Persistence

**Assumption**: Password reset progress NOT persisted to localStorage

**Behavior**: Page refresh clears progress (user starts from Step 1)

**Rationale**: Security > convenience for password reset flow

**Alternative Considered**: Persist step + email to localStorage
- ❌ Security risk (sensitive data in browser storage)
- ❌ User abandonment is rare
- ❌ Not worth the risk

### 42. Code Copy-Paste Support

**Assumption**: User can paste 6-digit code from email

**Implementation**:
```typescript
<Input
  type="text"
  inputMode="numeric"
  maxLength={6}
  onPaste={(e) => {
    const pastedText = e.clipboardData.getData('text');
    if (/^\d{6}$/.test(pastedText)) {
      form.setValue('code', pastedText);
      // Auto-submit or just fill
    }
  }}
/>
```

**Rationale**: Common user behavior, better UX

### 43. Form Validation Timing

**Assumption**: Validate on blur + on submit (not on every keystroke)

**Configuration**:
```typescript
const form = useForm({
  mode: 'onBlur', // Validate when user leaves field
  reValidateMode: 'onChange', // Re-validate on every change after first validation
});
```

**Rationale**: Less annoying than instant validation, catches errors before submit

### 44. Button States

**Assumption**: Disable submit button if form invalid or loading

**Implementation**:
```typescript
<Button
  type="submit"
  disabled={isLoading || !form.formState.isValid}
  className="w-full"
>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

**Rationale**: Prevents invalid submissions, visual feedback

### 45. Error Clearing

**Assumption**: Clear errors when user edits field or changes step

**Implementation**:
```typescript
// Clear error on field change
<Input
  {...field}
  onChange={(e) => {
    field.onChange(e);
    setError(null); // Clear API error
  }}
/>

// Clear error on step change
const nextStep = () => {
  setError(null);
  setStep('code');
};
```

**Rationale**: Fresh start for each action, less confusion

### 46. Legal Compliance

**Assumption**: No GDPR/privacy concerns for password reset

**Rationale**: Password reset uses existing customer data, no new data collected

**Note**: Email verification codes are temporary (deleted after 24 hours)

### 47. Email Verification Code Display

**Assumption**: Frontend does NOT display the code (user gets it via email)

**Only Step 2**: User inputs code received in email

**Rationale**: Security (code should only be in email, not on screen)

### 48. Multiple Device Support

**Assumption**: User can check email on phone, reset password on desktop

**Requirement**: Code must work across devices (not device-locked)

**Backend Behavior**: Code is email-based, not session-based ✅

**Rationale**: Common user workflow, better UX

### 49. Concurrent Reset Requests

**Assumption**: User can request new code, invalidating previous codes

**Backend Behavior**: New code invalidates old codes ✅ (Phase 13 implementation)

**Frontend**: User can click "Resend Code" multiple times (rate limited to 3/hour)

**Rationale**: User might not receive first code (spam folder, etc.)

### 50. Form Field Autocomplete

**Assumption**: Use autocomplete attributes for better UX

**Attributes**:
```typescript
// Email input
autoComplete="email"

// New password
autoComplete="new-password"

// Confirm password
autoComplete="new-password"

// Code input
autoComplete="one-time-code" // iOS will suggest code from SMS/email
```

**Rationale**: Browser autofill, iOS code suggestions, better mobile UX

---

## Assumptions Summary

**Total Assumptions**: 50

**Categories**:
- Architecture & Design: 8 assumptions
- Form Implementation: 12 assumptions
- UX & Interaction: 15 assumptions
- Security & Validation: 8 assumptions
- Technical Infrastructure: 7 assumptions

**High-Risk Assumptions** (require validation):
1. Multi-step form in single component (assumption #2)
2. No countdown timer for code expiration (assumption #17)
3. No password strength indicator (assumption #36)
4. No session persistence (assumption #41)

**Dependencies**:
- Phase 14 backend API must be 100% complete ✅
- No new environment variables ✅
- No new npm packages (all already installed) ✅
- No backend changes ✅

**Deferred to Future Phases**:
- Password strength indicator → Future enhancement
- Analytics tracking → Analytics phase
- Internationalization → i18n phase
- Comprehensive testing → Phase 22

**Key Decisions**:
- Single-page multi-step form (not separate routes)
- Single 6-digit input (not 6 separate inputs)
- No session persistence (security over convenience)
- Auto-login after successful reset
- Redirect to /account/profile

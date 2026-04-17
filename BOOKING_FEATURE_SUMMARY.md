---
title: Resource Booking Feature - Admin UI & Calendar Integration
date: 2026-04-08
status: COMPLETE
---

# Resource Booking Feature - Implementation Summary

## ✅ Backend Implementation (Complete)

### Entity Layer
- **Booking** MongoDB Document with all required fields
- **BookingStatus** Enum (PENDING, APPROVED, REJECTED, CANCELLED)

### Repository Layer
- **BookingRepository** with custom query methods
  - `findByResourceIdAndDate()` - Time conflict detection
  - `findByUserIdOrderByCreatedAtDesc()` - User bookings

### Service Layer
- **BookingService** with complete business logic
  - Automatic userId extraction from Spring Security session
  - Resource validation (must exist and be ACTIVE)
  - Time conflict detection algorithm
  - Status-based cancellation rules
  - Admin-only approval/rejection

### Controller Layer (REST API)
- `POST /api/bookings` - Create booking (201)
- `GET /api/bookings/my` - User's bookings
- `GET /api/bookings` - All bookings (ADMIN)
- `GET /api/bookings/{id}` - Single booking
- `PUT /api/bookings/{id}/status` - Update status (ADMIN)
- `DELETE /api/bookings/{id}` - Cancel booking

### Exception Handling
- TimeConflictException (409)
- BookingNotFoundException (404)
- InvalidBookingException (400)

### Security
- ✅ userId NEVER accepted from request
- ✅ Extracted from Spring Security session
- ✅ Role-based access control (@PreAuthorize)
- ✅ Ownership verification on user actions

---

## ✅ Frontend Implementation (Complete)

### 1. Service Layer: `bookingService.ts`
TypeScript service for API communication:
- `createBooking(request)` - POST with validation
- `getUserBookings()` - Fetch user's bookings
- `getAllBookings()` - Fetch all (admin)
- `getBookingById(id)` - Single booking lookup
- `cancelBooking(id)` - Cancel request
- `updateBookingStatus(id, status, reason?)` - Admin status update
- All requests include `credentials: "include"`

### 2. Main Page: `ResourceBookingPage.tsx`
Tab-based navigation component:
- **Tabs**: Book Resource / My Bookings / Calendar / Admin Panel (admin only)
- Responsive mobile tab scrolling
- Role-based admin detection
- Resource loading on mount
- Conditional rendering based on active tab

### 3. User Components

#### BookingForm.tsx
- Resource selection dropdown (filtered to ACTIVE resources)
- Date picker (min = today)
- Time range inputs (start/end)
- Purpose textarea
- Attendees number input
- Client-side validation
- Success/error notifications
- Form reset after submission

#### MyBookings.tsx
- Table display of user's bookings
- Columns: Resource, Date, Time, Purpose, Attendees, Status, Action
- Status color badges:
  - PENDING: Yellow ⚠️
  - APPROVED: Green ✅
  - REJECTED: Red ❌
  - CANCELLED: Gray ⚪
- Cancel button (PENDING/APPROVED only)
- Confirmation before deletion
- Rejection reason display
- Empty/Loading/Error states

#### BookingCalendar.tsx
- FullCalendar integration (installed in project)
- Plugins: dayGrid, timeGrid, list
- Event display by booking status:
  - PENDING: #f59e0b (yellow)
  - APPROVED: #10b981 (green)
  - REJECTED: #ef4444 (red)
  - CANCELLED: #d1d5db (gray)
- Header toolbar: navigation + view options
- Event details on click
- Admin sees all, users see own only
- Color legend below calendar
- Dark mode CSS variables included
- Now indicator for current time
- 12-hour time format

### 4. Admin Components (New)

#### AdminBookingPanel.tsx ✨
- Accessible only to ADMIN users
- Fetches all bookings via GET /api/bookings
- Table with complete booking information:
  - User ID (truncated)
  - Resource ID (truncated)
  - Date & time details
  - Purpose & attendees
  - Status badge
  - Action buttons
- Summary stats:
  - Total bookings
  - PENDING count
  - APPROVED count
  - REJECTED count
- Action buttons:
  - ✅ Approve button (green) → PUT status APPROVED
  - ❌ Reject button (red) → Opens modal
- Reject modal:
  - Textarea for rejection reason
  - Validation (reason required)
  - Confirmation buttons
- Optimistic UI updates
- Error handling & notifications
- Action buttons only appear on PENDING bookings

#### BookingCalendar.tsx ✨
- Multi-view calendar display:
  - Month view (default)
  - Week view
  - Day view
  - List view
- Status-based color coding
- Event click shows full details:
  - Purpose
  - Status
  - Resource ID
  - Attendees
  - Rejection reason (if applicable)
- Admin/User view switching
- Native FullCalendar toolbar
- Responsive height
- Dark mode support

---

## 🔐 Security Implementation

### Backend Security
✅ userId extracted from SecurityContextHolder
✅ Never accepted in request body
✅ Role-based endpoint protection (@PreAuthorize)
✅ Ownership verification for cancellations
✅ Resource ACTIVE status validation
✅ Time conflict detection algorithm

### Frontend Security
✅ credentials: "include" on all API calls
✅ Role-based UI rendering (admin features hidden for users)
✅ Session-based authentication (getStoredAuthSession)
✅ Confirmation dialogs for destructive actions
✅ Input validation before submission

---

## 📋 Database Schema

### Bookings Collection
```mongodb
{
  _id: ObjectId,
  resourceId: String (indexed),
  userId: String (indexed),
  date: LocalDate,
  startTime: LocalTime,
  endTime: LocalTime,
  purpose: String,
  attendees: Integer,
  status: BookingStatus enum,
  reason: String (optional),
  createdAt: LocalDateTime
}
```

---

## 🎨 UI/UX Features

### User Experience
✅ Tab-based navigation (easy switching between views)
✅ Color-coded status badges (clear visual feedback)
✅ Responsive design (mobile-friendly)
✅ Dark mode support (consistent theming)
✅ Loading indicators (transparent progress)
✅ Error messages (clear communication)
✅ Empty states (helpful guidance)
✅ Confirmation dialogs (prevent mistakes)
✅ Notifications (success/error feedback)
✅ Optimistic UI updates (feel responsive)

### Admin Features
✅ Overview of all bookings
✅ Summary statistics
✅ One-click approval/rejection
✅ Custom rejection reasons
✅ Status filtering (see only pending)
✅ Visual calendar overview
✅ Quick booking management

---

## 📦 Files Created/Modified

### Backend Files
1. `/src/main/java/.../booking/entity/Booking.java`
2. `/src/main/java/.../booking/entity/BookingStatus.java`
3. `/src/main/java/.../booking/repository/BookingRepository.java`
4. `/src/main/java/.../booking/service/BookingService.java`
5. `/src/main/java/.../booking/controller/BookingController.java`
6. `/src/main/java/.../booking/dto/BookingDTO.java`
7. `/src/main/java/.../booking/dto/CreateBookingRequest.java`
8. `/src/main/java/.../booking/dto/UpdateBookingStatusRequest.java`
9. `/src/main/java/.../booking/exception/*.java` (3 files)
10. `/src/main/java/.../common/ApiExceptionHandler.java` (updated)

### Frontend Files
1. `/client/src/lib/bookingService.ts` ✨
2. `/client/src/pages/ResourceBooking/ResourceBookingPage.tsx` (updated)
3. `/client/src/pages/ResourceBooking/BookingForm.tsx`
4. `/client/src/pages/ResourceBooking/MyBookings.tsx`
5. `/client/src/pages/ResourceBooking/AdminBookingPanel.tsx` ✨
6. `/client/src/pages/ResourceBooking/BookingCalendar.tsx` ✨
7. `/client/src/pages/ResourceBooking/index.ts` (updated)
8. `/client/src/App.tsx` (updated routing)

---

## 🚀 Integration Notes

### API Integration Rules
- All endpoints use `credentials: "include"`
- userId extracted server-side from Spring Security
- Backend validates resource exists and is ACTIVE
- Time conflicts checked before booking creation
- Ownership verified for user-initiated actions

### Frontend Integration Points
- Uses existing UI components (Button, Badge, Table, etc.)
- Integrates with NotificationProvider for toasts
- Uses PageBreadcrumb, PageMeta for consistency
- Follows Tailwind CSS theming (light/dark mode)
- LoadingIndicator for async states

### Role-Based Features
- All users: Book resources, view own bookings, view calendar, cancel own
- Admins: All user features + view all bookings + approve/reject + admin panel + full calendar

---

## ✨ Optional Features Included

### FullCalendar Integration
- Pre-installed dependencies
- Multi-view support (month/week/day/list)
- Status-based color coding
- Event details on click
- Responsive layout
- Dark mode compatibility

---

## 📊 Testing Checklist

- [ ] User can create booking with valid resource
- [ ] Time conflict prevents overbooking
- [ ] User can view only own bookings
- [ ] User can cancel PENDING/APPROVED bookings
- [ ] Admin can approve pending bookings
- [ ] Admin can reject with reason
- [ ] Calendar displays all bookings
- [ ] Status colors display correctly
- [ ] Error notifications show
- [ ] Success notifications show
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Performance optimized

package com.server.server.booking.controller;

import com.server.server.booking.dto.BookingDTO;
import com.server.server.booking.dto.CreateBookingRequest;
import com.server.server.booking.dto.UpdateBookingStatusRequest;
import com.server.server.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for booking management.
 * Endpoints for creating, retrieving, updating, and cancelling bookings.
 * Authorization rules:
 * - USER: create bookings, view own, cancel own
 * - ADMIN: view all, approve/reject
 */
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * Create a new booking.
     * The userId is extracted from the security session, not from request body.
     *
     * @param createRequest the booking creation request
     * @return the created booking DTO with HTTP 201
     */
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingDTO> createBooking(@Valid @RequestBody CreateBookingRequest createRequest) {
        BookingDTO booking = bookingService.createBooking(createRequest);
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

    /**
     * Get all bookings for the current user.
     *
     * @return list of current user's bookings
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<BookingDTO>> getCurrentUserBookings() {
        List<BookingDTO> bookings = bookingService.getCurrentUserBookings();
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get all bookings (admin only).
     *
     * @return list of all bookings
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        List<BookingDTO> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get a specific booking by ID.
     * Users can only access their own bookings; admins can access any booking.
     *
     * @param id the booking ID
     * @return the booking DTO
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> getBookingById(@PathVariable String id) {
        BookingDTO booking = bookingService.getBookingById(id);
        
        // Verify user has access to this booking (user can view own, admin can view any)
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin && !booking.getUserId().equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(booking);
    }

    /**
     * Update booking status (approve/reject) - admin only.
     *
     * @param id the booking ID
     * @param statusRequest the status update request with reason (optional)
     * @return the updated booking DTO
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> updateBookingStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateBookingStatusRequest statusRequest) {
        BookingDTO booking = bookingService.updateBookingStatus(id, statusRequest);
        return ResponseEntity.ok(booking);
    }

    /**
     * Cancel a booking - user can only cancel their own.
     * A booking can only be cancelled if it's in PENDING or APPROVED status.
     *
     * @param id the booking ID
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Void> cancelBooking(@PathVariable String id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Debug endpoint to check current user identity and role.
     * Helps diagnose authentication/authorization issues.
     */
    @GetMapping("/debug/current-user")
    public ResponseEntity<Object> getCurrentUserDebug() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(java.util.Map.of(
            "principal", auth != null ? auth.getPrincipal() : "null",
            "authorities", auth != null ? auth.getAuthorities() : "null",
            "isAuthenticated", auth != null ? auth.isAuthenticated() : false
        ));
    }
}

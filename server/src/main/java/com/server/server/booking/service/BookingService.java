package com.server.server.booking.service;

import com.server.server.booking.dto.BookingDTO;
import com.server.server.booking.dto.CreateBookingRequest;
import com.server.server.booking.dto.UpdateBookingStatusRequest;
import com.server.server.booking.entity.Booking;
import com.server.server.booking.entity.BookingStatus;
import com.server.server.booking.exception.BookingNotFoundException;
import com.server.server.booking.exception.InvalidBookingException;
import com.server.server.booking.exception.TimeConflictException;
import com.server.server.booking.repository.BookingRepository;
import com.server.server.resource.entity.Resource;
import com.server.server.resource.entity.ResourceStatus;
import com.server.server.resource.repository.ResourceRepository;
import com.server.server.resource.exception.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for booking management.
 * Handles business logic including conflict detection, status updates, and validation.
 */
@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public BookingService(BookingRepository bookingRepository, ResourceRepository resourceRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
    }

    /**
     * Extract the logged-in user's ID from Spring Security context.
     *
     * @return the user ID from the security context
     * @throws IllegalStateException if no authentication found
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }
        return (String) authentication.getPrincipal();
    }

    /**
     * Create a new booking.
     * Extracts user ID from session, validates resource exists and is ACTIVE,
     * checks for time conflicts with existing bookings.
     *
     * @param createRequest the booking creation request
     * @return the created booking DTO
     * @throws ResourceNotFoundException if resource does not exist
     * @throws InvalidBookingException if resource is not ACTIVE
     * @throws InvalidBookingException if end time is not after start time
     * @throws TimeConflictException if booking time conflicts with existing bookings
     */
    public BookingDTO createBooking(CreateBookingRequest createRequest) {
        String userId = getCurrentUserId();

        // Validate resource exists and is ACTIVE
        Resource resource = resourceRepository.findById(createRequest.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + createRequest.getResourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new InvalidBookingException("Resource is not available for booking");
        }

        // Validate time logic
        if (!createRequest.getEndTime().isAfter(createRequest.getStartTime())) {
            throw new InvalidBookingException("End time must be after start time");
        }

        // Check for time conflicts
        checkTimeConflict(createRequest.getResourceId(), createRequest.getDate(),
                createRequest.getStartTime(), createRequest.getEndTime());

        // Create and save booking
        Booking booking = new Booking(
                createRequest.getResourceId(),
                userId,
                createRequest.getDate(),
                createRequest.getStartTime(),
                createRequest.getEndTime(),
                createRequest.getPurpose(),
                createRequest.getAttendees()
        );

        Booking savedBooking = bookingRepository.save(booking);
        return mapToDTO(savedBooking);
    }

    /**
     * Check for time conflicts with existing bookings.
     * Conflict logic: newStart < existingEnd AND newEnd > existingStart
     * Only checks against PENDING and APPROVED bookings.
     *
     * @param resourceId the resource ID
     * @param date the booking date
     * @param startTime the start time
     * @param endTime the end time
     * @throws TimeConflictException if a conflict is detected
     */
    private void checkTimeConflict(String resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Booking> existingBookings = bookingRepository.findByResourceIdAndDate(resourceId, date);

        for (Booking booking : existingBookings) {
            // Only check against PENDING and APPROVED bookings
            if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
                continue;
            }

            // Conflict detection: newStart < existingEnd AND newEnd > existingStart
            if (startTime.isBefore(booking.getEndTime()) && endTime.isAfter(booking.getStartTime())) {
                throw new TimeConflictException(
                        String.format("Time conflict: Resource is already booked from %s to %s on %s",
                                booking.getStartTime(), booking.getEndTime(), date)
                );
            }
        }
    }

    /**
     * Get all bookings for the current user.
     *
     * @return list of booking DTOs for the current user
     */
    public List<BookingDTO> getCurrentUserBookings() {
        String userId = getCurrentUserId();
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all bookings (admin only - authorization should be enforced at controller level).
     *
     * @return list of all booking DTOs
     */
    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single booking by ID.
     *
     * @param id the booking ID
     * @return the booking DTO
     * @throws BookingNotFoundException if booking not found
     */
    public BookingDTO getBookingById(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
        return mapToDTO(booking);
    }

    /**
     * Update booking status (admin only - authorization enforced at controller level).
     * Sets the reason field if provided (used for rejections).
     *
     * @param id the booking ID
     * @param statusRequest the status update request
     * @return the updated booking DTO
     * @throws BookingNotFoundException if booking not found
     */
    public BookingDTO updateBookingStatus(String id, UpdateBookingStatusRequest statusRequest) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        booking.setStatus(statusRequest.getStatus());
        if (statusRequest.getReason() != null) {
            booking.setReason(statusRequest.getReason());
        }

        Booking updatedBooking = bookingRepository.save(booking);
        return mapToDTO(updatedBooking);
    }

    /**
     * Cancel a booking (user can only cancel their own bookings if PENDING or APPROVED).
     *
     * @param id the booking ID
     * @throws BookingNotFoundException if booking not found
     * @throws InvalidBookingException if booking is not owned by current user or cannot be cancelled
     */
    public void cancelBooking(String id) {
        String userId = getCurrentUserId();

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        // Verify ownership
        if (!booking.getUserId().equals(userId)) {
            throw new InvalidBookingException("You can only cancel your own bookings");
        }

        // Verify booking can be cancelled
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new InvalidBookingException(
                    String.format("Cannot cancel booking with status: %s", booking.getStatus())
            );
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    /**
     * Convert a Booking entity to BookingDTO.
     *
     * @param booking the booking entity
     * @return the booking DTO
     */
    private BookingDTO mapToDTO(Booking booking) {
        return new BookingDTO(
                booking.getId(),
                booking.getResourceId(),
                booking.getUserId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getAttendees(),
                booking.getStatus(),
                booking.getReason(),
                booking.getCreatedAt()
        );
    }
}

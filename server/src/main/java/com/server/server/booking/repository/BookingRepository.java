package com.server.server.booking.repository;

import com.server.server.booking.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for Booking entity.
 * Provides database access methods for booking operations using MongoDB.
 */
@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    /**
     * Find all bookings for a specific resource on a given date.
     *
     * @param resourceId the ID of the resource
     * @param date the date of the booking
     * @return a list of bookings for the resource on the specified date
     */
    List<Booking> findByResourceIdAndDate(String resourceId, LocalDate date);

    /**
     * Find all bookings for a user, ordered by creation date (descending).
     *
     * @param userId the ID of the user
     * @return a list of bookings for the user, most recent first
     */
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);
}

package com.server.server.booking.dto;

import com.server.server.booking.entity.BookingStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for updating booking status (admin only).
 */
public class UpdateBookingStatusRequest {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    private String reason;

    // Constructors
    public UpdateBookingStatusRequest() {
    }

    public UpdateBookingStatusRequest(BookingStatus status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    // Getters and Setters
    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

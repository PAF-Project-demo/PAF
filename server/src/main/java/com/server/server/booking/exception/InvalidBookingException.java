package com.server.server.booking.exception;

/**
 * Exception thrown when a booking operation is invalid.
 */
public class InvalidBookingException extends RuntimeException {
    public InvalidBookingException(String message) {
        super(message);
    }
}

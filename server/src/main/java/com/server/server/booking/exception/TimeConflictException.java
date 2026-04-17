package com.server.server.booking.exception;

/**
 * Exception thrown when a booking cannot be created due to time conflict.
 */
public class TimeConflictException extends RuntimeException {
    public TimeConflictException(String message) {
        super(message);
    }
}

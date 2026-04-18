package com.server.server.ticketing.dto;

public record TicketSlaBucketResponse(
        String label,
        long value,
        String description) {
}

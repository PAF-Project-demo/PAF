package com.server.server.ticketing.dto;

import java.time.LocalDateTime;

public record TicketActivityItemResponse(
        String id,
        String action,
        String message,
        LocalDateTime createdAt,
        TicketActorResponse actor) {
}

package com.server.server.ticketing.dto;

import java.time.LocalDateTime;

public record TicketCommentResponse(
        String id,
        String message,
        LocalDateTime createdAt,
        TicketActorResponse author) {
}

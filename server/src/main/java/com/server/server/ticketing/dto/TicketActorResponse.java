package com.server.server.ticketing.dto;

import com.server.server.auth.entity.UserRole;

public record TicketActorResponse(
        String id,
        String fullName,
        UserRole role) {
}

package com.server.server.ticketing.dto;

import com.server.server.auth.entity.UserRole;
import java.util.List;

public record TicketUserResponse(
        String id,
        String fullName,
        String email,
        UserRole role,
        String department,
        List<String> skills) {
}

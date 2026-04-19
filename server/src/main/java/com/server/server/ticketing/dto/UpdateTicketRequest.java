package com.server.server.ticketing.dto;

import com.server.server.ticketing.model.TicketPriority;
import com.server.server.ticketing.model.TicketStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

public record UpdateTicketRequest(
        TicketStatus status,
        TicketPriority priority,
        @Size(max = 120, message = "Category must be 120 characters or fewer.")
        String category,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.")
        String description,
        @Valid
        TicketLocationRequest location,
        Boolean requiresExtendedResolution) {
}

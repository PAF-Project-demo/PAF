package com.server.server.ticketing.dto;

import com.server.server.ticketing.model.TicketPriority;
import com.server.server.ticketing.model.TicketType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EditTicketRequest(
        @NotBlank(message = "Ticket title is required")
        @Size(max = 200, message = "Ticket title must be 200 characters or fewer.")
        String title,
        @NotBlank(message = "Description is required.")
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.")
        String description,
        @NotNull(message = "Ticket type is required.")
        TicketType type,
        @NotNull(message = "Priority is required.")
        TicketPriority priority,
        @NotBlank(message = "Category is required.")
        @Size(max = 120, message = "Category must be 120 characters or fewer.")
        String category,
        @Valid
        @NotNull(message = "Location is required.")
        TicketLocationRequest location) {
}

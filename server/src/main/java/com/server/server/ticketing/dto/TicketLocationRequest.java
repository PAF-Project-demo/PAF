package com.server.server.ticketing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketLocationRequest(
        @NotBlank(message = "Building or main area is required.")
        @Size(max = 120, message = "Building or main area must be 120 characters or fewer.")
        String building,
        @Size(max = 60, message = "Floor must be 60 characters or fewer.")
        String floor,
        @Size(max = 120, message = "Room must be 120 characters or fewer.")
        String room,
        @Size(max = 120, message = "Campus must be 120 characters or fewer.")
        String campus,
        @Size(max = 500, message = "Location note must be 500 characters or fewer.")
        String note) {
}

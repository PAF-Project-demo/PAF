package com.server.server.ticketing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddTicketCommentRequest(
        @NotBlank(message = "Comment message is required.")
        @Size(max = 1000, message = "Comment must be 1000 characters or fewer.")
        String message) {
}

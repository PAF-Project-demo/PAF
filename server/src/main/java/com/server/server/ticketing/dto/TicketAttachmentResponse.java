package com.server.server.ticketing.dto;

import java.time.LocalDateTime;

public record TicketAttachmentResponse(
        String id,
        String fileName,
        String originalName,
        String mimeType,
        long size,
        String url,
        LocalDateTime uploadedAt,
        TicketActorResponse uploadedBy) {
}

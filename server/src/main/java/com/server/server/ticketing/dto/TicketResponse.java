package com.server.server.ticketing.dto;

import com.server.server.ticketing.model.TicketPriority;
import com.server.server.ticketing.model.TicketStatus;
import com.server.server.ticketing.model.TicketType;
import java.time.LocalDateTime;
import java.util.List;

public record TicketResponse(
        String id,
        String ticketId,
        String title,
        String description,
        TicketType type,
        TicketPriority priority,
        String category,
        TicketStatus status,
        TicketLocationResponse location,
        TicketUserResponse reporter,
        TicketUserResponse assignedTechnician,
        boolean requiresExtendedResolution,
        int slaHours,
        LocalDateTime dueAt,
        boolean overdue,
        LocalDateTime resolvedAt,
        LocalDateTime closedAt,
        List<TicketAttachmentResponse> attachments,
        List<TicketCommentResponse> comments,
        List<TicketActivityItemResponse> activity,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<TicketStatus> allowedStatusOptions,
        TicketSlaPolicyResponse slaPolicy) {
}

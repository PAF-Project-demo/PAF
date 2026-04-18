package com.server.server.ticketing.dto;

import com.server.server.ticketing.model.TicketStatus;
import java.util.List;

public record TicketSlaPolicyResponse(
        int targetHours,
        String targetLabel,
        String description,
        List<TicketStatus> workflowPath) {
}

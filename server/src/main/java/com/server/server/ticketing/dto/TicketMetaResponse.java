package com.server.server.ticketing.dto;

import com.server.server.ticketing.model.TicketPriority;
import com.server.server.ticketing.model.TicketStatus;
import com.server.server.ticketing.model.TicketType;
import java.util.List;

public record TicketMetaResponse(
        List<TicketType> types,
        List<TicketPriority> priorities,
        List<TicketStatus> statuses,
        List<String> categories,
        List<TicketUserResponse> technicians) {
}

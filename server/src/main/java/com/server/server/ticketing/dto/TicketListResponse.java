package com.server.server.ticketing.dto;

import java.util.List;

public record TicketListResponse(
        List<TicketResponse> items,
        TicketPaginationResponse pagination) {
}

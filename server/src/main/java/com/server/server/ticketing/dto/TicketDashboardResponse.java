package com.server.server.ticketing.dto;

import java.util.List;

public record TicketDashboardResponse(
        TicketDashboardCardsResponse cards,
        List<TicketSlaBucketResponse> slaBuckets,
        TicketDashboardChartsResponse charts,
        List<TicketResponse> recentTickets) {
}

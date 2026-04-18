package com.server.server.ticketing.dto;

public record TicketReportsSummaryResponse(
        long averageResolutionHours,
        long slaBreachedTickets,
        long slaMetTickets) {
}

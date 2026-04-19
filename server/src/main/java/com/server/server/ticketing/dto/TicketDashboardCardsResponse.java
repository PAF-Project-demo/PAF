package com.server.server.ticketing.dto;

public record TicketDashboardCardsResponse(
        long totalTickets,
        long openTickets,
        long overdueTickets,
        long resolvedRate) {
}

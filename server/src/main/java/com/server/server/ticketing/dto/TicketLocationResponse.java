package com.server.server.ticketing.dto;

public record TicketLocationResponse(
        String building,
        String floor,
        String room,
        String campus,
        String note) {
}

package com.server.server.ticketing.dto;

import java.util.List;

public record TicketReportsResponse(
        TicketReportsSummaryResponse summary,
        List<TicketMetricItemResponse> categoryBreakdown,
        List<TicketMetricItemResponse> technicianWorkload,
        List<TicketMetricItemResponse> typeBreakdown) {
}

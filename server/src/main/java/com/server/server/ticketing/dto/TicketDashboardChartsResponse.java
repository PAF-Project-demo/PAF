package com.server.server.ticketing.dto;

import java.util.List;

public record TicketDashboardChartsResponse(
        List<TicketMetricItemResponse> statusBreakdown,
        List<TicketMetricItemResponse> priorityBreakdown,
        List<TicketMonthlyTrendItemResponse> monthlyTrend,
        List<TicketMetricItemResponse> typeBreakdown) {
}

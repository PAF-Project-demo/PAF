package com.server.server.activity.dto;

import java.util.List;

public record ActivityNotificationFeedResponse(
        long unreadCount,
        List<ActivityFeedItemResponse> items) {
}

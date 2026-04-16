package com.server.server.activity.controller;

import com.server.server.activity.dto.ActivityFeedItemResponse;
import com.server.server.activity.dto.ActivityNotificationFeedResponse;
import com.server.server.activity.service.ActivityEventService;
import com.server.server.auth.entity.User;
import com.server.server.common.ApiError;
import com.server.server.user.service.UserAccessService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final ActivityEventService activityEventService;
    private final UserAccessService userAccessService;

    public ActivityController(
            ActivityEventService activityEventService,
            UserAccessService userAccessService) {
        this.activityEventService = activityEventService;
        this.userAccessService = userAccessService;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/notifications")
    public ResponseEntity<ActivityNotificationFeedResponse> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "8") int limit) {
        User viewer = userAccessService.getAuthenticatedUser(authentication.getName());
        return ResponseEntity.ok(activityEventService.getNotificationFeed(viewer, limit));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/notifications/mark-read")
    public ResponseEntity<ApiError> markNotificationsAsRead(Authentication authentication) {
        User viewer = userAccessService.getAuthenticatedUser(authentication.getName());
        long markedCount = activityEventService.markVisibleNotificationsAsRead(viewer);
        String message = markedCount > 0
                ? "Marked " + markedCount + " notification(s) as read."
                : "No unread notifications.";
        return ResponseEntity.ok(new ApiError(message));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/audit")
    public ResponseEntity<List<ActivityFeedItemResponse>> getAuditLog(
            Authentication authentication,
            @RequestParam(defaultValue = "40") int limit) {
        userAccessService.getAuthenticatedUser(authentication.getName());
        return ResponseEntity.ok(activityEventService.getAuditLog(limit));
    }
}

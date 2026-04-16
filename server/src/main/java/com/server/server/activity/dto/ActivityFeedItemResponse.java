package com.server.server.activity.dto;

import com.server.server.activity.entity.ActivityEventType;
import com.server.server.auth.entity.UserRole;
import com.server.server.user.entity.RoleRequestStatus;
import java.time.LocalDateTime;

public record ActivityFeedItemResponse(
        String id,
        ActivityEventType eventType,
        String title,
        String message,
        String actorUserId,
        String actorDisplayName,
        String actorEmail,
        String subjectUserId,
        String subjectDisplayName,
        String subjectEmail,
        UserRole previousRole,
        UserRole requestedRole,
        UserRole resultingRole,
        String roleRequestId,
        RoleRequestStatus roleRequestStatus,
        boolean read,
        LocalDateTime createdAt) {
}

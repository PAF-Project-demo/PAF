package com.server.server.auth.dto;

import com.server.server.auth.entity.UserRole;
import java.time.LocalDateTime;

public record CurrentUserProfileResponse(
        String userId,
        String email,
        String displayName,
        String photoUrl,
        String provider,
        UserRole role,
        LocalDateTime createdAt,
        String googleSubject,
        String linkedinSubject,
        String githubSubject) {
}

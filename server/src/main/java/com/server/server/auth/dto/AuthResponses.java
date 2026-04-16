package com.server.server.auth.dto;

import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;

public final class AuthResponses {

    private AuthResponses() {
    }

    public static AuthResponse fromUser(User user, String message) {
        UserRole role = user.getRole() != null ? user.getRole() : UserRole.USER;
        String provider = isNotBlank(user.getLinkedinSubject())
                ? "LINKEDIN"
                : isNotBlank(user.getGithubSubject())
                        ? "GITHUB"
                        : isNotBlank(user.getGoogleSubject()) ? "GOOGLE" : "LOCAL";

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                message,
                user.getDisplayName(),
                user.getPhotoUrl(),
                provider,
                role);
    }

    public static CurrentUserProfileResponse profileFromUser(User user) {
        UserRole role = user.getRole() != null ? user.getRole() : UserRole.USER;
        String provider = isNotBlank(user.getLinkedinSubject())
                ? "LINKEDIN"
                : isNotBlank(user.getGithubSubject())
                        ? "GITHUB"
                        : isNotBlank(user.getGoogleSubject()) ? "GOOGLE" : "LOCAL";

        return new CurrentUserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPhotoUrl(),
                provider,
                role,
                user.getCreatedAt(),
                user.getGoogleSubject(),
                user.getLinkedinSubject(),
                user.getGithubSubject());
    }

    private static boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

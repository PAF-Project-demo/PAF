package com.server.server.auth.github;

public record GitHubUserProfile(
        String subject,
        String email,
        Boolean emailVerified,
        String displayName,
        String username,
        String pictureUrl) {
}

package com.server.server.auth.github;

public record GitHubEmailAddress(
        String email,
        Boolean primary,
        Boolean verified,
        String visibility) {
}

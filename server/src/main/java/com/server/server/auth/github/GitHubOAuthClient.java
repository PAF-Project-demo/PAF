package com.server.server.auth.github;

public interface GitHubOAuthClient {

    boolean isConfigured();

    String buildAuthorizationUrl(String state);

    GitHubUserProfile authenticate(String authorizationCode);
}

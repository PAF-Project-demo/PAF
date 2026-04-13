package com.server.server.auth.linkedin;

public interface LinkedInOAuthClient {

    boolean isConfigured();

    String buildAuthorizationUrl(String state);

    LinkedInUserProfile authenticate(String authorizationCode);
}

package com.server.server.auth.github;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GitHubOAuthClientServiceTest {

    private GitHubOAuthClientService gitHubOAuthClientService;

    @BeforeEach
    void setUp() {
        gitHubOAuthClientService = new GitHubOAuthClientService(
                "client-id",
                "client-secret",
                "http://localhost:8081/api/auth/github/callback",
                new ObjectMapper());
    }

    @Test
    void parseGitHubUserProfileReadsCoreFields() throws Exception {
        GitHubUserProfile profile = gitHubOAuthClientService.parseGitHubUserProfile("""
                {
                  "id": 12345,
                  "login": "octocat",
                  "name": "Mona Octocat",
                  "email": "octocat@example.com",
                  "avatar_url": "https://example.com/octocat.png"
                }
                """);

        assertEquals("12345", profile.subject());
        assertEquals("octocat", profile.username());
        assertEquals("Mona Octocat", profile.displayName());
        assertEquals("octocat@example.com", profile.email());
        assertEquals("https://example.com/octocat.png", profile.pictureUrl());
    }

    @Test
    void parseGitHubEmailAddressesReadsVerifiedPrimaryEmails() throws Exception {
        List<GitHubEmailAddress> emailAddresses = gitHubOAuthClientService.parseGitHubEmailAddresses("""
                [
                  {
                    "email": "octocat@example.com",
                    "primary": true,
                    "verified": true,
                    "visibility": "private"
                  },
                  {
                    "email": "backup@example.com",
                    "primary": false,
                    "verified": true,
                    "visibility": null
                  }
                ]
                """);

        assertEquals(2, emailAddresses.size());
        assertEquals("octocat@example.com", emailAddresses.get(0).email());
        assertEquals(Boolean.TRUE, emailAddresses.get(0).primary());
        assertEquals(Boolean.TRUE, emailAddresses.get(0).verified());
        assertEquals("private", emailAddresses.get(0).visibility());
    }
}

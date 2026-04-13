package com.server.server.auth.linkedin;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class LinkedInOAuthClientServiceTest {

    private LinkedInOAuthClientService linkedInOAuthClientService;

    @BeforeEach
    void setUp() {
        linkedInOAuthClientService = new LinkedInOAuthClientService(
                "client-id",
                "client-secret",
                "http://localhost:8081/api/auth/linkedin/callback",
                new ObjectMapper());
    }

    @Test
    void parseLinkedInUserProfileSupportsStringLocale() throws Exception {
        LinkedInUserProfile profile = linkedInOAuthClientService.parseLinkedInUserProfile("""
                {
                  "sub": "linkedin-user-1",
                  "email": "member@example.com",
                  "email_verified": true,
                  "name": "LinkedIn Member",
                  "given_name": "LinkedIn",
                  "family_name": "Member",
                  "picture": "https://example.com/profile.png",
                  "locale": "en-US"
                }
                """);

        assertEquals("linkedin-user-1", profile.subject());
        assertEquals("member@example.com", profile.email());
        assertEquals(Boolean.TRUE, profile.emailVerified());
        assertEquals("LinkedIn Member", profile.displayName());
        assertEquals("https://example.com/profile.png", profile.pictureUrl());
        assertEquals("en-US", profile.locale());
    }

    @Test
    void parseLinkedInUserProfileSupportsObjectLocale() throws Exception {
        LinkedInUserProfile profile = linkedInOAuthClientService.parseLinkedInUserProfile("""
                {
                  "sub": "linkedin-user-2",
                  "email": "member@example.com",
                  "email_verified": "true",
                  "name": "LinkedIn Member",
                  "locale": {
                    "language": "en",
                    "country": "US"
                  },
                  "picture": {
                    "url": "https://example.com/profile.png"
                  }
                }
                """);

        assertEquals("linkedin-user-2", profile.subject());
        assertEquals("member@example.com", profile.email());
        assertEquals(Boolean.TRUE, profile.emailVerified());
        assertEquals("en-US", profile.locale());
        assertEquals("https://example.com/profile.png", profile.pictureUrl());
        assertEquals("", profile.givenName());
    }
}

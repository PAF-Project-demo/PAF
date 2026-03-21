package com.server.server.auth.dto;

public record AuthResponse(
        String userId,
        String email,
        String message,
        String displayName,
        String photoUrl,
        String provider) {

    public AuthResponse(String userId, String email, String message) {
        this(userId, email, message, null, null, "LOCAL");
    }
}

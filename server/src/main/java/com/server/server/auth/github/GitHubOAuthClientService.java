package com.server.server.auth.github;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.server.server.auth.exception.AuthConfigurationException;
import com.server.server.auth.exception.InvalidCredentialsException;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GitHubOAuthClientService implements GitHubOAuthClient {

    private static final String AUTHORIZATION_ENDPOINT = "https://github.com/login/oauth/authorize";
    private static final String TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
    private static final String USER_ENDPOINT = "https://api.github.com/user";
    private static final String EMAILS_ENDPOINT = "https://api.github.com/user/emails";
    private static final String GITHUB_ACCEPT_HEADER = "application/vnd.github+json";
    private static final String GITHUB_API_VERSION = "2022-11-28";
    private static final String GITHUB_SCOPES = "read:user user:email";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    public GitHubOAuthClientService(
            @Value("${auth.github.client-id:}") String clientId,
            @Value("${auth.github.client-secret:}") String clientSecret,
            @Value("${auth.github.redirect-uri:}") String redirectUri,
            ObjectMapper objectMapper) {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = objectMapper;
        this.clientId = sanitize(clientId);
        this.clientSecret = sanitize(clientSecret);
        this.redirectUri = sanitize(redirectUri);
    }

    @Override
    public boolean isConfigured() {
        return isConfiguredValue(clientId)
                && isConfiguredValue(clientSecret)
                && isConfiguredValue(redirectUri);
    }

    @Override
    public String buildAuthorizationUrl(String state) {
        ensureConfigured();

        return UriComponentsBuilder.fromUriString(AUTHORIZATION_ENDPOINT)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("scope", GITHUB_SCOPES)
                .queryParam("state", state)
                .queryParam("allow_signup", true)
                .build()
                .encode()
                .toUriString();
    }

    @Override
    public GitHubUserProfile authenticate(String authorizationCode) {
        ensureConfigured();

        if (authorizationCode == null || authorizationCode.isBlank()) {
            throw new InvalidCredentialsException(
                    "GitHub sign-in did not return an authorization code.");
        }

        GitHubAccessTokenResponse tokenResponse = exchangeAuthorizationCode(authorizationCode.trim());
        String accessToken = tokenResponse.accessToken();

        if (accessToken == null || accessToken.isBlank()) {
            throw new InvalidCredentialsException(
                    "GitHub sign-in did not return an access token.");
        }

        GitHubUserProfile rawProfile = fetchUserProfile(accessToken.trim());

        if (rawProfile.subject() == null || rawProfile.subject().isBlank()) {
            throw new InvalidCredentialsException(
                    "GitHub sign-in did not return a valid account identifier.");
        }

        GitHubEmailAddress verifiedEmail = selectVerifiedEmail(fetchUserEmails(accessToken.trim()));

        if (verifiedEmail == null || verifiedEmail.email() == null || verifiedEmail.email().isBlank()) {
            throw new InvalidCredentialsException(
                    "Your GitHub account did not provide a verified email address.");
        }

        return new GitHubUserProfile(
                rawProfile.subject().trim(),
                normalizeEmail(verifiedEmail.email()),
                Boolean.TRUE,
                sanitize(rawProfile.displayName()),
                sanitize(rawProfile.username()),
                sanitize(rawProfile.pictureUrl()));
    }

    private GitHubAccessTokenResponse exchangeAuthorizationCode(String authorizationCode) {
        String requestBody = buildFormBody(
                "client_id", clientId,
                "client_secret", clientSecret,
                "code", authorizationCode,
                "redirect_uri", redirectUri);

        HttpRequest request = HttpRequest.newBuilder(URI.create(TOKEN_ENDPOINT))
                .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                .header("Content-Type", MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = send(request, "Unable to complete GitHub sign-in right now.");

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new InvalidCredentialsException("GitHub sign-in could not be verified.");
        }

        try {
            return objectMapper.readValue(response.body(), GitHubAccessTokenResponse.class);
        } catch (JsonProcessingException exception) {
            throw new AuthConfigurationException(
                    "GitHub sign-in returned an invalid token response.",
                    exception);
        }
    }

    private GitHubUserProfile fetchUserProfile(String accessToken) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(USER_ENDPOINT))
                .header("Accept", GITHUB_ACCEPT_HEADER)
                .header("Authorization", "Bearer " + accessToken)
                .header("X-GitHub-Api-Version", GITHUB_API_VERSION)
                .GET()
                .build();

        HttpResponse<String> response = send(request, "Unable to load your GitHub account right now.");

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new InvalidCredentialsException("GitHub account details could not be verified.");
        }

        try {
            return parseGitHubUserProfile(response.body());
        } catch (JsonProcessingException exception) {
            throw new AuthConfigurationException(
                    "GitHub sign-in returned an invalid profile response.",
                    exception);
        }
    }

    private List<GitHubEmailAddress> fetchUserEmails(String accessToken) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(EMAILS_ENDPOINT))
                .header("Accept", GITHUB_ACCEPT_HEADER)
                .header("Authorization", "Bearer " + accessToken)
                .header("X-GitHub-Api-Version", GITHUB_API_VERSION)
                .GET()
                .build();

        HttpResponse<String> response = send(request, "Unable to load your GitHub email right now.");

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new InvalidCredentialsException("GitHub account email could not be verified.");
        }

        try {
            return parseGitHubEmailAddresses(response.body());
        } catch (JsonProcessingException exception) {
            throw new AuthConfigurationException(
                    "GitHub sign-in returned an invalid email response.",
                    exception);
        }
    }

    private HttpResponse<String> send(HttpRequest request, String errorMessage) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AuthConfigurationException(errorMessage, exception);
        } catch (IOException exception) {
            throw new AuthConfigurationException(errorMessage, exception);
        }
    }

    private String buildFormBody(String... keyValues) {
        StringBuilder bodyBuilder = new StringBuilder();

        for (int index = 0; index < keyValues.length; index += 2) {
            if (bodyBuilder.length() > 0) {
                bodyBuilder.append('&');
            }

            bodyBuilder.append(urlEncode(keyValues[index]))
                    .append('=')
                    .append(urlEncode(keyValues[index + 1]));
        }

        return bodyBuilder.toString();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private GitHubEmailAddress selectVerifiedEmail(List<GitHubEmailAddress> emailAddresses) {
        for (GitHubEmailAddress emailAddress : emailAddresses) {
            if (isVerifiedPrimaryEmail(emailAddress)) {
                return emailAddress;
            }
        }

        for (GitHubEmailAddress emailAddress : emailAddresses) {
            if (Boolean.TRUE.equals(emailAddress.verified()) && hasText(emailAddress.email())) {
                return emailAddress;
            }
        }

        return null;
    }

    private boolean isVerifiedPrimaryEmail(GitHubEmailAddress emailAddress) {
        return emailAddress != null
                && Boolean.TRUE.equals(emailAddress.primary())
                && Boolean.TRUE.equals(emailAddress.verified())
                && hasText(emailAddress.email());
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new AuthConfigurationException(
                    "GitHub sign-in is not configured on the server.");
        }
    }

    private boolean isConfiguredValue(String value) {
        return value != null && !value.isBlank() && !value.startsWith("replace-with-");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String sanitize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeEmail(String value) {
        String sanitizedValue = sanitize(value);
        return sanitizedValue.isEmpty() ? "" : sanitizedValue.toLowerCase(Locale.ROOT);
    }

    GitHubUserProfile parseGitHubUserProfile(String rawResponse) throws JsonProcessingException {
        JsonNode profileNode = objectMapper.readTree(rawResponse);

        return new GitHubUserProfile(
                extractText(profileNode, "id"),
                normalizeEmail(extractText(profileNode, "email")),
                null,
                extractText(profileNode, "name"),
                extractText(profileNode, "login"),
                extractText(profileNode, "avatar_url"));
    }

    List<GitHubEmailAddress> parseGitHubEmailAddresses(String rawResponse) throws JsonProcessingException {
        JsonNode emailNodes = objectMapper.readTree(rawResponse);
        List<GitHubEmailAddress> emailAddresses = new ArrayList<>();

        if (!emailNodes.isArray()) {
            return emailAddresses;
        }

        for (JsonNode emailNode : emailNodes) {
            emailAddresses.add(new GitHubEmailAddress(
                    normalizeEmail(extractText(emailNode, "email")),
                    extractBoolean(emailNode, "primary"),
                    extractBoolean(emailNode, "verified"),
                    extractText(emailNode, "visibility")));
        }

        return emailAddresses;
    }

    private String extractText(JsonNode node, String fieldName) {
        return sanitize(node.path(fieldName).asText(""));
    }

    private Boolean extractBoolean(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.path(fieldName);

        if (fieldNode.isMissingNode() || fieldNode.isNull()) {
            return null;
        }

        if (fieldNode.isBoolean()) {
            return fieldNode.booleanValue();
        }

        if (fieldNode.isTextual()) {
            String value = sanitize(fieldNode.textValue());
            return value.isEmpty() ? null : Boolean.parseBoolean(value);
        }

        return null;
    }
}

package com.server.server.auth.linkedin;

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
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class LinkedInOAuthClientService implements LinkedInOAuthClient {

    private static final String AUTHORIZATION_ENDPOINT = "https://www.linkedin.com/oauth/v2/authorization";
    private static final String TOKEN_ENDPOINT = "https://www.linkedin.com/oauth/v2/accessToken";
    private static final String USERINFO_ENDPOINT = "https://api.linkedin.com/v2/userinfo";
    private static final String LINKEDIN_SCOPES = "openid profile email";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    public LinkedInOAuthClientService(
            @Value("${auth.linkedin.client-id:}") String clientId,
            @Value("${auth.linkedin.client-secret:}") String clientSecret,
            @Value("${auth.linkedin.redirect-uri:}") String redirectUri,
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
                .queryParam("response_type", "code")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("state", state)
                .queryParam("scope", LINKEDIN_SCOPES)
                .build()
                .encode()
                .toUriString();
    }

    @Override
    public LinkedInUserProfile authenticate(String authorizationCode) {
        ensureConfigured();

        if (authorizationCode == null || authorizationCode.isBlank()) {
            throw new InvalidCredentialsException(
                    "LinkedIn sign-in did not return an authorization code.");
        }

        LinkedInTokenResponse tokenResponse = exchangeAuthorizationCode(authorizationCode.trim());
        String accessToken = tokenResponse.accessToken();

        if (accessToken == null || accessToken.isBlank()) {
            throw new InvalidCredentialsException(
                    "LinkedIn sign-in did not return an access token.");
        }

        LinkedInUserProfile rawProfile = fetchUserProfile(accessToken.trim());

        if (rawProfile.subject() == null || rawProfile.subject().isBlank()) {
            throw new InvalidCredentialsException(
                    "LinkedIn sign-in did not return a valid account identifier.");
        }

        return new LinkedInUserProfile(
                rawProfile.subject().trim(),
                normalizeEmail(rawProfile.email()),
                rawProfile.emailVerified(),
                sanitize(rawProfile.displayName()),
                sanitize(rawProfile.givenName()),
                sanitize(rawProfile.familyName()),
                sanitize(rawProfile.pictureUrl()),
                sanitize(rawProfile.locale()));
    }

    private LinkedInTokenResponse exchangeAuthorizationCode(String authorizationCode) {
        String requestBody = buildFormBody(
                "grant_type", "authorization_code",
                "code", authorizationCode,
                "client_id", clientId,
                "client_secret", clientSecret,
                "redirect_uri", redirectUri);

        HttpRequest request = HttpRequest.newBuilder(URI.create(TOKEN_ENDPOINT))
                .header("Content-Type", MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = send(request, "Unable to complete LinkedIn sign-in right now.");

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new InvalidCredentialsException("LinkedIn sign-in could not be verified.");
        }

        try {
            return objectMapper.readValue(response.body(), LinkedInTokenResponse.class);
        } catch (JsonProcessingException exception) {
            throw new AuthConfigurationException(
                    "LinkedIn sign-in returned an invalid token response.",
                    exception);
        }
    }

    private LinkedInUserProfile fetchUserProfile(String accessToken) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(USERINFO_ENDPOINT))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                .GET()
                .build();

        HttpResponse<String> response = send(request, "Unable to load your LinkedIn account right now.");

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new InvalidCredentialsException("LinkedIn account details could not be verified.");
        }

        try {
            return parseLinkedInUserProfile(response.body());
        } catch (JsonProcessingException exception) {
            throw new AuthConfigurationException(
                    "LinkedIn sign-in returned an invalid profile response.",
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

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new AuthConfigurationException(
                    "LinkedIn sign-in is not configured on the server.");
        }
    }

    private boolean isConfiguredValue(String value) {
        return value != null && !value.isBlank() && !value.startsWith("replace-with-");
    }

    private String sanitize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeEmail(String value) {
        String sanitizedValue = sanitize(value);
        return sanitizedValue.isEmpty() ? "" : sanitizedValue.toLowerCase(Locale.ROOT);
    }

    LinkedInUserProfile parseLinkedInUserProfile(String rawResponse) throws JsonProcessingException {
        JsonNode profileNode = objectMapper.readTree(rawResponse);

        return new LinkedInUserProfile(
                extractText(profileNode, "sub"),
                extractText(profileNode, "email"),
                extractBoolean(profileNode, "email_verified"),
                extractText(profileNode, "name"),
                extractText(profileNode, "given_name"),
                extractText(profileNode, "family_name"),
                extractPicture(profileNode.path("picture")),
                extractLocale(profileNode.path("locale")));
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

    private String extractLocale(JsonNode localeNode) {
        if (localeNode == null || localeNode.isMissingNode() || localeNode.isNull()) {
            return "";
        }

        if (localeNode.isTextual()) {
            return sanitize(localeNode.textValue());
        }

        if (localeNode.isObject()) {
            String language = sanitize(localeNode.path("language").asText(""));
            String country = sanitize(localeNode.path("country").asText(""));

            if (!language.isEmpty() && !country.isEmpty()) {
                return language + "-" + country;
            }

            return !language.isEmpty() ? language : country;
        }

        return "";
    }

    private String extractPicture(JsonNode pictureNode) {
        if (pictureNode == null || pictureNode.isMissingNode() || pictureNode.isNull()) {
            return "";
        }

        if (pictureNode.isTextual()) {
            return sanitize(pictureNode.textValue());
        }

        if (pictureNode.isObject()) {
            String directUrl = sanitize(pictureNode.path("url").asText(""));
            if (!directUrl.isEmpty()) {
                return directUrl;
            }

            String nestedUrl = sanitize(pictureNode.path("data").path("url").asText(""));
            if (!nestedUrl.isEmpty()) {
                return nestedUrl;
            }
        }

        return "";
    }
}

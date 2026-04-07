package com.server.server.auth.controller;

import com.server.server.auth.dto.AuthResponse;
import com.server.server.auth.dto.AuthConfigResponse;
import com.server.server.auth.dto.AuthResponses;
import com.server.server.auth.dto.GoogleSignInRequest;
import com.server.server.auth.dto.SignInRequest;
import com.server.server.auth.dto.SignUpRequest;
import com.server.server.auth.exception.AuthConfigurationException;
import com.server.server.auth.exception.DuplicateEmailException;
import com.server.server.auth.exception.InvalidCredentialsException;
import com.server.server.auth.linkedin.LinkedInOAuthClient;
import com.server.server.auth.linkedin.LinkedInUserProfile;
import com.server.server.auth.security.SessionAuthenticationService;
import com.server.server.auth.service.AuthService;
import com.server.server.common.ApiError;
import com.server.server.user.service.UserAccessService;
import java.io.IOException;
import java.net.URI;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private static final String LINKEDIN_STATE_ATTRIBUTE = "paf.linkedin.oauth.state";
    private static final String LINKEDIN_REMEMBER_ATTRIBUTE = "paf.linkedin.oauth.remember";

    private final AuthService authService;
    private final SessionAuthenticationService sessionAuthenticationService;
    private final UserAccessService userAccessService;
    private final LinkedInOAuthClient linkedInOAuthClient;
    private final String googleClientId;
    private final String linkedInClientRedirectUri;

    public AuthController(
            AuthService authService,
            SessionAuthenticationService sessionAuthenticationService,
            UserAccessService userAccessService,
            LinkedInOAuthClient linkedInOAuthClient,
            @Value("${auth.google.client-id:}") String googleClientId,
            @Value("${auth.linkedin.client-redirect-uri:http://localhost:5173/}") String linkedInClientRedirectUri) {
        this.authService = authService;
        this.sessionAuthenticationService = sessionAuthenticationService;
        this.userAccessService = userAccessService;
        this.linkedInOAuthClient = linkedInOAuthClient;
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
        this.linkedInClientRedirectUri = linkedInClientRedirectUri == null
                ? "http://localhost:5173/"
                : linkedInClientRedirectUri.trim();
    }

    @GetMapping("/config")
    public ResponseEntity<AuthConfigResponse> getAuthConfig() {
        boolean googleSignInEnabled =
                !googleClientId.isBlank() && !googleClientId.startsWith("replace-with-");

        return ResponseEntity.ok(new AuthConfigResponse(
                googleSignInEnabled,
                googleSignInEnabled ? googleClientId : null,
                linkedInOAuthClient.isConfigured()));
    }

    @GetMapping("/linkedin/authorize")
    public ResponseEntity<Void> authorizeLinkedIn(
            @RequestParam(name = "remember", defaultValue = "false") boolean rememberUser,
            HttpServletRequest httpRequest) {
        String state = UUID.randomUUID().toString();
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(LINKEDIN_STATE_ATTRIBUTE, state);
        session.setAttribute(LINKEDIN_REMEMBER_ATTRIBUTE, rememberUser);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(linkedInOAuthClient.buildAuthorizationUrl(state)))
                .build();
    }

    @GetMapping("/linkedin/callback")
    public void signInWithLinkedIn(
            @RequestParam(name = "code", required = false) String authorizationCode,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "error", required = false) String error,
            @RequestParam(name = "error_description", required = false) String errorDescription,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) throws IOException {
        HttpSession session = httpRequest.getSession(false);
        boolean rememberUser = Boolean.TRUE.equals(
                session != null ? session.getAttribute(LINKEDIN_REMEMBER_ATTRIBUTE) : Boolean.FALSE);
        String expectedState = session != null
                ? (String) session.getAttribute(LINKEDIN_STATE_ATTRIBUTE)
                : null;
        clearLinkedInState(session);

        if (error != null && !error.isBlank()) {
            redirectToLinkedInClient(
                    httpResponse,
                    false,
                    resolveLinkedInErrorMessage(error, errorDescription),
                    rememberUser);
            return;
        }

        if (expectedState == null || expectedState.isBlank() || !expectedState.equals(state)) {
            redirectToLinkedInClient(
                    httpResponse,
                    false,
                    "LinkedIn sign-in could not be verified. Please try again.",
                    rememberUser);
            return;
        }

        try {
            LinkedInUserProfile linkedInUserProfile = linkedInOAuthClient.authenticate(authorizationCode);
            AuthResponse authResponse = authService.signInWithLinkedIn(linkedInUserProfile);
            sessionAuthenticationService.signIn(authResponse, httpRequest, httpResponse);
            redirectToLinkedInClient(httpResponse, true, authResponse.message(), rememberUser);
        } catch (InvalidCredentialsException | DuplicateEmailException | AuthConfigurationException exception) {
            logger.warn("LinkedIn sign-in failed: {}", exception.getMessage());
            redirectToLinkedInClient(httpResponse, false, exception.getMessage(), rememberUser);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        AuthResponse response = authService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signIn(
            @Valid @RequestBody SignInRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.signIn(request);
        sessionAuthenticationService.signIn(authResponse, httpRequest, httpResponse);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> signInWithGoogle(
            @Valid @RequestBody GoogleSignInRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse authResponse = authService.signInWithGoogle(request);
        sessionAuthenticationService.signIn(authResponse, httpRequest, httpResponse);
        return ResponseEntity.ok(authResponse);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(AuthResponses.fromUser(
                userAccessService.getAuthenticatedUser(authentication.getName()),
                "Authenticated session restored."));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/signout")
    public ResponseEntity<ApiError> signOut(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        sessionAuthenticationService.signOut(httpRequest, httpResponse);
        return ResponseEntity.ok(new ApiError("Signed out successfully."));
    }

    private void clearLinkedInState(HttpSession session) {
        if (session == null) {
            return;
        }

        session.removeAttribute(LINKEDIN_STATE_ATTRIBUTE);
        session.removeAttribute(LINKEDIN_REMEMBER_ATTRIBUTE);
    }

    private void redirectToLinkedInClient(
            HttpServletResponse httpResponse,
            boolean success,
            String message,
            boolean rememberUser) throws IOException {
        String redirectUri = success
                ? buildLinkedInSuccessRedirectUri()
                : buildLinkedInErrorRedirectUri(message);

        httpResponse.sendRedirect(redirectUri);
    }

    private String buildLinkedInSuccessRedirectUri() {
        return UriComponentsBuilder.fromUriString(linkedInClientRedirectUri)
                .replaceQuery(null)
                .fragment(null)
                .build()
                .encode()
                .toUriString();
    }

    private String buildLinkedInErrorRedirectUri(String message) {
        URI clientRedirectUri = URI.create(linkedInClientRedirectUri);

        return UriComponentsBuilder.fromUri(clientRedirectUri)
                .replacePath("/signin")
                .replaceQuery(null)
                .queryParam("linkedinError", message)
                .fragment(null)
                .build()
                .encode()
                .toUriString();
    }

    private String resolveLinkedInErrorMessage(String error, String errorDescription) {
        if ("user_cancelled_login".equalsIgnoreCase(error)
                || "user_cancelled_authorize".equalsIgnoreCase(error)) {
            return "LinkedIn sign-in was cancelled.";
        }

        if (errorDescription != null && !errorDescription.isBlank()) {
            return errorDescription.trim();
        }

        return "LinkedIn sign-in was not completed.";
    }
}

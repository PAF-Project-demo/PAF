package com.server.server.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.server.server.auth.dto.AuthResponse;
import com.server.server.auth.dto.SignInRequest;
import com.server.server.auth.dto.SignUpRequest;
import com.server.server.auth.entity.User;
import com.server.server.auth.exception.DuplicateEmailException;
import com.server.server.auth.exception.InvalidCredentialsException;
import com.server.server.auth.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder);
    }

    @Test
    void signUpThrowsWhenEmailAlreadyExists() {
        SignUpRequest request = new SignUpRequest("user@example.com", "secret123");
        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () -> authService.signUp(request));
    }

    @Test
    void signInReturnsAuthenticatedUserWhenCredentialsAreValid() {
        User user = new User();
        user.setId("user-123");
        user.setEmail("user@example.com");
        user.setPasswordHash("encoded-password");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "encoded-password")).thenReturn(true);

        AuthResponse response = authService.signIn(new SignInRequest(" USER@example.com ", "secret123"));

        assertEquals("user-123", response.userId());
        assertEquals("user@example.com", response.email());
        assertEquals("Signed in successfully.", response.message());
        verify(userRepository).findByEmail("user@example.com");
    }

    @Test
    void signInThrowsWhenPasswordDoesNotMatch() {
        User user = new User();
        user.setEmail("user@example.com");
        user.setPasswordHash("encoded-password");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.signIn(new SignInRequest("user@example.com", "wrong-password")));
    }
}

package com.server.server.auth.service;

import com.server.server.auth.dto.AuthResponse;
import com.server.server.auth.dto.SignUpRequest;
import com.server.server.auth.entity.User;
import com.server.server.auth.exception.DuplicateEmailException;
import com.server.server.auth.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse signUp(SignUpRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException("An account with this email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCreatedAt(LocalDateTime.now());

        try {
            User savedUser = userRepository.save(user);

            return new AuthResponse(savedUser.getId(), savedUser.getEmail(), "Account created successfully.");
        } catch (DuplicateKeyException exception) {
            throw new DuplicateEmailException("An account with this email already exists");
        }
    }
}

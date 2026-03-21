package com.server.server.user.service;

import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.auth.repository.UserRepository;
import com.server.server.user.dto.UserTableItemResponse;
import com.server.server.user.exception.UserNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserManagementService {

    private final UserRepository userRepository;

    public UserManagementService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserTableItemResponse updateUserRole(String targetUserId, UserRole role) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("User not found."));

        user.setRole(role);
        User savedUser = userRepository.save(user);

        return new UserTableItemResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                isNotBlank(savedUser.getDisplayName()) ? savedUser.getDisplayName().trim() : savedUser.getEmail(),
                savedUser.getPhotoUrl(),
                isNotBlank(savedUser.getGoogleSubject()) ? "GOOGLE" : "LOCAL",
                savedUser.getRole() != null ? savedUser.getRole() : UserRole.USER,
                savedUser.getCreatedAt());
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

package com.server.server.user.service;

import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.auth.exception.ForbiddenAccessException;
import com.server.server.auth.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserAccessService {

    private final UserRepository userRepository;

    public UserAccessService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void assertAdminAccess(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ForbiddenAccessException("Only admins can access this resource.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ForbiddenAccessException("Only admins can access this resource."));

        UserRole role = user.getRole() != null ? user.getRole() : UserRole.USER;
        if (role != UserRole.ADMIN) {
            throw new ForbiddenAccessException("Only admins can access this resource.");
        }
    }
}

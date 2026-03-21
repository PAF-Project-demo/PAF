package com.server.server.user.service;

import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.auth.repository.UserRepository;
import com.server.server.user.dto.UserTableItemResponse;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class UserQueryService {

    private static final Sort USER_LIST_SORT = Sort.by(
            Sort.Order.desc("createdAt"),
            Sort.Order.asc("email"));

    private final UserRepository userRepository;

    public UserQueryService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserTableItemResponse> getUsersForTable() {
        return userRepository.findAll(USER_LIST_SORT).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private UserTableItemResponse mapToResponse(User user) {
        String email = user.getEmail();
        String displayName = user.getDisplayName();
        UserRole role = user.getRole() != null ? user.getRole() : UserRole.USER;
        String provider = isNotBlank(user.getGoogleSubject()) ? "GOOGLE" : "LOCAL";

        return new UserTableItemResponse(
                user.getId(),
                email,
                isNotBlank(displayName) ? displayName.trim() : email,
                user.getPhotoUrl(),
                provider,
                role,
                user.getCreatedAt());
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

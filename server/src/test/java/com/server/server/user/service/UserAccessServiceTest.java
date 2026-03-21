package com.server.server.user.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.auth.exception.ForbiddenAccessException;
import com.server.server.auth.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserAccessServiceTest {

    @Mock
    private UserRepository userRepository;

    @Test
    void assertAdminAccessAllowsAdminUsers() {
        User adminUser = new User();
        adminUser.setId("admin-user");
        adminUser.setRole(UserRole.ADMIN);

        when(userRepository.findById("admin-user")).thenReturn(Optional.of(adminUser));

        UserAccessService userAccessService = new UserAccessService(userRepository);

        assertDoesNotThrow(() -> userAccessService.assertAdminAccess("admin-user"));
    }

    @Test
    void assertAdminAccessRejectsRegularUsers() {
        User standardUser = new User();
        standardUser.setId("user-1");
        standardUser.setRole(UserRole.USER);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(standardUser));

        UserAccessService userAccessService = new UserAccessService(userRepository);

        assertThrows(ForbiddenAccessException.class, () -> userAccessService.assertAdminAccess("user-1"));
    }
}

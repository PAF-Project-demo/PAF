package com.server.server.user.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.server.server.activity.service.ActivityEventService;
import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.auth.repository.UserRepository;
import com.server.server.user.dto.UserRoleUpdateResponse;
import com.server.server.user.exception.UserNotFoundException;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserAccessService userAccessService;

    @Mock
    private ActivityEventService activityEventService;

    @Test
    void updateUserRoleAssignsRequestedRole() {
        User user = new User();
        user.setId("user-1");
        user.setEmail("manager@example.com");
        user.setDisplayName("Manager User");
        user.setCreatedAt(LocalDateTime.of(2026, 3, 21, 18, 10, 0));
        user.setRole(UserRole.USER);

        User adminUser = new User();
        adminUser.setId("admin-user");
        adminUser.setEmail("admin@example.com");
        adminUser.setDisplayName("Admin User");
        adminUser.setRole(UserRole.ADMIN);

        when(userAccessService.getAuthenticatedUser("admin-user")).thenReturn(adminUser);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserManagementService userManagementService = new UserManagementService(
                userRepository,
                userAccessService,
                activityEventService);

        UserRoleUpdateResponse response = userManagementService.updateUserRole(
                "admin-user",
                "user-1",
                UserRole.MANAGER);

        assertEquals("User role updated to MANAGER successfully.", response.message());
        assertEquals("user-1", response.user().id());
        assertEquals(UserRole.MANAGER, response.user().role());
        assertEquals("Manager User", response.user().displayName());
        verify(userRepository).save(user);
        verify(activityEventService).recordDirectRoleChange(eq(adminUser), eq(user), eq(UserRole.USER));
    }

    @Test
    void updateUserRoleThrowsWhenUserDoesNotExist() {
        when(userRepository.findById("missing-user")).thenReturn(Optional.empty());

        User adminUser = new User();
        adminUser.setId("admin-user");
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(UserRole.ADMIN);

        when(userAccessService.getAuthenticatedUser("admin-user")).thenReturn(adminUser);

        UserManagementService userManagementService = new UserManagementService(
                userRepository,
                userAccessService,
                activityEventService);

        assertThrows(UserNotFoundException.class,
                () -> userManagementService.updateUserRole(
                        "admin-user",
                        "missing-user",
                        UserRole.TECHNICIAN));
    }
}

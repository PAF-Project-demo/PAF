package com.server.server.user.controller;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.server.server.auth.entity.UserRole;
import com.server.server.user.dto.UserTableItemResponse;
import com.server.server.user.service.UserAccessService;
import com.server.server.user.service.UserQueryService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserAccessService userAccessService;

    @MockitoBean
    private UserQueryService userQueryService;

    @Test
    void getUsersReturnsDisplayNameFallbackAndAdminRole() throws Exception {
        given(userQueryService.getUsersForTable()).willReturn(List.of(
                new UserTableItemResponse(
                        "user-1",
                        "hettiarachchianuk01@gmail.com",
                        "hettiarachchianuk01@gmail.com",
                        "https://example.com/photo.png",
                        "GOOGLE",
                        UserRole.USER,
                        LocalDateTime.of(2026, 3, 21, 9, 47, 12)),
                new UserTableItemResponse(
                        "user-2",
                        "admin@example.com",
                        "Admin User",
                        null,
                        "LOCAL",
                        UserRole.ADMIN,
                        LocalDateTime.of(2026, 3, 21, 10, 26, 59))));

        mockMvc.perform(get("/api/users").header("X-Auth-User-Id", "admin-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].displayName").value("hettiarachchianuk01@gmail.com"))
                .andExpect(jsonPath("$[0].role").value("USER"))
                .andExpect(jsonPath("$[1].role").value("ADMIN"));
    }

    @Test
    void getUsersRejectsNonAdminAccess() throws Exception {
        willThrow(new com.server.server.auth.exception.ForbiddenAccessException("Only admins can access this resource."))
                .given(userAccessService)
                .assertAdminAccess("user-1");

        mockMvc.perform(get("/api/users").header("X-Auth-User-Id", "user-1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only admins can access this resource."));
    }
}

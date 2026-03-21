package com.server.server.user.controller;

import com.server.server.user.dto.UserTableItemResponse;
import com.server.server.user.service.UserAccessService;
import com.server.server.user.service.UserQueryService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserAccessService userAccessService;
    private final UserQueryService userQueryService;

    public UserController(UserAccessService userAccessService, UserQueryService userQueryService) {
        this.userAccessService = userAccessService;
        this.userQueryService = userQueryService;
    }

    @GetMapping
    public ResponseEntity<List<UserTableItemResponse>> getUsers(
            @RequestHeader(value = "X-Auth-User-Id", required = false) String userId) {
        userAccessService.assertAdminAccess(userId);
        return ResponseEntity.ok(userQueryService.getUsersForTable());
    }
}

package com.server.server;

import com.server.server.auth.controller.AuthController;
import com.server.server.auth.dto.AuthResponse;
import com.server.server.auth.exception.DuplicateEmailException;
import com.server.server.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
class ServerApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @Test
    void contextLoads() {
    }

    @Test
    void signupCreatesUser() throws Exception {
        given(authService.signUp(any()))
                .willReturn(new AuthResponse("507f1f77bcf86cd799439011", "test@example.com", "Account created successfully."));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.message").value("Account created successfully."));
    }

    @Test
    void signupRejectsDuplicateEmail() throws Exception {
        given(authService.signUp(any()))
                .willThrow(new DuplicateEmailException("An account with this email already exists"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    @Test
    void signupReturnsServiceUnavailableWhenMongoDbIsDown() throws Exception {
        given(authService.signUp(any()))
                .willThrow(new DataAccessResourceFailureException("MongoDB is unavailable"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("MongoDB connection is unavailable. Check MONGODB_URI or MONGODB_PASSWORD."));
    }
}

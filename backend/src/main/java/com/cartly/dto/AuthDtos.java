package com.cartly.dto;

import com.cartly.entity.UserRole;
import com.cartly.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Valid email is required")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            @NotBlank(message = "Full name is required")
            String fullName,

            @NotNull(message = "Role is required")
            UserRole role
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record RefreshTokenRequest(
            @NotBlank(message = "Refresh token is required")
            String refreshToken
    ) {}

    public record UserDto(
            Long id,
            String email,
            String fullName,
            UserRole role,
            UserStatus status,
            LocalDateTime createdAt
    ) {}

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            UserDto user
    ) {}
}

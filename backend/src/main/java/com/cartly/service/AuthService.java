package com.cartly.service;

import com.cartly.config.JwtUtils;
import com.cartly.dto.AuthDtos;
import com.cartly.entity.User;
import com.cartly.entity.UserRole;
import com.cartly.entity.UserStatus;
import com.cartly.exception.BadRequestException;
import com.cartly.exception.ForbiddenException;
import com.cartly.exception.ResourceNotFoundException;
import com.cartly.exception.UnauthorizedException;
import com.cartly.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final ActivityLogService activityLogService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            ActivityLogService activityLogService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request, String ipAddress) {
        if (userRepository.existsByEmail(request.email().trim().toLowerCase())) {
            throw new BadRequestException("An account with this email already exists.");
        }

        if (request.role() == UserRole.ADMIN) {
            throw new ForbiddenException("Registration with ADMIN role is prohibited.");
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(
                request.email().trim().toLowerCase(),
                hashedPassword,
                request.fullName().trim(),
                request.role(),
                UserStatus.ACTIVE
        );

        User saved = userRepository.save(user);

        activityLogService.log(
                saved.getId(),
                saved.getEmail(),
                "USER_REGISTERED",
                "USER",
                saved.getId(),
                "New " + saved.getRole() + " registered: " + saved.getFullName(),
                ipAddress
        );

        String accessToken = jwtUtils.generateAccessToken(saved);
        String refreshToken = jwtUtils.generateRefreshToken(saved);

        return new AuthDtos.AuthResponse(accessToken, refreshToken, toUserDto(saved));
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request, String ipAddress) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ForbiddenException("Your account has been suspended. Please contact platform support.");
        }

        activityLogService.log(
                user.getId(),
                user.getEmail(),
                "USER_LOGGED_IN",
                "USER",
                user.getId(),
                user.getFullName() + " logged in",
                ipAddress
        );

        String accessToken = jwtUtils.generateAccessToken(user);
        String refreshToken = jwtUtils.generateRefreshToken(user);

        return new AuthDtos.AuthResponse(accessToken, refreshToken, toUserDto(user));
    }

    public AuthDtos.AuthResponse refreshToken(AuthDtos.RefreshTokenRequest request) {
        String token = request.refreshToken();
        if (!jwtUtils.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String email = jwtUtils.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ForbiddenException("Account is suspended.");
        }

        String newAccessToken = jwtUtils.generateAccessToken(user);
        String newRefreshToken = jwtUtils.generateRefreshToken(user);

        return new AuthDtos.AuthResponse(newAccessToken, newRefreshToken, toUserDto(user));
    }

    public AuthDtos.UserDto toUserDto(User user) {
        return new AuthDtos.UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}

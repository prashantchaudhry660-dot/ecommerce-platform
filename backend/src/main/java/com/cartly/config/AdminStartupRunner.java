package com.cartly.config;

import com.cartly.entity.User;
import com.cartly.entity.UserRole;
import com.cartly.entity.UserStatus;
import com.cartly.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminStartupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminStartupRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${passu.admin.email:${cartly.admin.email:admin@passu.com}}")
    private String adminEmail;

    @Value("${passu.admin.password:${cartly.admin.password:Admin@Passu2025!}}")
    private String adminPassword;

    @Value("${passu.admin.full-name:${cartly.admin.full-name:Platform Administrator}}")
    private String adminFullName;

    public AdminStartupRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByEmail(adminEmail)) {
            log.info("Bootstrapping sole initial admin user: {}", adminEmail);
            // Hash password dynamically at runtime with BCryptPasswordEncoder
            String runtimeHashedPassword = passwordEncoder.encode(adminPassword);

            User admin = new User(
                    adminEmail,
                    runtimeHashedPassword,
                    adminFullName,
                    UserRole.ADMIN,
                    UserStatus.ACTIVE
            );

            userRepository.save(admin);
            log.info("Admin user successfully initialized with runtime BCrypt hash.");
        } else {
            log.info("Admin account ({}) already exists. Skipping bootstrap.", adminEmail);
        }
    }
}

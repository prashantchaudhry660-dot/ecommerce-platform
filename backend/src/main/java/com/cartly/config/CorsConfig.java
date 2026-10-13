package com.cartly.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.frontend-url:${FRONTEND_URL:http://localhost:5173}}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        if (frontendUrl != null && !frontendUrl.isBlank()) {
            List<String> origins = new ArrayList<>(
                    Arrays.stream(frontendUrl.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .toList()
            );

            if (frontendUrl.contains("localhost:5173") && !origins.contains("http://127.0.0.1:5173")) {
                origins.add("http://127.0.0.1:5173");
            }

            if (origins.contains("*")) {
                configuration.setAllowedOriginPatterns(List.of("*"));
            } else {
                configuration.setAllowedOrigins(origins);
                configuration.setAllowedOriginPatterns(origins);
            }
        } else {
            configuration.setAllowedOriginPatterns(List.of("*"));
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

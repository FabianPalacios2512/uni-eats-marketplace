package com.remington.unieats.marketplace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(
                    "/registro",
                    "/forgot-password",
                    "/reset-password",
                    "/css/**",
                    "/js/**",
                    "/img/**",
                    "/uploads/**",
                    "/api/marketplace/**" // Permitimos ver tiendas sin iniciar sesión
                ).permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN_PLATAFORMA")
                .requestMatchers("/vendedor/**", "/api/vendedor/**").hasRole("VENDEDOR")
                .requestMatchers("/api/pedidos/crear").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout")
                .permitAll()
            );

        // ↓↓↓ AJUSTE IMPORTANTE PARA SOLUCIONAR EL ERROR 403 ↓↓↓
        http.csrf(csrf -> csrf
            .ignoringRequestMatchers("/api/**") // Deshabilita CSRF para todas las rutas de la API
        );

        return http.build();
    }
}
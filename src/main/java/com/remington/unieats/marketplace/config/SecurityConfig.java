package com.remington.unieats.marketplace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

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
                    "/api/marketplace/**", // Permitimos ver tiendas sin iniciar sesión
                    "/error/**", // Permitir páginas de error
                    "/custom-logout" // Permitir logout personalizado
                ).permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN_PLATAFORMA")
                .requestMatchers("/vendedor/**", "/api/vendedor/**").hasRole("VENDEDOR")
                .requestMatchers("/api/pedidos/crear").authenticated()
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedPage("/error/403") // Página personalizada para errores 403
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );

        // ↓↓↓ CONFIGURACIÓN CSRF PARA SOLUCIONAR ERROR 403 EN LOGOUT ↓↓↓
        http.csrf(csrf -> csrf
            .ignoringRequestMatchers("/api/**", "/logout", "/custom-logout") // Deshabilita CSRF para API y logout
        );

        return http.build();
    }
}
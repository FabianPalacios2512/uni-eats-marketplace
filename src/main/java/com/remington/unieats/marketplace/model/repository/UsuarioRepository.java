package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByCorreo(String correo);
    
    // ===== MÉTODO NUEVO AÑADIDO =====
    Optional<Usuario> findByResetPasswordToken(String token);
    // ================================
}
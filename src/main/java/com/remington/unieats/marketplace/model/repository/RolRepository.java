package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {
    // Busca un rol por su nombre, por ejemplo "ROLE_ADMIN"
    Optional<Rol> findByNombre(String nombre);
}

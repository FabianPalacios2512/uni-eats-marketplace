package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Opcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OpcionRepository extends JpaRepository<Opcion, Integer> {
    // Por ahora no necesitamos métodos personalizados aquí
}
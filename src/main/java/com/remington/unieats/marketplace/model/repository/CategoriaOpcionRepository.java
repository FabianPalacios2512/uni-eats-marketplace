package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.CategoriaOpcion;
import com.remington.unieats.marketplace.model.entity.Tienda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaOpcionRepository extends JpaRepository<CategoriaOpcion, Integer> {
    
    List<CategoriaOpcion> findByTienda(Tienda tienda);
}
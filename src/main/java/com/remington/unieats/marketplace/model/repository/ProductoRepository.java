package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    
    // Método para buscar todos los productos de una tienda específica
    List<Producto> findByTienda(Tienda tienda);
}
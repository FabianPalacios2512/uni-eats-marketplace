package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    List<Producto> findByTienda(Tienda tienda);

    // MÉTODO AÑADIDO (PARA EL ERROR 2)
    List<Producto> findByTiendaAndDisponible(Tienda tienda, boolean disponible);
}
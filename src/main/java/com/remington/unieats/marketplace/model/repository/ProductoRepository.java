package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    List<Producto> findByTienda(Tienda tienda);

    List<Producto> findByTiendaAndDisponible(Tienda tienda, boolean disponible);

    // MÉTODO AÑADIDO PARA SOLUCIONAR EL ERROR
    List<Producto> findByTienda_EstadoAndDisponible(EstadoTienda estado, boolean disponible);
}
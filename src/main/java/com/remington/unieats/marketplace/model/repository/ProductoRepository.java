package com.remington.unieats.marketplace.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    List<Producto> findByTienda(Tienda tienda);

    List<Producto> findByTiendaAndDisponible(Tienda tienda, boolean disponible);

    List<Producto> findByTienda_IdAndDisponible(Integer tiendaId, boolean disponible);

    // MÉTODO AÑADIDO PARA SOLUCIONAR EL ERROR
    List<Producto> findByTienda_EstadoAndDisponible(EstadoTienda estado, boolean disponible);
    
    // NUEVOS MÉTODOS PARA FILTRAR TIENDAS ABIERTAS Y BÚSQUEDA
    List<Producto> findByTienda_EstadoAndTienda_EstaAbiertaAndDisponible(EstadoTienda estado, Boolean estaAbierta, boolean disponible);
    
    List<Producto> findByTienda_IdAndTienda_EstaAbiertaAndDisponible(Integer tiendaId, Boolean estaAbierta, boolean disponible);
    
    List<Producto> findByNombreContainingIgnoreCaseAndTienda_EstadoAndTienda_EstaAbiertaAndDisponible(
        String nombre, EstadoTienda estado, Boolean estaAbierta, boolean disponible);
}
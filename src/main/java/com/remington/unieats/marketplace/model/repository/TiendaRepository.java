package com.remington.unieats.marketplace.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;

@Repository
public interface TiendaRepository extends JpaRepository<Tienda, Integer> {

    Optional<Tienda> findByVendedor(Usuario vendedor);

    List<Tienda> findByEstado(EstadoTienda estado);

    Optional<Tienda> findByIdAndEstado(Integer id, EstadoTienda estado);
    
    // NUEVO: Buscar tiendas que estén activas Y abiertas
    List<Tienda> findByEstadoAndEstaAbierta(EstadoTienda estado, Boolean estaAbierta);

    // MÉTODO AÑADIDO (PARA EL NUEVO ERROR)
    @Query("SELECT t FROM Tienda t JOIN FETCH t.vendedor")
    List<Tienda> findAllWithVendedor();
}
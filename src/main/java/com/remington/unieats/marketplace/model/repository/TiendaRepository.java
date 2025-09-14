package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario; // IMPORTAR
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional; // IMPORTAR

public interface TiendaRepository extends JpaRepository<Tienda, Integer> {

    List<Tienda> findByEstado(EstadoTienda estado);

    @Query("SELECT t FROM Tienda t JOIN FETCH t.vendedor")
    List<Tienda> findAllWithVendedor();

    // ===== MÉTODO NUEVO AÑADIDO =====
    Optional<Tienda> findByVendedor(Usuario vendedor);
}
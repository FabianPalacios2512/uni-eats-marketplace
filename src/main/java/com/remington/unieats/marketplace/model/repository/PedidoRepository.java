package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Pedido;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario; // Importar
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    List<Pedido> findByTiendaOrderByFechaCreacionDesc(Tienda tienda);
    
    // --- MÉTODO AÑADIDO ---
    List<Pedido> findByCompradorOrderByFechaCreacionDesc(Usuario comprador);
}
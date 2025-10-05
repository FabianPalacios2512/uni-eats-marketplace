package com.remington.unieats.marketplace.model.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository; // Importar
import org.springframework.stereotype.Repository;

import com.remington.unieats.marketplace.model.entity.Pedido;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.enums.EstadoPedido;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    List<Pedido> findByTiendaOrderByFechaCreacionDesc(Tienda tienda);
    
    // --- MÉTODO AÑADIDO ---
    List<Pedido> findByCompradorOrderByFechaCreacionDesc(Usuario comprador);
    
    // Métodos para estadísticas del dashboard
    List<Pedido> findByTiendaAndFechaCreacionBetween(Tienda tienda, LocalDateTime inicio, LocalDateTime fin);
    List<Pedido> findByTiendaAndEstado(Tienda tienda, EstadoPedido estado);
}
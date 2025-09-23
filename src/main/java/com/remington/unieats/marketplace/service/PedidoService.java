package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.PedidoCompradorDTO;
import com.remington.unieats.marketplace.dto.PedidoDTO;
import com.remington.unieats.marketplace.model.entity.Pedido;
import com.remington.unieats.marketplace.model.entity.Usuario;
import java.util.List;
import com.remington.unieats.marketplace.model.enums.EstadoPedido;


public interface PedidoService {
    Pedido crearPedido(PedidoDTO pedidoDTO, Usuario comprador);
    
    List<PedidoCompradorDTO> getMisPedidos(Usuario comprador);
    
    Pedido actualizarEstadoPedido(Integer pedidoId, EstadoPedido nuevoEstado);


}
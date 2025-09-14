package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.PedidoDTO;
import com.remington.unieats.marketplace.model.entity.Pedido;
import com.remington.unieats.marketplace.model.entity.Usuario;

public interface PedidoService {
    Pedido crearPedido(PedidoDTO pedidoDTO, Usuario comprador);
}
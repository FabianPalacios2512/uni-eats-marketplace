package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.PedidoDTO;
import com.remington.unieats.marketplace.model.entity.*;
import com.remington.unieats.marketplace.model.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PedidoServiceImpl implements PedidoService {

    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private TiendaRepository tiendaRepository;
    @Autowired private UsuarioRepository usuarioRepository; // Asumimos que lo tienes

    @Override
    @Transactional // Asegura que toda la operación se complete o se revierta
    public Pedido crearPedido(PedidoDTO pedidoDTO, Usuario comprador) {
        Tienda tienda = tiendaRepository.findById(pedidoDTO.getTiendaId())
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));

        Pedido nuevoPedido = new Pedido();
        nuevoPedido.setComprador(comprador);
        nuevoPedido.setTienda(tienda);

        List<DetallePedido> detalles = new ArrayList<>();
        BigDecimal totalPedido = BigDecimal.ZERO;

        for (PedidoDTO.ItemPedidoDTO itemDTO : pedidoDTO.getItems()) {
            Producto producto = productoRepository.findById(itemDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + itemDTO.getId()));

            DetallePedido detalle = new DetallePedido();
            detalle.setProducto(producto);
            detalle.setCantidad(itemDTO.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setPedido(nuevoPedido);
            detalles.add(detalle);

            totalPedido = totalPedido.add(producto.getPrecio().multiply(new BigDecimal(itemDTO.getCantidad())));
        }

        nuevoPedido.setDetalles(detalles);
        nuevoPedido.setTotal(totalPedido);

        return pedidoRepository.save(nuevoPedido);
    }
}
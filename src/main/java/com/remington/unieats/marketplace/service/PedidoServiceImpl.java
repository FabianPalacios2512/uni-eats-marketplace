package com.remington.unieats.marketplace.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.remington.unieats.marketplace.dto.PedidoCompradorDTO;
import com.remington.unieats.marketplace.dto.PedidoDTO;
import com.remington.unieats.marketplace.model.entity.DetallePedido;
import com.remington.unieats.marketplace.model.entity.Opcion;
import com.remington.unieats.marketplace.model.entity.Pedido;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.enums.EstadoPedido;
import com.remington.unieats.marketplace.model.repository.OpcionRepository;
import com.remington.unieats.marketplace.model.repository.PedidoRepository;
import com.remington.unieats.marketplace.model.repository.ProductoRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;

@Service
public class PedidoServiceImpl implements PedidoService {

    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private TiendaRepository tiendaRepository;
    @Autowired private OpcionRepository opcionRepository; // <-- Asegúrate de tenerlo

    @Override
    @Transactional
    public Pedido crearPedido(PedidoDTO pedidoDTO, Usuario comprador) {
        Tienda tienda = tiendaRepository.findById(pedidoDTO.getTiendaId())
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));

        Pedido nuevoPedido = new Pedido();
        nuevoPedido.setComprador(comprador);
        nuevoPedido.setTienda(tienda);
        
        // 🚛 Asignar campos de entrega y pago
        nuevoPedido.setTipoEntrega(pedidoDTO.getTipoEntrega() != null ? pedidoDTO.getTipoEntrega() : "domicilio");
        nuevoPedido.setTipoPago(pedidoDTO.getTipoPago() != null ? pedidoDTO.getTipoPago() : "efectivo");
        nuevoPedido.setNotasGenerales(pedidoDTO.getNotasGenerales());
        nuevoPedido.setNotasDomicilio(pedidoDTO.getNotasDomicilio());

        List<DetallePedido> detalles = new ArrayList<>();
        BigDecimal totalPedido = BigDecimal.ZERO;

        for (PedidoDTO.ItemPedidoDTO itemDTO : pedidoDTO.getItems()) {
            Producto producto = productoRepository.findById(itemDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + itemDTO.getId()));

            // --- LÓGICA DE CÁLCULO DE PRECIO ACTUALIZADA ---
            BigDecimal precioDeOpciones = BigDecimal.ZERO;
            Set<Opcion> opcionesSeleccionadas = new HashSet<>();
            if (itemDTO.getOpcionesIds() != null && !itemDTO.getOpcionesIds().isEmpty()) {
                List<Opcion> opciones = opcionRepository.findAllById(itemDTO.getOpcionesIds());
                opcionesSeleccionadas.addAll(opciones);
                for (Opcion opcion : opciones) {
                    precioDeOpciones = precioDeOpciones.add(opcion.getPrecioAdicional());
                }
            }
            
            BigDecimal precioUnitarioFinal = producto.getPrecio().add(precioDeOpciones);
            BigDecimal subtotalItem = precioUnitarioFinal.multiply(new BigDecimal(itemDTO.getCantidad()));
            totalPedido = totalPedido.add(subtotalItem);
            
            // --- GUARDADO DEL DETALLE CON LA NUEVA INFORMACIÓN ---
            DetallePedido detalle = new DetallePedido();
            detalle.setProducto(producto);
            detalle.setCantidad(itemDTO.getCantidad());
            detalle.setPrecioUnitario(precioUnitarioFinal); // Guardamos el precio final unitario
            detalle.setOpcionesSeleccionadas(opcionesSeleccionadas); // Guardamos las opciones
            detalle.setPedido(nuevoPedido);
            detalles.add(detalle);
        }

        nuevoPedido.setDetalles(detalles);
        nuevoPedido.setTotal(totalPedido); // Guardamos el total correcto

        return pedidoRepository.save(nuevoPedido);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoCompradorDTO> getMisPedidos(Usuario comprador) {
        return pedidoRepository.findByCompradorOrderByFechaCreacionDesc(comprador)
            .stream()
            .map(this::convertirAPedidoCompradorDTO)
            .collect(Collectors.toList());
    }

    private PedidoCompradorDTO convertirAPedidoCompradorDTO(Pedido pedido) {
        PedidoCompradorDTO dto = new PedidoCompradorDTO();
        dto.setId(pedido.getId());
        dto.setFechaCreacion(pedido.getFechaCreacion());
        dto.setEstado(pedido.getEstado().name());
        dto.setTotal(pedido.getTotal());
        dto.setNombreTienda(pedido.getTienda().getNombre());

        List<String> items = pedido.getDetalles().stream()
            .map(detalle -> {
                String itemBase = detalle.getCantidad() + "x " + detalle.getProducto().getNombre();
                String opciones = detalle.getOpcionesSeleccionadas().stream()
                    .map(opcion -> "+ " + opcion.getNombre())
                    .collect(Collectors.joining(", "));
                return opciones.isEmpty() ? itemBase : itemBase + " (" + opciones + ")";
            })
            .collect(Collectors.toList());
        dto.setItems(items);

        return dto;

        
    }

    @Override
    @Transactional
    public Pedido actualizarEstadoPedido(Integer pedidoId, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
            .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + pedidoId));

        // Aquí se podrían añadir validaciones de negocio en el futuro
        // (ej. no se puede cancelar un pedido que ya está listo)

        pedido.setEstado(nuevoEstado);
        return pedidoRepository.save(pedido);
    }
}
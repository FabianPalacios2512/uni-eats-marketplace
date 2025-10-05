package com.remington.unieats.marketplace.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.remington.unieats.marketplace.dto.CategoriaOpcionCreacionDTO;
import com.remington.unieats.marketplace.dto.HorarioUpdateDTO;
import com.remington.unieats.marketplace.dto.OpcionCreacionDTO;
import com.remington.unieats.marketplace.dto.PedidoVendedorDTO;
import com.remington.unieats.marketplace.dto.TiendaCreacionDTO;
import com.remington.unieats.marketplace.dto.TiendaUpdateDTO;
import com.remington.unieats.marketplace.model.entity.CategoriaOpcion;
import com.remington.unieats.marketplace.model.entity.DetallePedido;
import com.remington.unieats.marketplace.model.entity.Horario;
import com.remington.unieats.marketplace.model.entity.Opcion;
import com.remington.unieats.marketplace.model.entity.Pedido;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.enums.DiaSemana;
import com.remington.unieats.marketplace.model.repository.CategoriaOpcionRepository;
import com.remington.unieats.marketplace.model.repository.HorarioRepository;
import com.remington.unieats.marketplace.model.repository.PedidoRepository;
import com.remington.unieats.marketplace.model.repository.ProductoRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;

@Service
public class VendedorServiceImpl implements VendedorService {

    @Autowired private TiendaRepository tiendaRepository;
    @Autowired private HorarioRepository horarioRepository;
    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaOpcionRepository categoriaOpcionRepository;
    @Autowired private LocalImageService localImageService;

    @Override
    public Optional<Tienda> findTiendaByVendedor(Usuario vendedor) {
        return tiendaRepository.findByVendedor(vendedor);
    }

    @Override
    @Transactional
    public Tienda crearTienda(TiendaCreacionDTO tiendaDTO, Usuario vendedor, MultipartFile logoFile) {
        if (tiendaRepository.findByVendedor(vendedor).isPresent()) {
            throw new IllegalStateException("Este vendedor ya tiene una tienda registrada.");
        }
        Tienda nuevaTienda = new Tienda();
        nuevaTienda.setNombre(tiendaDTO.getNombre());
        nuevaTienda.setNit(tiendaDTO.getNit());
        nuevaTienda.setDescripcion(tiendaDTO.getDescripcion());
        nuevaTienda.setVendedor(vendedor);

        if (logoFile != null && !logoFile.isEmpty()) {
            try {
                String logoUrl = localImageService.uploadImage(logoFile, "logos");
                nuevaTienda.setLogoUrl(logoUrl);
            } catch (Exception e) {
                throw new RuntimeException("Error al subir logo: " + e.getMessage(), e);
            }
        }
        
        Tienda tiendaGuardada = tiendaRepository.save(nuevaTienda);

        for (DiaSemana dia : DiaSemana.values()) {
            Horario horario = new Horario();
            horario.setDia(dia);
            horario.setAbierto(false);
            horario.setTienda(tiendaGuardada);
            horarioRepository.save(horario);
        }
        return tiendaGuardada;
    }

    @Override
    @Transactional
    public Tienda actualizarTienda(Tienda tienda, TiendaUpdateDTO updateDTO, MultipartFile logoFile) {
        tienda.setNombre(updateDTO.getNombre());
        tienda.setDescripcion(updateDTO.getDescripcion());

        if (logoFile != null && !logoFile.isEmpty()) {
            try {
                // Eliminar logo anterior si existe
                if (tienda.getLogoUrl() != null && !tienda.getLogoUrl().isEmpty()) {
                    localImageService.deleteImage(tienda.getLogoUrl());
                }
                String logoUrl = localImageService.uploadImage(logoFile, "logos");
                tienda.setLogoUrl(logoUrl);
            } catch (Exception e) {
                throw new RuntimeException("Error al actualizar logo: " + e.getMessage(), e);
            }
        }
        return tiendaRepository.save(tienda);
    }

    @Override
    public List<Horario> findHorariosByTienda(Tienda tienda) {
        return horarioRepository.findByTienda(tienda);
    }

    @Override
    @Transactional
    public void actualizarHorarios(Tienda tienda, List<HorarioUpdateDTO> horariosDTO) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        for (HorarioUpdateDTO dto : horariosDTO) {
            Horario horario = horarioRepository.findByTiendaAndDia(tienda, dto.getDia())
                    .orElseThrow(() -> new IllegalStateException("Horario no encontrado para el día: " + dto.getDia()));
            
            horario.setAbierto(dto.isAbierto());
            if (dto.isAbierto()) {
                horario.setHoraApertura(LocalTime.parse(dto.getHoraApertura(), formatter));
                horario.setHoraCierre(LocalTime.parse(dto.getHoraCierre(), formatter));
            } else {
                horario.setHoraApertura(null);
                horario.setHoraCierre(null);
            }
            horarioRepository.save(horario);
        }
    }

    @Override
    public List<PedidoVendedorDTO> getPedidosDeLaTienda(Tienda tienda) {
        List<Pedido> pedidos = pedidoRepository.findByTiendaOrderByFechaCreacionDesc(tienda);
        return pedidos.stream()
                .map(this::convertirAPedidoVendedorDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<CategoriaOpcion> getCategoriasDeOpciones(Tienda tienda) {
        return categoriaOpcionRepository.findByTienda(tienda);
    }

    @Override
    @Transactional
    public CategoriaOpcion crearCategoriaConOpciones(CategoriaOpcionCreacionDTO dto, Tienda tienda) {
        CategoriaOpcion nuevaCategoria = new CategoriaOpcion();
        nuevaCategoria.setNombre(dto.getNombre());
        nuevaCategoria.setTienda(tienda);

        List<Opcion> opciones = new ArrayList<>();
        if (dto.getOpciones() != null) {
            for (OpcionCreacionDTO opcionDTO : dto.getOpciones()) {
                Opcion nuevaOpcion = new Opcion();
                nuevaOpcion.setNombre(opcionDTO.getNombre());
                nuevaOpcion.setPrecioAdicional(opcionDTO.getPrecioAdicional());
                nuevaOpcion.setCategoria(nuevaCategoria);
                opciones.add(nuevaOpcion);
            }
        }
        nuevaCategoria.setOpciones(opciones);
        
        return categoriaOpcionRepository.save(nuevaCategoria);
    }

    @Override
    @Transactional
    public void asignarCategoriaAProducto(Integer productoId, Integer categoriaId) {
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        CategoriaOpcion categoria = categoriaOpcionRepository.findById(categoriaId)
            .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        if (!producto.getTienda().getId().equals(categoria.getTienda().getId())) {
            throw new IllegalStateException("La categoría no pertenece a la tienda de este producto.");
        }

        producto.getCategoriasDeOpciones().add(categoria);
        productoRepository.save(producto);
    }
    
    private PedidoVendedorDTO convertirAPedidoVendedorDTO(Pedido pedido) {
        PedidoVendedorDTO dto = new PedidoVendedorDTO();
        dto.setId(pedido.getId());
        dto.setFechaCreacion(pedido.getFechaCreacion());
        dto.setEstado(pedido.getEstado().name());
        dto.setTotal(pedido.getTotal());
        dto.setNombreComprador(pedido.getComprador().getNombre() + " " + pedido.getComprador().getApellido());

        // Mapear nuevos campos de entrega y pago
        dto.setTipoEntrega(pedido.getTipoEntrega());
        dto.setTipoPago(pedido.getTipoPago());
        dto.setNotasGenerales(pedido.getNotasGenerales());
        dto.setNotasDomicilio(pedido.getNotasDomicilio());

        List<PedidoVendedorDTO.DetallePedidoVendedorDTO> detallesDTO = pedido.getDetalles().stream()
                .map(this::convertirADetalleDTO)
                .collect(Collectors.toList());
        dto.setDetalles(detallesDTO);
        
        return dto;
    }

    private PedidoVendedorDTO.DetallePedidoVendedorDTO convertirADetalleDTO(DetallePedido detalle) {
        PedidoVendedorDTO.DetallePedidoVendedorDTO dto = new PedidoVendedorDTO.DetallePedidoVendedorDTO();
        dto.setNombreProducto(detalle.getProducto().getNombre());
        dto.setCantidad(detalle.getCantidad());
        dto.setPrecioUnitario(detalle.getPrecioUnitario());
        
        // Mapear opciones seleccionadas
        if (detalle.getOpcionesSeleccionadas() != null && !detalle.getOpcionesSeleccionadas().isEmpty()) {
            String opciones = detalle.getOpcionesSeleccionadas().stream()
                    .map(opcion -> opcion.getNombre())
                    .collect(Collectors.joining(", "));
            dto.setOpcionesSeleccionadas(opciones);
        }
        
        return dto;
    }

    @Override
    @Transactional
    public void actualizarEstadoTienda(Integer tiendaId, Boolean estaAbierta) {
        Tienda tienda = tiendaRepository.findById(tiendaId)
            .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));
        tienda.setEstaAbierta(estaAbierta);
        tiendaRepository.save(tienda);
    }

    @Override
    public Double calcularVentasHoy(Tienda tienda) {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioDelDia = hoy.atStartOfDay();
        LocalDateTime finDelDia = hoy.atTime(23, 59, 59);
        
        List<Pedido> pedidosHoy = pedidoRepository.findByTiendaAndFechaCreacionBetween(
            tienda, inicioDelDia, finDelDia);
        
        return pedidosHoy.stream()
            .filter(p -> p.getEstado().name().equals("COMPLETADO"))
            .mapToDouble(p -> p.getTotal().doubleValue())
            .sum();
    }

    @Override
    public Integer contarPedidosNuevos(Tienda tienda) {
        return pedidoRepository.findByTiendaAndEstado(tienda, 
            com.remington.unieats.marketplace.model.enums.EstadoPedido.PENDIENTE).size();
    }

    @Override
    public Integer contarPedidosCompletadosHoy(Tienda tienda) {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioDelDia = hoy.atStartOfDay();
        LocalDateTime finDelDia = hoy.atTime(23, 59, 59);
        
        List<Pedido> pedidosHoy = pedidoRepository.findByTiendaAndFechaCreacionBetween(
            tienda, inicioDelDia, finDelDia);
        
        return (int) pedidosHoy.stream()
            .filter(p -> p.getEstado().name().equals("COMPLETADO"))
            .count();
    }
}
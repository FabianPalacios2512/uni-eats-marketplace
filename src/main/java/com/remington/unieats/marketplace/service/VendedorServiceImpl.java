package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.HorarioUpdateDTO;
import com.remington.unieats.marketplace.dto.PedidoVendedorDTO;
import com.remington.unieats.marketplace.dto.TiendaCreacionDTO;
import com.remington.unieats.marketplace.dto.TiendaUpdateDTO;
import com.remington.unieats.marketplace.model.entity.*;
import com.remington.unieats.marketplace.model.enums.DiaSemana;
import com.remington.unieats.marketplace.model.repository.HorarioRepository;
import com.remington.unieats.marketplace.model.repository.PedidoRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VendedorServiceImpl implements VendedorService {

    @Autowired private TiendaRepository tiendaRepository;
    @Autowired private HorarioRepository horarioRepository;
    @Autowired private PedidoRepository pedidoRepository;

    private final Path rootLocation = Paths.get("uploads");

    @Override
    public Optional<Tienda> findTiendaByVendedor(Usuario vendedor) {
        return tiendaRepository.findByVendedor(vendedor);
    }

    @Override
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
            String logoUrl = storeFile(logoFile);
            nuevaTienda.setLogoUrl(logoUrl);
        }
        
        Tienda tiendaGuardada = tiendaRepository.save(nuevaTienda);

        // Crear horarios por defecto
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
    public Tienda actualizarTienda(Tienda tienda, TiendaUpdateDTO updateDTO, MultipartFile logoFile) {
        tienda.setNombre(updateDTO.getNombre());
        tienda.setDescripcion(updateDTO.getDescripcion());

        if (logoFile != null && !logoFile.isEmpty()) {
            String logoUrl = storeFile(logoFile);
            tienda.setLogoUrl(logoUrl);
        }
        return tiendaRepository.save(tienda);
    }

    @Override
    public List<Horario> findHorariosByTienda(Tienda tienda) {
        return horarioRepository.findByTienda(tienda);
    }

    @Override
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

    private String storeFile(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("No se puede guardar un archivo vacío.");
            }
            Files.createDirectories(rootLocation);
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), this.rootLocation.resolve(filename));
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar el archivo.", e);
        }
    }

    private PedidoVendedorDTO convertirAPedidoVendedorDTO(Pedido pedido) {
        PedidoVendedorDTO dto = new PedidoVendedorDTO();
        dto.setId(pedido.getId());
        dto.setFechaCreacion(pedido.getFechaCreacion());
        dto.setEstado(pedido.getEstado().name());
        dto.setTotal(pedido.getTotal());
        dto.setNombreComprador(pedido.getComprador().getNombre() + " " + pedido.getComprador().getApellido());

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
        return dto;
    }
}
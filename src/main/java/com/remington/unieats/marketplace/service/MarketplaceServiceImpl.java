package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.ProductoPublicoDTO;
import com.remington.unieats.marketplace.dto.TiendaDetallePublicoDTO;
import com.remington.unieats.marketplace.dto.TiendaPublicaDTO;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import com.remington.unieats.marketplace.model.repository.ProductoRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MarketplaceServiceImpl implements MarketplaceService {

    @Autowired
    private TiendaRepository tiendaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Override
    public List<TiendaPublicaDTO> getTiendasActivas() {
        return tiendaRepository.findByEstado(EstadoTienda.ACTIVA)
                .stream()
                .map(this::convertirATiendaPublicaDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<TiendaDetallePublicoDTO> getDetallesTienda(Integer id) {
        Optional<Tienda> tiendaOpt = tiendaRepository.findByIdAndEstado(id, EstadoTienda.ACTIVA);

        if (tiendaOpt.isEmpty()) {
            return Optional.empty();
        }

        Tienda tienda = tiendaOpt.get();
        List<Producto> productos = productoRepository.findByTiendaAndDisponible(tienda, true);

        TiendaDetallePublicoDTO dto = new TiendaDetallePublicoDTO();
        dto.setId(tienda.getId());
        dto.setNombre(tienda.getNombre());
        dto.setDescripcion(tienda.getDescripcion());
        dto.setLogoUrl(tienda.getLogoUrl());
        dto.setProductos(productos.stream().map(this::convertirAProductoPublicoDTO).collect(Collectors.toList()));
        
        return Optional.of(dto);
    }

    private TiendaPublicaDTO convertirATiendaPublicaDTO(Tienda tienda) {
        TiendaPublicaDTO dto = new TiendaPublicaDTO();
        dto.setId(tienda.getId());
        dto.setNombre(tienda.getNombre());
        dto.setDescripcion(tienda.getDescripcion());
        dto.setLogoUrl(tienda.getLogoUrl());
        return dto;
    }

    private ProductoPublicoDTO convertirAProductoPublicoDTO(Producto producto) {
        ProductoPublicoDTO dto = new ProductoPublicoDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setPrecio(producto.getPrecio());
        dto.setImagenUrl(producto.getImagenUrl());
        return dto;
    }
}
package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.*;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import com.remington.unieats.marketplace.model.repository.ProductoRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional(readOnly = true)
    public List<TiendaPublicaDTO> getTiendasActivas() {
        return tiendaRepository.findByEstado(EstadoTienda.ACTIVA)
                .stream()
                .map(this::convertirATiendaPublicaDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
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

    @Override
    @Transactional(readOnly = true)
    public List<ProductoPublicoDTO> getProductosPopulares() {
        return productoRepository.findByTienda_EstadoAndDisponible(EstadoTienda.ACTIVA, true)
                .stream()
                .map(this::convertirAProductoPublicoDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProductoDetalleDTO> getDetalleProducto(Integer id) {
        Optional<Producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return Optional.empty();
        }
        Producto producto = productoOpt.get();

        ProductoDetalleDTO dto = new ProductoDetalleDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setPrecio(producto.getPrecio());
        dto.setImagenUrl(producto.getImagenUrl());

        // Asignar la información de la tienda
        ProductoPublicoDTO.TiendaSimpleDTO tiendaDTO = new ProductoPublicoDTO.TiendaSimpleDTO();
        tiendaDTO.setId(producto.getTienda().getId());
        tiendaDTO.setNombre(producto.getTienda().getNombre());
        dto.setTienda(tiendaDTO);

        // Mapear las categorías y sus opciones
        List<CategoriaOpcionDTO> categoriasDTO = producto.getCategoriasDeOpciones().stream()
            .map(categoria -> {
                CategoriaOpcionDTO catDTO = new CategoriaOpcionDTO();
                catDTO.setId(categoria.getId());
                catDTO.setNombre(categoria.getNombre());
                
                List<OpcionDTO> opcionesDTO = categoria.getOpciones().stream()
                    .map(opcion -> {
                        OpcionDTO opDTO = new OpcionDTO();
                        opDTO.setId(opcion.getId());
                        opDTO.setNombre(opcion.getNombre());
                        opDTO.setPrecioAdicional(opcion.getPrecioAdicional());
                        return opDTO;
                    }).collect(Collectors.toList());
                
                catDTO.setOpciones(opcionesDTO);
                return catDTO;
            }).collect(Collectors.toList());
        
        dto.setCategoriasDeOpciones(categoriasDTO);

        return Optional.of(dto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoPublicoDTO> getProductosDeTienda(Integer tiendaId) {
        return productoRepository.findByTienda_IdAndDisponible(tiendaId, true)
                .stream()
                .map(this::convertirAProductoPublicoDTO)
                .collect(Collectors.toList());
    }

    // --- Métodos privados de ayuda (Helpers) ---

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
        
        ProductoPublicoDTO.TiendaSimpleDTO tiendaDTO = new ProductoPublicoDTO.TiendaSimpleDTO();
        tiendaDTO.setId(producto.getTienda().getId());
        tiendaDTO.setNombre(producto.getTienda().getNombre());
        dto.setTienda(tiendaDTO);
        
        return dto;
    }
}
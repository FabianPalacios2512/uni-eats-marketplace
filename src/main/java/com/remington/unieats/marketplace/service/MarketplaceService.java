package com.remington.unieats.marketplace.service;

import java.util.List; // Importar
import java.util.Optional;

import com.remington.unieats.marketplace.dto.ProductoDetalleDTO;
import com.remington.unieats.marketplace.dto.ProductoPublicoDTO; // <-- Importar
import com.remington.unieats.marketplace.dto.TiendaDetallePublicoDTO;
import com.remington.unieats.marketplace.dto.TiendaPublicaDTO;

public interface MarketplaceService {
    List<TiendaPublicaDTO> getTiendasActivas();
    Optional<TiendaDetallePublicoDTO> getDetallesTienda(Integer id);
    
    // MÉTODO AÑADIDO
    List<ProductoPublicoDTO> getProductosPopulares();
    List<ProductoPublicoDTO> getProductosDeTienda(Integer tiendaId);
    Optional<ProductoDetalleDTO> getDetalleProducto(Integer id);
    
    // NUEVOS MÉTODOS PARA BÚSQUEDA
    List<ProductoPublicoDTO> buscarProductos(String termino);
}
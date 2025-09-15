package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.ProductoPublicoDTO; // Importar
import com.remington.unieats.marketplace.dto.TiendaDetallePublicoDTO;
import com.remington.unieats.marketplace.dto.TiendaPublicaDTO;
import com.remington.unieats.marketplace.dto.ProductoDetalleDTO; // <-- Importar

import java.util.List;
import java.util.Optional;

public interface MarketplaceService {
    List<TiendaPublicaDTO> getTiendasActivas();
    Optional<TiendaDetallePublicoDTO> getDetallesTienda(Integer id);
    
    // MÉTODO AÑADIDO
    List<ProductoPublicoDTO> getProductosPopulares();
    Optional<ProductoDetalleDTO> getDetalleProducto(Integer id);
}
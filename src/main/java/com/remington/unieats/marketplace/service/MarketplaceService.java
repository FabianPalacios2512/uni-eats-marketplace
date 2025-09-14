package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.TiendaDetallePublicoDTO;
import com.remington.unieats.marketplace.dto.TiendaPublicaDTO;

import java.util.List;
import java.util.Optional;

public interface MarketplaceService {

    /**
     * Devuelve una lista de todas las tiendas que están en estado ACTIVA.
     * @return Lista de DTOs para la vista pública.
     */
    List<TiendaPublicaDTO> getTiendasActivas();

    /**
     * Busca los detalles completos de una tienda por su ID, incluyendo sus productos.
     * @param id El ID de la tienda.
     * @return Un Optional con el DTO de detalles si la tienda existe y está activa, o un Optional vacío.
     */
    Optional<TiendaDetallePublicoDTO> getDetallesTienda(Integer id);
}
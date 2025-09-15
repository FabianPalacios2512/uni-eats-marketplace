package com.remington.unieats.marketplace.controller;

import com.remington.unieats.marketplace.dto.ProductoPublicoDTO;
import com.remington.unieats.marketplace.dto.TiendaDetallePublicoDTO;
import com.remington.unieats.marketplace.dto.TiendaPublicaDTO;
import com.remington.unieats.marketplace.service.MarketplaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.remington.unieats.marketplace.dto.ProductoDetalleDTO; // <-- Nuevo DTO


import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    @Autowired
    private MarketplaceService marketplaceService;

    @GetMapping("/tiendas")
    public ResponseEntity<List<TiendaPublicaDTO>> listarTiendasActivas() {
        List<TiendaPublicaDTO> tiendas = marketplaceService.getTiendasActivas();
        return ResponseEntity.ok(tiendas);
    }

    @GetMapping("/tiendas/{id}")
    public ResponseEntity<TiendaDetallePublicoDTO> obtenerDetallesTienda(@PathVariable Integer id) {
        return marketplaceService.getDetallesTienda(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/productos")
    public ResponseEntity<List<ProductoPublicoDTO>> listarProductosPopulares() {
        List<ProductoPublicoDTO> productos = marketplaceService.getProductosPopulares();
        return ResponseEntity.ok(productos);
    }

      @GetMapping("/productos/{id}")
    public ResponseEntity<ProductoDetalleDTO> obtenerDetalleProducto(@PathVariable Integer id) {
        return marketplaceService.getDetalleProducto(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

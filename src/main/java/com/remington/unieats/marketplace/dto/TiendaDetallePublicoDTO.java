package com.remington.unieats.marketplace.dto;

import java.util.List;

public class TiendaDetallePublicoDTO {
    private Integer id;
    private String nombre;
    private String descripcion;
    private String logoUrl;
    private List<ProductoPublicoDTO> productos;

    // --- Getters y Setters ---

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public List<ProductoPublicoDTO> getProductos() {
        return productos;
    }

    public void setProductos(List<ProductoPublicoDTO> productos) {
        this.productos = productos;
    }
}
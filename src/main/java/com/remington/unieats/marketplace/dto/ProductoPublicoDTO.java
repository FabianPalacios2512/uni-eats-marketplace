package com.remington.unieats.marketplace.dto;

import java.math.BigDecimal;

public class ProductoPublicoDTO {
    private Integer id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private String imagenUrl;
    private String clasificacion; // 🍔 CAMPO AÑADIDO PARA FILTRADO POR CATEGORÍA
    private TiendaSimpleDTO tienda;

    // Clase anidada simple para la tienda
    public static class TiendaSimpleDTO {
        private Integer id;
        private String nombre;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
    }

    // --- Getters y Setters ---
    
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }
    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public String getClasificacion() { return clasificacion; } // 🍔 GETTER PARA CLASIFICACIÓN
    public void setClasificacion(String clasificacion) { this.clasificacion = clasificacion; } // 🍔 SETTER PARA CLASIFICACIÓN
    public TiendaSimpleDTO getTienda() { return tienda; } // <-- GETTER AÑADIDO
    public void setTienda(TiendaSimpleDTO tienda) { this.tienda = tienda; } // <-- SETTER AÑADIDO
}
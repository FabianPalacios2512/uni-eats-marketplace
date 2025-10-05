package com.remington.unieats.marketplace.dto;

import java.math.BigDecimal;

import com.remington.unieats.marketplace.model.enums.ClasificacionProducto;

import jakarta.validation.constraints.NotNull;

public class ProductoDTO {

    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Boolean disponible;
    
    // NUEVO: Clasificación del producto (OBLIGATORIO)
    @NotNull(message = "La clasificación del producto es obligatoria")
    private ClasificacionProducto clasificacion;

    // Getters y Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }
    public Boolean getDisponible() { return disponible; }
    public void setDisponible(Boolean disponible) { this.disponible = disponible; }
    
    // NUEVO: Getters y setters para clasificación
    public ClasificacionProducto getClasificacion() { return clasificacion; }
    public void setClasificacion(ClasificacionProducto clasificacion) { this.clasificacion = clasificacion; }
}
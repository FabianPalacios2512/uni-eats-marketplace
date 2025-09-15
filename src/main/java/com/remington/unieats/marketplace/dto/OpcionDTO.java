package com.remington.unieats.marketplace.dto;

import java.math.BigDecimal;

public class OpcionDTO {
    private Integer id;
    private String nombre; // "Salsa de Ajo"
    private BigDecimal precioAdicional;



    
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
    public BigDecimal getPrecioAdicional() {
        return precioAdicional;
    }
    public void setPrecioAdicional(BigDecimal precioAdicional) {
        this.precioAdicional = precioAdicional;
    }
    
    // Getters y Setters...
    
}
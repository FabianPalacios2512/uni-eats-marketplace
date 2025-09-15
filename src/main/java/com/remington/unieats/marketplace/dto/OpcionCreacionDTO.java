package com.remington.unieats.marketplace.dto;

import java.math.BigDecimal;

public class OpcionCreacionDTO {

    private String nombre; // "Salsa de Ajo"
    private BigDecimal precioAdicional;

    // Getters y Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public BigDecimal getPrecioAdicional() { return precioAdicional; }
    public void setPrecioAdicional(BigDecimal precioAdicional) { this.precioAdicional = precioAdicional; }
}
package com.remington.unieats.marketplace.dto;

import java.util.List;

public class CategoriaOpcionCreacionDTO {

    private String nombre; // "Salsas", "Adiciones"
    private List<OpcionCreacionDTO> opciones;

    // Getters y Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public List<OpcionCreacionDTO> getOpciones() { return opciones; }
    public void setOpciones(List<OpcionCreacionDTO> opciones) { this.opciones = opciones; }
}
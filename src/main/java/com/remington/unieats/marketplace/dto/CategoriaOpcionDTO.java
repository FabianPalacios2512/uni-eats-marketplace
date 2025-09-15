package com.remington.unieats.marketplace.dto;

import java.util.List;

public class CategoriaOpcionDTO {
    private Integer id;
    private String nombre;
    private List<OpcionDTO> opciones;

    // --- Getters y Setters ---

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public List<OpcionDTO> getOpciones() { return opciones; }
    public void setOpciones(List<OpcionDTO> opciones) { this.opciones = opciones; }
}
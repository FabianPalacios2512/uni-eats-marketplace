package com.remington.unieats.marketplace.dto;

import com.remington.unieats.marketplace.dto.ProductoPublicoDTO.TiendaSimpleDTO;
import java.math.BigDecimal;
import java.util.List;

public class ProductoDetalleDTO {
    
    private Integer id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private String imagenUrl;
    private TiendaSimpleDTO tienda;
    private List<CategoriaOpcionDTO> categoriasDeOpciones;

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
    public TiendaSimpleDTO getTienda() { return tienda; }
    public void setTienda(TiendaSimpleDTO tienda) { this.tienda = tienda; }
    public List<CategoriaOpcionDTO> getCategoriasDeOpciones() { return categoriasDeOpciones; }
    public void setCategoriasDeOpciones(List<CategoriaOpcionDTO> categoriasDeOpciones) { this.categoriasDeOpciones = categoriasDeOpciones; }
}
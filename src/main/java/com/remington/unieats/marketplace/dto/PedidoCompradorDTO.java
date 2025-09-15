package com.remington.unieats.marketplace.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PedidoCompradorDTO {

    private Integer id;
    private LocalDateTime fechaCreacion;
    private String estado;
    private BigDecimal total;
    private String nombreTienda; // <-- Diferente al DTO del vendedor
    private List<String> items; // Una lista simple de los nombres de los productos

    // Getters y Setters para todos los campos...
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public String getNombreTienda() { return nombreTienda; }
    public void setNombreTienda(String nombreTienda) { this.nombreTienda = nombreTienda; }
    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }
}
package com.remington.unieats.marketplace.dto;

import com.remington.unieats.marketplace.model.entity.Horario; // Importar
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import java.util.List;

public class DashboardVendedorDTO {

    private Tienda tienda;
    private List<Producto> productos;
    private List<Horario> horarios; // AÑADIR ESTA LÍNEA

    // Getters y Setters
    public Tienda getTienda() { return tienda; }
    public void setTienda(Tienda tienda) { this.tienda = tienda; }
    public List<Producto> getProductos() { return productos; }
    public void setProductos(List<Producto> productos) { this.productos = productos; }
    public List<Horario> getHorarios() { return horarios; } // AÑADIR GETTER Y SETTER
    public void setHorarios(List<Horario> horarios) { this.horarios = horarios; }
}
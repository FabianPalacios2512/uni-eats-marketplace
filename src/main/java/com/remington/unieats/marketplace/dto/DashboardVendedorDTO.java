package com.remington.unieats.marketplace.dto;

import java.util.List; // Importar

import com.remington.unieats.marketplace.model.entity.Horario;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;

public class DashboardVendedorDTO {

    private Tienda tienda;
    private List<Producto> productos;
    private List<Horario> horarios; // AÑADIR ESTA LÍNEA
    
    // Estadísticas para el dashboard
    private Double ventasHoy;
    private Integer pedidosNuevos;
    private Integer pedidosCompletados;

    // Getters y Setters
    public Tienda getTienda() { return tienda; }
    public void setTienda(Tienda tienda) { this.tienda = tienda; }
    public List<Producto> getProductos() { return productos; }
    public void setProductos(List<Producto> productos) { this.productos = productos; }
    public List<Horario> getHorarios() { return horarios; } // AÑADIR GETTER Y SETTER
    public void setHorarios(List<Horario> horarios) { this.horarios = horarios; }
    
    public Double getVentasHoy() { return ventasHoy; }
    public void setVentasHoy(Double ventasHoy) { this.ventasHoy = ventasHoy; }
    public Integer getPedidosNuevos() { return pedidosNuevos; }
    public void setPedidosNuevos(Integer pedidosNuevos) { this.pedidosNuevos = pedidosNuevos; }
    public Integer getPedidosCompletados() { return pedidosCompletados; }
    public void setPedidosCompletados(Integer pedidosCompletados) { this.pedidosCompletados = pedidosCompletados; }
}
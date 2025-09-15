package com.remington.unieats.marketplace.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Set; // <-- Importar Set

@Entity
@Table(name = "detalles_pedido")
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario; // Guardamos el precio CON adiciones

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // --- RELACIÓN NUEVA PARA GUARDAR LAS OPCIONES SELECCIONADAS ---
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "detalle_pedido_opciones",
        joinColumns = @JoinColumn(name = "detalle_pedido_id"),
        inverseJoinColumns = @JoinColumn(name = "opcion_id")
    )
    private Set<Opcion> opcionesSeleccionadas;

    // --- Getters y Setters ---

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    
    // --- GETTER Y SETTER NUEVOS ---
    public Set<Opcion> getOpcionesSeleccionadas() { return opcionesSeleccionadas; }
    public void setOpcionesSeleccionadas(Set<Opcion> opcionesSeleccionadas) { this.opcionesSeleccionadas = opcionesSeleccionadas; }
}
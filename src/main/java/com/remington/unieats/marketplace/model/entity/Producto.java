package com.remington.unieats.marketplace.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Integer id;

    @Column(nullable = false)
    private String nombre;

    @Column(length = 500) // Permitimos descripciones más largas
    private String descripcion;

    @Column(nullable = false, precision = 10, scale = 2) // Ideal para dinero
    private BigDecimal precio;

    private String imagenUrl;

    @Column(nullable = false)
    private boolean disponible = true;

    // Relación: Muchos productos pertenecen a UNA tienda.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    // Getters y Setters
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
    public boolean isDisponible() { return disponible; }
    public void setDisponible(boolean disponible) { this.disponible = disponible; }
    public Tienda getTienda() { return tienda; }
    public void setTienda(Tienda tienda) { this.tienda = tienda; }
}
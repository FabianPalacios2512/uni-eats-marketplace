package com.remington.unieats.marketplace.model.entity;

import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tiendas")
public class Tienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tienda")
    private Integer id;

    @Column(nullable = false, unique = true)
    private String nombre;

    private String descripcion;

    @Column(nullable = false, unique = true)
    private String nit;

    private String logoUrl; // URL a la imagen del logo

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTienda estado = EstadoTienda.PENDIENTE;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    // Relación: Muchas tiendas pueden pertenecer a UN usuario (vendedor)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendedor_id", nullable = false)
    private Usuario vendedor;

    // Getters y Setters

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

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getNit() {
        return nit;
    }

    public void setNit(String nit) {
        this.nit = nit;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public EstadoTienda getEstado() {
        return estado;
    }

    public void setEstado(EstadoTienda estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public Usuario getVendedor() {
        return vendedor;
    }

    public void setVendedor(Usuario vendedor) {
        this.vendedor = vendedor;
    }
}
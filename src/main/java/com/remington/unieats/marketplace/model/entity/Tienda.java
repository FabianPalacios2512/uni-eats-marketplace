package com.remington.unieats.marketplace.model.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

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

    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTienda estado = EstadoTienda.PENDIENTE;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendedor_id", nullable = false)
    private Usuario vendedor;
    
    @OneToMany(mappedBy = "tienda")
    @JsonManagedReference
    private List<CategoriaOpcion> categoriasDeOpciones;

    // --- Getters y Setters ---

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

    public List<CategoriaOpcion> getCategoriasDeOpciones() {
        return categoriasDeOpciones;
    }

    public void setCategoriasDeOpciones(List<CategoriaOpcion> categoriasDeOpciones) {
        this.categoriasDeOpciones = categoriasDeOpciones;
    }
}
package com.remington.unieats.marketplace.model.entity;

import java.math.BigDecimal;
import java.util.Set;

import com.remington.unieats.marketplace.model.enums.ClasificacionProducto; // Importar Set

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

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

    // NUEVO: Clasificación del producto (OBLIGATORIO)
    @Enumerated(EnumType.STRING)
    @Column(name = "clasificacion", nullable = true) // Permitir null para productos existentes
    private ClasificacionProducto clasificacion;

    // Relación: Muchos productos pertenecen a UNA tienda.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

     @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "producto_categorias_opciones",
        joinColumns = @JoinColumn(name = "producto_id"),
        inverseJoinColumns = @JoinColumn(name = "categoria_opcion_id")
    )
    private Set<CategoriaOpcion> categoriasDeOpciones;


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

    // NUEVO: Getters y setters para clasificación
    public ClasificacionProducto getClasificacion() { return clasificacion; }
    public void setClasificacion(ClasificacionProducto clasificacion) { this.clasificacion = clasificacion; }

     public Set<CategoriaOpcion> getCategoriasDeOpciones() {
        return categoriasDeOpciones;
    }

    public void setCategoriasDeOpciones(Set<CategoriaOpcion> categoriasDeOpciones) {
        this.categoriasDeOpciones = categoriasDeOpciones;
    }

}
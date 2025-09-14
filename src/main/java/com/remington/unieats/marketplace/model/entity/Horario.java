package com.remington.unieats.marketplace.model.entity;

import com.remington.unieats.marketplace.model.enums.DiaSemana;
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "horarios")
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiaSemana dia;

    private LocalTime horaApertura;

    private LocalTime horaCierre;
    
    @Column(nullable = false)
    private boolean abierto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public DiaSemana getDia() { return dia; }
    public void setDia(DiaSemana dia) { this.dia = dia; }
    public LocalTime getHoraApertura() { return horaApertura; }
    public void setHoraApertura(LocalTime horaApertura) { this.horaApertura = horaApertura; }
    public LocalTime getHoraCierre() { return horaCierre; }
    public void setHoraCierre(LocalTime horaCierre) { this.horaCierre = horaCierre; }
    public boolean isAbierto() { return abierto; }
    public void setAbierto(boolean abierto) { this.abierto = abierto; }
    public Tienda getTienda() { return tienda; }
    public void setTienda(Tienda tienda) { this.tienda = tienda; }
}
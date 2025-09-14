package com.remington.unieats.marketplace.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(nullable = false, unique = true)
    private String correo;
    
    @Column(nullable = false, unique = true)
    private String cedula;

    @Column(nullable = true)
    private String telefono;

    @Column(name = "contrasena_hash", nullable = false)
    private String contrasenaHash;

    private boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    // ===== CAMPOS NUEVOS PARA RECUPERAR CONTRASEÑA =====
    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expiry")
    private LocalDateTime resetPasswordTokenExpiry;
    // ===================================================

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_roles",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    private Set<Rol> roles;
    
    // Getters y Setters (incluyendo los nuevos)
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getCedula() { return cedula; }
    public void setCedula(String cedula) { this.cedula = cedula; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getContrasenaHash() { return contrasenaHash; }
    public void setContrasenaHash(String contrasenaHash) { this.contrasenaHash = contrasenaHash; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public String getResetPasswordToken() { return resetPasswordToken; }
    public void setResetPasswordToken(String resetPasswordToken) { this.resetPasswordToken = resetPasswordToken; }
    public LocalDateTime getResetPasswordTokenExpiry() { return resetPasswordTokenExpiry; }
    public void setResetPasswordTokenExpiry(LocalDateTime resetPasswordTokenExpiry) { this.resetPasswordTokenExpiry = resetPasswordTokenExpiry; }
    public Set<Rol> getRoles() { return roles; }
    public void setRoles(Set<Rol> roles) { this.roles = roles; }
}
package com.remington.unieats.marketplace.dto;

/**
 * DTO para el registro de estudiantes con validaciones implementadas
 * en el frontend (HTML + JavaScript) y validaciones básicas en el backend
 */
public class EstudianteRegistroDTO {
    
    private String nombre;      // 2-30 caracteres, solo letras y espacios
    private String apellido;    // 2-40 caracteres, solo letras y espacios  
    private String cedula;      // 6-12 dígitos, solo números
    private String telefono;    // máximo 10 dígitos, solo números (opcional)
    private String correo;      // formato email válido, máximo 100 caracteres
    private String password;    // 8-50 caracteres, debe incluir mayúscula, minúscula, número y carácter especial
    
    // Constructor vacío
    public EstudianteRegistroDTO() {}
    
    // Constructor con parámetros
    public EstudianteRegistroDTO(String nombre, String apellido, String cedula, String telefono, String correo, String password) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.cedula = cedula;
        this.telefono = telefono;
        this.correo = correo;
        this.password = password;
    }
    
    // Getters y Setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { 
        this.nombre = (nombre != null) ? nombre.trim() : null; 
    }
    
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { 
        this.apellido = (apellido != null) ? apellido.trim() : null; 
    }
    
    public String getCedula() { return cedula; }
    public void setCedula(String cedula) { 
        this.cedula = (cedula != null) ? cedula.trim() : null; 
    }
    
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { 
        this.telefono = (telefono != null) ? telefono.trim() : null; 
    }
    
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { 
        this.correo = (correo != null) ? correo.trim().toLowerCase() : null; 
    }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    // Método toString para debugging
    @Override
    public String toString() {
        return "EstudianteRegistroDTO{" +
                "nombre='" + nombre + '\'' +
                ", apellido='" + apellido + '\'' +
                ", cedula='" + cedula + '\'' +
                ", telefono='" + telefono + '\'' +
                ", correo='" + correo + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
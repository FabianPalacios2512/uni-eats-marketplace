package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.DashboardStatsDTO;
import com.remington.unieats.marketplace.dto.TiendaDetallesDTO;
import com.remington.unieats.marketplace.dto.UsuarioAdminDTO;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import java.util.List;
import java.util.Optional;

public interface AdminService {
    
    // Métodos de Usuario
    DashboardStatsDTO getDashboardStats();
    List<Usuario> listarTodosLosUsuarios();
    Usuario guardarUsuario(UsuarioAdminDTO usuarioDTO);
    void cambiarEstadoUsuario(Integer id);
    Optional<Usuario> buscarUsuarioPorId(Integer id);

    // Métodos de Tienda
    List<Tienda> listarTodasLasTiendas();
    void aprobarTienda(Integer tiendaId);
    void rechazarOInhabilitarTienda(Integer tiendaId);
    void reactivarTienda(Integer tiendaId);
    Optional<TiendaDetallesDTO> buscarTiendaDetallesPorId(Integer id);
}
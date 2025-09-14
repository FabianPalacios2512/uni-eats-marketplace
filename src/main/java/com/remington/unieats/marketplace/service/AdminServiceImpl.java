package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.DashboardStatsDTO;
import com.remington.unieats.marketplace.dto.TiendaDetallesDTO;
import com.remington.unieats.marketplace.dto.UsuarioAdminDTO;
import com.remington.unieats.marketplace.model.entity.Rol;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import com.remington.unieats.marketplace.model.repository.RolRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TiendaRepository tiendaRepository;

    @Override
    public DashboardStatsDTO getDashboardStats() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalUsuarios(usuarios.size());
        stats.setTotalEstudiantes(usuarios.stream().filter(u -> u.getRoles().stream().anyMatch(r -> r.getNombre().equals("ESTUDIANTE"))).count());
        stats.setTotalVendedores(usuarios.stream().filter(u -> u.getRoles().stream().anyMatch(r -> r.getNombre().equals("VENDEDOR"))).count());
        stats.setTotalTiendas(tiendaRepository.count()); 
        return stats;
    }

    @Override
    public List<Usuario> listarTodosLosUsuarios() {
        return usuarioRepository.findAll();
    }

    @Override
    public Usuario guardarUsuario(UsuarioAdminDTO usuarioDTO) {
        if (usuarioDTO.getRolesIds() == null || usuarioDTO.getRolesIds().isEmpty()) {
            throw new RuntimeException("El usuario debe tener al menos un rol seleccionado.");
        }
        Optional<Usuario> existentePorCorreo = usuarioRepository.findByCorreo(usuarioDTO.getCorreo());
        if (existentePorCorreo.isPresent() && !existentePorCorreo.get().getId().equals(usuarioDTO.getId())) {
            throw new RuntimeException("El correo electrónico ya está en uso por otro usuario.");
        }
        Usuario usuario;
        if (usuarioDTO.getId() != null && usuarioDTO.getId() != 0) {
            usuario = usuarioRepository.findById(usuarioDTO.getId()).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        } else {
            usuario = new Usuario();
            usuario.setFechaCreacion(LocalDateTime.now());
        }
        usuario.setNombre(usuarioDTO.getNombre());
        usuario.setApellido(usuarioDTO.getApellido());
        usuario.setCorreo(usuarioDTO.getCorreo());
        usuario.setCedula(usuarioDTO.getCedula());
        if (usuarioDTO.getPassword() != null && !usuarioDTO.getPassword().isEmpty()) {
            usuario.setContrasenaHash(passwordEncoder.encode(usuarioDTO.getPassword()));
        }
        Set<Rol> roles = usuarioDTO.getRolesIds().stream()
                .map(rolId -> rolRepository.findById(rolId).orElse(null))
                .filter(rol -> rol != null).collect(Collectors.toSet());
        usuario.setRoles(roles);
        return usuarioRepository.save(usuario);
    }

    @Override
    public void cambiarEstadoUsuario(Integer id) {
        Usuario usuario = usuarioRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(!usuario.isActivo());
        usuarioRepository.save(usuario);
    }

    @Override
    public Optional<Usuario> buscarUsuarioPorId(Integer id) {
        return usuarioRepository.findById(id);
    }
    
    @Override
    public List<Tienda> listarTodasLasTiendas() {
        return tiendaRepository.findAllWithVendedor();
    }

    @Override
    public void aprobarTienda(Integer tiendaId) {
        Tienda tienda = tiendaRepository.findById(tiendaId)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));
        tienda.setEstado(EstadoTienda.ACTIVA);
        tiendaRepository.save(tienda);
    }

    @Override
    public void rechazarOInhabilitarTienda(Integer tiendaId) {
        Tienda tienda = tiendaRepository.findById(tiendaId)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));
        tienda.setEstado(EstadoTienda.INACTIVA);
        tiendaRepository.save(tienda);
    }

    @Override
    public void reactivarTienda(Integer tiendaId) {
        Tienda tienda = tiendaRepository.findById(tiendaId)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));
        tienda.setEstado(EstadoTienda.ACTIVA);
        tiendaRepository.save(tienda);
    }

    @Override
    public Optional<TiendaDetallesDTO> buscarTiendaDetallesPorId(Integer id) {
        return tiendaRepository.findById(id).map(tienda -> {
            TiendaDetallesDTO dto = new TiendaDetallesDTO();
            dto.setId(tienda.getId());
            dto.setNombre(tienda.getNombre());
            dto.setNit(tienda.getNit());
            dto.setDescripcion(tienda.getDescripcion());
            dto.setLogoUrl(tienda.getLogoUrl());
            dto.setEstado(tienda.getEstado().name());
            dto.setFechaCreacion(tienda.getFechaCreacion());
            dto.setNombreVendedor(tienda.getVendedor().getNombre() + " " + tienda.getVendedor().getApellido());
            return dto;
        });
    }
}
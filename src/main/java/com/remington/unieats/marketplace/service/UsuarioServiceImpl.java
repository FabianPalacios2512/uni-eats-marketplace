package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.EstudianteRegistroDTO;
import com.remington.unieats.marketplace.model.entity.Rol;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.repository.RolRepository;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public Usuario registrarEstudiante(EstudianteRegistroDTO registroDTO) {
        // Validar que el correo no exista
        if (usuarioRepository.findByCorreo(registroDTO.getCorreo()).isPresent()) {
            throw new RuntimeException("El correo electrónico ya está en uso.");
        }

        // Crear el nuevo usuario
        Usuario usuario = new Usuario();
        usuario.setNombre(registroDTO.getNombre());
        usuario.setApellido(registroDTO.getApellido());
        usuario.setCedula(registroDTO.getCedula());
        usuario.setTelefono(registroDTO.getTelefono());
        usuario.setCorreo(registroDTO.getCorreo());
        usuario.setContrasenaHash(passwordEncoder.encode(registroDTO.getPassword()));

        // Asignar el rol de ESTUDIANTE
        Rol rolEstudiante = rolRepository.findByNombre("ESTUDIANTE")
                .orElseThrow(() -> new RuntimeException("Error: El rol de ESTUDIANTE no se encuentra en la base de datos."));
        usuario.setRoles(Set.of(rolEstudiante));

        return usuarioRepository.save(usuario);
    }
}
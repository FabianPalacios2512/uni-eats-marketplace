package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collection;
import java.util.stream.Collectors;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Buscamos al usuario en nuestra base de datos por su correo
        Usuario usuario = usuarioRepository.findByCorreo(username)
                .orElseThrow(() -> new UsernameNotFoundException("No se encontró un usuario con el correo: " + username));

        // Convertimos nuestros Roles a un formato que Spring Security entiende
        Collection<? extends GrantedAuthority> authorities = usuario.getRoles()
                .stream()
                .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol.getNombre()))
                .collect(Collectors.toList());

        // Creamos y retornamos el objeto UserDetails que Spring Security usará
        return new User(usuario.getCorreo(), usuario.getContrasenaHash(), usuario.isActivo(), true, true, true, authorities);
    }
}

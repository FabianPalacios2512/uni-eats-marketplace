package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.EstudianteRegistroDTO;
import com.remington.unieats.marketplace.model.entity.Usuario;

public interface UsuarioService {
    Usuario registrarEstudiante(EstudianteRegistroDTO registroDTO);
}
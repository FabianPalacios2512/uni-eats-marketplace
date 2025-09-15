package com.remington.unieats.marketplace.controller;

import com.remington.unieats.marketplace.dto.PedidoCompradorDTO;
import com.remington.unieats.marketplace.dto.PedidoDTO;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import com.remington.unieats.marketplace.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired private PedidoService pedidoService;
    @Autowired private UsuarioRepository usuarioRepository;

    @PostMapping("/crear")
    public ResponseEntity<?> crearPedido(@RequestBody PedidoDTO pedidoDTO, Authentication authentication) {
        try {
            // Obtenemos el usuario autenticado que está haciendo la compra
            String correo = authentication.getName();
            Usuario comprador = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario comprador no encontrado."));

            pedidoService.crearPedido(pedidoDTO, comprador);
            return ResponseEntity.status(HttpStatus.CREATED).body("Pedido creado exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/mis-pedidos")
    public ResponseEntity<List<PedidoCompradorDTO>> getMisPedidos(Authentication authentication) {
        String correo = authentication.getName();
        Usuario comprador = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        
        List<PedidoCompradorDTO> pedidos = pedidoService.getMisPedidos(comprador);
        return ResponseEntity.ok(pedidos);
    }
}
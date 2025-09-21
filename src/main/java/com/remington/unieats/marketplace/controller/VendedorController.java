package com.remington.unieats.marketplace.controller;

import com.remington.unieats.marketplace.dto.*;
import com.remington.unieats.marketplace.model.entity.*;
import com.remington.unieats.marketplace.model.enums.EstadoPedido;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import com.remington.unieats.marketplace.service.PedidoService;
import com.remington.unieats.marketplace.service.ProductoService;
import com.remington.unieats.marketplace.service.VendedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vendedor")
public class VendedorController {

    @Autowired private VendedorService vendedorService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProductoService productoService;
    @Autowired private PedidoService pedidoService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> obtenerDatosDashboard(Authentication authentication) {
        String correo = authentication.getName();
        Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
        Optional<Tienda> tiendaOpt = vendedorService.findTiendaByVendedor(vendedor);

        if (tiendaOpt.isPresent()) {
            Tienda tienda = tiendaOpt.get();
            List<Producto> productos = productoService.findByTienda(tienda);
            List<Horario> horarios = vendedorService.findHorariosByTienda(tienda);
            
            DashboardVendedorDTO dto = new DashboardVendedorDTO();
            dto.setTienda(tienda);
            dto.setProductos(productos);
            dto.setHorarios(horarios);
            
            return ResponseEntity.ok(dto);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/pedidos")
    public ResponseEntity<List<PedidoVendedorDTO>> obtenerPedidos(Authentication authentication) {
        String correo = authentication.getName();
        Usuario vendedor = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
        
        return vendedorService.findTiendaByVendedor(vendedor)
                .map(tienda -> {
                    List<PedidoVendedorDTO> pedidos = vendedorService.getPedidosDeLaTienda(tienda);
                    return ResponseEntity.ok(pedidos);
                })
                .orElse(ResponseEntity.ok(Collections.emptyList()));
    }

    @PostMapping("/tienda/crear")
    public ResponseEntity<?> procesarCreacionTienda(@ModelAttribute TiendaCreacionDTO tiendaDTO, @RequestParam("logo") MultipartFile logoFile, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Tienda tiendaCreada = vendedorService.crearTienda(tiendaDTO, vendedor, logoFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(tiendaCreada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/tienda/actualizar")
    public ResponseEntity<?> procesarUpdateTienda(@ModelAttribute TiendaUpdateDTO updateDTO, @RequestParam(value = "logo", required = false) MultipartFile logoFile, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Tienda tienda = vendedorService.findTiendaByVendedor(vendedor).orElseThrow(() -> new IllegalStateException("Tienda no encontrada."));
            Tienda tiendaActualizada = vendedorService.actualizarTienda(tienda, updateDTO, logoFile);
            return ResponseEntity.ok(tiendaActualizada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/productos/crear")
    public ResponseEntity<?> procesarCreacionProducto(@ModelAttribute("productoDto") ProductoDTO productoDTO, @RequestParam(value = "imagenFile", required = false) MultipartFile imagenFile, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Tienda tienda = vendedorService.findTiendaByVendedor(vendedor).orElseThrow(() -> new IllegalStateException("Tienda no encontrada."));
            Producto productoCreado = productoService.createProducto(productoDTO, tienda, imagenFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(productoCreado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/productos/{productoId}/actualizar")
    public ResponseEntity<?> procesarActualizacionProducto(@PathVariable Integer productoId, @ModelAttribute ProductoDTO productoDTO, @RequestParam(value = "imagen", required = false) MultipartFile imagenFile, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Tienda tienda = vendedorService.findTiendaByVendedor(vendedor).orElseThrow(() -> new IllegalStateException("Tienda no encontrada."));
            
            // Verificar que el producto pertenece a la tienda del vendedor
            Producto producto = productoService.findById(productoId).orElseThrow(() -> new IllegalStateException("Producto no encontrado."));
            if (!producto.getTienda().getId().equals(tienda.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para actualizar este producto.");
            }
            
            Producto productoActualizado = productoService.updateProducto(productoId, productoDTO, imagenFile);
            return ResponseEntity.ok(productoActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/productos/{productoId}/eliminar")
    public ResponseEntity<?> procesarEliminacionProducto(@PathVariable Integer productoId, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Tienda tienda = vendedorService.findTiendaByVendedor(vendedor).orElseThrow(() -> new IllegalStateException("Tienda no encontrada."));
            
            // Verificar que el producto pertenece a la tienda del vendedor
            Producto producto = productoService.findById(productoId).orElseThrow(() -> new IllegalStateException("Producto no encontrado."));
            if (!producto.getTienda().getId().equals(tienda.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para eliminar este producto.");
            }
            
            productoService.deleteProducto(productoId);
            return ResponseEntity.ok().body("Producto eliminado exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/horarios/actualizar")
    public ResponseEntity<?> procesarUpdateHorarios(@RequestBody List<HorarioUpdateDTO> horariosDTO, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Tienda tienda = vendedorService.findTiendaByVendedor(vendedor).orElseThrow(() -> new IllegalStateException("Tienda no encontrada."));
            vendedorService.actualizarHorarios(tienda, horariosDTO);
            return ResponseEntity.ok().build();
        } catch(Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/opciones/categorias")
    public ResponseEntity<List<CategoriaOpcion>> obtenerCategorias(Authentication authentication) {
        String correo = authentication.getName();
        Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
        Tienda tienda = vendedorService.findTiendaByVendedor(vendedor).orElseThrow(() -> new IllegalStateException("Tienda no encontrada."));
        
        List<CategoriaOpcion> categorias = vendedorService.getCategoriasDeOpciones(tienda);
        return ResponseEntity.ok(categorias);
    }

    @PostMapping("/opciones/categorias/crear")
    public ResponseEntity<?> crearCategoria(@RequestBody CategoriaOpcionCreacionDTO dto, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Tienda tienda = vendedorService.findTiendaByVendedor(vendedor).orElseThrow(() -> new IllegalStateException("Tienda no encontrada."));
            
            CategoriaOpcion nuevaCategoria = vendedorService.crearCategoriaConOpciones(dto, tienda);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaCategoria);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/productos/{productoId}/asignar-categoria")
    public ResponseEntity<?> asignarCategoria(@PathVariable Integer productoId, @RequestBody Map<String, Integer> payload) {
        try {
            Integer categoriaId = payload.get("categoriaId");
            if (categoriaId == null) {
                return ResponseEntity.badRequest().body("Falta el campo 'categoriaId'");
            }
            vendedorService.asignarCategoriaAProducto(productoId, categoriaId);
            return ResponseEntity.ok().body("Categoría asignada correctamente.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pedidos/{pedidoId}/aceptar")
    public ResponseEntity<?> aceptarPedido(@PathVariable Integer pedidoId) {
        try {
            pedidoService.actualizarEstadoPedido(pedidoId, EstadoPedido.EN_PREPARACION);
            return ResponseEntity.ok().body("Pedido aceptado y movido a 'En Preparación'");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pedidos/{pedidoId}/listo")
    public ResponseEntity<?> pedidoListo(@PathVariable Integer pedidoId) {
        try {
            pedidoService.actualizarEstadoPedido(pedidoId, EstadoPedido.LISTO_PARA_RECOGER);
            return ResponseEntity.ok().body("Pedido marcado como 'Listo para Recoger'");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pedidos/{pedidoId}/cancelar")
    public ResponseEntity<?> cancelarPedido(@PathVariable Integer pedidoId) {
        try {
            pedidoService.actualizarEstadoPedido(pedidoId, EstadoPedido.CANCELADO);
            return ResponseEntity.ok().body("Pedido cancelado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
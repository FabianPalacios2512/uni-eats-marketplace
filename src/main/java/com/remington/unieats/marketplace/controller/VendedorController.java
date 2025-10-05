package com.remington.unieats.marketplace.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.remington.unieats.marketplace.dto.CategoriaOpcionCreacionDTO;
import com.remington.unieats.marketplace.dto.DashboardVendedorDTO;
import com.remington.unieats.marketplace.dto.HorarioUpdateDTO;
import com.remington.unieats.marketplace.dto.PedidoVendedorDTO;
import com.remington.unieats.marketplace.dto.ProductoDTO;
import com.remington.unieats.marketplace.dto.TiendaCreacionDTO;
import com.remington.unieats.marketplace.dto.TiendaUpdateDTO;
import com.remington.unieats.marketplace.model.entity.CategoriaOpcion;
import com.remington.unieats.marketplace.model.entity.Horario;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.enums.EstadoPedido;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import com.remington.unieats.marketplace.service.PedidoService;
import com.remington.unieats.marketplace.service.ProductoService;
import com.remington.unieats.marketplace.service.VendedorService;

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
            
            // Agregar estadísticas del dashboard
            dto.setVentasHoy(vendedorService.calcularVentasHoy(tienda));
            dto.setPedidosNuevos(vendedorService.contarPedidosNuevos(tienda));
            dto.setPedidosCompletados(vendedorService.contarPedidosCompletadosHoy(tienda));
            
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
            return ResponseEntity.ok().body("Producto deshabilitado exitosamente. No será visible para los clientes.");
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

    @PostMapping("/pedidos/{pedidoId}/entregado")
    public ResponseEntity<?> pedidoEntregado(@PathVariable Integer pedidoId) {
        try {
            pedidoService.actualizarEstadoPedido(pedidoId, EstadoPedido.COMPLETADO);
            return ResponseEntity.ok().body("Pedido marcado como 'Entregado'");
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

    @PostMapping("/tienda/estado")
    public ResponseEntity<?> cambiarEstadoTienda(@RequestBody Map<String, Boolean> request, Authentication authentication) {
        try {
            String correo = authentication.getName();
            Usuario vendedor = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new IllegalStateException("Vendedor no encontrado."));
            Optional<Tienda> tiendaOpt = vendedorService.findTiendaByVendedor(vendedor);
            
            if (tiendaOpt.isPresent()) {
                Tienda tienda = tiendaOpt.get();
                Boolean estaAbierta = request.get("estaAbierta");
                vendedorService.actualizarEstadoTienda(tienda.getId(), estaAbierta);
                return ResponseEntity.ok().body("Estado de la tienda actualizado");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Tienda no encontrada");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
package com.remington.unieats.marketplace.service;

import java.util.List;
import java.util.Optional;

import org.springframework.web.multipart.MultipartFile;

import com.remington.unieats.marketplace.dto.CategoriaOpcionCreacionDTO;
import com.remington.unieats.marketplace.dto.HorarioUpdateDTO;
import com.remington.unieats.marketplace.dto.PedidoVendedorDTO;
import com.remington.unieats.marketplace.dto.TiendaCreacionDTO;
import com.remington.unieats.marketplace.dto.TiendaUpdateDTO;
import com.remington.unieats.marketplace.model.entity.CategoriaOpcion;
import com.remington.unieats.marketplace.model.entity.Horario;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;

public interface VendedorService {

    Optional<Tienda> findTiendaByVendedor(Usuario vendedor);

    Tienda crearTienda(TiendaCreacionDTO tiendaDTO, Usuario vendedor, MultipartFile logoFile);

    Tienda actualizarTienda(Tienda tienda, TiendaUpdateDTO updateDTO, MultipartFile logoFile);

    List<Horario> findHorariosByTienda(Tienda tienda);

    void actualizarHorarios(Tienda tienda, List<HorarioUpdateDTO> horariosDTO);

    List<PedidoVendedorDTO> getPedidosDeLaTienda(Tienda tienda);

    List<CategoriaOpcion> getCategoriasDeOpciones(Tienda tienda);
    
    CategoriaOpcion crearCategoriaConOpciones(CategoriaOpcionCreacionDTO dto, Tienda tienda);

    void asignarCategoriaAProducto(Integer productoId, Integer categoriaId);

    void actualizarEstadoTienda(Integer tiendaId, Boolean estaAbierta);
    
    // Métodos para estadísticas del dashboard
    Double calcularVentasHoy(Tienda tienda);
    Integer contarPedidosNuevos(Tienda tienda);
    Integer contarPedidosCompletadosHoy(Tienda tienda);
}
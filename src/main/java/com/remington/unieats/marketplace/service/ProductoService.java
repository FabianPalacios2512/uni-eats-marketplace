package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.ProductoDTO;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ProductoService {

    List<Producto> findByTienda(Tienda tienda);
    

    Producto createProducto(ProductoDTO productoDTO, Tienda tienda, MultipartFile imagenFile);
    
    // Aquí irán los futuros métodos para actualizar, eliminar, etc.
}
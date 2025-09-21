package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.ProductoDTO;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;

public interface ProductoService {

    List<Producto> findByTienda(Tienda tienda);
    
    Optional<Producto> findById(Integer id);
    
    Producto createProducto(ProductoDTO productoDTO, Tienda tienda, MultipartFile imagenFile);
    
    Producto updateProducto(Integer id, ProductoDTO productoDTO, MultipartFile imagenFile);
    
    void deleteProducto(Integer id);
    
    // Aquí irán los futuros métodos para actualizar, eliminar, etc.
}
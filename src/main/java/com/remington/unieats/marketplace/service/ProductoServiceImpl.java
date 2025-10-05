package com.remington.unieats.marketplace.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.remington.unieats.marketplace.dto.ProductoDTO;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.repository.ProductoRepository;

@Service
public class ProductoServiceImpl implements ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private LocalImageService localImageService;

    @Override
    public List<Producto> findByTienda(Tienda tienda) {
        return productoRepository.findByTienda(tienda);
    }

    @Override
    public Producto createProducto(ProductoDTO productoDTO, Tienda tienda, MultipartFile imagenFile) {
        try {
            // Validar que la clasificación sea obligatoria
            if (productoDTO.getClasificacion() == null) {
                throw new RuntimeException("La clasificación del producto es obligatoria");
            }
            
            // 1. Subir la imagen usando almacenamiento local
            String imagenUrl = localImageService.uploadImage(imagenFile, "productos");

            // 2. Crear la nueva entidad Producto
            Producto nuevoProducto = new Producto();
            nuevoProducto.setNombre(productoDTO.getNombre());
            nuevoProducto.setDescripcion(productoDTO.getDescripcion());
            nuevoProducto.setPrecio(productoDTO.getPrecio());
            nuevoProducto.setImagenUrl(imagenUrl);
            nuevoProducto.setTienda(tienda);
            nuevoProducto.setDisponible(true); // Por defecto, un nuevo producto está disponible
            
            // NUEVO: Asignar clasificación
            nuevoProducto.setClasificacion(productoDTO.getClasificacion());

            return productoRepository.save(nuevoProducto);
        } catch (Exception e) {
            throw new RuntimeException("Error al crear producto: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<Producto> findById(Integer id) {
        return productoRepository.findById(id);
    }

    @Override
    public Producto updateProducto(Integer id, ProductoDTO productoDTO, MultipartFile imagenFile) {
        try {
            // 1. Buscar el producto existente
            Producto producto = productoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));

            // 2. Actualizar los campos básicos
            producto.setNombre(productoDTO.getNombre());
            producto.setDescripcion(productoDTO.getDescripcion());
            producto.setPrecio(productoDTO.getPrecio());
            producto.setDisponible(productoDTO.getDisponible() != null ? productoDTO.getDisponible() : true);
            
            // NUEVO: Actualizar clasificación si se proporciona
            if (productoDTO.getClasificacion() != null) {
                producto.setClasificacion(productoDTO.getClasificacion());
            }

            // 3. Actualizar la imagen si se proporciona una nueva
            if (imagenFile != null && !imagenFile.isEmpty()) {
                // Eliminar la imagen anterior si existe
                if (producto.getImagenUrl() != null && !producto.getImagenUrl().isEmpty()) {
                    localImageService.deleteImage(producto.getImagenUrl());
                }
                // Subir la nueva imagen
                String nuevaImagenUrl = localImageService.uploadImage(imagenFile, "productos");
                producto.setImagenUrl(nuevaImagenUrl);
            }

            // 4. Guardar los cambios
            return productoRepository.save(producto);
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar producto: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteProducto(Integer id) {
        // 1. Buscar el producto existente
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));

        // 2. En lugar de eliminar físicamente, simplemente lo deshabilitamos
        producto.setDisponible(false);
        
        // 3. Guardar el cambio (soft delete)
        productoRepository.save(producto);
        
        // Nota: No eliminamos la imagen ni el registro, solo lo marcamos como no disponible
        // Esto evita problemas con claves foráneas y preserva el historial de pedidos
    }
}
package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.ProductoDTO;
import com.remington.unieats.marketplace.model.entity.Producto;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductoServiceImpl implements ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    private final String UPLOAD_DIR_PRODUCTOS = "./uploads/productos/";

    @Override
    public List<Producto> findByTienda(Tienda tienda) {
        return productoRepository.findByTienda(tienda);
    }

    @Override
    public Producto createProducto(ProductoDTO productoDTO, Tienda tienda, MultipartFile imagenFile) {
        // 1. Guardar la imagen del producto
        String imagenUrl = guardarImagenProducto(imagenFile);

        // 2. Crear la nueva entidad Producto
        Producto nuevoProducto = new Producto();
        nuevoProducto.setNombre(productoDTO.getNombre());
        nuevoProducto.setDescripcion(productoDTO.getDescripcion());
        nuevoProducto.setPrecio(productoDTO.getPrecio());
        nuevoProducto.setImagenUrl(imagenUrl);
        nuevoProducto.setTienda(tienda);
        nuevoProducto.setDisponible(true); // Por defecto, un nuevo producto está disponible

        return productoRepository.save(nuevoProducto);
    }

    private String guardarImagenProducto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            // Permitimos crear productos sin imagen, asignando una por defecto.
            return null; 
        }
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR_PRODUCTOS);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);

            return "/uploads/productos/" + uniqueFilename;

        } catch (IOException e) {
            throw new RuntimeException("No se pudo guardar la imagen del producto. Error: " + e.getMessage());
        }
    }

    @Override
    public Optional<Producto> findById(Integer id) {
        return productoRepository.findById(id);
    }

    @Override
    public Producto updateProducto(Integer id, ProductoDTO productoDTO, MultipartFile imagenFile) {
        // 1. Buscar el producto existente
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));

        // 2. Actualizar los campos básicos
        producto.setNombre(productoDTO.getNombre());
        producto.setDescripcion(productoDTO.getDescripcion());
        producto.setPrecio(productoDTO.getPrecio());
        producto.setDisponible(productoDTO.getDisponible() != null ? productoDTO.getDisponible() : true);

        // 3. Actualizar la imagen si se proporciona una nueva
        if (imagenFile != null && !imagenFile.isEmpty()) {
            // Eliminar la imagen anterior si existe
            if (producto.getImagenUrl() != null && !producto.getImagenUrl().isEmpty()) {
                eliminarImagenAnterior(producto.getImagenUrl());
            }
            // Guardar la nueva imagen
            String nuevaImagenUrl = guardarImagenProducto(imagenFile);
            producto.setImagenUrl(nuevaImagenUrl);
        }

        // 4. Guardar los cambios
        return productoRepository.save(producto);
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

    private void eliminarImagenAnterior(String imagenUrl) {
        try {
            if (imagenUrl != null && imagenUrl.startsWith("/uploads/productos/")) {
                String filename = imagenUrl.substring("/uploads/productos/".length());
                Path imagePath = Paths.get(UPLOAD_DIR_PRODUCTOS + filename);
                if (Files.exists(imagePath)) {
                    Files.delete(imagePath);
                }
            }
        } catch (IOException e) {
            // Log del error pero no fallar la operación principal
            System.err.println("Error al eliminar imagen anterior: " + e.getMessage());
        }
    }
}
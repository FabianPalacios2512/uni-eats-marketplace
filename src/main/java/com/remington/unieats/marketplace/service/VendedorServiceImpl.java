package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.dto.HorarioUpdateDTO;
import com.remington.unieats.marketplace.dto.TiendaCreacionDTO;
import com.remington.unieats.marketplace.dto.TiendaUpdateDTO;
import com.remington.unieats.marketplace.model.entity.Horario;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import com.remington.unieats.marketplace.model.repository.HorarioRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VendedorServiceImpl implements VendedorService {

    @Autowired private TiendaRepository tiendaRepository;
    @Autowired private HorarioRepository horarioRepository;
    
    private final String UPLOAD_DIR = "./uploads/logos/";

    @Override
    public Optional<Tienda> findTiendaByVendedor(Usuario vendedor) {
        return tiendaRepository.findByVendedor(vendedor);
    }

    @Override
    public Tienda crearTienda(TiendaCreacionDTO tiendaDTO, Usuario vendedor, MultipartFile logoFile) {
        if (tiendaRepository.findByVendedor(vendedor).isPresent()) {
            throw new IllegalStateException("Este vendedor ya tiene una tienda registrada.");
        }
        String logoUrl = guardarLogo(logoFile);
        
        Tienda nuevaTienda = new Tienda();
        nuevaTienda.setNombre(tiendaDTO.getNombre());
        nuevaTienda.setNit(tiendaDTO.getNit());
        nuevaTienda.setDescripcion(tiendaDTO.getDescripcion());
        nuevaTienda.setVendedor(vendedor);
        nuevaTienda.setEstado(EstadoTienda.PENDIENTE);
        nuevaTienda.setLogoUrl(logoUrl);
        
        return tiendaRepository.save(nuevaTienda);
    }

    @Override
    public Tienda actualizarTienda(Tienda tienda, TiendaUpdateDTO updateDTO, MultipartFile logoFile) {
        tienda.setNombre(updateDTO.getNombre());
        tienda.setDescripcion(updateDTO.getDescripcion());
        if (logoFile != null && !logoFile.isEmpty()) {
            String nuevoLogoUrl = guardarLogo(logoFile);
            tienda.setLogoUrl(nuevoLogoUrl);
        }
        return tiendaRepository.save(tienda);
    }

    @Override
    public List<Horario> findHorariosByTienda(Tienda tienda) {
        return horarioRepository.findByTiendaOrderByDiaAsc(tienda);
    }

    @Override
    @Transactional
    public void actualizarHorarios(Tienda tienda, List<HorarioUpdateDTO> horariosDTO) {
        horarioRepository.deleteByTienda(tienda);
        List<Horario> nuevosHorarios = horariosDTO.stream().map(dto -> {
            Horario horario = new Horario();
            horario.setTienda(tienda);
            horario.setDia(dto.getDia());
            horario.setAbierto(dto.isAbierto());
            if (dto.isAbierto() && dto.getHoraApertura() != null && dto.getHoraCierre() != null) {
                horario.setHoraApertura(LocalTime.parse(dto.getHoraApertura()));
                horario.setHoraCierre(LocalTime.parse(dto.getHoraCierre()));
            }
            return horario;
        }).collect(Collectors.toList());
        horarioRepository.saveAll(nuevosHorarios);
    }
    
    private String guardarLogo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
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
            return "/uploads/logos/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("No se pudo guardar el archivo del logo: " + e.getMessage());
        }
    }
}
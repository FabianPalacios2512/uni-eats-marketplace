package com.remington.unieats.marketplace.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.remington.unieats.marketplace.dto.TiendaPublicaDTO;
import com.remington.unieats.marketplace.service.MarketplaceService;

@Controller
public class TestController {

    @Autowired
    private MarketplaceService marketplaceService;

    @GetMapping("/debug-api")
    public String debugApi() {
        return "debug-api";
    }

    @GetMapping("/test-logos")
    public String testLogos(Model model) {
        List<TiendaPublicaDTO> tiendas = marketplaceService.getTiendasActivas();
        model.addAttribute("tiendas", tiendas);
        return "test-logos";
    }

    @GetMapping("/api/test/tiendas")
    @ResponseBody
    public List<TiendaPublicaDTO> testApiTiendas() {
        return marketplaceService.getTiendasActivas();
    }
}
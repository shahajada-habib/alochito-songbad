package com.alochitosongbad.settings;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SiteSettingsController {
    private final SiteSettingsService service;

    public SiteSettingsController(SiteSettingsService service) {
        this.service = service;
    }

    @GetMapping("/api/public/site-settings")
    public SiteSettingsResponseDto getPublicSettings() {
        return service.getSettings();
    }

    @GetMapping("/api/admin/site-settings")
    public SiteSettingsResponseDto getAdminSettings() {
        return service.getAdminSettings();
    }

    @PutMapping("/api/admin/site-settings")
    public SiteSettingsResponseDto updateSettings(@RequestBody SiteSettingsRequestDto request) {
        return service.updateSettings(request);
    }
}

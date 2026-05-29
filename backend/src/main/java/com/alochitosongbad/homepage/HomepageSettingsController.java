package com.alochitosongbad.homepage;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomepageSettingsController {
    private final HomepageSettingsService service;

    public HomepageSettingsController(HomepageSettingsService service) {
        this.service = service;
    }

    @GetMapping("/api/public/homepage-settings")
    public HomepageSettingsResponseDto getPublicSettings() {
        return service.getSettings();
    }

    @GetMapping("/api/admin/homepage-settings")
    public HomepageSettingsResponseDto getAdminSettings() {
        return service.getAdminSettings();
    }

    @PutMapping("/api/admin/homepage-settings")
    public HomepageSettingsResponseDto updateSettings(@RequestBody HomepageSettingsRequestDto request) {
        return service.updateSettings(request);
    }
}

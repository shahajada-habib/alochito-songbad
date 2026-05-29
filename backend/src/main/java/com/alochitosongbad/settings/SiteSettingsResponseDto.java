package com.alochitosongbad.settings;

import java.time.LocalDateTime;

public record SiteSettingsResponseDto(
        Long id,
        String siteName,
        String tagline,
        String logoUrl,
        String faviconUrl,
        String footerLogoUrl,
        String contactEmail,
        String contactPhone,
        String address,
        String facebookUrl,
        String youtubeUrl,
        String twitterUrl,
        String linkedinUrl,
        String aboutText,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

package com.alochitosongbad.seo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RobotsController {
    private final String siteUrl;

    public RobotsController(@Value("${SITE_URL:https://alochitosongbad.com}") String siteUrl) {
        this.siteUrl = normalizeSiteUrl(siteUrl);
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String robots() {
        return """
                User-agent: *
                Allow: /
                Disallow: /admin
                Disallow: /admin/
                Disallow: /api/
                Sitemap: %s/sitemap.xml
                """.formatted(siteUrl);
    }

    private String normalizeSiteUrl(String value) {
        String normalized = value == null || value.isBlank() ? "https://alochitosongbad.com" : value.trim();
        return normalized.endsWith("/") ? normalized.substring(0, normalized.length() - 1) : normalized;
    }
}

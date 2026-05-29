package com.alochitosongbad.homepage;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.alochitosongbad.common.ContentSanitizer;
import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.news.NewsRepository;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HomepageSettingsService {
    private static final long SETTINGS_ID = 1L;

    private final HomepageSettingsRepository repository;
    private final NewsRepository newsRepository;
    private final CurrentUserService currentUserService;
    private final ContentSanitizer sanitizer;
    private final InputValidator inputValidator;

    public HomepageSettingsService(
            HomepageSettingsRepository repository,
            NewsRepository newsRepository,
            CurrentUserService currentUserService,
            ContentSanitizer sanitizer,
            InputValidator inputValidator) {
        this.repository = repository;
        this.newsRepository = newsRepository;
        this.currentUserService = currentUserService;
        this.sanitizer = sanitizer;
        this.inputValidator = inputValidator;
    }

    @Transactional(readOnly = true)
    public HomepageSettingsResponseDto getSettings() {
        return toResponse(repository.findById(SETTINGS_ID).orElseGet(this::defaults));
    }

    @Transactional(readOnly = true)
    public HomepageSettingsResponseDto getAdminSettings() {
        currentUserService.requireAdmin("view homepage settings");
        return getSettings();
    }

    public HomepageSettingsResponseDto updateSettings(HomepageSettingsRequestDto request) {
        currentUserService.requireAdmin("update homepage settings");
        HomepageSettings settings = repository.findById(SETTINGS_ID).orElseGet(this::defaults);
        settings.setId(SETTINGS_ID);
        settings.setBreakingTickerEnabled(request.isBreakingTickerEnabled());
        settings.setLeadStoryId(validNewsIdOrNull(request.getLeadStoryId()));
        settings.setFeaturedStoryIds(joinLongs(validNewsIds(request.getFeaturedStoryIds(), 6)));
        settings.setVisibleCategorySections(joinStrings(cleanCategories(request.getVisibleCategorySections())));
        settings.setMostReadEnabled(request.isMostReadEnabled());
        settings.setLatestSectionEnabled(request.isLatestSectionEnabled());
        return toResponse(repository.save(settings));
    }

    private HomepageSettings defaults() {
        HomepageSettings settings = new HomepageSettings();
        settings.setId(SETTINGS_ID);
        settings.setBreakingTickerEnabled(true);
        settings.setMostReadEnabled(true);
        settings.setLatestSectionEnabled(true);
        return settings;
    }

    private Long validNewsIdOrNull(Long id) {
        if (id == null || id <= 0 || !newsRepository.existsById(id)) {
            return null;
        }
        return id;
    }

    private List<Long> validNewsIds(List<Long> ids, int limit) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<Long> valid = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>(ids);
        for (Long id : seen) {
            if (id != null && id > 0 && newsRepository.existsById(id)) {
                valid.add(id);
            }
            if (valid.size() >= limit) {
                break;
            }
        }
        return valid;
    }

    private List<String> cleanCategories(List<String> categories) {
        if (categories == null || categories.isEmpty()) {
            return List.of();
        }

        List<String> cleaned = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (String category : categories) {
            String value = inputValidator.optional(sanitizer.plainText(category), 120);
            if (!value.isBlank() && seen.add(value)) {
                cleaned.add(value);
            }
            if (cleaned.size() >= 12) {
                break;
            }
        }
        return cleaned;
    }

    private HomepageSettingsResponseDto toResponse(HomepageSettings settings) {
        return new HomepageSettingsResponseDto(
                settings.getId(),
                settings.isBreakingTickerEnabled(),
                settings.getLeadStoryId(),
                splitLongs(settings.getFeaturedStoryIds()),
                splitStrings(settings.getVisibleCategorySections()),
                settings.isMostReadEnabled(),
                settings.isLatestSectionEnabled(),
                settings.getCreatedAt(),
                settings.getUpdatedAt());
    }

    private String joinLongs(List<Long> values) {
        return values.stream().map(String::valueOf).reduce((left, right) -> left + "," + right).orElse("");
    }

    private String joinStrings(List<String> values) {
        return String.join("\n", values);
    }

    private List<Long> splitLongs(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<Long> ids = new ArrayList<>();
        for (String part : value.split(",")) {
            try {
                ids.add(Long.parseLong(part.trim()));
            } catch (NumberFormatException ignored) {
                // Ignore malformed stored ids and keep the public response safe.
            }
        }
        return ids;
    }

    private List<String> splitStrings(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return value.lines().map(String::trim).filter((line) -> !line.isBlank()).toList();
    }
}

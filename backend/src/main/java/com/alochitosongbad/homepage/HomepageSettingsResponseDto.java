package com.alochitosongbad.homepage;

import java.time.LocalDateTime;
import java.util.List;

public record HomepageSettingsResponseDto(
        Long id,
        boolean breakingTickerEnabled,
        Long leadStoryId,
        List<Long> featuredStoryIds,
        List<String> visibleCategorySections,
        boolean mostReadEnabled,
        boolean latestSectionEnabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

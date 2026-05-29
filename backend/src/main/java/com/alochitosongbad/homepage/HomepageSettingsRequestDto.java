package com.alochitosongbad.homepage;

import java.util.List;

public class HomepageSettingsRequestDto {
    private boolean breakingTickerEnabled = true;
    private Long leadStoryId;
    private List<Long> featuredStoryIds = List.of();
    private List<String> visibleCategorySections = List.of();
    private boolean mostReadEnabled = true;
    private boolean latestSectionEnabled = true;

    public boolean isBreakingTickerEnabled() { return breakingTickerEnabled; }
    public void setBreakingTickerEnabled(boolean breakingTickerEnabled) { this.breakingTickerEnabled = breakingTickerEnabled; }
    public Long getLeadStoryId() { return leadStoryId; }
    public void setLeadStoryId(Long leadStoryId) { this.leadStoryId = leadStoryId; }
    public List<Long> getFeaturedStoryIds() { return featuredStoryIds; }
    public void setFeaturedStoryIds(List<Long> featuredStoryIds) { this.featuredStoryIds = featuredStoryIds; }
    public List<String> getVisibleCategorySections() { return visibleCategorySections; }
    public void setVisibleCategorySections(List<String> visibleCategorySections) { this.visibleCategorySections = visibleCategorySections; }
    public boolean isMostReadEnabled() { return mostReadEnabled; }
    public void setMostReadEnabled(boolean mostReadEnabled) { this.mostReadEnabled = mostReadEnabled; }
    public boolean isLatestSectionEnabled() { return latestSectionEnabled; }
    public void setLatestSectionEnabled(boolean latestSectionEnabled) { this.latestSectionEnabled = latestSectionEnabled; }
}

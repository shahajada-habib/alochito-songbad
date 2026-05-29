package com.alochitosongbad.homepage;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "homepage_settings")
public class HomepageSettings {
    @Id
    private Long id = 1L;

    private boolean breakingTickerEnabled = true;

    private Long leadStoryId;

    @Column(columnDefinition = "TEXT")
    private String featuredStoryIds = "";

    @Column(columnDefinition = "TEXT")
    private String visibleCategorySections = "";

    private boolean mostReadEnabled = true;

    private boolean latestSectionEnabled = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public boolean isBreakingTickerEnabled() { return breakingTickerEnabled; }
    public void setBreakingTickerEnabled(boolean breakingTickerEnabled) { this.breakingTickerEnabled = breakingTickerEnabled; }
    public Long getLeadStoryId() { return leadStoryId; }
    public void setLeadStoryId(Long leadStoryId) { this.leadStoryId = leadStoryId; }
    public String getFeaturedStoryIds() { return featuredStoryIds; }
    public void setFeaturedStoryIds(String featuredStoryIds) { this.featuredStoryIds = featuredStoryIds; }
    public String getVisibleCategorySections() { return visibleCategorySections; }
    public void setVisibleCategorySections(String visibleCategorySections) { this.visibleCategorySections = visibleCategorySections; }
    public boolean isMostReadEnabled() { return mostReadEnabled; }
    public void setMostReadEnabled(boolean mostReadEnabled) { this.mostReadEnabled = mostReadEnabled; }
    public boolean isLatestSectionEnabled() { return latestSectionEnabled; }
    public void setLatestSectionEnabled(boolean latestSectionEnabled) { this.latestSectionEnabled = latestSectionEnabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (id == null) {
            id = 1L;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

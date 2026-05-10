package com.alochitosongbad.breakingnews;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BreakingNewsController {

    private final BreakingNewsService breakingNewsService;

    public BreakingNewsController(BreakingNewsService breakingNewsService) {
        this.breakingNewsService = breakingNewsService;
    }

    @GetMapping("/api/breaking-news")
    public List<BreakingNews> getAll() {
        return breakingNewsService.getAll();
    }

    @PostMapping("/api/breaking-news")
    public BreakingNews create(@RequestBody BreakingNews request) {
        return breakingNewsService.create(request);
    }

    @PutMapping("/api/breaking-news/{id}")
    public ResponseEntity<BreakingNews> update(@PathVariable Long id, @RequestBody BreakingNews request) {
        return breakingNewsService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/breaking-news/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return breakingNewsService.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PatchMapping("/api/breaking-news/{id}/toggle")
    public ResponseEntity<BreakingNews> toggle(@PathVariable Long id) {
        return breakingNewsService.toggle(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/public/breaking-news/active")
    public List<BreakingNews> getActive() {
        return breakingNewsService.getActive();
    }
}

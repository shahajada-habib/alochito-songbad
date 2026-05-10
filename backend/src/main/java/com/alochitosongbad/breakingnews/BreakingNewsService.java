package com.alochitosongbad.breakingnews;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BreakingNewsService {

    private final BreakingNewsRepository breakingNewsRepository;
    private final CurrentUserService currentUserService;

    public BreakingNewsService(
            BreakingNewsRepository breakingNewsRepository,
            CurrentUserService currentUserService) {
        this.breakingNewsRepository = breakingNewsRepository;
        this.currentUserService = currentUserService;
    }

    public List<BreakingNews> getAll() {
        currentUserService.requireEditorOrAdmin("view breaking news");
        return breakingNewsRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<BreakingNews> getActive() {
        return breakingNewsRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    public BreakingNews create(BreakingNews request) {
        currentUserService.requireEditorOrAdmin("create breaking news");

        BreakingNews breakingNews = new BreakingNews();
        breakingNews.setText(normalizeText(request.getText()));
        breakingNews.setActive(request.isActive());
        return breakingNewsRepository.save(breakingNews);
    }

    public Optional<BreakingNews> update(Long id, BreakingNews request) {
        currentUserService.requireEditorOrAdmin("update breaking news");

        return breakingNewsRepository.findById(id)
                .map((existing) -> {
                    existing.setText(normalizeText(request.getText()));
                    existing.setActive(request.isActive());
                    return breakingNewsRepository.save(existing);
                });
    }

    public Optional<BreakingNews> toggle(Long id) {
        currentUserService.requireEditorOrAdmin("toggle breaking news");

        return breakingNewsRepository.findById(id)
                .map((existing) -> {
                    existing.setActive(!existing.isActive());
                    return breakingNewsRepository.save(existing);
                });
    }

    public boolean delete(Long id) {
        currentUserService.requireEditorOrAdmin("delete breaking news");

        if (!breakingNewsRepository.existsById(id)) {
            return false;
        }

        breakingNewsRepository.deleteById(id);
        return true;
    }

    private String normalizeText(String text) {
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "text is required");
        }

        return text.trim();
    }
}

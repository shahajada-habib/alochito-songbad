package com.alochitosongbad.tag;

import java.util.List;

import com.alochitosongbad.news.NewsService;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TagController {

    private final TagRepository tagRepository;
    private final CurrentUserService currentUserService;
    private final NewsService newsService;

    public TagController(TagRepository tagRepository, CurrentUserService currentUserService, NewsService newsService) {
        this.tagRepository = tagRepository;
        this.currentUserService = currentUserService;
        this.newsService = newsService;
    }

    @GetMapping("/api/public/tags")
    public List<String> publicTags() {
        return tagRepository.findPublicPublishedTagNames(com.alochitosongbad.news.NewsStatus.PUBLISHED);
    }

    @GetMapping("/api/public/tags/{name}/news")
    public Object publicNewsByTag(
            @PathVariable String name,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return newsService.getPublishedNewsByTag(name, page, size);
    }

    @GetMapping("/api/admin/tags")
    public List<TagSummaryDto> adminTags() {
        currentUserService.requireEditorOrAdmin("view tags");
        return tagRepository.findAllWithArticleCount().stream()
                .map((row) -> new TagSummaryDto((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }
}

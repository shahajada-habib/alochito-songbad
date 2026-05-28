package com.alochitosongbad.category;

import java.util.List;

import com.alochitosongbad.news.NewsService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicCategoryController {

    private final CategoryRepository categoryRepository;
    private final NewsService newsService;

    public PublicCategoryController(CategoryRepository categoryRepository, NewsService newsService) {
        this.categoryRepository = categoryRepository;
        this.newsService = newsService;
    }

    @GetMapping("/api/public/categories/active")
    public List<Category> getActiveCategories() {
        return categoryRepository.findByStatusOrderByIdAsc("active");
    }

    @GetMapping("/api/public/categories/{slugOrName}/news")
    public Object getPublishedCategoryNews(
            @PathVariable String slugOrName,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return newsService.getPublishedNewsByCategory(slugOrName, page, size);
    }
}

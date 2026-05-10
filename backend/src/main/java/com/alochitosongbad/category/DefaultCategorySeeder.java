package com.alochitosongbad.category;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile({ "dev", "mysql-dev" })
public class DefaultCategorySeeder {

    private static final Logger log = LoggerFactory.getLogger(DefaultCategorySeeder.class);

    @Bean
    ApplicationRunner seedDefaultCategories(CategoryRepository categoryRepository) {
        return (args) -> {
            List<CategorySeed> categories = List.of(
                    new CategorySeed("জাতীয়", "national"),
                    new CategorySeed("রাজনীতি", "politics"),
                    new CategorySeed("আন্তর্জাতিক", "international"),
                    new CategorySeed("খেলাধুলা", "sports"),
                    new CategorySeed("বিনোদন", "entertainment"));

            int createdCount = 0;
            for (CategorySeed seed : categories) {
                if (categoryRepository.existsBySlug(seed.slug())) {
                    continue;
                }

                Category category = new Category();
                category.setName(seed.name());
                category.setSlug(seed.slug());
                category.setStatus("active");
                categoryRepository.save(category);
                createdCount++;
            }

            log.info("mysql-dev category seeder created {} categories", createdCount);
        };
    }

    private record CategorySeed(String name, String slug) {
    }
}

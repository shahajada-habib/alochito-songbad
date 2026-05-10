package com.alochitosongbad.breakingnews;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BreakingNewsRepository extends JpaRepository<BreakingNews, Long> {

    List<BreakingNews> findAllByOrderByCreatedAtDesc();

    List<BreakingNews> findByActiveTrueOrderByCreatedAtDesc();
}

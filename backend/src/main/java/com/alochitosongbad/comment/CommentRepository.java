package com.alochitosongbad.comment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByNewsIdAndStatusOrderByCreatedAtDesc(Long newsId, String status);

    List<Comment> findAllByOrderByCreatedAtDesc();

    long countByStatus(String status);
}

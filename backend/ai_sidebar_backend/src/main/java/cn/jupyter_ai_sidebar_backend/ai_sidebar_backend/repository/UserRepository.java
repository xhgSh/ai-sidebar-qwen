package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.repository;

import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
} 
package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.repository;

import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.entity.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import java.util.List;

public interface HistoryRepository extends JpaRepository<History, Integer> {
    @Query("SELECT h.chatId, MIN(h.chatTime) FROM History h WHERE h.userId = :userId GROUP BY h.chatId ORDER BY MIN(h.chatTime) DESC")
    List<Object[]> findChatIdAndFirstTimeByUserId(@Param("userId") Integer userId);

    List<History> findByUserIdAndChatIdOrderByChatTimeAsc(Integer userId, Integer chatId);

    @Query("SELECT MAX(h.chatId) FROM History h WHERE h.userId = :userId")
    Integer findMaxChatIdByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE History h SET h.chatId = :newChatId WHERE h.userId = :userId AND h.chatId = :oldChatId")
    int updateChatIdForUser(@Param("userId") Integer userId, @Param("oldChatId") Integer oldChatId, @Param("newChatId") Integer newChatId);

    @Query("SELECT h.chatId, h.request, MAX(h.chatTime) FROM History h WHERE h.userId = :userId GROUP BY h.chatId ORDER BY MAX(h.chatTime) DESC")
    List<Object[]> findLastRequestAndTimeByUserId(@Param("userId") Integer userId);

    @Query("""
    SELECT h FROM History h
    WHERE h.userId = :userId AND h.chatTime = (
        SELECT MAX(h2.chatTime) FROM History h2 WHERE h2.userId = :userId AND h2.chatId = h.chatId
    )
    ORDER BY h.chatTime DESC
    """)
    List<History> findLastHistoryByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("DELETE FROM History h WHERE h.userId = :userId AND h.chatId = :chatId")
    int deleteByUserIdAndChatId(@Param("userId") Integer userId, @Param("chatId") Integer chatId);
} 
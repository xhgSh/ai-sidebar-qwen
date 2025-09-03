package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.ai.openai.api-key=test-key",
    "spring.ai.openai.base-url=http://localhost:8080",
    "spring.ai.openai.chat.api-key=test-key",
    "spring.ai.openai.chat.base-url=http://localhost:8080"
})
class AiSidebarBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}

package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.StreamingChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class AiModelConfig {

    @Value("${spring.ai.openai.text.api-key}")
    private String textApiKey;

    @Value("${spring.ai.openai.text.base-url}")
    private String textBaseUrl;

    @Value("${spring.ai.openai.text.chat.options.model}")
    private String textModel;

    @Value("${spring.ai.openai.multimodal.api-key}")
    private String multimodalApiKey;

    @Value("${spring.ai.openai.multimodal.base-url}")
    private String multimodalBaseUrl;

    @Value("${spring.ai.openai.multimodal.chat.options.model}")
    private String multimodalModel;

    @Bean
    public OpenAiApi textOpenAiApi() {
        // 在Spring AI 1.0.0-M6中，OpenAiApi构造函数需要同时设置baseUrl和apiKey
        return new OpenAiApi(textBaseUrl, textApiKey);
    }

    @Bean
    public OpenAiApi multimodalOpenAiApi() {
        // 在Spring AI 1.0.0-M6中，OpenAiApi构造函数需要同时设置baseUrl和apiKey
        return new OpenAiApi(multimodalBaseUrl, multimodalApiKey);
    }

    @Primary
    @Bean
    public ChatModel syncChatModel(OpenAiApi textOpenAiApi) {
        // 在Spring AI 1.0.0-M6中，使用OpenAiChatOptions.builder()来配置模型参数
        // 注意：OpenAiChatOptions.Builder使用的是model()方法，而不是withModel()
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(textModel)
                .build();
        
        return new OpenAiChatModel(textOpenAiApi, options);
    }

    @Bean
    public StreamingChatModel chatModel(OpenAiApi textOpenAiApi) {
        // 为流式聊天配置相同的模型参数
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(textModel)
                .build();
        
        return new OpenAiChatModel(textOpenAiApi, options);
    }

    @Bean
    @Qualifier("qwenVlModel")
    public ChatModel qwenVlModel(OpenAiApi multimodalOpenAiApi) {
        // 为多模态模型配置特定的模型名称
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(multimodalModel)
                .build();
        
        return new OpenAiChatModel(multimodalOpenAiApi, options);
    }

    @Bean
    @Primary
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.create(chatModel);
    }
}
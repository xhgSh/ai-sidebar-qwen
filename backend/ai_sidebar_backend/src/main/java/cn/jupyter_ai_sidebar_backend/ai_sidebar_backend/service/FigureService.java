package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.service;

import org.springframework.ai.chat.messages.Message; 
import org.springframework.ai.chat.messages.UserMessage; 
import org.springframework.ai.chat.model.ChatModel; 
import org.springframework.ai.chat.prompt.Prompt; 
import org.springframework.ai.chat.prompt.PromptTemplate; 
import org.springframework.beans.factory.annotation.Autowired; 
import org.springframework.beans.factory.annotation.Qualifier; 
import org.springframework.stereotype.Service; 

import java.io.File; 
import java.io.IOException; 
import java.nio.file.Files; 
import java.util.*; 
import java.util.Base64; 

@Service 
public class FigureService {

    @Autowired
    @Qualifier("qwenVlModel")
    private ChatModel qwenVlModel; // 用于图片理解的多模态模型

    // 描述多个图片
    public List<String> describeFigures(String sessionID, String baseDir) {
        List<String> descriptions = new ArrayList<>();
        File dir = new File(baseDir, sessionID);
        File[] files = dir.listFiles((d, name) -> name.endsWith(".png") || name.endsWith(".jpg"));
        if (files == null) return descriptions;
        Arrays.sort(files, Comparator.comparing(File::getName));
        for (File img : files) {
            try {
                String desc = describeImage(img);
                descriptions.add(desc);
            } catch (Exception e) {
                descriptions.add("图片理解失败: " + e.getMessage());
            }
        }
        return descriptions;
    }

    // 使用 qwen-vl-max 描述单个图片
    private String describeImage(File imageFile) throws IOException {
        // 读取图片并转换为base64
        byte[] imageData = Files.readAllBytes(imageFile.toPath());
        String base64Image = Base64.getEncoder().encodeToString(imageData);
        
        // 在Spring AI 1.0.0-M6中，对于支持多模态的模型，我们可以在prompt中包含图片
        // 对于通义千问的qwen-vl-max模型，我们使用特定格式来传递图片
        String prompt = "你是一个jupyter lab图片分析助手，请详细地分析这张图片，描述其中的所有细节，不要说无关的内容\n<|image_start|>data:image/jpeg;base64," + base64Image + "<|image_end|>";
        
        // 构建包含图片的消息
        List<Message> messages = new ArrayList<>();
        messages.add(new UserMessage(prompt));
        
        // 构建提示
        Prompt qwenPrompt = new Prompt(messages);
        
        // 调用模型获取结果
        var response = qwenVlModel.call(qwenPrompt);
        
        // 返回图片描述
        return response.getResult().getOutput().getText();
    }
}
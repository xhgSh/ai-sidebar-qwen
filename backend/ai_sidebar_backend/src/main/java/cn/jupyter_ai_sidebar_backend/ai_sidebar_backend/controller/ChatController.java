package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.StreamingChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import jakarta.servlet.http.HttpSession;
import org.springframework.ai.chat.messages.Message;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import reactor.core.publisher.Sinks;
import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.entity.History;
import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.repository.HistoryRepository;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.ai.chat.model.ChatModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.service.FigureService;

import javax.swing.plaf.synth.SynthTabbedPaneUI;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private StreamingChatModel chatModel;

    @Autowired
    private ChatModel syncChatModel;

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private FigureService figureService;

    // 每个 session 独立的 MessageWindowChatMemory
    private final ConcurrentHashMap<String, ChatMemory> memoryMap = new ConcurrentHashMap<>();

    private ChatMemory getSessionMemory(HttpSession session) {
        String sessionId = session.getId();
        return memoryMap.computeIfAbsent(sessionId, k -> new InMemoryChatMemory());
    }

    @GetMapping(value = "/stream", produces = "text/event-stream;charset=UTF-8")
    public Flux<String> chatStream(@RequestParam("message") String message,
                                   @RequestParam(value = "codebase", required = false) String codebase,
                                   @RequestParam(value = "chatId", required = false) Integer chatIdParam,
                                   HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        Integer chatId;
        if (chatIdParam != null) {
            // 优先使用前端传递的chatId
            chatId = chatIdParam;
        } else {
            // 其次从session中获取
            chatId = (Integer) session.getAttribute("chatId");
            if (chatId == null) {
                Integer maxChatId = historyRepository.findMaxChatIdByUserId(userId);
                chatId = (maxChatId == null ? 1 : maxChatId + 1);
            }
        }
        session.setAttribute("chatId", chatId);
        String sessionId = session.getId();

//        System.out.println("now session: " + sessionId);

        ChatMemory memory = getSessionMemory(session);
        // ChatMemory 只存 message
        memory.add(sessionId, new UserMessage(message));
        // 获取历史消息
        List<Message> history = memory.get(sessionId, 20);
        // 构造 Prompt，先加 codebase（如有）再加历史
        List<Message> promptMessages = new ArrayList<>();
        // 合并 notebookNote 到系统提示词
        String systemPrompt = "你是一个编程专家，我在使用jupyter lab进行编程开发，请简介并专业地回答我的问题。" +
            "注意：notebook的每个cell可能不是按顺序执行的；如果某个cell有代码没有输出，则可能是还没有运行这个cell；如果某个cell代码和输出非常不匹配，则可能是在运行过的cell中添加了新的代码，请不要对这种情况产生疑问。" +
            "如果某个cell的output中包含{此处图片1的描述：。。}类似的内容，这说明这里是图片输出，我使用图片理解的工具为你描述了图片，请参考此处内容。" +
            "注意，我给你的codebase是json格式的，因为这样可以方便你理解；但是为了方便我理解，你的回答中要避免使用这样的json格式的代码块,即使作为参考也不行。";
        
        // 检测并替换output中<Figure ...>
        if (codebase != null && codebase.contains("<Figure")) {
            String baseDir = "src/main/resources/static/codebase_figures";
            List<String> descriptions = figureService.describeFigures(sessionId, baseDir);
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(codebase);
                int descIdx = 0;
                Pattern figPattern = Pattern.compile("<Figure[^>]*>");
                if (root.has("cells") && root.get("cells").isArray()) {
                    for (JsonNode cell : root.get("cells")) {
                        if (cell.has("output")) {
                            String output = cell.get("output").asText();
                            Matcher m = figPattern.matcher(output);
                            if (m.find() && descIdx < descriptions.size()) {
                                String newOutput = m.replaceAll("此处图片" + (descIdx + 1) + "的描述：" + descriptions.get(descIdx));
                                ((ObjectNode) cell).put("output", newOutput);
                                descIdx++;
                            }
                        }
                    }
                }
                codebase = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
            } catch (Exception e) {
                // fallback: 不做替换
            }
        }
        
        promptMessages.add(new SystemMessage(systemPrompt));
        if (codebase != null && !codebase.trim().isEmpty()) {
            promptMessages.add(new SystemMessage(codebase));
        }
        promptMessages.addAll(history);
        Prompt prompt = new Prompt(promptMessages);
//        System.out.println("history: " + history);

        // 用于收集完整AI回复
        StringBuilder aiReply = new StringBuilder();
        Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();

        final Integer finalChatId = chatId;
        final Integer finalUserId = userId;
        final String userMsg = message;
        final String finalCodebase = codebase;

        chatModel.stream(prompt)
            .doOnNext(resp -> {
                String chunk = resp.getResult().getOutput().getText();
                aiReply.append(chunk);
                sink.tryEmitNext(chunk);
            })
            .doOnComplete(() -> {
                // 只在流式结束时追加完整AI回复
                memory.add(sessionId, respToAssistantMessage(aiReply.toString()));
                // 存历史（只存用户原始message，不存codebase和提示词）
                History h = new History();
                h.setUserId(finalUserId);
                h.setChatId(finalChatId);
                h.setRequest(userMsg); // 只存原始用户输入
                h.setResponse(aiReply.toString());
                h.setCodebase(finalCodebase); // 新增，存 codebase
                h.setChatTime(new java.sql.Timestamp(System.currentTimeMillis()));
                historyRepository.save(h);
                // 完成流式传输，不再发送额外的end事件
                sink.tryEmitComplete();
            })
            .doOnError(e -> sink.tryEmitError(e))
            .subscribe();

        return sink.asFlux();
    }

    // 辅助方法：构造 AssistantMessage
    private Message respToAssistantMessage(String text) {
        // 兼容不同 spring-ai 版本
        try {
            Class<?> clazz = Class.forName("org.springframework.ai.chat.messages.AssistantMessage");
            return (Message) clazz.getConstructor(String.class).newInstance(text);
        } catch (Exception e) {
            // 兜底：用 SystemMessage 代替
            return new SystemMessage(text);
        }
    }

    // 新建对话，生成新chatId并清除ChatMemory
    @PostMapping("/new")
    public ResponseEntity<?> newChat(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        Integer maxChatId = historyRepository.findMaxChatIdByUserId(userId);
        Integer chatId = (maxChatId == null ? 1 : maxChatId + 1);
        session.setAttribute("chatId", chatId);
        String sessionId = session.getId();
        // 彻底重置 memory
        memoryMap.put(sessionId, new InMemoryChatMemory());
        return ResponseEntity.ok(Map.of("chatId", chatId));
    }

    // 查询所有历史对话的最后一条request和时间，按时间倒序
    @GetMapping("/history/list")
    public ResponseEntity<?> listHistory(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        List<History> list = historyRepository.findLastHistoryByUserId(userId);
        return ResponseEntity.ok(list.stream().map(h -> Map.of(
            "chatId", h.getChatId(),
            "lastRequest", h.getRequest(),
            "lastTime", h.getChatTime()
        )).toList());
    }

    // 查询单次聊天所有历史
    @GetMapping("/history/detail")
    public ResponseEntity<?> chatDetail(@RequestParam Integer chatId, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        List<History> list = historyRepository.findByUserIdAndChatIdOrderByChatTimeAsc(userId, chatId);
        return ResponseEntity.ok(list);
    }

    // 载入历史记录并迁移 chatId
    @PostMapping("/history/load")
    @Transactional
    public ResponseEntity<?> loadHistory(@RequestParam Integer chatId, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        // 查出历史
        List<History> list = historyRepository.findByUserIdAndChatIdOrderByChatTimeAsc(userId, chatId);
        if (list.isEmpty()) return ResponseEntity.badRequest().body("历史不存在");
        // 新 chatId
        Integer maxChatId = historyRepository.findMaxChatIdByUserId(userId);
        Integer newChatId = (maxChatId == null ? 1 : maxChatId + 1);
        // 批量更新 chatId
        historyRepository.updateChatIdForUser(userId, chatId, newChatId);
        // 载入 ChatMemory
        String sessionId = session.getId();
        ChatMemory memory = new InMemoryChatMemory();
        for (History h : list) {
            memory.add(sessionId, new UserMessage(h.getRequest()));
            memory.add(sessionId, respToAssistantMessage(h.getResponse()));
        }
        memoryMap.put(sessionId, memory); // 用新 memory 覆盖
        session.setAttribute("chatId", newChatId);
        return ResponseEntity.ok(Map.of("chatId", newChatId));
    }

    @PostMapping("/history/delete")
    @Transactional
    public ResponseEntity<?> deleteHistory(@RequestParam Integer chatId, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        int count = historyRepository.deleteByUserIdAndChatId(userId, chatId);
        return ResponseEntity.ok(Map.of("deleted", count));
    }

    @PostMapping(value = "/apply", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> applyCode(@RequestBody Map<String, String> req) {
//        System.out.println("applying");

        String codebase = req.getOrDefault("codebase", "");
        String advice = req.getOrDefault("advice", "");
        String applyCode = req.getOrDefault("apply_code", "");

//        System.out.println("codebase\n"+codebase);
//        System.out.println("advice\n"+advice);
//        System.out.println("applyCode\n"+applyCode);


        // 构造提示词
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("## AI 编程助手提示词（适用于 Jupyter 环境）\n\n");
        promptBuilder.append("### 角色设定  \n你现在是一个 AI 编程助手，我正在使用 **Jupyter Notebook** 进行python编程开发。\n\n");
        promptBuilder.append("### 输入信息  \n请根据以下三项输入内容整理回答：\n\n");
        promptBuilder.append("1. **我的当前 codebase**（代码上下文）  \n\n");
        promptBuilder.append("以下是 notebook 的所有 cell，为方便你理解，格式为 JSON，每个 cell 有 cell_index、code、output 三个字段。\n");
        promptBuilder.append(codebase).append("\n\n");
        promptBuilder.append("请遍历 codebase 中所有 cell，判断哪些 cell 需要被修改，并返回所有需要修改的 cell_index。\n");
        promptBuilder.append("请严格根据 codebase 中 cell 的编号（cell_index 字段），返回正确的 cell_index（即编号中的数字）。\n");
        promptBuilder.append("如果你要修改 cell2，请返回 cell_index: 2。\n");
        promptBuilder.append("不要总是返回 cell_index: 1，除非确实只需要修改第一个 cell。\n");
        promptBuilder.append("2. **来自专家的代码修改建议**  \n\n");
        promptBuilder.append(advice).append("\n\n");
        promptBuilder.append("3. **专家建议中我希望应用的新代码或修改内容**\n\n");
        promptBuilder.append(applyCode).append("\n\n");

        promptBuilder.append("### 任务要求  \n请严格根据 codebase 中 cell 的编号（如 cell_index: 1、cell_index: 2...），先判断是哪个 cell 需要被修改，并返回正确的 cell_index（即编号中的数字）。\n");
        promptBuilder.append("为我生成更新后对应的 cell 中的完整代码内容。  \n注意：\n- 提供的新代码可能需要进行补全或删减，以确保该 cell 中的业务逻辑正确无误；\n- 原始代码也可能不需要任何更改。\n\n### 输出格式  \n你的输出应包含一个如下格式的 JSON 响应，其中包含两列信息：\n\n- `cell_index`：cell 的序号  \n- `updated_code`：该 cell 中修改或补全后的完整代码内容  \n\n#### 示例输出\n\n```json\n{\n  \"modifications\": [\n    {\n      \"cell_index\": 1,\n      \"updated_code\": \"print(\\\"hello world\\\")\"\n    },\n    {\n      \"cell_index\": 2,\n      \"updated_code\": \"a = 1\nprint(a)\"\n    }\n  ]\n}\n```\n\n### 补充说明  \n如果没有足够的信息，或者无法确定如何修改，请返回空值（空对象 `{}` 或空数组 `[]`）。\n不要输出其他无关内容，一定要确保回答可以直接被json解析。\n");

        String prompt = promptBuilder.toString();
        // 调用大模型
        Prompt aiPrompt = new Prompt(List.of(new UserMessage(prompt)));
        String aiResult = syncChatModel.call(aiPrompt).getResult().getOutput().getText();
        // 只返回模型原始文本，前端负责解析

        System.out.println("result: " + aiResult);

        return ResponseEntity.ok(Map.of("result", aiResult));
    }
}
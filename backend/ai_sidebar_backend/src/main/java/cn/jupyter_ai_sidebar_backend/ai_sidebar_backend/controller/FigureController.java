package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.service.FigureService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/figures")
public class FigureController {
    @Value("${figure.upload.dir:src/main/resources/static/codebase_figures}")
    private String baseDir;

    private static final Logger logger = LoggerFactory.getLogger(FigureController.class);

    @Autowired
    private FigureService figureService;

    // 清空session目录
    @PostMapping("/clear")
    public ResponseEntity<?> clearSessionDir(HttpSession session) {
        String sessionID = session.getId();
        File dir = new File(baseDir, sessionID);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            logger.info("[clearSessionDir] 创建目录: {} 成功? {}", dir.getAbsolutePath(), created);
        }
        if (dir.exists() && dir.isDirectory()) {
            for (File file : Objects.requireNonNull(dir.listFiles())) {
                boolean deleted = file.delete();
                logger.info("[clearSessionDir] 删除文件: {} 成功? {}", file.getAbsolutePath(), deleted);
            }
        }
        return ResponseEntity.ok("cleared");
    }

    // 上传多图片
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFigures(HttpSession session, @RequestParam("files") MultipartFile[] files) throws IOException {
        String sessionID = session.getId();
        File dir = new File(baseDir, sessionID);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            logger.info("[uploadFigures] 创建目录: {} 成功? {}", dir.getAbsolutePath(), created);
        }
        int idx = 1;
        for (MultipartFile file : files) {
            String ext = Objects.requireNonNull(file.getOriginalFilename()).toLowerCase().endsWith(".png") ? ".png" : ".jpg";
            Path path = Paths.get(dir.getAbsolutePath(), idx + ext);
            Files.write(path, file.getBytes());
            logger.info("[uploadFigures] 写入文件: {} 大小: {} bytes", path, file.getSize());
            idx++;
        }
        return ResponseEntity.ok("uploaded");
    }

    // 图片描述接口
    @PostMapping("/describe")
    public ResponseEntity<?> describeFigures(HttpSession session) {
        String sessionID = session.getId();
        List<String> descriptions = figureService.describeFigures(sessionID, baseDir);
        return ResponseEntity.ok(descriptions);
    }

}
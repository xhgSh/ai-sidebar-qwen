package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.controller;

import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.entity.User;
import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> req) {
        try {
            User user = userService.register(req.get("username"), req.get("password"), req.get("email"));
            return ResponseEntity.ok("注册成功");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req, HttpSession session) {
        try {
            User user = userService.login(req.get("username"), req.get("password"));
            session.setAttribute("user", user);
            session.setAttribute("userId", user.getId());
            return ResponseEntity.ok("登录成功");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body("未登录");
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("已登出");
    }

    @GetMapping("/userinfo")
    public ResponseEntity<?> userInfo(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        User user = userService.findById(userId);
        return ResponseEntity.ok(Map.of("username", user.getUsername(), "email", user.getEmail()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> req, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        try {
            userService.changePassword(userId, req.get("oldPassword"), req.get("newPassword"));
            session.invalidate();
            return ResponseEntity.ok("修改成功，请重新登录");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("未登录");
        userService.deleteUser(userId);
        session.invalidate();
        return ResponseEntity.ok("账号已注销");
    }
} 
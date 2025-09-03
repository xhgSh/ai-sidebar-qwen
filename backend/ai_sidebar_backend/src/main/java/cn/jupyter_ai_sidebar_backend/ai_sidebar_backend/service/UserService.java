package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.service;

import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.repository.UserRepository;
import cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public User register(String username, String password, String email) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        return userRepository.save(user);
    }

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        return user;
    }

    public User findById(Integer id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        User user = findById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void deleteUser(Integer userId) {
        userRepository.deleteById(userId);
    }
} 
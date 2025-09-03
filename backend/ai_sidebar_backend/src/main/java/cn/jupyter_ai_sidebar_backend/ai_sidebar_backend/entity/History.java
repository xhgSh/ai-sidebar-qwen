package cn.jupyter_ai_sidebar_backend.ai_sidebar_backend.entity;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "history")
public class History {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer userId;
    private Integer chatId;
    @Column(columnDefinition = "TEXT")
    private String request;
    @Column(columnDefinition = "TEXT")
    private String response;
    @Column(columnDefinition = "TEXT")
    private String codebase;
    private Timestamp chatTime;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getChatId() { return chatId; }
    public void setChatId(Integer chatId) { this.chatId = chatId; }
    public String getRequest() { return request; }
    public void setRequest(String request) { this.request = request; }
    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    public String getCodebase() { return codebase; }
    public void setCodebase(String codebase) { this.codebase = codebase; }
    public Timestamp getChatTime() { return chatTime; }
    public void setChatTime(Timestamp chatTime) { this.chatTime = chatTime; }
} 
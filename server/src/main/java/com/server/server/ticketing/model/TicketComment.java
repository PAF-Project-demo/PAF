package com.server.server.ticketing.model;

import java.time.LocalDateTime;

public class TicketComment {

    private String id;
    private String message;
    private LocalDateTime createdAt;
    private TicketActorSummary author;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public TicketActorSummary getAuthor() {
        return author;
    }

    public void setAuthor(TicketActorSummary author) {
        this.author = author;
    }
}

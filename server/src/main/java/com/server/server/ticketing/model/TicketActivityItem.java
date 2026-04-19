package com.server.server.ticketing.model;

import java.time.LocalDateTime;

public class TicketActivityItem {

    private String id;
    private String action;
    private String message;
    private LocalDateTime createdAt;
    private TicketActorSummary actor;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
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

    public TicketActorSummary getActor() {
        return actor;
    }

    public void setActor(TicketActorSummary actor) {
        this.actor = actor;
    }
}

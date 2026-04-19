package com.server.server.ticketing.model;

import java.time.LocalDateTime;

public class TicketAttachment {

    private String id;
    private String fileName;
    private String originalName;
    private String mimeType;
    private long size;
    private String url;
    private LocalDateTime uploadedAt;
    private TicketActorSummary uploadedBy;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public TicketActorSummary getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(TicketActorSummary uploadedBy) {
        this.uploadedBy = uploadedBy;
    }
}

package com.server.server.ticketing.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    @Indexed
    private String ticketId;

    private String title;

    private String description;

    private TicketType type;

    private TicketPriority priority;

    private String category;

    private TicketStatus status;

    private TicketLocation location;

    private TicketUserSummary reporter;

    private TicketUserSummary assignedTechnician;

    private boolean requiresExtendedResolution;

    private int slaHours;

    private LocalDateTime dueAt;

    private boolean overdue;

    private LocalDateTime resolvedAt;

    private LocalDateTime closedAt;

    private boolean deleted;

    private LocalDateTime deletedAt;

    private String deletedByUserId;

    private List<TicketAttachment> attachments = new ArrayList<>();

    private List<TicketComment> comments = new ArrayList<>();

    private List<TicketActivityItem> activity = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TicketType getType() {
        return type;
    }

    public void setType(TicketType type) {
        this.type = type;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public TicketLocation getLocation() {
        return location;
    }

    public void setLocation(TicketLocation location) {
        this.location = location;
    }

    public TicketUserSummary getReporter() {
        return reporter;
    }

    public void setReporter(TicketUserSummary reporter) {
        this.reporter = reporter;
    }

    public TicketUserSummary getAssignedTechnician() {
        return assignedTechnician;
    }

    public void setAssignedTechnician(TicketUserSummary assignedTechnician) {
        this.assignedTechnician = assignedTechnician;
    }

    public boolean isRequiresExtendedResolution() {
        return requiresExtendedResolution;
    }

    public void setRequiresExtendedResolution(boolean requiresExtendedResolution) {
        this.requiresExtendedResolution = requiresExtendedResolution;
    }

    public int getSlaHours() {
        return slaHours;
    }

    public void setSlaHours(int slaHours) {
        this.slaHours = slaHours;
    }

    public LocalDateTime getDueAt() {
        return dueAt;
    }

    public void setDueAt(LocalDateTime dueAt) {
        this.dueAt = dueAt;
    }

    public boolean isOverdue() {
        return overdue;
    }

    public void setOverdue(boolean overdue) {
        this.overdue = overdue;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public String getDeletedByUserId() {
        return deletedByUserId;
    }

    public void setDeletedByUserId(String deletedByUserId) {
        this.deletedByUserId = deletedByUserId;
    }

    public List<TicketAttachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<TicketAttachment> attachments) {
        this.attachments = attachments;
    }

    public List<TicketComment> getComments() {
        return comments;
    }

    public void setComments(List<TicketComment> comments) {
        this.comments = comments;
    }

    public List<TicketActivityItem> getActivity() {
        return activity;
    }

    public void setActivity(List<TicketActivityItem> activity) {
        this.activity = activity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

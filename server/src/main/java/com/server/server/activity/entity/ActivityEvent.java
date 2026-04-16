package com.server.server.activity.entity;

import com.server.server.auth.entity.UserRole;
import com.server.server.user.entity.RoleRequestStatus;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "activity_events")
public class ActivityEvent {

    @Id
    private String id;

    @Indexed
    private ActivityEventType eventType;

    private String title;

    private String message;

    @Indexed
    private String actorUserId;

    private String actorEmail;

    private String actorDisplayName;

    @Indexed
    private String subjectUserId;

    private String subjectEmail;

    private String subjectDisplayName;

    private UserRole previousRole;

    private UserRole requestedRole;

    private UserRole resultingRole;

    @Indexed
    private String roleRequestId;

    private RoleRequestStatus roleRequestStatus;

    @Indexed
    private LocalDateTime createdAt;

    private List<String> readByUserIds = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ActivityEventType getEventType() {
        return eventType;
    }

    public void setEventType(ActivityEventType eventType) {
        this.eventType = eventType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(String actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getActorDisplayName() {
        return actorDisplayName;
    }

    public void setActorDisplayName(String actorDisplayName) {
        this.actorDisplayName = actorDisplayName;
    }

    public String getSubjectUserId() {
        return subjectUserId;
    }

    public void setSubjectUserId(String subjectUserId) {
        this.subjectUserId = subjectUserId;
    }

    public String getSubjectEmail() {
        return subjectEmail;
    }

    public void setSubjectEmail(String subjectEmail) {
        this.subjectEmail = subjectEmail;
    }

    public String getSubjectDisplayName() {
        return subjectDisplayName;
    }

    public void setSubjectDisplayName(String subjectDisplayName) {
        this.subjectDisplayName = subjectDisplayName;
    }

    public UserRole getPreviousRole() {
        return previousRole;
    }

    public void setPreviousRole(UserRole previousRole) {
        this.previousRole = previousRole;
    }

    public UserRole getRequestedRole() {
        return requestedRole;
    }

    public void setRequestedRole(UserRole requestedRole) {
        this.requestedRole = requestedRole;
    }

    public UserRole getResultingRole() {
        return resultingRole;
    }

    public void setResultingRole(UserRole resultingRole) {
        this.resultingRole = resultingRole;
    }

    public String getRoleRequestId() {
        return roleRequestId;
    }

    public void setRoleRequestId(String roleRequestId) {
        this.roleRequestId = roleRequestId;
    }

    public RoleRequestStatus getRoleRequestStatus() {
        return roleRequestStatus;
    }

    public void setRoleRequestStatus(RoleRequestStatus roleRequestStatus) {
        this.roleRequestStatus = roleRequestStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getReadByUserIds() {
        return readByUserIds;
    }

    public void setReadByUserIds(List<String> readByUserIds) {
        this.readByUserIds = readByUserIds;
    }
}

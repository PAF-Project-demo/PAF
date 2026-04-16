package com.server.server.activity.service;

import com.server.server.activity.dto.ActivityFeedItemResponse;
import com.server.server.activity.dto.ActivityNotificationFeedResponse;
import com.server.server.activity.entity.ActivityEvent;
import com.server.server.activity.entity.ActivityEventType;
import com.server.server.activity.repository.ActivityEventRepository;
import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.user.entity.RoleRequest;
import com.server.server.user.entity.RoleRequestStatus;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class ActivityEventService {

    private static final int DEFAULT_NOTIFICATION_LIMIT = 8;
    private static final int MAX_NOTIFICATION_LIMIT = 20;
    private static final int DEFAULT_AUDIT_LIMIT = 40;
    private static final int MAX_AUDIT_LIMIT = 100;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"));

    private final ActivityEventRepository activityEventRepository;

    public ActivityEventService(ActivityEventRepository activityEventRepository) {
        this.activityEventRepository = activityEventRepository;
    }

    public void recordRoleRequestCreated(User requester, RoleRequest roleRequest) {
        ActivityEvent event = baseRoleRequestEvent(
                ActivityEventType.ROLE_REQUEST_CREATED,
                "Role request submitted",
                requester,
                roleRequest);
        event.setMessage(getDisplayName(requester) + " requested "
                + formatRoleLabel(getRequestedRole(roleRequest)) + " access.");
        event.setPreviousRole(getUserRole(requester));
        event.setRequestedRole(getRequestedRole(roleRequest));
        event.setResultingRole(getUserRole(requester));
        save(event);
    }

    public void recordRoleRequestUpdated(User requester, RoleRequest roleRequest) {
        ActivityEvent event = baseRoleRequestEvent(
                ActivityEventType.ROLE_REQUEST_UPDATED,
                "Role request updated",
                requester,
                roleRequest);
        event.setMessage(getDisplayName(requester) + " updated a request for "
                + formatRoleLabel(getRequestedRole(roleRequest)) + " access.");
        event.setPreviousRole(getCurrentRole(roleRequest));
        event.setRequestedRole(getRequestedRole(roleRequest));
        event.setResultingRole(getCurrentRole(roleRequest));
        save(event);
    }

    public void recordRoleRequestDeleted(User requester, RoleRequest roleRequest) {
        ActivityEvent event = baseRoleRequestEvent(
                ActivityEventType.ROLE_REQUEST_DELETED,
                "Role request deleted",
                requester,
                roleRequest);
        event.setMessage(getDisplayName(requester) + " deleted a request for "
                + formatRoleLabel(getRequestedRole(roleRequest)) + " access.");
        event.setPreviousRole(getCurrentRole(roleRequest));
        event.setRequestedRole(getRequestedRole(roleRequest));
        event.setResultingRole(getCurrentRole(roleRequest));
        save(event);
    }

    public void recordRoleRequestApproved(
            User adminUser,
            User requester,
            UserRole previousRole,
            RoleRequest roleRequest) {
        ActivityEvent event = baseRoleRequestEvent(
                ActivityEventType.ROLE_REQUEST_APPROVED,
                "Role request approved",
                adminUser,
                roleRequest);
        event.setSubjectUserId(requester.getId());
        event.setSubjectEmail(requester.getEmail());
        event.setSubjectDisplayName(getDisplayName(requester));
        event.setMessage(getDisplayName(adminUser) + " approved "
                + getDisplayName(requester) + "'s request for "
                + formatRoleLabel(getRequestedRole(roleRequest)) + " access.");
        event.setPreviousRole(previousRole != null ? previousRole : getCurrentRole(roleRequest));
        event.setRequestedRole(getRequestedRole(roleRequest));
        event.setResultingRole(getUserRole(requester));
        event.setRoleRequestStatus(RoleRequestStatus.APPROVED);
        save(event);
    }

    public void recordRoleRequestRejected(User adminUser, RoleRequest roleRequest) {
        ActivityEvent event = baseRoleRequestEvent(
                ActivityEventType.ROLE_REQUEST_REJECTED,
                "Role request rejected",
                adminUser,
                roleRequest);

        String message = getDisplayName(adminUser) + " rejected "
                + getRoleRequestSubjectDisplayName(roleRequest) + "'s request for "
                + formatRoleLabel(getRequestedRole(roleRequest)) + " access.";
        if (isNotBlank(roleRequest.getRejectionReason())) {
            message = message + " Feedback: " + roleRequest.getRejectionReason().trim();
        }

        event.setMessage(message);
        event.setPreviousRole(getCurrentRole(roleRequest));
        event.setRequestedRole(getRequestedRole(roleRequest));
        event.setResultingRole(getCurrentRole(roleRequest));
        event.setRoleRequestStatus(RoleRequestStatus.REJECTED);
        save(event);
    }

    public void recordDirectRoleChange(User adminUser, User targetUser, UserRole previousRole) {
        ActivityEvent event = new ActivityEvent();
        populateActor(event, adminUser);
        populateSubject(event, targetUser);
        event.setEventType(ActivityEventType.USER_ROLE_CHANGED);
        event.setTitle("User role changed");
        event.setMessage(getDisplayName(adminUser) + " changed "
                + getDisplayName(targetUser) + "'s role from "
                + formatRoleLabel(previousRole) + " to "
                + formatRoleLabel(getUserRole(targetUser)) + ".");
        event.setPreviousRole(previousRole != null ? previousRole : UserRole.USER);
        event.setRequestedRole(getUserRole(targetUser));
        event.setResultingRole(getUserRole(targetUser));
        save(event);
    }

    public ActivityNotificationFeedResponse getNotificationFeed(User viewer, int requestedLimit) {
        String viewerUserId = viewer.getId();
        Pageable pageable = PageRequest.of(
                0,
                normalizeLimit(requestedLimit, DEFAULT_NOTIFICATION_LIMIT, MAX_NOTIFICATION_LIMIT),
                NEWEST_FIRST);

        List<ActivityEvent> events = isAdmin(viewer)
                ? activityEventRepository.findAll(pageable).getContent()
                : activityEventRepository.findBySubjectUserId(viewerUserId, pageable);

        long unreadCount = isAdmin(viewer)
                ? activityEventRepository.countUnreadForAdmin(viewerUserId)
                : activityEventRepository.countUnreadBySubjectUserId(viewerUserId, viewerUserId);

        return new ActivityNotificationFeedResponse(
                unreadCount,
                events.stream()
                        .map(event -> mapToResponse(event, viewerUserId))
                        .toList());
    }

    public List<ActivityFeedItemResponse> getAuditLog(int requestedLimit) {
        Pageable pageable = PageRequest.of(
                0,
                normalizeLimit(requestedLimit, DEFAULT_AUDIT_LIMIT, MAX_AUDIT_LIMIT),
                NEWEST_FIRST);

        return activityEventRepository.findAll(pageable).getContent().stream()
                .map(event -> mapToResponse(event, null))
                .toList();
    }

    public long markVisibleNotificationsAsRead(User viewer) {
        String viewerUserId = viewer.getId();
        List<ActivityEvent> unreadEvents = isAdmin(viewer)
                ? activityEventRepository.findUnreadForAdmin(viewerUserId)
                : activityEventRepository.findUnreadBySubjectUserId(viewerUserId, viewerUserId);

        if (unreadEvents.isEmpty()) {
            return 0;
        }

        unreadEvents.forEach(event -> markAsRead(event, viewerUserId));
        activityEventRepository.saveAll(unreadEvents);
        return unreadEvents.size();
    }

    private ActivityEvent baseRoleRequestEvent(
            ActivityEventType eventType,
            String title,
            User actor,
            RoleRequest roleRequest) {
        ActivityEvent event = new ActivityEvent();
        populateActor(event, actor);
        populateSubject(event, roleRequest);
        event.setEventType(eventType);
        event.setTitle(title);
        event.setRoleRequestId(roleRequest.getId());
        event.setRoleRequestStatus(roleRequest.getStatus());
        return event;
    }

    private ActivityFeedItemResponse mapToResponse(ActivityEvent event, String viewerUserId) {
        return new ActivityFeedItemResponse(
                event.getId(),
                event.getEventType(),
                event.getTitle(),
                event.getMessage(),
                event.getActorUserId(),
                event.getActorDisplayName(),
                event.getActorEmail(),
                event.getSubjectUserId(),
                event.getSubjectDisplayName(),
                event.getSubjectEmail(),
                event.getPreviousRole(),
                event.getRequestedRole(),
                event.getResultingRole(),
                event.getRoleRequestId(),
                event.getRoleRequestStatus(),
                viewerUserId != null && isReadBy(event, viewerUserId),
                event.getCreatedAt());
    }

    private void populateActor(ActivityEvent event, User actor) {
        event.setActorUserId(actor.getId());
        event.setActorEmail(actor.getEmail());
        event.setActorDisplayName(getDisplayName(actor));
    }

    private void populateSubject(ActivityEvent event, User subject) {
        event.setSubjectUserId(subject.getId());
        event.setSubjectEmail(subject.getEmail());
        event.setSubjectDisplayName(getDisplayName(subject));
    }

    private void populateSubject(ActivityEvent event, RoleRequest roleRequest) {
        event.setSubjectUserId(roleRequest.getRequesterUserId());
        event.setSubjectEmail(roleRequest.getRequesterEmail());
        event.setSubjectDisplayName(getRoleRequestSubjectDisplayName(roleRequest));
    }

    private void save(ActivityEvent event) {
        event.setCreatedAt(LocalDateTime.now());
        if (event.getReadByUserIds() == null) {
            event.setReadByUserIds(new ArrayList<>());
        }
        activityEventRepository.save(event);
    }

    private void markAsRead(ActivityEvent event, String viewerUserId) {
        List<String> readByUserIds = event.getReadByUserIds();
        if (readByUserIds == null) {
            readByUserIds = new ArrayList<>();
            event.setReadByUserIds(readByUserIds);
        }

        if (!readByUserIds.contains(viewerUserId)) {
            readByUserIds.add(viewerUserId);
        }
    }

    private boolean isReadBy(ActivityEvent event, String viewerUserId) {
        List<String> readByUserIds = event.getReadByUserIds();
        return readByUserIds != null && readByUserIds.contains(viewerUserId);
    }

    private boolean isAdmin(User user) {
        return getUserRole(user) == UserRole.ADMIN;
    }

    private UserRole getUserRole(User user) {
        return user.getRole() != null ? user.getRole() : UserRole.USER;
    }

    private UserRole getRequestedRole(RoleRequest roleRequest) {
        return roleRequest.getRequestedRole() != null ? roleRequest.getRequestedRole() : UserRole.USER;
    }

    private UserRole getCurrentRole(RoleRequest roleRequest) {
        return roleRequest.getCurrentRole() != null ? roleRequest.getCurrentRole() : UserRole.USER;
    }

    private String getDisplayName(User user) {
        return isNotBlank(user.getDisplayName()) ? user.getDisplayName().trim() : user.getEmail();
    }

    private String getRoleRequestSubjectDisplayName(RoleRequest roleRequest) {
        return isNotBlank(roleRequest.getRequesterDisplayName())
                ? roleRequest.getRequesterDisplayName().trim()
                : roleRequest.getRequesterEmail();
    }

    private String formatRoleLabel(UserRole role) {
        UserRole normalizedRole = role != null ? role : UserRole.USER;
        String lowerCaseValue = normalizedRole.name().toLowerCase();
        return Character.toUpperCase(lowerCaseValue.charAt(0)) + lowerCaseValue.substring(1);
    }

    private int normalizeLimit(int requestedLimit, int fallbackLimit, int maxLimit) {
        if (requestedLimit <= 0) {
            return fallbackLimit;
        }

        return Math.min(requestedLimit, maxLimit);
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

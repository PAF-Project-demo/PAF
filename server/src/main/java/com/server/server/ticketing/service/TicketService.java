package com.server.server.ticketing.service;

import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.auth.exception.ForbiddenAccessException;
import com.server.server.auth.repository.UserRepository;
import com.server.server.ticketing.dto.AddTicketCommentRequest;
import com.server.server.ticketing.dto.CreateTicketRequest;
import com.server.server.ticketing.dto.EditTicketRequest;
import com.server.server.ticketing.dto.TicketActivityItemResponse;
import com.server.server.ticketing.dto.TicketActorResponse;
import com.server.server.ticketing.dto.TicketAttachmentResponse;
import com.server.server.ticketing.dto.TicketCommentResponse;
import com.server.server.ticketing.dto.TicketDashboardCardsResponse;
import com.server.server.ticketing.dto.TicketDashboardChartsResponse;
import com.server.server.ticketing.dto.TicketDashboardResponse;
import com.server.server.ticketing.dto.TicketDeleteResponse;
import com.server.server.ticketing.dto.TicketListResponse;
import com.server.server.ticketing.dto.TicketLocationRequest;
import com.server.server.ticketing.dto.TicketLocationResponse;
import com.server.server.ticketing.dto.TicketMetaResponse;
import com.server.server.ticketing.dto.TicketMetricItemResponse;
import com.server.server.ticketing.dto.TicketMonthlyTrendItemResponse;
import com.server.server.ticketing.dto.TicketPaginationResponse;
import com.server.server.ticketing.dto.TicketReportsResponse;
import com.server.server.ticketing.dto.TicketReportsSummaryResponse;
import com.server.server.ticketing.dto.TicketResponse;
import com.server.server.ticketing.dto.TicketSlaBucketResponse;
import com.server.server.ticketing.dto.TicketSlaPolicyResponse;
import com.server.server.ticketing.dto.TicketUserResponse;
import com.server.server.ticketing.dto.UpdateTicketRequest;
import com.server.server.ticketing.exception.InvalidTicketException;
import com.server.server.ticketing.exception.TicketNotFoundException;
import com.server.server.ticketing.model.Ticket;
import com.server.server.ticketing.model.TicketActivityItem;
import com.server.server.ticketing.model.TicketActorSummary;
import com.server.server.ticketing.model.TicketAttachment;
import com.server.server.ticketing.model.TicketComment;
import com.server.server.ticketing.model.TicketLocation;
import com.server.server.ticketing.model.TicketPriority;
import com.server.server.ticketing.model.TicketStatus;
import com.server.server.ticketing.model.TicketType;
import com.server.server.ticketing.model.TicketUserSummary;
import com.server.server.ticketing.repository.TicketRepository;
import com.server.server.user.service.UserAccessService;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TicketService {

    private static final Sort TICKET_SORT = Sort.by(Sort.Order.desc("createdAt"));

    private static final List<String> STUDENT_TICKET_CATEGORIES = List.of(
            "Air Conditioning",
            "Electricity / Lighting",
            "Water / Plumbing",
            "Internet / Wi-Fi",
            "Classroom Equipment",
            "Access / Security",
            "Cleaning / Housekeeping",
            "Furniture / Facility Damage",
            "Other");

    private static final Map<String, String> LEGACY_CATEGORY_MAP = Map.of(
            "HVAC", "Air Conditioning",
            "Electrical", "Electricity / Lighting",
            "Plumbing", "Water / Plumbing",
            "Networking", "Internet / Wi-Fi",
            "AV Equipment", "Classroom Equipment",
            "Access Control", "Access / Security",
            "Security", "Access / Security",
            "Cleaning", "Cleaning / Housekeeping");

    private static final Map<TicketStatus, List<TicketStatus>> WORKFLOW_TRANSITIONS = buildWorkflowTransitions();

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final UserAccessService userAccessService;

    public TicketService(
            TicketRepository ticketRepository,
            UserRepository userRepository,
            UserAccessService userAccessService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.userAccessService = userAccessService;
    }

    public TicketMetaResponse getTicketMeta() {
        List<TicketUserResponse> technicians = userRepository.findAll().stream()
                .filter(user -> {
                    UserRole role = getUserRole(user);
                    return role == UserRole.ADMIN || role == UserRole.TECHNICIAN;
                })
                .sorted(Comparator.comparing(this::getDisplayName, String.CASE_INSENSITIVE_ORDER))
                .map(user -> mapToTicketUserResponse(user))
                .toList();

        return new TicketMetaResponse(
                Arrays.asList(TicketType.values()),
                Arrays.asList(TicketPriority.values()),
                Arrays.asList(TicketStatus.values()),
                STUDENT_TICKET_CATEGORIES,
                technicians);
    }

    public TicketListResponse getTickets(
            String actorUserId,
            String search,
            TicketType type,
            TicketPriority priority,
            TicketStatus status,
            String category,
            String location,
            String assignedTechnicianId,
            boolean overdueOnly) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);

        List<TicketResponse> items = getScopedTickets(actor).stream()
                .map(this::synchronizeTicketRuntimeFields)
                .filter(ticket -> matchesFilters(
                        ticket,
                        search,
                        type,
                        priority,
                        status,
                        category,
                        location,
                        assignedTechnicianId,
                        overdueOnly))
                .map(this::mapToTicketResponse)
                .toList();

        return new TicketListResponse(items, new TicketPaginationResponse(items.size()));
    }

    public TicketResponse getTicketById(String actorUserId, String ticketId) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        Ticket ticket = getActiveTicket(ticketId);

        assertTicketAccess(actor, ticket);
        return mapToTicketResponse(synchronizeTicketRuntimeFields(ticket));
    }

    public TicketResponse editTicket(String actorUserId, String ticketId, EditTicketRequest request) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        Ticket ticket = getActiveTicket(ticketId);

        assertTicketAccess(actor, ticket);

        boolean changed = false;
        TicketType nextType = request.type() != null ? request.type() : getTicketType(ticket);

        String normalizedTitle = request.title().trim();
        if (!Objects.equals(normalizedTitle, ticket.getTitle())) {
            ticket.setTitle(normalizedTitle);
            changed = true;
        }

        String normalizedDescription = request.description().trim();
        if (!Objects.equals(normalizedDescription, ticket.getDescription())) {
            ticket.setDescription(normalizedDescription);
            changed = true;
        }

        if (request.type() != ticket.getType()) {
            ticket.setType(request.type());
            changed = true;
        }

        if (request.priority() != ticket.getPriority()) {
            ticket.setPriority(request.priority());
            changed = true;
        }

        String normalizedCategory = normalizeCategory(request.category());
        if (!Objects.equals(normalizedCategory, ticket.getCategory())) {
            ticket.setCategory(normalizedCategory);
            changed = true;
        }

        TicketLocation nextLocation = mapToLocation(request.location(), nextType);
        if (!locationsEqual(ticket.getLocation(), nextLocation)) {
            ticket.setLocation(nextLocation);
            changed = true;
        }

        if (!changed) {
            return mapToTicketResponse(synchronizeTicketRuntimeFields(ticket));
        }

        LocalDateTime now = LocalDateTime.now();
        prependActivity(ticket, buildActivity("TICKET_UPDATED", "Ticket updated.", now, actor));
        ticket.setUpdatedAt(now);
        synchronizeTicketRuntimeFields(ticket);

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToTicketResponse(synchronizeTicketRuntimeFields(savedTicket));
    }

    public TicketResponse createTicket(String actorUserId, CreateTicketRequest request) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        LocalDateTime now = LocalDateTime.now();

        Ticket ticket = new Ticket();
        ticket.setTicketId(generateTicketId(now));
        ticket.setTitle(request.title().trim());
        ticket.setDescription(request.description().trim());
        ticket.setType(request.type());
        ticket.setPriority(request.priority());
        ticket.setCategory(normalizeCategory(request.category()));
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setLocation(mapToLocation(request.location(), request.type()));
        ticket.setReporter(buildTicketUserSummary(actor));
        ticket.setAssignedTechnician(null);
        ticket.setRequiresExtendedResolution(false);
        ticket.setDeleted(false);
        ticket.setDeletedAt(null);
        ticket.setDeletedByUserId(null);
        ticket.setAttachments(new ArrayList<>());
        ticket.setComments(new ArrayList<>());
        ticket.setActivity(new ArrayList<>());
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);

        synchronizeTicketRuntimeFields(ticket);
        prependActivity(ticket, buildActivity(
                "TICKET_CREATED",
                "Ticket created with " + ticket.getPriority() + " priority.",
                now,
                actor));

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToTicketResponse(synchronizeTicketRuntimeFields(savedTicket));
    }

    public TicketResponse updateTicket(String actorUserId, String ticketId, UpdateTicketRequest request) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        assertStaffAccess(actor);

        Ticket ticket = getActiveTicket(ticketId);

        LocalDateTime now = LocalDateTime.now();
        TicketPriority nextPriority = request.priority() != null ? request.priority() : getTicketPriority(ticket);
        boolean nextRequiresExtendedResolution = request.requiresExtendedResolution() != null
                ? request.requiresExtendedResolution()
                : ticket.isRequiresExtendedResolution();
        TicketStatus nextStatus = request.status() != null ? request.status() : getTicketStatus(ticket);

        if (request.status() != null
                && request.status() != ticket.getStatus()
                && !getAllowedStatusOptions(ticket.getStatus(), nextPriority, nextRequiresExtendedResolution)
                        .contains(request.status())) {
            throw new InvalidTicketException("This ticket cannot move to the requested workflow stage.");
        }

        boolean changed = false;

        if (request.priority() != null && request.priority() != ticket.getPriority()) {
            ticket.setPriority(request.priority());
            changed = true;
        }

        if (request.category() != null) {
            String normalizedCategory = normalizeCategory(request.category());
            if (!Objects.equals(normalizedCategory, ticket.getCategory())) {
                ticket.setCategory(normalizedCategory);
                changed = true;
            }
        }

        if (request.description() != null) {
            String normalizedDescription = request.description().trim();
            if (normalizedDescription.isEmpty()) {
                throw new InvalidTicketException("Description is required.");
            }
            if (!Objects.equals(normalizedDescription, ticket.getDescription())) {
                ticket.setDescription(normalizedDescription);
                changed = true;
            }
        }

        if (request.location() != null) {
            TicketLocation nextLocation = mapToLocation(request.location(), getTicketType(ticket));
            if (!locationsEqual(ticket.getLocation(), nextLocation)) {
                ticket.setLocation(nextLocation);
                changed = true;
            }
        }

        if (request.requiresExtendedResolution() != null
                && request.requiresExtendedResolution() != ticket.isRequiresExtendedResolution()) {
            ticket.setRequiresExtendedResolution(request.requiresExtendedResolution());
            prependActivity(ticket, buildActivity(
                    "SLA_UPDATED",
                    request.requiresExtendedResolution()
                            ? "Extended resolution time enabled for a major or large repair."
                            : "Ticket moved back to the standard SLA window.",
                    now,
                    actor));
            changed = true;
        }

        if (request.status() != null && request.status() != ticket.getStatus()) {
            TicketStatus previousStatus = ticket.getStatus();
            ticket.setStatus(request.status());
            updateResolutionTimestamps(ticket, now, previousStatus, request.status());
            prependActivity(ticket, buildActivity(
                    "STATUS_CHANGED",
                    "Ticket moved to " + request.status().name().replace('_', ' ') + ".",
                    now,
                    actor));
            changed = true;
        }

        if (changed
                && (request.status() == null)
                && (request.priority() != null || request.category() != null || request.description() != null || request.location() != null)) {
            prependActivity(ticket, buildActivity(
                    "TICKET_UPDATED",
                    "Ticket updated.",
                    now,
                    actor));
        }

        if (!changed) {
            return mapToTicketResponse(synchronizeTicketRuntimeFields(ticket));
        }

        ticket.setUpdatedAt(now);
        synchronizeTicketRuntimeFields(ticket);

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToTicketResponse(synchronizeTicketRuntimeFields(savedTicket));
    }

    public TicketResponse assignTechnician(String actorUserId, String ticketId, String technicianId) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        if (getUserRole(actor) != UserRole.ADMIN) {
            throw new ForbiddenAccessException("Only admins can assign technicians.");
        }

        Ticket ticket = getActiveTicket(ticketId);

        TicketUserSummary previousAssignee = ticket.getAssignedTechnician();
        TicketUserSummary nextAssignee = null;
        String normalizedTechnicianId = technicianId != null ? technicianId.trim() : "";

        if (!normalizedTechnicianId.isEmpty()) {
            User technician = userRepository.findById(normalizedTechnicianId)
                    .orElseThrow(() -> new InvalidTicketException("Technician not found."));

            UserRole technicianRole = getUserRole(technician);
            if (technicianRole != UserRole.TECHNICIAN && technicianRole != UserRole.ADMIN) {
                throw new InvalidTicketException("The selected user cannot be assigned to tickets.");
            }

            nextAssignee = buildTicketUserSummary(technician);
        }

        boolean assignmentChanged = !sameUser(previousAssignee, nextAssignee);
        if (!assignmentChanged) {
            return mapToTicketResponse(synchronizeTicketRuntimeFields(ticket));
        }

        LocalDateTime now = LocalDateTime.now();
        ticket.setAssignedTechnician(nextAssignee);

        if (nextAssignee != null && ticket.getStatus() == TicketStatus.OPEN) {
            TicketStatus previousStatus = ticket.getStatus();
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            updateResolutionTimestamps(ticket, now, previousStatus, TicketStatus.IN_PROGRESS);
            prependActivity(ticket, buildActivity(
                    "STATUS_CHANGED",
                    "Ticket moved to IN PROGRESS.",
                    now,
                    actor));
        }

        prependActivity(ticket, buildActivity(
                nextAssignee != null ? "TECHNICIAN_ASSIGNED" : "TECHNICIAN_UNASSIGNED",
                nextAssignee != null
                        ? nextAssignee.getFullName() + " was assigned to the ticket."
                        : "Ticket assignment was cleared.",
                now,
                actor));

        ticket.setUpdatedAt(now);
        synchronizeTicketRuntimeFields(ticket);

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToTicketResponse(synchronizeTicketRuntimeFields(savedTicket));
    }

    public TicketResponse addComment(String actorUserId, String ticketId, AddTicketCommentRequest request) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        Ticket ticket = getActiveTicket(ticketId);

        assertTicketAccess(actor, ticket);

        LocalDateTime now = LocalDateTime.now();
        TicketComment comment = new TicketComment();
        comment.setId(UUID.randomUUID().toString());
        comment.setMessage(request.message().trim());
        comment.setCreatedAt(now);
        comment.setAuthor(buildTicketActorSummary(actor));

        List<TicketComment> comments = new ArrayList<>(getComments(ticket));
        comments.add(comment);
        ticket.setComments(comments);

        prependActivity(ticket, buildActivity("COMMENT_ADDED", "Comment added.", now, actor));
        ticket.setUpdatedAt(now);

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToTicketResponse(synchronizeTicketRuntimeFields(savedTicket));
    }

    public TicketResponse addAttachments(String actorUserId, String ticketId, MultipartFile[] attachments) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        Ticket ticket = getActiveTicket(ticketId);

        assertTicketAccess(actor, ticket);

        if (attachments == null || attachments.length == 0) {
            throw new InvalidTicketException("At least one attachment is required.");
        }

        LocalDateTime now = LocalDateTime.now();
        List<TicketAttachment> currentAttachments = getAttachments(ticket);
        List<TicketAttachment> nextAttachments = new ArrayList<>(currentAttachments);

        for (MultipartFile attachmentFile : attachments) {
            if (attachmentFile == null || attachmentFile.isEmpty()) {
                continue;
            }

            TicketAttachment attachment = new TicketAttachment();
            attachment.setId(UUID.randomUUID().toString());
            attachment.setOriginalName(attachmentFile.getOriginalFilename());
            attachment.setFileName(sanitizeFileName(attachmentFile.getOriginalFilename()));
            attachment.setMimeType(isNotBlank(attachmentFile.getContentType())
                    ? attachmentFile.getContentType()
                    : "application/octet-stream");
            attachment.setSize(attachmentFile.getSize());
            attachment.setUrl("#");
            attachment.setUploadedAt(now);
            attachment.setUploadedBy(buildTicketActorSummary(actor));
            nextAttachments.add(attachment);
        }

        int uploadedCount = nextAttachments.size() - currentAttachments.size();
        if (uploadedCount == 0) {
            throw new InvalidTicketException("At least one attachment is required.");
        }

        ticket.setAttachments(nextAttachments);
        prependActivity(ticket, buildActivity(
                "ATTACHMENT_UPLOADED",
                uploadedCount + " attachment(s) uploaded.",
                now,
                actor));
        ticket.setUpdatedAt(now);

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToTicketResponse(synchronizeTicketRuntimeFields(savedTicket));
    }

    public TicketDeleteResponse deleteTicket(String actorUserId, String ticketId) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        Ticket ticket = getActiveTicket(ticketId);

        assertTicketAccess(actor, ticket);
        ticketRepository.delete(ticket);

        return new TicketDeleteResponse("Ticket deleted successfully.", ticket.getId());
    }

    public TicketDashboardResponse getDashboardSummary(String actorUserId) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        List<Ticket> tickets = getScopedTickets(actor).stream()
                .map(this::synchronizeTicketRuntimeFields)
                .toList();

        Map<String, Long> statusCounts = initializeOrderedCounts(Arrays.stream(TicketStatus.values())
                .map(Enum::name)
                .toList());
        Map<String, Long> priorityCounts = initializeOrderedCounts(Arrays.stream(TicketPriority.values())
                .map(Enum::name)
                .toList());
        Map<String, Long> typeCounts = initializeOrderedCounts(Arrays.stream(TicketType.values())
                .map(Enum::name)
                .toList());
        Map<String, Long> slaBucketCounts = initializeOrderedCounts(List.of(
                "Same-day target",
                "2-day target",
                "Extended repair window"));
        Map<String, Long> monthlyCounts = initializeOrderedCounts(getLastSixMonthLabels());

        for (Ticket ticket : tickets) {
            incrementCount(statusCounts, ticket.getStatus().name());
            incrementCount(priorityCounts, ticket.getPriority().name());
            incrementCount(typeCounts, ticket.getType().name());

            TicketSlaPolicyResponse policy = buildSlaPolicy(ticket.getPriority(), ticket.isRequiresExtendedResolution());
            incrementCount(slaBucketCounts, policy.targetLabel());

            YearMonth month = YearMonth.from(ticket.getCreatedAt());
            String monthLabel = month.format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH));
            if (monthlyCounts.containsKey(monthLabel)) {
                incrementCount(monthlyCounts, monthLabel);
            }
        }

        long resolvedCount = tickets.stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)
                .count();

        TicketDashboardCardsResponse cards = new TicketDashboardCardsResponse(
                tickets.size(),
                tickets.stream()
                        .filter(ticket -> ticket.getStatus() == TicketStatus.OPEN
                                || ticket.getStatus() == TicketStatus.IN_PROGRESS
                                || ticket.getStatus() == TicketStatus.ON_HOLD)
                        .count(),
                tickets.stream().filter(Ticket::isOverdue).count(),
                tickets.isEmpty() ? 0 : Math.round((resolvedCount * 100.0f) / tickets.size()));

        TicketDashboardChartsResponse charts = new TicketDashboardChartsResponse(
                toMetricItems(statusCounts),
                toMetricItems(priorityCounts),
                monthlyCounts.entrySet().stream()
                        .map(entry -> new TicketMonthlyTrendItemResponse(entry.getKey(), entry.getValue()))
                        .toList(),
                toMetricItems(typeCounts));

        List<TicketSlaBucketResponse> slaBuckets = List.of(
                new TicketSlaBucketResponse(
                        "Same-day target",
                        slaBucketCounts.getOrDefault("Same-day target", 0L),
                        "Low and medium priority tickets expected to close within the day."),
                new TicketSlaBucketResponse(
                        "2-day target",
                        slaBucketCounts.getOrDefault("2-day target", 0L),
                        "High and critical tickets that can take up to around 2 days."),
                new TicketSlaBucketResponse(
                        "Extended repair window",
                        slaBucketCounts.getOrDefault("Extended repair window", 0L),
                        "Major or large repairs intentionally given extra time."));

        List<TicketResponse> recentTickets = tickets.stream()
                .sorted(Comparator.comparing(Ticket::getCreatedAt).reversed())
                .limit(5)
                .map(this::mapToTicketResponse)
                .toList();

        return new TicketDashboardResponse(cards, slaBuckets, charts, recentTickets);
    }

    public TicketReportsResponse getReports(String actorUserId) {
        User actor = userAccessService.getAuthenticatedUser(actorUserId);
        assertStaffAccess(actor);

        List<Ticket> tickets = getScopedTickets(actor).stream()
                .map(this::synchronizeTicketRuntimeFields)
                .toList();

        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        Map<String, Long> technicianCounts = new LinkedHashMap<>();
        Map<String, Long> typeCounts = new LinkedHashMap<>();
        long slaMetTickets = 0;
        long slaBreachedTickets = 0;

        for (Ticket ticket : tickets) {
            incrementCount(categoryCounts, ticket.getCategory());
            incrementCount(typeCounts, ticket.getType().name());
            incrementCount(
                    technicianCounts,
                    ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getFullName() : "Unassigned");
        }

        List<Ticket> closedTickets = tickets.stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)
                .toList();

        long totalResolutionHours = 0;
        for (Ticket ticket : closedTickets) {
            LocalDateTime endTime = firstNonNull(ticket.getResolvedAt(), ticket.getClosedAt(), ticket.getUpdatedAt());
            if (endTime.isAfter(ticket.getDueAt())) {
                slaBreachedTickets += 1;
            } else {
                slaMetTickets += 1;
            }
            totalResolutionHours += Math.round(java.time.Duration.between(ticket.getCreatedAt(), endTime).toHours());
        }

        long averageResolutionHours = closedTickets.isEmpty() ? 0 : Math.round((double) totalResolutionHours / closedTickets.size());

        return new TicketReportsResponse(
                new TicketReportsSummaryResponse(averageResolutionHours, slaBreachedTickets, slaMetTickets),
                toMetricItems(categoryCounts),
                toMetricItems(technicianCounts),
                toMetricItems(typeCounts));
    }

    private List<Ticket> getScopedTickets(User actor) {
        List<Ticket> activeTickets = ticketRepository.findAll(TICKET_SORT).stream()
                .filter(ticket -> !isDeleted(ticket))
                .toList();

        UserRole role = getUserRole(actor);
        if (role == UserRole.ADMIN || role == UserRole.TECHNICIAN) {
            return activeTickets;
        }

        return activeTickets.stream()
                .filter(ticket -> ticket.getReporter() != null && actor.getId().equals(ticket.getReporter().getId()))
                .toList();
    }

    private Ticket getActiveTicket(String ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found."));

        if (isDeleted(ticket)) {
            throw new TicketNotFoundException("Ticket not found.");
        }

        return ticket;
    }

    private boolean matchesFilters(
            Ticket ticket,
            String search,
            TicketType type,
            TicketPriority priority,
            TicketStatus status,
            String category,
            String location,
            String assignedTechnicianId,
            boolean overdueOnly) {
        if (type != null && ticket.getType() != type) {
            return false;
        }

        if (priority != null && ticket.getPriority() != priority) {
            return false;
        }

        if (status != null && ticket.getStatus() != status) {
            return false;
        }

        if (isNotBlank(category) && !Objects.equals(ticket.getCategory(), category.trim())) {
            return false;
        }

        if (isNotBlank(assignedTechnicianId)) {
            String currentAssignedTechnicianId = ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getId() : null;
            if (!Objects.equals(currentAssignedTechnicianId, assignedTechnicianId.trim())) {
                return false;
            }
        }

        if (isNotBlank(location)) {
            String locationText = formatLocation(ticket.getLocation()).toLowerCase(Locale.ENGLISH);
            if (!locationText.contains(location.trim().toLowerCase(Locale.ENGLISH))) {
                return false;
            }
        }

        if (overdueOnly && !ticket.isOverdue()) {
            return false;
        }

        if (!isNotBlank(search)) {
            return true;
        }

        String blob = String.join(
                " ",
                defaultString(ticket.getTicketId()),
                defaultString(ticket.getTitle()),
                defaultString(ticket.getDescription()),
                defaultString(ticket.getCategory()),
                formatLocation(ticket.getLocation()),
                ticket.getReporter() != null ? defaultString(ticket.getReporter().getFullName()) : "",
                ticket.getAssignedTechnician() != null ? defaultString(ticket.getAssignedTechnician().getFullName()) : "")
                .toLowerCase(Locale.ENGLISH);

        return blob.contains(search.trim().toLowerCase(Locale.ENGLISH));
    }

    private void assertTicketAccess(User actor, Ticket ticket) {
        UserRole role = getUserRole(actor);
        if (role == UserRole.ADMIN || role == UserRole.TECHNICIAN) {
            return;
        }

        String reporterUserId = ticket.getReporter() != null ? ticket.getReporter().getId() : null;
        if (!Objects.equals(actor.getId(), reporterUserId)) {
            throw new ForbiddenAccessException("You can only access your own tickets.");
        }
    }

    private void assertStaffAccess(User actor) {
        UserRole role = getUserRole(actor);
        if (role != UserRole.ADMIN && role != UserRole.TECHNICIAN) {
            throw new ForbiddenAccessException("Only technicians and admins can update ticket workflow.");
        }
    }

    private boolean isDeleted(Ticket ticket) {
        return ticket.isDeleted();
    }

    private Ticket synchronizeTicketRuntimeFields(Ticket ticket) {
        TicketPriority priority = getTicketPriority(ticket);
        TicketStatus status = getTicketStatus(ticket);
        TicketSlaPolicyResponse policy = buildSlaPolicy(priority, ticket.isRequiresExtendedResolution());

        ticket.setPriority(priority);
        ticket.setStatus(status);
        ticket.setSlaHours(policy.targetHours());
        ticket.setDueAt(ticket.getCreatedAt().plusHours(policy.targetHours()));
        ticket.setOverdue(status != TicketStatus.RESOLVED
                && status != TicketStatus.CLOSED
                && status != TicketStatus.CANCELLED
                && ticket.getDueAt().isBefore(LocalDateTime.now()));
        return ticket;
    }

    private TicketResponse mapToTicketResponse(Ticket ticket) {
        TicketSlaPolicyResponse policy = buildSlaPolicy(ticket.getPriority(), ticket.isRequiresExtendedResolution());

        return new TicketResponse(
                ticket.getId(),
                ticket.getTicketId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getType(),
                ticket.getPriority(),
                ticket.getCategory(),
                ticket.getStatus(),
                mapToLocationResponse(ticket.getLocation()),
                mapToTicketUserResponse(ticket.getReporter()),
                mapToTicketUserResponse(ticket.getAssignedTechnician()),
                ticket.isRequiresExtendedResolution(),
                ticket.getSlaHours(),
                ticket.getDueAt(),
                ticket.isOverdue(),
                ticket.getResolvedAt(),
                ticket.getClosedAt(),
                getAttachments(ticket).stream().map(this::mapToAttachmentResponse).toList(),
                getComments(ticket).stream().map(this::mapToCommentResponse).toList(),
                getActivity(ticket).stream().map(this::mapToActivityResponse).toList(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                getAllowedStatusOptions(ticket.getStatus(), ticket.getPriority(), ticket.isRequiresExtendedResolution()),
                policy);
    }

    private TicketLocationResponse mapToLocationResponse(TicketLocation location) {
        if (location == null) {
            return new TicketLocationResponse("", "", "", "", "");
        }

        return new TicketLocationResponse(
                defaultString(location.getBuilding()),
                defaultString(location.getFloor()),
                defaultString(location.getRoom()),
                defaultString(location.getCampus()),
                defaultString(location.getNote()));
    }

    private TicketUserResponse mapToTicketUserResponse(User user) {
        return new TicketUserResponse(
                user.getId(),
                getDisplayName(user),
                user.getEmail(),
                getUserRole(user),
                null,
                List.of());
    }

    private TicketUserResponse mapToTicketUserResponse(TicketUserSummary user) {
        if (user == null) {
            return null;
        }

        return new TicketUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole() : UserRole.USER,
                null,
                List.of());
    }

    private TicketAttachmentResponse mapToAttachmentResponse(TicketAttachment attachment) {
        return new TicketAttachmentResponse(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getOriginalName(),
                attachment.getMimeType(),
                attachment.getSize(),
                attachment.getUrl(),
                attachment.getUploadedAt(),
                mapToActorResponse(attachment.getUploadedBy()));
    }

    private TicketCommentResponse mapToCommentResponse(TicketComment comment) {
        return new TicketCommentResponse(
                comment.getId(),
                comment.getMessage(),
                comment.getCreatedAt(),
                mapToActorResponse(comment.getAuthor()));
    }

    private TicketActivityItemResponse mapToActivityResponse(TicketActivityItem activityItem) {
        return new TicketActivityItemResponse(
                activityItem.getId(),
                activityItem.getAction(),
                activityItem.getMessage(),
                activityItem.getCreatedAt(),
                mapToActorResponse(activityItem.getActor()));
    }

    private TicketActorResponse mapToActorResponse(TicketActorSummary actor) {
        if (actor == null) {
            return null;
        }

        return new TicketActorResponse(
                actor.getId(),
                actor.getFullName(),
                actor.getRole() != null ? actor.getRole() : UserRole.USER);
    }

    private TicketUserSummary buildTicketUserSummary(User user) {
        TicketUserSummary summary = new TicketUserSummary();
        summary.setId(user.getId());
        summary.setFullName(getDisplayName(user));
        summary.setEmail(user.getEmail());
        summary.setRole(getUserRole(user));
        return summary;
    }

    private TicketActorSummary buildTicketActorSummary(User user) {
        TicketActorSummary summary = new TicketActorSummary();
        summary.setId(user.getId());
        summary.setFullName(getDisplayName(user));
        summary.setRole(getUserRole(user));
        return summary;
    }

    private TicketActivityItem buildActivity(String action, String message, LocalDateTime createdAt, User actor) {
        TicketActivityItem activityItem = new TicketActivityItem();
        activityItem.setId(UUID.randomUUID().toString());
        activityItem.setAction(action);
        activityItem.setMessage(message);
        activityItem.setCreatedAt(createdAt);
        activityItem.setActor(buildTicketActorSummary(actor));
        return activityItem;
    }

    private void prependActivity(Ticket ticket, TicketActivityItem activityItem) {
        List<TicketActivityItem> nextActivity = new ArrayList<>();
        nextActivity.add(activityItem);
        nextActivity.addAll(getActivity(ticket));
        ticket.setActivity(nextActivity);
    }

    private void updateResolutionTimestamps(
            Ticket ticket,
            LocalDateTime now,
            TicketStatus previousStatus,
            TicketStatus nextStatus) {
        if (nextStatus == TicketStatus.RESOLVED && previousStatus != TicketStatus.RESOLVED) {
            ticket.setResolvedAt(now);
        }

        if (nextStatus == TicketStatus.CLOSED && previousStatus != TicketStatus.CLOSED) {
            ticket.setClosedAt(now);
        }

        if (nextStatus != TicketStatus.CLOSED) {
            ticket.setClosedAt(null);
        }

        if (nextStatus != TicketStatus.RESOLVED && nextStatus != TicketStatus.CLOSED) {
            ticket.setResolvedAt(null);
        }
    }

    private TicketLocation mapToLocation(TicketLocationRequest request, TicketType type) {
        TicketLocation location = new TicketLocation();
        location.setBuilding(normalizeRequiredValue(request.building(), "Building or main area is required."));
        location.setFloor(normalizeOptionalValue(request.floor()));
        location.setRoom(normalizeOptionalValue(request.room()));
        location.setCampus(normalizeOptionalValue(request.campus()));
        location.setNote(type == TicketType.INCIDENT ? normalizeOptionalValue(request.note()) : "");
        return location;
    }

    private TicketSlaPolicyResponse buildSlaPolicy(TicketPriority priority, boolean requiresExtendedResolution) {
        if (requiresExtendedResolution) {
            return new TicketSlaPolicyResponse(
                    72,
                    "Extended repair window",
                    "Major or large repairs can stay open longer with a planned follow-up window.",
                    List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.RESOLVED));
        }

        if (priority == TicketPriority.HIGH || priority == TicketPriority.CRITICAL) {
            return new TicketSlaPolicyResponse(
                    48,
                    "2-day target",
                    "High and critical work is expected to be resolved within about 2 days.",
                    List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.RESOLVED));
        }

        return new TicketSlaPolicyResponse(
                12,
                "Same-day target",
                "Low and medium work should normally move from Open to In Progress to Resolved.",
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED));
    }

    private List<TicketStatus> getAllowedStatusOptions(
            TicketStatus currentStatus,
            TicketPriority priority,
            boolean requiresExtendedResolution) {
        return WORKFLOW_TRANSITIONS.getOrDefault(currentStatus, List.of(currentStatus)).stream()
                .filter(status -> status != TicketStatus.ON_HOLD
                        || requiresExtendedResolution
                        || priority == TicketPriority.HIGH
                        || priority == TicketPriority.CRITICAL)
                .toList();
    }

    private String generateTicketId(LocalDateTime createdAt) {
        String datePart = createdAt.toLocalDate().format(DateTimeFormatter.BASIC_ISO_DATE);
        int sequence = 1;
        String ticketId;

        do {
            ticketId = "TCK-" + datePart + "-" + String.format("%04d", sequence);
            sequence += 1;
        } while (ticketRepository.existsByTicketId(ticketId));

        return ticketId;
    }

    private String normalizeCategory(String category) {
        String normalizedCategory = normalizeRequiredValue(category, "Category is required.");
        return LEGACY_CATEGORY_MAP.getOrDefault(normalizedCategory, normalizedCategory);
    }

    private String sanitizeFileName(String originalName) {
        String normalizedOriginalName = isNotBlank(originalName) ? originalName.trim() : "attachment";
        String sanitizedFileName = normalizedOriginalName
                .replaceAll("\\s+", "-")
                .replaceAll("[^A-Za-z0-9._-]", "")
                .toLowerCase(Locale.ENGLISH);
        return isNotBlank(sanitizedFileName) ? sanitizedFileName : "attachment";
    }

    private boolean locationsEqual(TicketLocation left, TicketLocation right) {
        return Objects.equals(defaultString(left != null ? left.getBuilding() : null), defaultString(right != null ? right.getBuilding() : null))
                && Objects.equals(defaultString(left != null ? left.getFloor() : null), defaultString(right != null ? right.getFloor() : null))
                && Objects.equals(defaultString(left != null ? left.getRoom() : null), defaultString(right != null ? right.getRoom() : null))
                && Objects.equals(defaultString(left != null ? left.getCampus() : null), defaultString(right != null ? right.getCampus() : null))
                && Objects.equals(defaultString(left != null ? left.getNote() : null), defaultString(right != null ? right.getNote() : null));
    }

    private boolean sameUser(TicketUserSummary left, TicketUserSummary right) {
        return Objects.equals(left != null ? left.getId() : null, right != null ? right.getId() : null);
    }

    private String formatLocation(TicketLocation location) {
        if (location == null) {
            return "";
        }

        return List.of(
                        defaultString(location.getBuilding()),
                        isNotBlank(location.getFloor()) ? "Floor " + location.getFloor().trim() : "",
                        isNotBlank(location.getRoom()) ? "Room " + location.getRoom().trim() : "",
                        defaultString(location.getCampus()))
                .stream()
                .filter(this::isNotBlank)
                .reduce((left, right) -> left + " | " + right)
                .orElse("");
    }

    private Map<String, Long> initializeOrderedCounts(List<String> keys) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String key : keys) {
            counts.put(key, 0L);
        }
        return counts;
    }

    private void incrementCount(Map<String, Long> counts, String key) {
        counts.put(key, counts.getOrDefault(key, 0L) + 1);
    }

    private List<TicketMetricItemResponse> toMetricItems(Map<String, Long> counts) {
        return counts.entrySet().stream()
                .map(entry -> new TicketMetricItemResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    private List<String> getLastSixMonthLabels() {
        YearMonth currentMonth = YearMonth.now();
        List<String> labels = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

        for (int index = 5; index >= 0; index -= 1) {
            labels.add(currentMonth.minusMonths(index).format(formatter));
        }

        return labels;
    }

    private TicketPriority getTicketPriority(Ticket ticket) {
        return ticket.getPriority() != null ? ticket.getPriority() : TicketPriority.MEDIUM;
    }

    private List<TicketAttachment> getAttachments(Ticket ticket) {
        return ticket.getAttachments() != null ? ticket.getAttachments() : List.of();
    }

    private List<TicketComment> getComments(Ticket ticket) {
        return ticket.getComments() != null ? ticket.getComments() : List.of();
    }

    private List<TicketActivityItem> getActivity(Ticket ticket) {
        return ticket.getActivity() != null ? ticket.getActivity() : List.of();
    }

    private TicketStatus getTicketStatus(Ticket ticket) {
        return ticket.getStatus() != null ? ticket.getStatus() : TicketStatus.OPEN;
    }

    private TicketType getTicketType(Ticket ticket) {
        return ticket.getType() != null ? ticket.getType() : TicketType.MAINTENANCE;
    }

    private UserRole getUserRole(User user) {
        return user.getRole() != null ? user.getRole() : UserRole.USER;
    }

    private String getDisplayName(User user) {
        return isNotBlank(user.getDisplayName()) ? user.getDisplayName().trim() : user.getEmail();
    }

    private String normalizeRequiredValue(String value, String message) {
        String normalizedValue = normalizeOptionalValue(value);
        if (!isNotBlank(normalizedValue)) {
            throw new InvalidTicketException(message);
        }
        return normalizedValue;
    }

    private String normalizeOptionalValue(String value) {
        return isNotBlank(value) ? value.trim() : "";
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }

    private String defaultString(String value) {
        return value != null ? value : "";
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private static Map<TicketStatus, List<TicketStatus>> buildWorkflowTransitions() {
        Map<TicketStatus, List<TicketStatus>> transitions = new EnumMap<>(TicketStatus.class);
        transitions.put(TicketStatus.OPEN, List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED));
        transitions.put(TicketStatus.IN_PROGRESS, List.of(
                TicketStatus.IN_PROGRESS,
                TicketStatus.ON_HOLD,
                TicketStatus.RESOLVED,
                TicketStatus.CANCELLED));
        transitions.put(TicketStatus.ON_HOLD, List.of(
                TicketStatus.ON_HOLD,
                TicketStatus.IN_PROGRESS,
                TicketStatus.RESOLVED,
                TicketStatus.CANCELLED));
        transitions.put(TicketStatus.RESOLVED, List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.IN_PROGRESS));
        transitions.put(TicketStatus.CLOSED, List.of(TicketStatus.CLOSED));
        transitions.put(TicketStatus.CANCELLED, List.of(TicketStatus.CANCELLED));
        return transitions;
    }
}

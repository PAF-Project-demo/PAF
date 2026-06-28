package com.server.server.config.seed;

import com.server.server.activity.entity.ActivityEvent;
import com.server.server.activity.entity.ActivityEventType;
import com.server.server.auth.entity.User;
import com.server.server.auth.entity.UserRole;
import com.server.server.booking.entity.Booking;
import com.server.server.booking.entity.BookingStatus;
import com.server.server.resource.entity.Resource;
import com.server.server.resource.entity.ResourceStatus;
import com.server.server.resource.entity.ResourceType;
import com.server.server.resource.entity.Review;
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
import com.server.server.user.entity.RoleRequest;
import com.server.server.user.entity.RoleRequestStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * In-memory specification of the demo dataset. {@link DataSeeder} reads these
 * definitions, hashes the shared {@code DEMO_PASSWORD} with the configured
 * {@code PasswordEncoder}, and persists the records through the repositories.
 *
 * <p>All seeded users share the same password so demos are easy to run; rotate
 * or remove the dataset before any production use.
 */
public final class SeedData {

    /** Plain-text password assigned to every seeded account. */
    public static final String DEMO_PASSWORD = "Demo@123";

    private SeedData() {
    }

    // ---------------------------------------------------------------------
    // Users
    // ---------------------------------------------------------------------
    public static List<User> users() {
        LocalDateTime created = LocalDateTime.now().minusDays(30);
        return List.of(
                user("demo@devgen.com", "Demo Admin", UserRole.ADMIN, created),
                user("manager@devgen.com", "Demo Manager", UserRole.MANAGER, created.plusHours(1)),
                user("tech.alex@devgen.com", "Alex Technician", UserRole.TECHNICIAN, created.plusHours(2)),
                user("tech.priya@devgen.com", "Priya Technician", UserRole.TECHNICIAN, created.plusHours(3)),
                user("user.jane@devgen.com", "Jane Doe", UserRole.USER, created.plusHours(4)),
                user("user.ravi@devgen.com", "Ravi Silva", UserRole.USER, created.plusHours(5))
        );
    }

    private static User user(String email, String displayName, UserRole role, LocalDateTime createdAt) {
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(displayName);
        user.setRole(role);
        user.setCreatedAt(createdAt);
        // passwordHash is filled in by the seeder after BCrypt encoding
        return user;
    }

    // ---------------------------------------------------------------------
    // Resources
    // ---------------------------------------------------------------------
    public static List<Resource> resources(List<User> users) {
        LocalDateTime now = LocalDateTime.now();
        User jane = users.get(4);
        User ravi = users.get(5);

        return List.of(
                resource("Lecture Hall A", ResourceType.LECTURE_HALL, 200, "Main Building, Floor 1",
                        "Mon-Fri 08:00-20:00",
                        "Tiered seating hall with projector, microphones, and recording system.",
                        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
                        List.of(review(jane, 5, "Excellent acoustics for large lectures."),
                                review(ravi, 4, "Projector resolution could be sharper.")),
                        now),
                resource("Computer Lab 1", ResourceType.LAB, 30, "Engineering Block, Floor 2",
                        "Mon-Sat 07:00-22:00",
                        "30-seat lab with dual-monitor workstations, Ubuntu + Windows dual boot.",
                        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
                        List.of(review(ravi, 5, "Machines are fast and well-maintained.")),
                        now),
                resource("Robotics Lab", ResourceType.LAB, 20, "Engineering Block, Floor 3",
                        "Mon-Fri 09:00-18:00",
                        "Robotics workspace with 6DOF arms, test rigs, and 3D printers.",
                        "https://images.unsplash.com/photo-1581090700227-1e37b190418e",
                        List.of(),
                        now),
                resource("Meeting Room Cedar", ResourceType.MEETING_ROOM, 12, "Admin Block, Floor 4",
                        "Mon-Sun 07:00-21:00",
                        "12-person boardroom with 4K display and video conferencing.",
                        "https://images.unsplash.com/photo-1497366216548-37526070297c",
                        List.of(review(jane, 4, "Great room. Booking approval is quick.")),
                        now),
                resource("Meeting Room Birch", ResourceType.MEETING_ROOM, 6, "Admin Block, Floor 4",
                        "Mon-Sun 07:00-21:00",
                        "Compact 6-person huddle room with whiteboard wall.",
                        "https://images.unsplash.com/photo-1431540015161-0bf868a2d407",
                        List.of(),
                        now),
                resource("Mobile Projector Kit", ResourceType.EQUIPMENT, 1, "Equipment Locker A",
                        "Pickup Mon-Fri 09:00-17:00",
                        "Portable 4K projector, carry case, HDMI + USB-C cables included.",
                        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
                        List.of(),
                        now)
        );
    }

    private static Resource resource(String name, ResourceType type, int capacity, String location,
                                     String availability, String description, String imageUrl,
                                     List<Review> reviews, LocalDateTime now) {
        Resource resource = new Resource();
        resource.setName(name);
        resource.setType(type);
        resource.setCapacity(capacity);
        resource.setLocation(location);
        resource.setAvailabilityWindows(availability);
        resource.setStatus(ResourceStatus.ACTIVE);
        resource.setDescription(description);
        resource.setImageUrl(imageUrl);
        resource.setCreatedAt(now);
        resource.setUpdatedAt(now);
        resource.setReviews(new ArrayList<>(reviews));
        return resource;
    }

    private static Review review(User author, int rating, String comment) {
        Review review = new Review();
        review.setUserId(author.getId());
        review.setUserName(author.getDisplayName());
        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now().minusDays(7));
        return review;
    }

    // ---------------------------------------------------------------------
    // Bookings
    // ---------------------------------------------------------------------
    public static List<Booking> bookings(List<User> users, List<Resource> resources) {
        LocalDate today = LocalDate.now();
        String janeId = users.get(4).getId();
        String raviId = users.get(5).getId();
        String hallId = resources.get(0).getId();
        String labId = resources.get(1).getId();
        String meetingId = resources.get(3).getId();

        Booking upcoming = new Booking(hallId, janeId,
                today.plusDays(2), LocalTime.of(10, 0), LocalTime.of(12, 0),
                "Final-year project defense", 25);
        upcoming.setStatus(BookingStatus.APPROVED);

        Booking pending = new Booking(labId, raviId,
                today.plusDays(3), LocalTime.of(14, 0), LocalTime.of(16, 0),
                "ML workshop hands-on session", 20);
        pending.setStatus(BookingStatus.PENDING);

        Booking rejected = new Booking(meetingId, janeId,
                today.plusDays(1), LocalTime.of(18, 0), LocalTime.of(19, 0),
                "External vendor demo", 8);
        rejected.setStatus(BookingStatus.REJECTED);
        rejected.setReason("Resource closed for maintenance during that slot.");

        Booking cancelled = new Booking(meetingId, raviId,
                today.plusDays(4), LocalTime.of(11, 0), LocalTime.of(12, 0),
                "Sprint planning", 6);
        cancelled.setStatus(BookingStatus.CANCELLED);

        return List.of(upcoming, pending, rejected, cancelled);
    }

    // ---------------------------------------------------------------------
    // Tickets
    // ---------------------------------------------------------------------
    public static List<Ticket> tickets(List<User> users, List<Resource> resources) {
        LocalDateTime now = LocalDateTime.now();
        User jane = users.get(4);
        User ravi = users.get(5);
        User alex = users.get(2);
        User priya = users.get(3);
        User manager = users.get(1);

        return List.of(
                ticket("TCK-1001", "Projector not powering on in Lecture Hall A",
                        "Lecturer reports the projector will not power on for the 9am lecture. Tried the spare remote with no luck.",
                        TicketType.INCIDENT, TicketPriority.HIGH, "AV Equipment",
                        TicketStatus.IN_PROGRESS,
                        location("Main Building", "1", "A-101", "Main Campus", "Wall plate behind lectern"),
                        summary(jane), summary(alex),
                        List.of(
                                comment(alex, "On site, swapping in spare bulb and re-cabling HDMI."),
                                comment(jane, "Thanks - I moved the class to Lab 1 for today.")
                        ),
                        List.of(
                                activity("ASSIGNED", "Assigned to Alex Technician", alex),
                                activity("STATUS_CHANGED", "Status changed from OPEN to IN_PROGRESS", alex)
                        ),
                        List.of(),
                        now.minusHours(6), now.minusHours(1), 8),

                ticket("TCK-1002", "AC unit leaking in Computer Lab 1",
                        "Water dripping from the ceiling AC onto workstation #14. Workstation moved; cleanup required.",
                        TicketType.MAINTENANCE, TicketPriority.CRITICAL, "HVAC",
                        TicketStatus.OPEN,
                        location("Engineering Block", "2", "Lab-1", "Engineering Campus", "Row B, station 14"),
                        summary(ravi), null,
                        List.of(comment(ravi, "Bucket placed under leak; facilities please prioritize.")),
                        List.of(activity("CREATED", "Ticket created", ravi)),
                        List.of(),
                        now.minusHours(2), now.minusHours(2), 4),

                ticket("TCK-1003", "Request: install Git on Robotics Lab workstations",
                        "All 20 robotics workstations need Git + VS Code pre-installed before next Tuesday's workshop.",
                        TicketType.MAINTENANCE, TicketPriority.MEDIUM, "Software",
                        TicketStatus.RESOLVED,
                        location("Engineering Block", "3", "Robotics", "Engineering Campus", null),
                        summary(jane), summary(priya),
                        List.of(
                                comment(priya, "Git installed via Chocolatey on all 20 machines."),
                                comment(jane, "Verified on 5 random machines - works as expected.")
                        ),
                        List.of(
                                activity("ASSIGNED", "Assigned to Priya Technician", manager),
                                activity("STATUS_CHANGED", "Status changed to RESOLVED", priya)
                        ),
                        List.of(),
                        now.minusDays(3), now.minusDays(1), 24),

                ticket("TCK-1004", "Wi-Fi drops in Meeting Room Cedar",
                        "During meetings >30 minutes the Wi-Fi disconnects 2-3 times. Ethernet works fine.",
                        TicketType.INCIDENT, TicketPriority.MEDIUM, "Network",
                        TicketStatus.ON_HOLD,
                        location("Admin Block", "4", "Cedar", "Main Campus", "Awaiting ISP site visit"),
                        summary(ravi), summary(alex),
                        List.of(comment(alex, "Waiting on ISP to replace the access point on 2026-07-02.")),
                        List.of(
                                activity("ASSIGNED", "Assigned to Alex Technician", manager),
                                activity("STATUS_CHANGED", "Status changed to ON_HOLD pending vendor", alex)
                        ),
                        List.of(),
                        now.minusDays(5), now.minusDays(2), 48),

                ticket("TCK-1005", "Whiteboard markers out of stock in Meeting Room Birch",
                        "All dry-erase markers are dried out. Please restock before Friday's design review.",
                        TicketType.MAINTENANCE, TicketPriority.LOW, "Supplies",
                        TicketStatus.CLOSED,
                        location("Admin Block", "4", "Birch", "Main Campus", null),
                        summary(jane), summary(priya),
                        List.of(comment(priya, "Markers and erasers restocked.")),
                        List.of(
                                activity("ASSIGNED", "Assigned to Priya Technician", manager),
                                activity("STATUS_CHANGED", "Status changed to CLOSED", priya)
                        ),
                        List.of(),
                        now.minusDays(10), now.minusDays(8), 72)
        );
    }

    private static Ticket ticket(String ticketId, String title, String description,
                                 TicketType type, TicketPriority priority, String category,
                                 TicketStatus status,
                                 TicketLocation location,
                                 TicketUserSummary reporter, TicketUserSummary assignee,
                                 List<TicketComment> comments,
                                 List<TicketActivityItem> activity,
                                 List<TicketAttachment> attachments,
                                 LocalDateTime createdAt, LocalDateTime updatedAt, int slaHours) {
        Ticket ticket = new Ticket();
        ticket.setTicketId(ticketId);
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setType(type);
        ticket.setPriority(priority);
        ticket.setCategory(category);
        ticket.setStatus(status);
        ticket.setLocation(location);
        ticket.setReporter(reporter);
        ticket.setAssignedTechnician(assignee);
        ticket.setRequiresExtendedResolution(false);
        ticket.setSlaHours(slaHours);
        ticket.setDueAt(createdAt.plusHours(slaHours));
        ticket.setOverdue(updatedAt.isAfter(ticket.getDueAt()) && !(status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED || status == TicketStatus.CANCELLED));
        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            ticket.setResolvedAt(updatedAt.minusHours(2));
        }
        if (status == TicketStatus.CLOSED) {
            ticket.setClosedAt(updatedAt);
        }
        ticket.setAttachments(new ArrayList<>(attachments));
        ticket.setComments(new ArrayList<>(comments));
        ticket.setActivity(new ArrayList<>(activity));
        ticket.setCreatedAt(createdAt);
        ticket.setUpdatedAt(updatedAt);
        return ticket;
    }

    private static TicketLocation location(String building, String floor, String room, String campus, String note) {
        TicketLocation loc = new TicketLocation();
        loc.setBuilding(building);
        loc.setFloor(floor);
        loc.setRoom(room);
        loc.setCampus(campus);
        loc.setNote(note);
        return loc;
    }

    private static TicketUserSummary summary(User user) {
        if (user == null) {
            return null;
        }
        TicketUserSummary s = new TicketUserSummary();
        s.setId(user.getId());
        s.setFullName(user.getDisplayName());
        s.setEmail(user.getEmail());
        s.setRole(user.getRole());
        return s;
    }

    private static TicketComment comment(User author, String message) {
        TicketComment c = new TicketComment();
        c.setId(java.util.UUID.randomUUID().toString());
        c.setMessage(message);
        c.setCreatedAt(LocalDateTime.now().minusHours(2));
        c.setAuthor(actor(author));
        return c;
    }

    private static TicketActivityItem activity(String action, String message, User actor) {
        TicketActivityItem item = new TicketActivityItem();
        item.setId(java.util.UUID.randomUUID().toString());
        item.setAction(action);
        item.setMessage(message);
        item.setCreatedAt(LocalDateTime.now().minusHours(1));
        item.setActor(actor(actor));
        return item;
    }

    private static TicketActorSummary actor(User user) {
        if (user == null) {
            return null;
        }
        TicketActorSummary a = new TicketActorSummary();
        a.setId(user.getId());
        a.setFullName(user.getDisplayName());
        a.setRole(user.getRole());
        return a;
    }

    // ---------------------------------------------------------------------
    // Role requests
    // ---------------------------------------------------------------------
    public static List<RoleRequest> roleRequests(List<User> users) {
        User jane = users.get(4);
        User ravi = users.get(5);
        User admin = users.get(0);

        RoleRequest pending = new RoleRequest();
        pending.setRequesterUserId(jane.getId());
        pending.setRequesterEmail(jane.getEmail());
        pending.setRequesterDisplayName(jane.getDisplayName());
        pending.setCurrentRole(UserRole.USER);
        pending.setRequestedRole(UserRole.TECHNICIAN);
        pending.setDescription("I've been helping debug lab issues; would like to formalize as technician.");
        pending.setStatus(RoleRequestStatus.PENDING);
        pending.setCreatedAt(LocalDateTime.now().minusHours(8));
        pending.setUpdatedAt(LocalDateTime.now().minusHours(8));

        RoleRequest approved = new RoleRequest();
        approved.setRequesterUserId(ravi.getId());
        approved.setRequesterEmail(ravi.getEmail());
        approved.setRequesterDisplayName(ravi.getDisplayName());
        approved.setCurrentRole(UserRole.TECHNICIAN);
        approved.setRequestedRole(UserRole.MANAGER);
        approved.setDescription("Managing the IT support rotation - need elevated role for approvals.");
        approved.setStatus(RoleRequestStatus.APPROVED);
        approved.setCreatedAt(LocalDateTime.now().minusDays(4));
        approved.setUpdatedAt(LocalDateTime.now().minusDays(3));
        approved.setReviewedAt(LocalDateTime.now().minusDays(3));
        approved.setReviewedByUserId(admin.getId());
        approved.setReviewedByEmail(admin.getEmail());

        return List.of(pending, approved);
    }

    // ---------------------------------------------------------------------
    // Activity events
    // ---------------------------------------------------------------------
    public static List<ActivityEvent> activityEvents(List<User> users) {
        User jane = users.get(4);
        User ravi = users.get(5);
        User admin = users.get(0);

        ActivityEvent created = new ActivityEvent();
        created.setEventType(ActivityEventType.ROLE_REQUEST_CREATED);
        created.setTitle("Role request submitted");
        created.setMessage(jane.getDisplayName() + " requested the TECHNICIAN role.");
        created.setActorUserId(jane.getId());
        created.setActorEmail(jane.getEmail());
        created.setActorDisplayName(jane.getDisplayName());
        created.setSubjectUserId(jane.getId());
        created.setSubjectEmail(jane.getEmail());
        created.setSubjectDisplayName(jane.getDisplayName());
        created.setPreviousRole(UserRole.USER);
        created.setRequestedRole(UserRole.TECHNICIAN);
        created.setRoleRequestStatus(RoleRequestStatus.PENDING);
        created.setCreatedAt(LocalDateTime.now().minusHours(8));

        ActivityEvent approved = new ActivityEvent();
        approved.setEventType(ActivityEventType.ROLE_REQUEST_APPROVED);
        approved.setTitle("Role request approved");
        approved.setMessage("Ravi Silva promoted to MANAGER.");
        approved.setActorUserId(admin.getId());
        approved.setActorEmail(admin.getEmail());
        approved.setActorDisplayName(admin.getDisplayName());
        approved.setSubjectUserId(ravi.getId());
        approved.setSubjectEmail(ravi.getEmail());
        approved.setSubjectDisplayName(ravi.getDisplayName());
        approved.setPreviousRole(UserRole.TECHNICIAN);
        approved.setRequestedRole(UserRole.MANAGER);
        approved.setResultingRole(UserRole.MANAGER);
        approved.setRoleRequestStatus(RoleRequestStatus.APPROVED);
        approved.setCreatedAt(LocalDateTime.now().minusDays(3));
        approved.setReadByUserIds(new ArrayList<>());
        approved.getReadByUserIds().add(admin.getId());

        ActivityEvent roleChanged = new ActivityEvent();
        roleChanged.setEventType(ActivityEventType.USER_ROLE_CHANGED);
        roleChanged.setTitle("Role updated");
        roleChanged.setMessage(admin.getDisplayName() + " updated Ravi Silva's role to MANAGER.");
        roleChanged.setActorUserId(admin.getId());
        roleChanged.setActorEmail(admin.getEmail());
        roleChanged.setActorDisplayName(admin.getDisplayName());
        roleChanged.setSubjectUserId(ravi.getId());
        roleChanged.setSubjectEmail(ravi.getEmail());
        roleChanged.setSubjectDisplayName(ravi.getDisplayName());
        roleChanged.setPreviousRole(UserRole.TECHNICIAN);
        roleChanged.setResultingRole(UserRole.MANAGER);
        roleChanged.setCreatedAt(LocalDateTime.now().minusDays(3).plusMinutes(1));

        return List.of(created, approved, roleChanged);
    }
}

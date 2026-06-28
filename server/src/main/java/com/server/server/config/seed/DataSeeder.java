package com.server.server.config.seed;

import com.server.server.activity.entity.ActivityEvent;
import com.server.server.activity.repository.ActivityEventRepository;
import com.server.server.auth.entity.User;
import com.server.server.auth.repository.UserRepository;
import com.server.server.booking.entity.Booking;
import com.server.server.booking.repository.BookingRepository;
import com.server.server.resource.entity.Resource;
import com.server.server.resource.repository.ResourceRepository;
import com.server.server.ticketing.model.Ticket;
import com.server.server.ticketing.repository.TicketRepository;
import com.server.server.user.entity.RoleRequest;
import com.server.server.user.repository.RoleRequestRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Demo data seeder. Opt-in via {@code app.seed.enabled=true} (passed as
 * {@code --app.seed.enabled=true} to {@code spring-boot:run}, or set in
 * {@code application.properties}). Idempotent: re-running with an already
 * populated database is a no-op.
 *
 * <p>Use {@code app.seed.reset=true} to wipe every collection listed in
 * {@link #COLLECTIONS} before seeding. Use with care — destructive.
 */
@Component
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final ActivityEventRepository activityEventRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean reset;

    public DataSeeder(UserRepository userRepository,
                      ResourceRepository resourceRepository,
                      BookingRepository bookingRepository,
                      TicketRepository ticketRepository,
                      RoleRequestRepository roleRequestRepository,
                      ActivityEventRepository activityEventRepository,
                      PasswordEncoder passwordEncoder,
                      @org.springframework.beans.factory.annotation.Value("${app.seed.reset:false}") boolean reset) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.roleRequestRepository = roleRequestRepository;
        this.activityEventRepository = activityEventRepository;
        this.passwordEncoder = passwordEncoder;
        this.reset = reset;
    }

    @Override
    public void run(String... args) {
        log.info("=== DataSeeder starting (reset={}) ===", reset);
        if (reset) {
            resetCollections();
        } else if (userRepository.count() > 0) {
            log.info("Users already present ({}). Skipping seed. Set app.seed.reset=true to wipe and re-seed.",
                    userRepository.count());
            return;
        }

        seedUsers();
        List<User> users = userRepository.findAll();

        seedResources(users);
        List<Resource> resources = resourceRepository.findAll();

        seedBookings(users, resources);
        seedTickets(users, resources);
        seedRoleRequests(users);
        seedActivityEvents(users);

        log.info("=== DataSeeder complete. Sign in with email 'demo@devgen.com' / password '{}' ===",
                SeedData.DEMO_PASSWORD);
    }

    private void resetCollections() {
        log.warn("Wiping collections: {}", COLLECTIONS);
        activityEventRepository.deleteAll();
        roleRequestRepository.deleteAll();
        ticketRepository.deleteAll();
        bookingRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();
    }

    private void seedUsers() {
        String hash = passwordEncoder.encode(SeedData.DEMO_PASSWORD);
        for (User u : SeedData.users()) {
            u.setPasswordHash(hash);
            userRepository.save(u);
        }
        log.info("Seeded {} users", SeedData.users().size());
    }

    private void seedResources(List<User> users) {
        List<Resource> resources = SeedData.resources(users);
        resourceRepository.saveAll(resources);
        log.info("Seeded {} resources", resources.size());
    }

    private void seedBookings(List<User> users, List<Resource> resources) {
        List<Booking> bookings = SeedData.bookings(users, resources);
        bookingRepository.saveAll(bookings);
        log.info("Seeded {} bookings", bookings.size());
    }

    private void seedTickets(List<User> users, List<Resource> resources) {
        List<Ticket> tickets = SeedData.tickets(users, resources);
        ticketRepository.saveAll(tickets);
        log.info("Seeded {} tickets", tickets.size());
    }

    private void seedRoleRequests(List<User> users) {
        List<RoleRequest> requests = SeedData.roleRequests(users);
        roleRequestRepository.saveAll(requests);
        log.info("Seeded {} role requests", requests.size());
    }

    private void seedActivityEvents(List<User> users) {
        List<ActivityEvent> events = SeedData.activityEvents(users);
        activityEventRepository.saveAll(events);
        log.info("Seeded {} activity events", events.size());
    }

    private static final List<String> COLLECTIONS = List.of(
            "activity_events", "role_requests", "tickets", "bookings", "resources", "users");
}

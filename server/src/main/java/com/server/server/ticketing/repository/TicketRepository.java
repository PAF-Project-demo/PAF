package com.server.server.ticketing.repository;

import com.server.server.ticketing.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TicketRepository extends MongoRepository<Ticket, String> {

    boolean existsByTicketId(String ticketId);
}

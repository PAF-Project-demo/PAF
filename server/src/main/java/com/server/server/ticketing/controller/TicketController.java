package com.server.server.ticketing.controller;

import com.server.server.ticketing.dto.AddTicketCommentRequest;
import com.server.server.ticketing.dto.AssignTechnicianRequest;
import com.server.server.ticketing.dto.CreateTicketRequest;
import com.server.server.ticketing.dto.TicketDashboardResponse;
import com.server.server.ticketing.dto.TicketListResponse;
import com.server.server.ticketing.dto.TicketMetaResponse;
import com.server.server.ticketing.dto.TicketReportsResponse;
import com.server.server.ticketing.dto.TicketResponse;
import com.server.server.ticketing.dto.UpdateTicketRequest;
import com.server.server.ticketing.model.TicketPriority;
import com.server.server.ticketing.model.TicketStatus;
import com.server.server.ticketing.model.TicketType;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.server.server.ticketing.service.TicketService;

@RestController
@RequestMapping("/api")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/tickets/meta")
    public ResponseEntity<TicketMetaResponse> getTicketMeta() {
        return ResponseEntity.ok(ticketService.getTicketMeta());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/tickets")
    public ResponseEntity<TicketListResponse> getTickets(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TicketType type,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String assignedTechnicianId,
            @RequestParam(name = "overdue", defaultValue = "false") boolean overdueOnly) {
        return ResponseEntity.ok(ticketService.getTickets(
                authentication.getName(),
                search,
                type,
                priority,
                status,
                category,
                location,
                assignedTechnicianId,
                overdueOnly));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<TicketResponse> getTicketById(
            Authentication authentication,
            @PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.getTicketById(authentication.getName(), ticketId));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> createTicket(
            Authentication authentication,
            @Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(authentication.getName(), request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @PutMapping("/tickets/{ticketId}")
    public ResponseEntity<TicketResponse> updateTicket(
            Authentication authentication,
            @PathVariable String ticketId,
            @Valid @RequestBody UpdateTicketRequest request) {
        return ResponseEntity.ok(ticketService.updateTicket(authentication.getName(), ticketId, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/tickets/{ticketId}/assign")
    public ResponseEntity<TicketResponse> assignTechnician(
            Authentication authentication,
            @PathVariable String ticketId,
            @RequestBody(required = false) AssignTechnicianRequest request) {
        return ResponseEntity.ok(ticketService.assignTechnician(
                authentication.getName(),
                ticketId,
                request != null ? request.technicianId() : null));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/tickets/{ticketId}/comments")
    public ResponseEntity<TicketResponse> addComment(
            Authentication authentication,
            @PathVariable String ticketId,
            @Valid @RequestBody AddTicketCommentRequest request) {
        return ResponseEntity.ok(ticketService.addComment(authentication.getName(), ticketId, request));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping(
            value = "/tickets/{ticketId}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponse> addAttachments(
            Authentication authentication,
            @PathVariable String ticketId,
            @RequestPart("attachments") MultipartFile[] attachments) {
        return ResponseEntity.ok(ticketService.addAttachments(authentication.getName(), ticketId, attachments));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/dashboard")
    public ResponseEntity<TicketDashboardResponse> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getDashboardSummary(authentication.getName()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @GetMapping("/reports")
    public ResponseEntity<TicketReportsResponse> getReports(Authentication authentication) {
        return ResponseEntity.ok(ticketService.getReports(authentication.getName()));
    }
}

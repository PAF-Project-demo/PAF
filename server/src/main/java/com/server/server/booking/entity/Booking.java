package com.server.server.booking.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * MongoDB Document representing a resource booking.
 * Stores booking information including resource reference, user, time slots,
 * and status tracking.
 */
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    @Indexed
    private String resourceId;

    @Indexed
    private String userId;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    private String purpose;

    private Integer attendees;

    private BookingStatus status;

    private String reason;

    private LocalDateTime createdAt;

    // Constructors
    public Booking() {
    }

    public Booking(String resourceId, String userId, LocalDate date, LocalTime startTime,
                   LocalTime endTime, String purpose, Integer attendees) {
        this.resourceId = resourceId;
        this.userId = userId;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.attendees = attendees;
        this.status = BookingStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public Integer getAttendees() {
        return attendees;
    }

    public void setAttendees(Integer attendees) {
        this.attendees = attendees;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Booking{" +
                "id='" + id + '\'' +
                ", resourceId='" + resourceId + '\'' +
                ", userId='" + userId + '\'' +
                ", date=" + date +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", purpose='" + purpose + '\'' +
                ", attendees=" + attendees +
                ", status=" + status +
                ", reason='" + reason + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

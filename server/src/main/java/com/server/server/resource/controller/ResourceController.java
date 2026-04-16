package com.server.server.resource.controller;

import com.server.server.resource.dto.ResourceDTO;
import com.server.server.resource.dto.ReviewDTO;
import com.server.server.resource.entity.ResourceStatus;
import com.server.server.resource.entity.ResourceType;
import com.server.server.resource.service.ResourceService;
import jakarta.validation.Valid;
import com.server.server.user.service.UserAccessService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;
    private final UserAccessService userAccessService;

    public ResourceController(ResourceService resourceService, UserAccessService userAccessService) {
        this.resourceService = resourceService;
        this.userAccessService = userAccessService;
    }

    @PostMapping
    public ResponseEntity<ResourceDTO> createResource(
            @RequestHeader(value = "X-Auth-User-Id", required = false) String userId,
            @Valid @RequestBody ResourceDTO resourceDTO) {
        userAccessService.assertAdminAccess(userId);
        ResourceDTO created = resourceService.createResource(resourceDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ResourceDTO>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer capacity) {
        try {
            System.out.println("Fetching resources with filters - Type: " + type + ", Location: " + location + ", Capacity: " + capacity);
            List<ResourceDTO> resources = resourceService.getAllResources(type, location, capacity);
            System.out.println("Found " + resources.size() + " resources");
            return ResponseEntity.ok(resources);
        } catch (Exception e) {
            System.err.println("Error fetching resources: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceDTO> getResourceById(@PathVariable String id) {
        ResourceDTO resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceDTO> updateResource(
            @RequestHeader(value = "X-Auth-User-Id", required = false) String userId,
            @PathVariable String id,
            @Valid @RequestBody ResourceDTO resourceDTO) {
        userAccessService.assertAdminAccess(userId);
        ResourceDTO updated = resourceService.updateResource(id, resourceDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(
            @RequestHeader(value = "X-Auth-User-Id", required = false) String userId,
            @PathVariable String id) {
        userAccessService.assertAdminAccess(userId);
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceDTO> updateResourceStatus(
            @RequestHeader(value = "X-Auth-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {
        userAccessService.assertAdminAccess(userId);
        ResourceStatus newStatus = ResourceStatus.valueOf(statusUpdate.get("status"));
        ResourceDTO updated = resourceService.updateResourceStatus(id, newStatus);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/init-samples")
    public ResponseEntity<Map<String, Object>> initializeSampleResources() {
        try {
            List<ResourceDTO> existingResources = resourceService.getAllResources(null, null, null);
            
            if (!existingResources.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Sample resources already exist"
                ));
            }

            List<ResourceDTO> sampleResources = List.of(
                createSampleResource("Lecture Hall A", ResourceType.LECTURE_HALL, 100, "Building A, Room 101", "Modern lecture hall with projector and audio system"),
                createSampleResource("Lecture Hall B", ResourceType.LECTURE_HALL, 80, "Building A, Room 102", "Interactive lecture hall with smart board"),
                createSampleResource("Lab 1 - Computer Science", ResourceType.LAB, 40, "Building B, Room 201", "Computer lab with 40 workstations"),
                createSampleResource("Lab 2 - Physics", ResourceType.LAB, 30, "Building B, Room 202", "Physics laboratory with experiment equipment"),
                createSampleResource("Assignment Room 1", ResourceType.MEETING_ROOM, 20, "Building C, Room 301", "Collaborative space for group assignments"),
                createSampleResource("Assignment Room 2", ResourceType.MEETING_ROOM, 15, "Building C, Room 302", "Quiet study room for individual work"),
                createSampleResource("Projector Equipment", ResourceType.EQUIPMENT, 1, "Media Room", "Professional grade projector with lens"),
                createSampleResource("Sound System", ResourceType.EQUIPMENT, 1, "Media Room", "Complete audio setup with microphones and speakers")
            );

            List<ResourceDTO> created = sampleResources.stream()
                .map(resourceService::createResource)
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sample resources created successfully",
                "count", created.size(),
                "resources", created
            ));
        } catch (Exception e) {
            System.err.println("Error initializing sample resources: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error creating sample resources: " + e.getMessage()
            ));
        }
    }

    private ResourceDTO createSampleResource(String name, ResourceType type, Integer capacity, String location, String description) {
        ResourceDTO dto = new ResourceDTO();
        dto.setName(name);
        dto.setType(type);
        dto.setCapacity(capacity);
        dto.setLocation(location);
        dto.setDescription(description);
        dto.setStatus(ResourceStatus.ACTIVE);
        dto.setCreatedAt(LocalDateTime.now());
        dto.setUpdatedAt(LocalDateTime.now());
        return dto;
    @PostMapping("/{id}/reviews")
    public ResponseEntity<ResourceDTO> addReviewToResource(
            @RequestHeader(value = "X-Auth-User-Id", required = true) String userId,
            @PathVariable String id,
            @Valid @RequestBody ReviewDTO reviewDTO) {
        ResourceDTO updated = resourceService.addReviewToResource(id, reviewDTO, userId);
        return new ResponseEntity<>(updated, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}/reviews/{reviewId}")
    public ResponseEntity<ResourceDTO> deleteReviewFromResource(
            @RequestHeader(value = "X-Auth-User-Id", required = true) String userId,
            @PathVariable String id,
            @PathVariable String reviewId) {
        ResourceDTO updated = resourceService.deleteReviewFromResource(id, reviewId, userId);
        return ResponseEntity.ok(updated);
    }
}

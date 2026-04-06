package com.server.server.resource.controller;

import com.server.server.resource.dto.ResourceDTO;
import com.server.server.resource.entity.ResourceStatus;
import com.server.server.resource.entity.ResourceType;
import com.server.server.resource.service.ResourceService;
import jakarta.validation.Valid;
import com.server.server.user.service.UserAccessService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*", maxAge = 3600)
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
        List<ResourceDTO> resources = resourceService.getAllResources(type, location, capacity);
        return ResponseEntity.ok(resources);
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
}

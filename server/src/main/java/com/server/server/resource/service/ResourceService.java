package com.server.server.resource.service;

import com.server.server.resource.dto.ResourceDTO;
import com.server.server.resource.entity.ResourceStatus;
import com.server.server.resource.entity.ResourceType;
import java.util.List;

public interface ResourceService {
    ResourceDTO createResource(ResourceDTO resourceDTO);
    List<ResourceDTO> getAllResources(ResourceType type, String location, Integer capacity);
    ResourceDTO getResourceById(String id);
    ResourceDTO updateResource(String id, ResourceDTO resourceDTO);
    void deleteResource(String id);
    ResourceDTO updateResourceStatus(String id, ResourceStatus status);
    ResourceDTO addReviewToResource(String resourceId, com.server.server.resource.dto.ReviewDTO reviewDTO, String userId);
    ResourceDTO deleteReviewFromResource(String resourceId, String reviewId, String userId);
}

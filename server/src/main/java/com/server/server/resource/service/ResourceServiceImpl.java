package com.server.server.resource.service;

import com.server.server.resource.dto.ResourceDTO;
import com.server.server.resource.entity.Resource;
import com.server.server.resource.entity.ResourceStatus;
import com.server.server.resource.entity.ResourceType;
import com.server.server.resource.exception.ResourceNotFoundException;
import com.server.server.resource.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.server.server.resource.dto.ReviewDTO;
import com.server.server.resource.entity.Review;
import java.util.ArrayList;
import com.server.server.auth.entity.User;
import com.server.server.auth.repository.UserRepository;

@Service
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository, UserRepository userRepository) {
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ResourceDTO createResource(ResourceDTO resourceDTO) {
        Resource resource = new Resource();
        mapToEntity(resourceDTO, resource);
        resource.setStatus(ResourceStatus.ACTIVE); // Default status
        resource.setCreatedAt(LocalDateTime.now());
        resource.setUpdatedAt(LocalDateTime.now());

        Resource saved = resourceRepository.save(resource);
        return mapToDTO(saved);
    }

    @Override
    public List<ResourceDTO> getAllResources(ResourceType type, String location, Integer capacity) {
        List<Resource> resources;

        if (type != null && location != null && capacity != null) {
            resources = resourceRepository.findByTypeAndLocationContainingIgnoreCaseAndCapacityGreaterThanEqual(type,
                    location, capacity);
        } else if (type != null && location != null) {
            resources = resourceRepository.findByTypeAndLocationContainingIgnoreCase(type, location);
        } else if (type != null && capacity != null) {
            resources = resourceRepository.findByTypeAndCapacityGreaterThanEqual(type, capacity);
        } else if (location != null && capacity != null) {
            resources = resourceRepository.findByLocationContainingIgnoreCaseAndCapacityGreaterThanEqual(location,
                    capacity);
        } else if (type != null) {
            resources = resourceRepository.findByType(type);
        } else if (location != null) {
            resources = resourceRepository.findByLocationContainingIgnoreCase(location);
        } else if (capacity != null) {
            resources = resourceRepository.findByCapacityGreaterThanEqual(capacity);
        } else {
            resources = resourceRepository.findAll();
        }

        return resources.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public ResourceDTO getResourceById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        return mapToDTO(resource);
    }

    @Override
    public ResourceDTO updateResource(String id, ResourceDTO resourceDTO) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));

        mapToEntity(resourceDTO, resource);
        resource.setUpdatedAt(LocalDateTime.now());

        Resource updated = resourceRepository.save(resource);
        return mapToDTO(updated);
    }

    @Override
    public void deleteResource(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        resourceRepository.delete(resource);
    }

    @Override
    public ResourceDTO updateResourceStatus(String id, ResourceStatus status) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));

        resource.setStatus(status);
        resource.setUpdatedAt(LocalDateTime.now());

        Resource updated = resourceRepository.save(resource);
        return mapToDTO(updated);
    }

    @Override
    public ResourceDTO addReviewToResource(String resourceId, ReviewDTO reviewDTO, String userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));

        if (resource.getReviews() == null) {
            resource.setReviews(new ArrayList<>());
        }

        String actualUserName = "Anonymous User";
        if (userId != null) {
            actualUserName = userRepository.findById(userId)
                    .map(User::getDisplayName)
                    .filter(name -> name != null && !name.isEmpty())
                    .orElse("Student");
        }

        Review review = new Review();
        review.setUserId(userId);
        review.setUserName(actualUserName);
        review.setRating(reviewDTO.getRating());
        review.setComment(reviewDTO.getComment());
        review.setCreatedAt(LocalDateTime.now());

        resource.getReviews().add(review);
        Resource updated = resourceRepository.save(resource);
        return mapToDTO(updated);
    }

    @Override
    public ResourceDTO deleteReviewFromResource(String resourceId, String reviewId, String userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));

        if (resource.getReviews() != null) {
            boolean removed = resource.getReviews().removeIf(r -> 
                r.getId().equals(reviewId) && r.getUserId().equals(userId)
            );
            
            if (removed) {
                Resource updated = resourceRepository.save(resource);
                return mapToDTO(updated);
            }
        }
        
        // If not removed (not found, or user didn't own it), just return untouched. Alternatively, throw exception.
        return mapToDTO(resource);
    }

    private void mapToEntity(ResourceDTO dto, Resource entity) {
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setCapacity(dto.getCapacity());
        entity.setLocation(dto.getLocation());
        entity.setAvailabilityWindows(dto.getAvailabilityWindows());
        entity.setImageUrl(dto.getImageUrl());
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
    }

    private ResourceDTO mapToDTO(Resource entity) {
        ResourceDTO dto = new ResourceDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setCapacity(entity.getCapacity());
        dto.setLocation(entity.getLocation());
        dto.setAvailabilityWindows(entity.getAvailabilityWindows());
        dto.setStatus(entity.getStatus());
        dto.setImageUrl(entity.getImageUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getReviews() != null) {
            List<ReviewDTO> reviewDTOs = entity.getReviews().stream().map(review -> {
                ReviewDTO rDTO = new ReviewDTO();
                rDTO.setId(review.getId());
                rDTO.setUserId(review.getUserId());
                rDTO.setUserName(review.getUserName() != null ? review.getUserName() : "Anonymous User");
                rDTO.setRating(review.getRating());
                rDTO.setComment(review.getComment());
                rDTO.setCreatedAt(review.getCreatedAt());
                return rDTO;
            }).collect(Collectors.toList());
            dto.setReviews(reviewDTOs);

            if (!reviewDTOs.isEmpty()) {
                double avg = reviewDTOs.stream().mapToInt(ReviewDTO::getRating).average().orElse(0.0);
                // Round to 1 decimal place
                dto.setAverageRating(Math.round(avg * 10.0) / 10.0);
            } else {
                dto.setAverageRating(0.0);
            }
        } else {
            dto.setReviews(new ArrayList<>());
            dto.setAverageRating(0.0);
        }

        return dto;
    }
}

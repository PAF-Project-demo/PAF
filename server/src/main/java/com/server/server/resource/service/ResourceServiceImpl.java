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

@Service
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
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
            resources = resourceRepository.findByTypeAndLocationContainingIgnoreCaseAndCapacityGreaterThanEqual(type, location, capacity);
        } else if (type != null && location != null) {
            resources = resourceRepository.findByTypeAndLocationContainingIgnoreCase(type, location);
        } else if (type != null && capacity != null) {
            resources = resourceRepository.findByTypeAndCapacityGreaterThanEqual(type, capacity);
        } else if (location != null && capacity != null) {
            resources = resourceRepository.findByLocationContainingIgnoreCaseAndCapacityGreaterThanEqual(location, capacity);
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

    private void mapToEntity(ResourceDTO dto, Resource entity) {
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setCapacity(dto.getCapacity());
        entity.setLocation(dto.getLocation());
        entity.setAvailabilityWindows(dto.getAvailabilityWindows());
        entity.setDescription(dto.getDescription());
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
        dto.setDescription(entity.getDescription());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}

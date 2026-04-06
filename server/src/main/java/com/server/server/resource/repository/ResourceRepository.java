package com.server.server.resource.repository;

import com.server.server.resource.entity.Resource;
import com.server.server.resource.entity.ResourceType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
    List<Resource> findByType(ResourceType type);
    List<Resource> findByLocationContainingIgnoreCase(String location);
    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);
    List<Resource> findByTypeAndLocationContainingIgnoreCase(ResourceType type, String location);
    List<Resource> findByTypeAndCapacityGreaterThanEqual(ResourceType type, Integer capacity);
    List<Resource> findByLocationContainingIgnoreCaseAndCapacityGreaterThanEqual(String location, Integer capacity);
    List<Resource> findByTypeAndLocationContainingIgnoreCaseAndCapacityGreaterThanEqual(ResourceType type, String location, Integer capacity);
}

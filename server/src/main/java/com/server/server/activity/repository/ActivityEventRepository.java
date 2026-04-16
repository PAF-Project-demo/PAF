package com.server.server.activity.repository;

import com.server.server.activity.entity.ActivityEvent;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface ActivityEventRepository extends MongoRepository<ActivityEvent, String> {

    List<ActivityEvent> findBySubjectUserId(String subjectUserId, Pageable pageable);

    @Query(value = "{ 'subjectUserId': ?0, 'readByUserIds': { $ne: ?1 } }", count = true)
    long countUnreadBySubjectUserId(String subjectUserId, String viewerUserId);

    @Query(value = "{ 'readByUserIds': { $ne: ?0 } }", count = true)
    long countUnreadForAdmin(String viewerUserId);

    @Query("{ 'subjectUserId': ?0, 'readByUserIds': { $ne: ?1 } }")
    List<ActivityEvent> findUnreadBySubjectUserId(String subjectUserId, String viewerUserId);

    @Query("{ 'readByUserIds': { $ne: ?0 } }")
    List<ActivityEvent> findUnreadForAdmin(String viewerUserId);
}

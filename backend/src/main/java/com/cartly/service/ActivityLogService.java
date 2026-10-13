package com.cartly.service;

import com.cartly.dto.AdminDtos;
import com.cartly.dto.PageResponse;
import com.cartly.entity.ActivityLog;
import com.cartly.repository.ActivityLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final SseNotificationService sseNotificationService;

    public ActivityLogService(ActivityLogRepository activityLogRepository, SseNotificationService sseNotificationService) {
        this.activityLogRepository = activityLogRepository;
        this.sseNotificationService = sseNotificationService;
    }

    @Transactional
    public ActivityLog log(Long userId, String userEmail, String action, String entityType, Long entityId, String details, String ipAddress) {
        ActivityLog log = new ActivityLog(userId, userEmail, action, entityType, entityId, details, ipAddress);
        ActivityLog saved = activityLogRepository.save(log);

        AdminDtos.ActivityLogDto dto = new AdminDtos.ActivityLogDto(
                saved.getId(),
                saved.getUserId(),
                saved.getUserEmail(),
                saved.getAction(),
                saved.getEntityType(),
                saved.getEntityId(),
                saved.getDetails(),
                saved.getIpAddress(),
                saved.getCreatedAt()
        );

        // Broadcast to Admin SSE stream!
        sseNotificationService.broadcastToAdmin("ACTIVITY_LOG", dto);

        return saved;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminDtos.ActivityLogDto> getActivityLogs(int page, int size) {
        Page<ActivityLog> p = activityLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        return PageResponse.from(p.map(l -> new AdminDtos.ActivityLogDto(
                l.getId(),
                l.getUserId(),
                l.getUserEmail(),
                l.getAction(),
                l.getEntityType(),
                l.getEntityId(),
                l.getDetails(),
                l.getIpAddress(),
                l.getCreatedAt()
        )));
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.ActivityLogDto> getRecentActivities() {
        return activityLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(l -> new AdminDtos.ActivityLogDto(
                        l.getId(),
                        l.getUserId(),
                        l.getUserEmail(),
                        l.getAction(),
                        l.getEntityType(),
                        l.getEntityId(),
                        l.getDetails(),
                        l.getIpAddress(),
                        l.getCreatedAt()
                )).toList();
    }
}

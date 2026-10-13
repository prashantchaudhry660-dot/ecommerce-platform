package com.cartly.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseNotificationService {

    private static final Logger log = LoggerFactory.getLogger(SseNotificationService.class);
    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // Admin emitters
    private final List<SseEmitter> adminEmitters = new CopyOnWriteArrayList<>();

    // Seller emitters keyed by sellerId
    private final Map<Long, List<SseEmitter>> sellerEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribeAdmin() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        adminEmitters.add(emitter);

        emitter.onCompletion(() -> adminEmitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            adminEmitters.remove(emitter);
        });
        emitter.onError(e -> {
            emitter.complete();
            adminEmitters.remove(emitter);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Connected to Admin Live Activity Stream", "timestamp", System.currentTimeMillis())));
        } catch (IOException e) {
            adminEmitters.remove(emitter);
        }

        return emitter;
    }

    public SseEmitter subscribeSeller(Long sellerId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        sellerEmitters.computeIfAbsent(sellerId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeSellerEmitter(sellerId, emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            removeSellerEmitter(sellerId, emitter);
        });
        emitter.onError(e -> {
            emitter.complete();
            removeSellerEmitter(sellerId, emitter);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Connected to Seller Live Order Stream", "sellerId", sellerId, "timestamp", System.currentTimeMillis())));
        } catch (IOException e) {
            removeSellerEmitter(sellerId, emitter);
        }

        return emitter;
    }

    private void removeSellerEmitter(Long sellerId, SseEmitter emitter) {
        List<SseEmitter> emitters = sellerEmitters.get(sellerId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                sellerEmitters.remove(sellerId);
            }
        }
    }

    public void broadcastToAdmin(String eventName, Object data) {
        for (SseEmitter emitter : adminEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Exception e) {
                adminEmitters.remove(emitter);
            }
        }
    }

    public void notifySeller(Long sellerId, String eventName, Object data) {
        List<SseEmitter> emitters = sellerEmitters.get(sellerId);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name(eventName).data(data));
                } catch (Exception e) {
                    emitters.remove(emitter);
                }
            }
        }
    }
}

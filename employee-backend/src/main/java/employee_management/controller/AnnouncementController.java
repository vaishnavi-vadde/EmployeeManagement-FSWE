package employee_management.controller;

import employee_management.model.Announcement;
import employee_management.service.AnnouncementService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(
            AnnouncementService announcementService) {

        this.announcementService =
                announcementService;
    }

    // ==========================================
    // GET ALL ANNOUNCEMENTS
    // ==========================================

    @GetMapping
    public List<Announcement> getAllAnnouncements() {

        return announcementService
                .getAllAnnouncements();
    }

    // ==========================================
    // GET ANNOUNCEMENT BY ID
    // ==========================================

    @GetMapping("/{id}")
    public Announcement getAnnouncementById(
            @PathVariable Long id) {

        return announcementService
                .getAnnouncementById(id);
    }

    // ==========================================
    // CREATE ANNOUNCEMENT
    // ==========================================

    @PostMapping
    public Announcement createAnnouncement(
            @RequestBody Announcement announcement) {

        return announcementService
                .createAnnouncement(announcement);
    }

    // ==========================================
    // UPDATE ANNOUNCEMENT
    // ==========================================

    @PutMapping("/{id}")
    public Announcement updateAnnouncement(
            @PathVariable Long id,
            @RequestBody Announcement announcement) {

        return announcementService
                .updateAnnouncement(
                        id,
                        announcement
                );
    }

    // ==========================================
    // DELETE ANNOUNCEMENT
    // ==========================================

    @DeleteMapping("/{id}")
    public String deleteAnnouncement(
            @PathVariable Long id) {

        announcementService
                .deleteAnnouncement(id);

        return "Announcement deleted successfully";
    }
}
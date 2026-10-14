package employee_management.service;

import employee_management.model.Announcement;
import employee_management.repository.AnnouncementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public AnnouncementService(
            AnnouncementRepository announcementRepository) {

        this.announcementRepository =
                announcementRepository;
    }

    public List<Announcement> getAllAnnouncements() {

        return announcementRepository.findAll();
    }

    public Announcement getAnnouncementById(
            Long id) {

        return announcementRepository
                .findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Announcement not found"
                        )
                );
    }

    public Announcement createAnnouncement(
            Announcement announcement) {

        if (announcement.getDate() == null ||
                announcement.getDate().isBlank()) {

            announcement.setDate(
                    java.time.LocalDate
                            .now()
                            .toString()
            );
        }

        if (announcement.getDepartment() == null ||
                announcement.getDepartment().isBlank()) {

            announcement.setDepartment("ALL");
        }

        return announcementRepository.save(
                announcement
        );
    }

    public Announcement updateAnnouncement(
            Long id,
            Announcement updatedAnnouncement) {

        Announcement announcement =
                getAnnouncementById(id);

        announcement.setTitle(
                updatedAnnouncement.getTitle()
        );

        announcement.setMessage(
                updatedAnnouncement.getMessage()
        );

        announcement.setDepartment(
                updatedAnnouncement.getDepartment()
        );

        announcement.setCreatedBy(
                updatedAnnouncement.getCreatedBy()
        );

        return announcementRepository.save(
                announcement
        );
    }

    public void deleteAnnouncement(Long id) {

        announcementRepository.deleteById(id);
    }
}

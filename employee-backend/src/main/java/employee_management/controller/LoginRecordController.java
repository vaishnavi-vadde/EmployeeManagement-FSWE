
package employee_management.controller;

import employee_management.model.LoginRecord;
import employee_management.repository.LoginRecordRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/login-records")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class LoginRecordController {

    private final LoginRecordRepository repository;

    public LoginRecordController(LoginRecordRepository repository) {
        this.repository = repository;
    }

    private static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    private static final DateTimeFormatter PARSE_FORMAT =
            new DateTimeFormatterBuilder()
                    .parseCaseInsensitive()
                    .appendPattern("h:mm a")
                    .toFormatter(Locale.ENGLISH);

    // GET ALL RECORDS
    @GetMapping
    public List<LoginRecord> getAllRecords() {
        return repository.findAll();
    }

    // GET RECORD BY ID
    @GetMapping("/{id}")
    public ResponseEntity<LoginRecord> getRecordById(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ADD LOGIN RECORD
    @PostMapping
    public ResponseEntity<LoginRecord> addRecord(
            @RequestBody LoginRecord record) {

        if (record.getDate() == null
                || record.getDate().isBlank()) {
            record.setDate(LocalDate.now().toString());
        }

        if (record.getStatus() == null
                || record.getStatus().isBlank()) {
            record.setStatus("LOGGED IN");
        }

        if (record.getLoginTime() == null
                || record.getLoginTime().isBlank()) {
            record.setLoginTime(
                    LocalTime.now().format(DISPLAY_FORMAT));
        }

        if (record.getLogoutTime() == null
                || record.getLogoutTime().isBlank()) {
            record.setLogoutTime("-");
        }

        if (record.getWorkingHours() == null
                || record.getWorkingHours().isBlank()) {
            record.setWorkingHours("-");
        }

        LoginRecord savedRecord = repository.save(record);

        return ResponseEntity.ok(savedRecord);
    }

    // RECORD LOGOUT TIME AND WORKING HOURS
    @PatchMapping("/{id}/logout")
    public ResponseEntity<LoginRecord> logout(
            @PathVariable Long id) {

        Optional<LoginRecord> existing =
                repository.findById(id);

        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LoginRecord record = existing.get();

        // Do not overwrite an already-recorded logout.
        String existingLogout = record.getLogoutTime();

        if (existingLogout != null
                && !existingLogout.isBlank()
                && !existingLogout.equals("-")) {
            return ResponseEntity.ok(record);
        }

        LocalTime logoutTime = LocalTime.now();

        record.setLogoutTime(
                logoutTime.format(DISPLAY_FORMAT));

        String loginTime = record.getLoginTime();

        if (loginTime != null
                && !loginTime.isBlank()
                && !loginTime.equals("-")) {

            try {
                LocalTime startTime =
                        LocalTime.parse(
                                loginTime.trim(),
                                PARSE_FORMAT);

                long minutes = Duration.between(
                        startTime, logoutTime).toMinutes();

                // Handle a session crossing midnight.
                if (minutes < 0) {
                    minutes += 24 * 60;
                }

                record.setWorkingHours(
                        String.format(
                                "%d hrs %d mins",
                                minutes / 60,
                                minutes % 60));

            } catch (DateTimeParseException exception) {
                record.setWorkingHours("-");
            }

        } else {
            record.setWorkingHours("-");
        }

        record.setStatus("LOGGED OUT");

        LoginRecord savedRecord = repository.save(record);

        return ResponseEntity.ok(savedRecord);
    }

    // UPDATE COMPLETE RECORD
    @PutMapping("/{id}")
    public ResponseEntity<LoginRecord> updateRecord(
            @PathVariable Long id,
            @RequestBody LoginRecord updatedRecord) {

        Optional<LoginRecord> existing =
                repository.findById(id);

        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LoginRecord record = existing.get();

        record.setEmployeeName(updatedRecord.getEmployeeName());
        record.setEmployeeId(updatedRecord.getEmployeeId());
        record.setDate(updatedRecord.getDate());
        record.setLoginTime(updatedRecord.getLoginTime());
        record.setLogoutTime(updatedRecord.getLogoutTime());
        record.setStatus(updatedRecord.getStatus());
        record.setWorkingHours(updatedRecord.getWorkingHours());

        return ResponseEntity.ok(repository.save(record));
    }

    // UPDATE STATUS
    @PatchMapping("/{id}/status")
    public ResponseEntity<LoginRecord> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        Optional<LoginRecord> existing =
                repository.findById(id);

        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LoginRecord record = existing.get();
        record.setStatus(status);

        LoginRecord savedRecord = repository.save(record);

        return ResponseEntity.ok(savedRecord);
    }

    // DELETE RECORD
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(
            @PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}

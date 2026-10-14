package employee_management.controller;

import employee_management.model.Leave;
import employee_management.service.LeaveService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "http://localhost:5173")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @GetMapping
    public List<Leave> getAllLeaves() {
        return leaveService.getAllLeaves();
    }

    @GetMapping("/{id}")
    public Leave getLeaveById(@PathVariable Long id) {
        return leaveService.getLeaveById(id);
    }

    @PostMapping
    public Leave createLeave(@RequestBody Leave leave) {
        return leaveService.createLeave(leave);
    }

    @PutMapping("/{id}/status")
    public Leave updateLeaveStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return leaveService.updateLeaveStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public String deleteLeave(@PathVariable Long id) {

        leaveService.deleteLeave(id);

        return "Leave deleted successfully";
    }
}

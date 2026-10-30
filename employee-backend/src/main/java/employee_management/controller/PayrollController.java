
package employee_management.controller;

import employee_management.model.Payroll;
import employee_management.repository.PayrollRepository;
import employee_management.service.EmailService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class PayrollController {

    private final PayrollRepository payrollRepository;
    private final EmailService emailService;

    public PayrollController(
            PayrollRepository payrollRepository,
            EmailService emailService) {

        this.payrollRepository = payrollRepository;
        this.emailService = emailService;
    }

    // GET ALL PAYROLL
    @GetMapping
    public List<Payroll> getAllPayroll() {
        return payrollRepository.findAll();
    }

    // GET PAYROLL BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Payroll> getPayrollById(
            @PathVariable Long id) {

        return payrollRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // CREATE PAYROLL
    @PostMapping
    public ResponseEntity<Payroll> createPayroll(
            @RequestBody Payroll payroll) {

        double basic = payroll.getBasicSalary() == null
                ? 0
                : payroll.getBasicSalary();

        double allowances = payroll.getAllowances() == null
                ? 0
                : payroll.getAllowances();

        double deductions = payroll.getDeductions() == null
                ? 0
                : payroll.getDeductions();

        double netSalary = basic + allowances - deductions;

        payroll.setBasicSalary(basic);
        payroll.setAllowances(allowances);
        payroll.setDeductions(deductions);
        payroll.setNetSalary(netSalary);

        if (payroll.getStatus() == null ||
                payroll.getStatus().isBlank()) {
            payroll.setStatus("PENDING");
        }

        Payroll savedPayroll = payrollRepository.save(payroll);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedPayroll);
    }

    // MARK PAYROLL AS PAID AND SEND EMAIL
    @PutMapping("/{id}/paid")
    public ResponseEntity<?> markAsPaid(
            @PathVariable Long id) {

        return payrollRepository.findById(id)
                .map(payroll -> {

                    if (payroll.getEmployeeEmail() == null ||
                            payroll.getEmployeeEmail().isBlank()) {

                        return ResponseEntity
                                .badRequest()
                                .body("Employee email is missing.");
                    }

                    // This is a demo status update.
                    // It does not transfer real money.
                    payroll.setStatus("PAID");

                    Payroll savedPayroll =
                            payrollRepository.save(payroll);

                    try {
                        emailService.sendSalaryNotification(
                                savedPayroll.getEmployeeEmail(),
                                savedPayroll
                        );

                        return ResponseEntity
                                .ok(savedPayroll);

                    } catch (Exception e) {
                        return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(
                                    "Payroll marked PAID, but email failed. Check SMTP settings."
                                );
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE PAYROLL
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayroll(
            @PathVariable Long id) {

        if (!payrollRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        payrollRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // RAZORPAY WEBHOOK - TESTING ONLY
    @PostMapping("/webhook")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(
                    value = "X-Razorpay-Signature",
                    required = false
            ) String signature) {

        if (signature == null || signature.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body("Missing Razorpay signature");
        }

        // This test endpoint does not verify the signature
        // or process real Razorpay payout events.
        return ResponseEntity.ok("Webhook received");
    }
}


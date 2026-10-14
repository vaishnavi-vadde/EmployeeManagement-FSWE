package employee_management.controller;

import employee_management.model.Payroll;
import employee_management.repository.PayrollRepository;
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

    public PayrollController(PayrollRepository payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    // GET ALL PAYROLL
    @GetMapping
    public List<Payroll> getAllPayroll() {
        return payrollRepository.findAll();
    }

    // GET ONE PAYROLL
    @GetMapping("/{id}")
    public ResponseEntity<Payroll> getPayrollById(
            @PathVariable Long id) {

        return payrollRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ADD PAYROLL
    @PostMapping
    public Payroll createPayroll(
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

        payroll.setBasicSalary(basic);
        payroll.setAllowances(allowances);
        payroll.setDeductions(deductions);

        payroll.setNetSalary(
                basic + allowances - deductions
        );

        if (payroll.getStatus() == null ||
                payroll.getStatus().isBlank()) {

            payroll.setStatus("PENDING");
        }

        return payrollRepository.save(payroll);
    }

    // MARK AS PAID
    @PutMapping("/{id}/paid")
    public ResponseEntity<Payroll> markAsPaid(
            @PathVariable Long id) {

        return payrollRepository.findById(id)
                .map(payroll -> {

                    payroll.setStatus("PAID");

                    return ResponseEntity.ok(
                            payrollRepository.save(payroll)
                    );

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
}

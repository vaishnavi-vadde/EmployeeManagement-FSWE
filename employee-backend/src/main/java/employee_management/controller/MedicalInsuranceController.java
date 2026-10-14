package employee_management.controller;

import employee_management.model.MedicalInsurance;
import employee_management.repository.MedicalInsuranceRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insurance")
@CrossOrigin(
    origins = {
        "http://localhost:5173",
        "http://localhost:5174"
    }
)
public class MedicalInsuranceController {

    @Autowired
    private MedicalInsuranceRepository repository;

    // ==========================================
    // GET ALL INSURANCE RECORDS
    // ==========================================

    @GetMapping
    public List<MedicalInsurance> getAllInsurance() {

        return repository.findAll();
    }

    // ==========================================
    // GET INSURANCE BY ID
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<MedicalInsurance> getInsuranceById(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // APPLY MEDICAL INSURANCE
    // ==========================================

    @PostMapping
    public ResponseEntity<MedicalInsurance> applyInsurance(
            @RequestBody MedicalInsurance insurance) {

        // Set status automatically
        insurance.setStatus("ACTIVE");

        // Set family coverage automatically
        if (insurance.getMaritalStatus() != null &&
                insurance.getMaritalStatus()
                        .equalsIgnoreCase("Married")) {

            insurance.setDependents(
                    "Spouse, Child 1, Child 2"
            );

        } else {

            insurance.setDependents(
                    "Father, Mother"
            );
        }

        MedicalInsurance savedInsurance =
                repository.save(insurance);

        return ResponseEntity.ok(savedInsurance);
    }

    // ==========================================
    // UPDATE INSURANCE
    // ==========================================

    @PutMapping("/{id}")
    public ResponseEntity<MedicalInsurance> updateInsurance(
            @PathVariable Long id,
            @RequestBody MedicalInsurance insurance) {

        return repository.findById(id)
                .map(existingInsurance -> {

                    existingInsurance.setEmployeeName(
                            insurance.getEmployeeName()
                    );

                    existingInsurance.setEmployeeId(
                            insurance.getEmployeeId()
                    );

                    existingInsurance.setMaritalStatus(
                            insurance.getMaritalStatus()
                    );

                    // Automatically calculate dependents
                    if (insurance.getMaritalStatus() != null &&
                            insurance.getMaritalStatus()
                                    .equalsIgnoreCase("Married")) {

                        existingInsurance.setDependents(
                                "Spouse, Child 1, Child 2"
                        );

                    } else {

                        existingInsurance.setDependents(
                                "Father, Mother"
                        );
                    }

                    existingInsurance.setPolicyNumber(
                            insurance.getPolicyNumber()
                    );

                    existingInsurance.setCoverage(
                            insurance.getCoverage()
                    );

                    existingInsurance.setStatus(
                            insurance.getStatus() == null
                                    ? "ACTIVE"
                                    : insurance.getStatus()
                    );

                    existingInsurance.setDocumentName(
                            insurance.getDocumentName()
                    );

                    MedicalInsurance updatedInsurance =
                            repository.save(existingInsurance);

                    return ResponseEntity.ok(
                            updatedInsurance
                    );
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // ==========================================
    // DELETE INSURANCE
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInsurance(
            @PathVariable Long id) {

        if (!repository.existsById(id)) {

            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
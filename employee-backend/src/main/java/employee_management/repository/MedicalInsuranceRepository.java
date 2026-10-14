
package employee_management.repository;

import employee_management.model.MedicalInsurance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalInsuranceRepository
        extends JpaRepository<MedicalInsurance, Long> {

}

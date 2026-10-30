package employee_management.service;

import employee_management.model.Payroll;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendSalaryNotification(
            String employeeEmail,
            Payroll payroll) {

        if (employeeEmail == null || employeeEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "Employee email is required"
            );
        }

        if (payroll == null) {
            throw new IllegalArgumentException(
                    "Payroll details are required"
            );
        }

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(employeeEmail);
        message.setSubject("EMS Salary Payment Notification");

        message.setText(
                "Hello " + payroll.getEmployeeName() + ",\n\n" +

                "Your salary has been marked as paid in the Employee Management System.\n\n" +

                "Employee ID: " + payroll.getEmployeeId() + "\n" +
                "Department: " + payroll.getDepartment() + "\n" +
                "Salary Month: " + payroll.getMonth() + "\n" +
                "Basic Salary: ₹" + payroll.getBasicSalary() + "\n" +
                "Allowances: ₹" + payroll.getAllowances() + "\n" +
                "Deductions: ₹" + payroll.getDeductions() + "\n" +
                "Net Salary: ₹" + payroll.getNetSalary() + "\n\n" +

                "This is an automated salary notification from EMS.\n\n" +

                "Regards,\n" +
                "HR / Admin Team"
        );

        mailSender.send(message);
    }
}
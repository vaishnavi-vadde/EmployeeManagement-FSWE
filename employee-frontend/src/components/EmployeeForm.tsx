import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useEmployeeStore } from "../store/employeeStore";
import type { Employee } from "../employee";

interface EmployeeFormProps {
  employeeToEdit: Employee | null;
  onEditComplete: () => void;
}

function EmployeeForm({
  employeeToEdit,
  onEditComplete,
}: EmployeeFormProps) {
  const { createEmployee, editEmployee } =
    useEmployeeStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [salary, setSalary] = useState("");
  const [role, setRole] = useState<"employee" | "manager">(
    "employee"
  );

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (employeeToEdit) {
      setEditingId(employeeToEdit.id);
      setName(employeeToEdit.name || "");
      setEmail(employeeToEdit.email || "");
      setDepartment(employeeToEdit.department || "");
      setSalary(String(employeeToEdit.salary ?? ""));
      setRole(employeeToEdit.role || "employee");

      setError("");
      setSuccess("");
    }
  }, [employeeToEdit]);

  const clearForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setDepartment("");
    setSalary("");
    setRole("employee");
  };

  const validateForm = () => {
    if (!name.trim()) {
      return "Name is required.";
    }

    if (!email.trim()) {
      return "Email is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!department.trim()) {
      return "Department is required.";
    }

    if (!salary.trim()) {
      return "Salary is required.";
    }

    const salaryValue = Number(salary);

    if (Number.isNaN(salaryValue) || salaryValue <= 0) {
      return "Salary must be greater than 0.";
    }

    if (!role) {
      return "Role is required.";
    }

    return "";
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const employeeData = {
      name: name.trim(),
      email: email.trim(),
      department: department.trim(),
      salary: Number(salary),
      role: role,
    };

    try {
      if (editingId !== null) {
        await editEmployee(editingId, employeeData);

        setSuccess(
          "Employee updated successfully!"
        );
      } else {
        await createEmployee(employeeData);

        setSuccess(
          "Employee added successfully!"
        );
      }

      clearForm();
      onEditComplete();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(error);

      if (editingId !== null) {
        setError("Failed to update employee.");
      } else {
        setError("Failed to add employee.");
      }
    }
  };

  const handleCancel = () => {
    clearForm();
    setError("");
    setSuccess("");
    onEditComplete();
  };

  return (
    <div className="form-container-inner">

      {error && (
        <div className="form-error">
          ⚠ {error}
        </div>
      )}

      {success && (
        <div className="form-success">
          ✓ {success}
        </div>
      )}

      <form
        className="employee-form"
        onSubmit={handleSubmit}
      >

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Department"
          value={department}
          onChange={(e) =>
            setDepartment(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Salary"
          value={salary}
          onChange={(e) =>
            setSalary(e.target.value)
          }
        />

        {/* ROLE */}
        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value as "employee" | "manager"
            )
          }
        >
          <option value="employee">
            Employee
          </option>

          <option value="manager">
            Manager
          </option>
        </select>

        <button
          className="add-btn"
          type="submit"
        >
          {editingId !== null
            ? "Update Employee"
            : "Add Employee"}
        </button>

        {editingId !== null && (
          <button
            className="cancel-btn"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}

      </form>
    </div>
  );
}

export default EmployeeForm;
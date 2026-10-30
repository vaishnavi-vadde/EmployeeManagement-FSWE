
import { useEffect, useState } from "react";

interface PayrollRecord {
  id: number;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
  department: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  status: string;
}

const API_URL = "http://localhost:8081/api/payroll";

function Payroll() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);

  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState("");
  const [deductions, setDeductions] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Common headers for authenticated API requests.
  const getHeaders = (json = false): HeadersInit => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("JWT token missing. Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
      ...(json ? { "Content-Type": "application/json" } : {}),
    };
  };

  // FETCH PAYROLL RECORDS.
  const fetchPayroll = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to fetch payroll (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const data: PayrollRecord[] = await response.json();

      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Payroll loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payroll records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayroll();
  }, []);

  // ADD PAYROLL.
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !employeeName.trim() ||
      !employeeId.trim() ||
      !employeeEmail.trim() ||
      !department.trim() ||
      !basicSalary.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const basic = Number(basicSalary);
    const allowance = Number(allowances) || 0;
    const deduction = Number(deductions) || 0;

    if (
      !Number.isFinite(basic) ||
      !Number.isFinite(allowance) ||
      !Number.isFinite(deduction) ||
      basic < 0 ||
      allowance < 0 ||
      deduction < 0
    ) {
      setError("Please enter valid, non-negative salary values.");
      return;
    }

    if (deduction > basic + allowance) {
      setError("Deductions cannot exceed the total salary.");
      return;
    }

    const newPayroll = {
      employeeName: employeeName.trim(),
      employeeId: employeeId.trim(),
      employeeEmail: employeeEmail.trim(),
      department: department.trim(),
      basicSalary: basic,
      allowances: allowance,
      deductions: deduction,
      netSalary: basic + allowance - deduction,
      month: new Date().toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      status: "PENDING",
    };

    setSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(newPayroll),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to add payroll (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const savedRecord: PayrollRecord = await response.json();

      setRecords((previous) => [...previous, savedRecord]);

      setEmployeeName("");
      setEmployeeId("");
      setEmployeeEmail("");
      setDepartment("");
      setBasicSalary("");
      setAllowances("");
      setDeductions("");

      setMessage("Payroll record added successfully.");
    } catch (err) {
      console.error("Add payroll error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to add payroll record."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // MARK PAYROLL AS PAID.
  const markAsPaid = async (id: number) => {
    setError("");
    setMessage("");
    setUpdatingId(id);

    try {
      const response = await fetch(`${API_URL}/${id}/paid`, {
        method: "PUT",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to update payroll (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const updatedRecord: PayrollRecord = await response.json();

      // Update the frontend table immediately.
      setRecords((previous) =>
        previous.map((record) =>
          record.id === id ? updatedRecord : record
        )
      );

      setMessage(
        `Salary of ₹${Number(
          updatedRecord.netSalary
        ).toLocaleString("en-IN")} marked as paid for ${
          updatedRecord.employeeName
        }.`
      );
    } catch (err) {
      console.error("Update payroll error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update payroll status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE PAYROLL.
  const deletePayroll = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payroll record?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to delete payroll (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      setRecords((previous) =>
        previous.filter((record) => record.id !== id)
      );

      setMessage("Payroll record deleted.");
    } catch (err) {
      console.error("Delete payroll error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete payroll record."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // FORMAT SALARY AS INDIAN RUPEES.
  const formatSalary = (amount: number | null | undefined) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  return (
    <div>
      {/* PAYROLL MANAGEMENT FORM */}
      <div className="section-card">
        <div className="section-title">
          <span>💰</span>

          <div>
            <h2>Payroll Management</h2>
            <p>Manage employee salary and payroll information</p>
          </div>
        </div>

        {message && (
          <div className="form-success" role="status">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="form-error" role="alert">
            ✕ {error}
          </div>
        )}

        <form className="employee-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Employee Name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Employee Email"
            value={employeeEmail}
            onChange={(e) => setEmployeeEmail(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          />

          <input
            type="number"
            min="0"
            placeholder="Basic Salary"
            value={basicSalary}
            onChange={(e) => setBasicSalary(e.target.value)}
            required
          />

          <input
            type="number"
            min="0"
            placeholder="Allowances"
            value={allowances}
            onChange={(e) => setAllowances(e.target.value)}
          />

          <input
            type="number"
            min="0"
            placeholder="Deductions"
            value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
          />

          <button
            type="submit"
            className="add-btn"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "💰 Add Payroll"}
          </button>
        </form>
      </div>

      {/* EMPLOYEE PAYROLL TABLE */}
      <div className="section-card">
        <div className="section-title">
          <span>📊</span>

          <div>
            <h2>Employee Payroll</h2>
            <p>View salary details and payment status</p>
          </div>
        </div>

        {loading ? (
          <div className="no-employees">
            <p>Loading payroll records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="no-employees">
            <p>No payroll records found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Month</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeName}</td>

                    <td>{record.employeeId}</td>

                    <td>{record.employeeEmail || "No email"}</td>

                    <td>{record.department}</td>

                    <td>{formatSalary(record.basicSalary)}</td>

                    <td>{formatSalary(record.allowances)}</td>

                    <td>{formatSalary(record.deductions)}</td>

                    <td>
                      <strong>
                        {formatSalary(record.netSalary)}
                      </strong>
                    </td>

                    <td>{record.month}</td>

                    <td>
                      <span
                        className={`leave-status ${
                          record.status?.toUpperCase() === "PAID"
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td>
                      {record.status?.toUpperCase() === "PENDING" && (
                        <button
                          type="button"
                          className="edit-btn"
                          disabled={
                            updatingId !== null ||
                            deletingId !== null
                          }
                          onClick={() => void markAsPaid(record.id)}
                        >
                          {updatingId === record.id
                            ? "Updating..."
                            : "✓ Mark Paid"}
                        </button>
                      )}

                      {record.status?.toUpperCase() !== "PENDING" && (
                        <span>✓ Completed</span>
                      )}

                      <button
                        type="button"
                        className="delete-btn"
                        disabled={
                          deletingId !== null ||
                          updatingId !== null
                        }
                        onClick={() => void deletePayroll(record.id)}
                        style={{ marginLeft: "8px" }}
                      >
                        {deletingId === record.id
                          ? "Deleting..."
                          : "🗑 Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payroll;

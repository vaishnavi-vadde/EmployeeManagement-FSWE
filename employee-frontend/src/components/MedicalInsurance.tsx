
import { useEffect, useState } from "react";

interface InsuranceRecord {
  id: number;
  employeeName: string;
  employeeId: string;
  maritalStatus: string;
  dependents: string;
  policyNumber: string;
  coverage: string;
  status: string;
  documentName?: string;
}

const API_URL = `${import.meta.env.VITE_API_URL}/api/insurance`;

function MedicalInsurance() {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const username = localStorage.getItem("username") || "";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";

  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [employeeName, setEmployeeName] = useState(username);
  const [employeeId, setEmployeeId] = useState(loggedInEmployeeId);
  const [maritalStatus, setMaritalStatus] = useState("Unmarried");
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverage, setCoverage] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [loading, setLoading] = useState(role === "hr");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Add JWT authentication to protected API requests.
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

  // FETCH INSURANCE RECORDS - HR ONLY.
  const fetchInsurance = async () => {
    if (role !== "hr") {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to fetch insurance records (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const data: InsuranceRecord[] = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Insurance loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load insurance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInsurance();
  }, [role]);

  // GET DEPENDENTS.
  const getDependents = () => {
    if (maritalStatus === "Married") {
      return "Spouse, Child 1, Child 2";
    }

    return "Father, Mother";
  };

  // APPLY FOR MEDICAL INSURANCE.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    const finalEmployeeName =
      role === "hr" ? employeeName.trim() : username.trim();

    const finalEmployeeId =
      role === "hr" ? employeeId.trim() : loggedInEmployeeId.trim();

    if (
      !finalEmployeeName ||
      !finalEmployeeId ||
      !policyNumber.trim() ||
      !coverage.trim()
    ) {
      setError(
        "Please fill in the employee name, employee ID, policy number, and coverage."
      );
      return;
    }

    const coverageValue = Number(coverage);

    if (!Number.isFinite(coverageValue) || coverageValue <= 0) {
      setError("Coverage amount must be a positive number.");
      return;
    }

    setSubmitting(true);

    try {
      const newInsurance = {
        employeeName: finalEmployeeName,
        employeeId: finalEmployeeId,
        maritalStatus,
        dependents: getDependents(),
        policyNumber: policyNumber.trim(),
        coverage: coverage.trim(),
        status: "ACTIVE",
        documentName: documentName.trim() || "No document",
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(newInsurance),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to apply medical insurance (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      setPolicyNumber("");
      setCoverage("");
      setDocumentName("");
      setSuccess("Medical insurance applied successfully.");

      // Refresh the HR records table after creating a record.
      if (role === "hr") {
        await fetchInsurance();
      }
    } catch (err) {
      console.error("Insurance submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to apply medical insurance."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE INSURANCE RECORD - HR ONLY.
  const handleDelete = async (id: number) => {
    if (role !== "hr") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this insurance record?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to delete insurance record (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      setRecords((previous) =>
        previous.filter((record) => record.id !== id)
      );

      setSuccess("Insurance record deleted successfully.");
    } catch (err) {
      console.error("Insurance deletion error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete insurance record."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="section-card">
        <div className="section-title">
          <span>🏥</span>
          <div>
            <h2>Medical Insurance</h2>
            <p>Manage employee medical insurance records</p>
          </div>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="form-success" role="status">
          ✓ {success}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="form-error" role="alert">
          ✕ {error}
        </div>
      )}

      {/* APPLY FORM */}
      <div className="section-card">
        <div className="section-title">
          <span>📝</span>
          <div>
            <h2>Apply for Medical Insurance</h2>
            <p>Submit your medical insurance application</p>
          </div>
        </div>

        <form className="employee-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Employee Name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            disabled={role !== "hr"}
            required
          />

          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={role !== "hr"}
            required
          />

          <select
            value={maritalStatus}
            onChange={(e) => setMaritalStatus(e.target.value)}
          >
            <option value="Unmarried">Unmarried</option>
            <option value="Married">Married</option>
          </select>

          <input
            type="text"
            placeholder="Policy Number"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            required
          />

          <input
            type="number"
            min="1"
            placeholder="Coverage Amount"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            required
          />

          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setDocumentName(file ? file.name : "");
            }}
          />

          <button
            type="submit"
            className="add-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "🏥 Apply Medical Insurance"}
          </button>
        </form>
      </div>

      {/* FAMILY COVERAGE */}
      <div className="section-card">
        <div className="section-title">
          <span>👨‍👩‍👧</span>
          <div>
            <h2>Family Coverage</h2>
            <p>Family coverage depends on marital status</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-icon">💍</div>
            <div>
              <small>Married Employee</small>
              <h3>Spouse + Children</h3>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">👨‍👩‍👧</div>
            <div>
              <small>Unmarried Employee</small>
              <h3>Father + Mother</h3>
            </div>
          </div>
        </div>
      </div>

      {/* HR ONLY: INSURANCE RECORDS */}
      {role === "hr" && (
        <div className="section-card">
          <div className="section-title">
            <span>📋</span>
            <div>
              <h2>Insurance Records</h2>
              <p>View and manage employee medical insurance records</p>
            </div>
          </div>

          {loading ? (
            <div className="no-employees">
              <p>Loading insurance records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="no-employees">
              <p>No insurance records found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Marital Status</th>
                    <th>Covered Family</th>
                    <th>Policy Number</th>
                    <th>Coverage</th>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.employeeName}</strong>
                      </td>
                      <td>{record.employeeId}</td>
                      <td>{record.maritalStatus || "-"}</td>

                      <td>
                        {record.dependents
                          ? record.dependents.split(",").map(
                              (dependent, index) => (
                                <div key={index}>
                                  👤 {dependent.trim()}
                                </div>
                              )
                            )
                          : "No dependents"}
                      </td>

                      <td>{record.policyNumber || "-"}</td>
                      <td>{record.coverage || "-"}</td>

                      <td>
                        {record.documentName &&
                        record.documentName !== "No document"
                          ? record.documentName
                          : "No document"}
                      </td>

                      <td>
                        <strong>{record.status || "ACTIVE"}</strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          disabled={deletingId !== null}
                          onClick={() => void handleDelete(record.id)}
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

          <button
            type="button"
            className="add-btn"
            onClick={() => void fetchInsurance()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Insurance Records"}
          </button>
        </div>
      )}

      {/* MANAGER / EMPLOYEE MESSAGE */}
      {role !== "hr" && (
        <div className="section-card">
          <div className="section-title">
            <span>🔒</span>
            <div>
              <h2>Insurance Records</h2>
              <p>Insurance records are managed by HR.</p>
            </div>
          </div>

          <div className="no-employees">
            <p>Your insurance application can be submitted to HR.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalInsurance;

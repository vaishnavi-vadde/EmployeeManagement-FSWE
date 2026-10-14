
import { useCallback, useEffect, useState, type FormEvent } from "react";

interface LeaveRequestData {
  id: number;
  employeeName: string;
  department: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: string;
}

const API_URL = "http://localhost:8081/api/leaves";

function LeaveRequest() {
  const [requests, setRequests] = useState<LeaveRequestData[]>([]);
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const username = localStorage.getItem("username") || "";
  const department = localStorage.getItem("employeeDepartment") || "";
  const employeeId = localStorage.getItem("employeeId") || "";

  const getHeaders = (json = false): HeadersInit => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Login token missing. Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
      ...(json ? { "Content-Type": "application/json" } : {}),
    };
  };

  // LOAD THE LOGGED-IN USER'S LEAVE REQUESTS
  const loadRequests = useCallback(async () => {
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
          `Unable to load leave requests (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const data: LeaveRequestData[] = await response.json();

      const myRequests = (Array.isArray(data) ? data : []).filter(
        (request) =>
          request.employeeName?.trim().toLowerCase() ===
          username.trim().toLowerCase()
      );

      setRequests(myRequests);
    } catch (err) {
      console.error("Leave requests error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your leave requests."
      );
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  // APPLY FOR LEAVE
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!username.trim() || !department.trim()) {
      setError(
        "Your employee name or department is missing. Please log in again."
      );
      return;
    }

    if (!reason.trim() || !fromDate || !toDate) {
      setError("Please fill in all fields.");
      return;
    }

    if (toDate < fromDate) {
      setError("To date cannot be before from date.");
      return;
    }

    setSubmitting(true);

    try {
      const newLeave = {
        employeeName: username.trim(),
        department: department.trim(),
        reason: reason.trim(),
        fromDate,
        toDate,
        status: "PENDING",
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(newLeave),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to submit leave request (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      setReason("");
      setFromDate("");
      setToDate("");
      setMessage("Leave request submitted successfully.");

      await loadRequests();
    } catch (err) {
      console.error("Leave submission error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* APPLY FOR LEAVE */}
      <div className="section-card">
        <div className="section-title">
          <span>📝</span>
          <div>
            <h2>Apply for Leave</h2>
            <p>Submit your leave request to the company</p>
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
            value={username}
            readOnly
          />

          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            readOnly
          />

          <input
            type="text"
            placeholder="Department"
            value={department}
            readOnly
          />

          <input
            type="text"
            placeholder="Reason for leave"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <label htmlFor="leave-from-date">From Date</label>
          <input
            id="leave-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            required
          />

          <label htmlFor="leave-to-date">To Date</label>
          <input
            id="leave-to-date"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            required
          />

          <button
            type="submit"
            className="add-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "📝 Submit Leave Request"}
          </button>
        </form>
      </div>

      {/* MY LEAVE REQUESTS */}
      <div className="section-card">
        <div className="section-title">
          <span>📋</span>
          <div>
            <h2>My Leave Requests</h2>
            <p>Track the status of your leave applications</p>
          </div>
        </div>

        {loading ? (
          <div className="no-employees">
            <p>Loading leave requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="no-employees">
            <p>No leave requests found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.reason}</td>
                    <td>{request.fromDate}</td>
                    <td>{request.toDate}</td>
                    <td>
                      <span
                        className={`leave-status ${
                          request.status?.toLowerCase() || "pending"
                        }`}
                      >
                        {request.status}
                      </span>
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
          onClick={() => void loadRequests()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Requests"}
        </button>
      </div>
    </div>
  );
}

export default LeaveRequest;

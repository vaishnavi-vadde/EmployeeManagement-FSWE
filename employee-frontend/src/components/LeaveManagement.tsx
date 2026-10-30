
import { useCallback, useEffect, useState } from "react";

interface LeaveRequestData {
  id: number;
  employeeName: string;
  department: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: string;
}

// Backend URL from Vercel environment variables
const API_URL = `${import.meta.env.VITE_API_URL}/api/leaves`;

function LeaveManagement() {
  const [requests, setRequests] = useState<LeaveRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Login token missing. Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Load all leave requests for HR.
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
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Leave loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  // Update status using the @RequestParam expected by LeaveController.
  const updateStatus = async (
    request: LeaveRequestData,
    status: "APPROVED" | "REJECTED"
  ) => {
    setError("");
    setMessage("");
    setUpdatingId(request.id);

    try {
      const url =
        `${API_URL}/${request.id}/status?status=${encodeURIComponent(status)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Unable to update leave status (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      setMessage(
        `Leave request ${status.toLowerCase()} successfully.`
      );

      await loadRequests();
    } catch (err) {
      console.error("Leave status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update leave status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => request.status?.toUpperCase() === "PENDING"
  ).length;

  const approvedRequests = requests.filter(
    (request) => request.status?.toUpperCase() === "APPROVED"
  ).length;

  const rejectedRequests = requests.filter(
    (request) => request.status?.toUpperCase() === "REJECTED"
  ).length;

  return (
    <div>
      {/* Leave summary */}
      <div className="section-card">
        <div className="section-title">
          <span>📋</span>

          <div>
            <h2>Leave Management</h2>
            <p>Review and manage all employee leave requests</p>
          </div>
        </div>

        <div className="leave-stats-grid">
          <div className="leave-stat-card">
            <span>📄</span>

            <div>
              <p>Total Requests</p>
              <h2>{totalRequests}</h2>
            </div>
          </div>

          <div className="leave-stat-card">
            <span>⏳</span>

            <div>
              <p>Pending</p>
              <h2>{pendingRequests}</h2>
            </div>
          </div>

          <div className="leave-stat-card">
            <span>✓</span>

            <div>
              <p>Approved</p>
              <h2>{approvedRequests}</h2>
            </div>
          </div>
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="form-success" role="status">
            {message}
          </div>
        )}

        <button
          type="button"
          className="add-btn"
          onClick={() => void loadRequests()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Requests"}
        </button>
      </div>

      {/* All employee leave requests */}
      <div className="section-card">
        <div className="section-title">
          <span>📋</span>

          <div>
            <h2>Employee Leave Requests</h2>
            <p>Approve or reject employee leave applications</p>
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
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Reason</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => {
                  const status = request.status?.toUpperCase();

                  return (
                    <tr key={request.id}>
                      <td>{request.employeeName}</td>
                      <td>{request.department}</td>
                      <td>{request.reason}</td>
                      <td>{request.fromDate}</td>
                      <td>{request.toDate}</td>

                      <td>
                        <span
                          className={`leave-status ${
                            status?.toLowerCase() || "pending"
                          }`}
                        >
                          {status || "PENDING"}
                        </span>
                      </td>

                      <td>
                        {status === "PENDING" ? (
                          <div className="leave-action-buttons">
                            <button
                              type="button"
                              className="add-btn"
                              disabled={updatingId !== null}
                              onClick={() =>
                                void updateStatus(request, "APPROVED")
                              }
                            >
                              {updatingId === request.id
                                ? "Updating..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              className="reject-btn"
                              disabled={updatingId !== null}
                              onClick={() =>
                                void updateStatus(request, "REJECTED")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span>Action completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p>Rejected requests: {rejectedRequests}</p>
      </div>
    </div>
  );
}

export default LeaveManagement;

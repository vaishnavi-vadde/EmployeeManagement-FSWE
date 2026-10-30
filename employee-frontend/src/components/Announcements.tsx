
import { useCallback, useEffect, useState } from "react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  department: string;
  createdBy: string;
  date: string;
}

// Backend URL from Vercel environment variables
const API_URL = `${import.meta.env.VITE_API_URL}/api/announcements`;

function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const username = localStorage.getItem("username") || "";
  const employeeDepartment =
    localStorage.getItem("employeeDepartment") || "";

  // Add the JWT token to every protected API request.
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

  // FETCH ANNOUNCEMENTS
  const fetchAnnouncements = useCallback(async () => {
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
          `Failed to fetch announcements (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const data: Announcement[] = await response.json();

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Announcement loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load announcements."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  // CREATE ANNOUNCEMENT
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!title.trim() || !message.trim()) {
      setError("Please fill all fields.");
      return;
    }

    let department = "ALL";
    const createdBy = username || "HR";

    if (role === "manager") {
      if (!employeeDepartment.trim()) {
        setError("Manager department not found. Please log in again.");
        return;
      }

      department = employeeDepartment;
    }

    setSubmitting(true);

    try {
      const newAnnouncement = {
        title: title.trim(),
        message: message.trim(),
        department,
        createdBy,
        date: new Date().toISOString().split("T")[0],
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(newAnnouncement),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to create announcement (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const savedAnnouncement: Announcement = await response.json();

      setAnnouncements((previous) => [...previous, savedAnnouncement]);
      setTitle("");
      setMessage("");
      setSuccess("Announcement posted successfully.");
    } catch (err) {
      console.error("Announcement creation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to post announcement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE ANNOUNCEMENT
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) return;

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
          `Failed to delete announcement (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      setAnnouncements((previous) =>
        previous.filter((announcement) => announcement.id !== id)
      );

      setSuccess("Announcement deleted successfully.");
    } catch (err) {
      console.error("Announcement deletion error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete announcement."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // FILTER ANNOUNCEMENTS FOR DISPLAY
  const visibleAnnouncements =
    role === "hr"
      ? announcements
      : announcements.filter(
          (announcement) =>
            announcement.department?.trim().toUpperCase() === "ALL" ||
            announcement.department?.trim().toLowerCase() ===
              employeeDepartment.trim().toLowerCase()
        );

  return (
    <div>
      {/* CREATE ANNOUNCEMENT */}
      {(role === "hr" || role === "manager") && (
        <div className="section-card">
          <div className="section-title">
            <span>📢</span>
            <div>
              <h2>Company Announcement</h2>
              <p>Share important information with employees</p>
            </div>
          </div>

          {success && (
            <div className="form-success" role="status">
              ✓ {success}
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
              placeholder="Announcement Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <textarea
              placeholder="Enter announcement message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />

            <button
              type="submit"
              className="add-btn"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "📢 Post Announcement"}
            </button>
          </form>

          {role === "manager" && (
            <p style={{ marginTop: "10px" }}>
              This announcement will be visible to{" "}
              <strong>{employeeDepartment}</strong> department employees.
            </p>
          )}

          {role === "hr" && (
            <p style={{ marginTop: "10px" }}>
              This announcement will be visible to{" "}
              <strong>all employees</strong>.
            </p>
          )}
        </div>
      )}

      {/* ANNOUNCEMENT LIST */}
      <div className="section-card">
        <div className="section-title">
          <span>📢</span>
          <div>
            <h2>Announcements</h2>
            <p>View company announcements</p>
          </div>
        </div>

        {error && !(role === "hr" || role === "manager") && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="no-employees">
            <p>Loading announcements...</p>
          </div>
        ) : visibleAnnouncements.length === 0 ? (
          <div className="no-employees">
            <p>No announcements found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Department</th>
                  <th>Posted By</th>
                  <th>Date</th>
                  {role === "hr" && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {visibleAnnouncements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>
                      <strong>{announcement.title}</strong>
                    </td>
                    <td>{announcement.message}</td>
                    <td>{announcement.department}</td>
                    <td>{announcement.createdBy || "-"}</td>
                    <td>{announcement.date}</td>

                    {role === "hr" && (
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          disabled={deletingId !== null}
                          onClick={() => void handleDelete(announcement.id)}
                        >
                          {deletingId === announcement.id
                            ? "Deleting..."
                            : "🗑 Delete"}
                        </button>
                      </td>
                    )}
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

export default Announcements;

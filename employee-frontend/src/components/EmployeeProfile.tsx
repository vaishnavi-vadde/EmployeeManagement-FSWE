
import { useEffect, useState } from "react";

interface EmployeeProfileProps {
  username?: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  role?: string;
}

function EmployeeProfile({ username }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = (localStorage.getItem("role") || "")
    .replace(/^ROLE_/i, "")
    .trim()
    .toLowerCase();

  const accountEmail =
    localStorage.getItem("employeeEmail") ||
    localStorage.getItem("username") ||
    "";

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      // HR has an app_users account, not necessarily an employees record.
      // Display the HR account directly without requesting employee data.
      if (role === "hr") {
        setEmployee(null);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Please log in again to view your profile."
          );
        }

        const loggedInUsername =
          username || localStorage.getItem("username") || "";

        const loggedInEmail =
          localStorage.getItem("employeeEmail") || "";

        if (!loggedInUsername && !loggedInEmail) {
          throw new Error(
            "Account information not found. Please log in again."
          );
        }

        const response = await fetch(
          "http://localhost:8081/api/employees",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Access denied. Please log out and log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            `Failed to fetch employee records (${response.status}).`
          );
        }

        const employees: Employee[] = await response.json();

        const matchedEmployee = employees.find((emp) => {
          const emailMatches =
            Boolean(loggedInEmail) &&
            emp.email?.trim().toLowerCase() ===
              loggedInEmail.trim().toLowerCase();

          const nameMatches =
            Boolean(loggedInUsername) &&
            emp.name?.trim().toLowerCase() ===
              loggedInUsername.trim().toLowerCase();

          return emailMatches || nameMatches;
        });

        if (!matchedEmployee) {
          throw new Error(
            "Employee profile not found. For Manager or Employee, " +
              "ensure a matching record exists in the employees table."
          );
        }

        if (cancelled) return;

        setEmployee(matchedEmployee);

        // Save the matched employee details for other pages.
        localStorage.setItem("username", matchedEmployee.name);
        localStorage.setItem(
          "employeeId",
          `EMP${String(matchedEmployee.id).padStart(3, "0")}`
        );
        localStorage.setItem(
          "employeeEmail",
          matchedEmployee.email
        );
        localStorage.setItem(
          "employeeDepartment",
          matchedEmployee.department
        );
        localStorage.setItem(
          "role",
          matchedEmployee.role?.toLowerCase() || role
        );
      } catch (err) {
        console.error("Employee profile error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load profile information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [username, role]);

  if (loading) {
    return (
      <div className="section-card">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  // ==============================
  // HR / ADMIN PROFILE
  // ==============================
  if (role === "hr") {
    const hrEmail = accountEmail;

    return (
      <div>
        <div className="section-card">
          <div className="section-title">
            <span>👤</span>
            <div>
              <h2>My Profile</h2>
              <p>Your HR / Admin account information</p>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-row">
              <strong>Name</strong>
              <span>HR / Admin</span>
            </div>

            <div className="profile-row">
              <strong>Email</strong>
              <span>{hrEmail || "Not available"}</span>
            </div>

            <div className="profile-row">
              <strong>Department</strong>
              <span>Administration</span>
            </div>

            <div className="profile-row">
              <strong>Job Role</strong>
              <span>HR / Admin</span>
            </div>

            <div className="profile-row">
              <strong>Employee ID</strong>
              <span>Not applicable</span>
            </div>

            <div className="profile-row">
              <strong>Status</strong>
              <span className="leave-status approved">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-title">
            <span>💼</span>
            <div>
              <h2>Job Information</h2>
              <p>Your administrator account details</p>
            </div>
          </div>

          <div className="profile-card">
            <p>
              <strong>Department:</strong> Administration
            </p>

            <p>
              <strong>Job Role:</strong> HR / Admin
            </p>

            <p>
              <strong>Salary:</strong> Not available in the HR account
            </p>

            <p>
              <strong>Employment Type:</strong> Not specified
            </p>

            <p>
              <strong>Work Location:</strong> Not specified
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // MANAGER / EMPLOYEE PROFILE
  // ==============================
  if (error) {
    return (
      <div className="section-card">
        <h2>My Profile</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="section-card">
        <h2>My Profile</h2>
        <p>Employee profile not found.</p>
      </div>
    );
  }

  const employeeRole = (employee.role || role)
    .replace(/^ROLE_/i, "")
    .toLowerCase();

  const jobRole =
    employeeRole === "manager" ? "Manager" : "Employee";

  const employeeId =
    `EMP${String(employee.id).padStart(3, "0")}`;

  return (
    <div>
      {/* PROFILE HEADER */}
      <div className="section-card">
        <div className="section-title">
          <span>👤</span>
          <div>
            <h2>My Profile</h2>
            <p>View your employee information</p>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-row">
            <strong>Name</strong>
            <span>{employee.name}</span>
          </div>

          <div className="profile-row">
            <strong>Username</strong>
            <span>{employee.name}</span>
          </div>

          <div className="profile-row">
            <strong>Email</strong>
            <span>{employee.email}</span>
          </div>

          <div className="profile-row">
            <strong>Department</strong>
            <span>{employee.department}</span>
          </div>

          <div className="profile-row">
            <strong>Job Role</strong>
            <span>{jobRole}</span>
          </div>

          <div className="profile-row">
            <strong>Employee ID</strong>
            <span>{employeeId}</span>
          </div>

          <div className="profile-row">
            <strong>Joining Date</strong>
            <span>15-07-2025</span>
          </div>

          <div className="profile-row">
            <strong>Status</strong>
            <span className="leave-status approved">
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* JOB INFORMATION */}
      <div className="section-card">
        <div className="section-title">
          <span>💼</span>
          <div>
            <h2>Job Information</h2>
            <p>Your current employment details</p>
          </div>
        </div>

        <div className="profile-card">
          <p>
            <strong>Department:</strong>{" "}
            {employee.department}
          </p>

          <p>
            <strong>Job Role:</strong> {jobRole}
          </p>

          <p>
            <strong>Salary:</strong>{" "}
            ₹{Number(employee.salary || 0).toLocaleString("en-IN")}
          </p>

          <p>
            <strong>Employment Type:</strong> Full Time
          </p>

          <p>
            <strong>Work Location:</strong> Hyderabad
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;

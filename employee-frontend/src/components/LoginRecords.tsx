
import { useEffect, useState } from "react";

interface LoginRecord {
  id: number;
  employeeName: string;
  employeeId: string;
  date: string;
  loginTime: string;
  logoutTime: string;
  status: string;
  workingHours: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  role?: string;
}

interface AttendanceProps {
  role: string;
}

const API_URL = "http://localhost:8081/api/login-records";
const EMPLOYEE_API = "http://localhost:8081/api/employees";

// Add the JWT token to every protected API request.
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Authentication token missing. Please log in again."
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

function LoginRecords({ role }: AttendanceProps) {
  const [records, setRecords] = useState<LoginRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("LOGGED IN");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loggedInUsername =
    localStorage.getItem("username") || "";

  const loggedInEmployeeId =
    localStorage.getItem("employeeId") || "";

  const isHR = role.toLowerCase() === "hr";
  const isManager = role.toLowerCase() === "manager";
  const isAdmin = isHR || isManager;

  // FETCH EMPLOYEES
  const fetchEmployees = async (): Promise<Employee[]> => {
    const response = await authenticatedFetch(EMPLOYEE_API);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch employees (${response.status})`
      );
    }

    const data: Employee[] = await response.json();
    setEmployees(data);
    return data;
  };

  // FETCH LOGIN RECORDS
  const fetchRecords = async (): Promise<LoginRecord[]> => {
    const response = await authenticatedFetch(API_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch login records (${response.status})`
      );
    }

    const data: LoginRecord[] = await response.json();
    setRecords(data);
    return data;
  };

  // LOAD DATA
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        fetchEmployees(),
        fetchRecords(),
      ]);
    } catch (err) {
      console.error("Login records loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // ADD LOGIN RECORD
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!employeeName.trim() || !employeeId.trim()) {
      setError("Please enter employee name and employee ID.");
      return;
    }

    if (isManager) {
      const manager = employees.find(
        (employee) =>
          employee.name.trim().toLowerCase() ===
          loggedInUsername.trim().toLowerCase()
      );

      const selectedEmployee = employees.find((employee) => {
        const formattedId =
          `EMP${String(employee.id).padStart(3, "0")}`;

        return (
          formattedId.toLowerCase() ===
            employeeId.trim().toLowerCase() ||
          employee.name.trim().toLowerCase() ===
            employeeName.trim().toLowerCase()
        );
      });

      if (!selectedEmployee) {
        setError("Employee not found. Check the employee ID.");
        return;
      }

      if (
        !manager ||
        manager.department.trim().toLowerCase() !==
          selectedEmployee.department.trim().toLowerCase()
      ) {
        setError(
          "You can only manage employees in your department."
        );
        return;
      }
    }

    const newRecord = {
      employeeName: employeeName.trim(),
      employeeId: employeeId.trim(),
      date: new Date().toLocaleDateString("en-CA"),
      loginTime:
        status === "LOGGED IN" ? "09:00 AM" : "-",
      logoutTime: "-",
      status,
      workingHours: "-",
    };

    try {
      const response = await authenticatedFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(newRecord),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to add login record (${response.status})`
        );
      }

      const savedRecord: LoginRecord = await response.json();

      setRecords((previous) => [...previous, savedRecord]);
      setEmployeeName("");
      setEmployeeId("");
      setStatus("LOGGED IN");
      setMessage("Login record added successfully.");
    } catch (err) {
      console.error("Add login record error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add login record."
      );
    }
  };

  // UPDATE LOGIN STATUS
  const handleStatusChange = async (
    id: number,
    newStatus: string
  ) => {
    setMessage("");
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/${id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update status (${response.status})`
        );
      }

      const updatedRecord: LoginRecord =
        await response.json();

      setRecords((previous) =>
        previous.map((record) =>
          record.id === id ? updatedRecord : record
        )
      );

      setMessage("Attendance status updated successfully.");
    } catch (err) {
      console.error("Update status error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update attendance status."
      );
    }
  };

  // DELETE LOGIN RECORD - HR ONLY
  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this login record?"
      )
    ) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete login record (${response.status})`
        );
      }

      setRecords((previous) =>
        previous.filter((record) => record.id !== id)
      );

      setMessage("Login record deleted successfully.");
    } catch (err) {
      console.error("Delete record error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete login record."
      );
    }
  };

  // FIND CURRENT MANAGER
  const currentManager = employees.find(
    (employee) =>
      employee.name.trim().toLowerCase() ===
      loggedInUsername.trim().toLowerCase()
  );

  const managerDepartment =
    currentManager?.department.trim().toLowerCase() || "";

  // FILTER RECORDS BY ROLE
  let visibleRecords: LoginRecord[] = [];

  if (isHR) {
    visibleRecords = records;
  } else if (isManager) {
    visibleRecords = records.filter((record) => {
      const employee = employees.find((emp) => {
        const formattedId =
          `EMP${String(emp.id).padStart(3, "0")}`;

        return (
          formattedId.toLowerCase() ===
            record.employeeId?.trim().toLowerCase() ||
          emp.name.trim().toLowerCase() ===
            record.employeeName?.trim().toLowerCase()
        );
      });

      return (
        !!employee &&
        employee.department.trim().toLowerCase() ===
          managerDepartment
      );
    });
  } else {
    visibleRecords = records.filter((record) => {
      const idMatches =
        !!loggedInEmployeeId &&
        record.employeeId?.trim().toLowerCase() ===
          loggedInEmployeeId.trim().toLowerCase();

      const nameMatches =
        !!loggedInUsername &&
        record.employeeName?.trim().toLowerCase() ===
          loggedInUsername.trim().toLowerCase();

      return idMatches || nameMatches;
    });
  }

  // UI
  return (
    <div>
      {/* HEADER */}
      <div className="section-card">
        <div className="section-title">
          <span>🔐</span>
          <div>
            <h2>
              {isHR
                ? "Employee Login Records"
                : isManager
                ? "Team Login Records"
                : "My Login"}
            </h2>

            <p>
              {isHR
                ? "View and manage employee login information"
                : isManager
                ? `Login information for your department - ${
                    currentManager?.department || "Department"
                  }`
                : `Login information for ${
                    loggedInUsername || "your account"
                  }`}
            </p>
          </div>
        </div>

        {message && (
          <div className="form-success">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="form-error" role="alert">
            ✕ {error}
          </div>
        )}

        <button
          type="button"
          className="add-btn"
          onClick={() => void loadData()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Records"}
        </button>
      </div>

      {/* ADD LOGIN - HR AND MANAGER */}
      {isAdmin && (
        <div className="section-card">
          <div className="section-title">
            <span>🔑</span>
            <div>
              <h2>Record Employee Login</h2>
              <p>
                {isHR
                  ? "Add a login record for an employee"
                  : "Add a login record for an employee in your department"}
              </p>
            </div>
          </div>

          <form
            className="employee-form"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              placeholder="Employee Name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Employee ID (e.g. EMP012)"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="LOGGED IN">Logged In</option>
              <option value="NOT LOGGED IN">Not Logged In</option>
            </select>

            <button type="submit" className="add-btn">
              🔐 Record Login
            </button>
          </form>
        </div>
      )}

      {/* LOGIN TABLE */}
      <div className="section-card">
        <div className="section-title">
          <span>📋</span>
          <div>
            <h2>
              {isHR
                ? "All Login Records"
                : isManager
                ? "Department Login Records"
                : "My Login Record"}
            </h2>

            <p>
              {isHR
                ? "View login information of all employees"
                : isManager
                ? "View login information of employees in your department"
                : `Your personal login information - ${
                    loggedInUsername || "Employee"
                  }`}
            </p>
          </div>
        </div>

        {loading && <p>Loading attendance records...</p>}

        {!loading && !error && visibleRecords.length === 0 && (
          <div className="profile-card">
            <p>
              No login records found for{" "}
              <strong>
                {isHR
                  ? "employees"
                  : isManager
                  ? "your department"
                  : loggedInUsername || "this employee"}
              </strong>.
            </p>
          </div>
        )}

        {!loading && visibleRecords.length > 0 && (
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Date</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  {isHR && <th>Action</th>}
                  {isManager && <th>Action</th>}
                </tr>
              </thead>

              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeName}</td>
                    <td>{record.employeeId}</td>
                    <td>{record.date}</td>
                    <td>{record.loginTime}</td>
                    <td>{record.logoutTime}</td>
                    <td>{record.workingHours}</td>

                    <td>
                      <span
                        className={`leave-status ${
                          record.status === "LOGGED IN"
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    {isHR && (
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            void handleDelete(record.id)
                          }
                        >
                          🗑 Delete
                        </button>
                      </td>
                    )}

                    {isManager && (
                      <td>
                        <select
                          value={record.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              record.id,
                              e.target.value
                            )
                          }
                        >
                          <option value="LOGGED IN">
                            Logged In
                          </option>
                          <option value="NOT LOGGED IN">
                            Not Logged In
                          </option>
                        </select>
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

export default LoginRecords;

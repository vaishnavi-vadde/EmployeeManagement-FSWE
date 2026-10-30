
import { useState, type FormEvent } from "react";

interface LoginProps {
  onLogin: (role: string) => void;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  role?: string;
}

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

interface LoginResponse {
  token: string;
  tokenType?: string;
  email: string;
  role: string;
  message?: string;
}

// Backend URL from Vercel environment variables
const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function normalizeRole(value?: string): string {
  return (value || "")
    .replace(/^ROLE_/i, "")
    .trim()
    .toLowerCase();
}

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState("employee");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Authentication headers for protected API requests.
  const getAuthHeaders = (json = false): HeadersInit => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("JWT token missing. Please log in again.");
    }

    return {
      Authorization: `Bearer ${token}`,
      ...(json ? { "Content-Type": "application/json" } : {}),
    };
  };

  // Create today's login record, or reuse an active one.
  const createLoginRecord = async (
    employeeName: string,
    employeeId: string
  ): Promise<void> => {
    try {
      const today = getLocalDate();

      const recordsResponse = await fetch(
        `${API_URL}/login-records`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!recordsResponse.ok) {
        throw new Error(
          `Unable to retrieve login records (${recordsResponse.status}).`
        );
      }

      const records: LoginRecord[] = await recordsResponse.json();

      const activeRecord = records.find(
        (record) =>
          record.employeeId?.trim().toLowerCase() ===
            employeeId.toLowerCase() &&
          record.date === today &&
          record.status?.toUpperCase() === "LOGGED IN" &&
          (!record.logoutTime ||
            record.logoutTime.trim() === "-")
      );

      // Remember the existing active record ID.
      if (activeRecord) {
        localStorage.setItem(
          "activeLoginRecordId",
          String(activeRecord.id)
        );

        return;
      }

      const newRecord = {
        employeeName,
        employeeId,
        date: today,
        loginTime: getCurrentTime(),
        logoutTime: "-",
        status: "LOGGED IN",
        workingHours: "-",
      };

      const response = await fetch(
        `${API_URL}/login-records`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify(newRecord),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create login record (${response.status}).`
        );
      }

      const savedRecord: LoginRecord = await response.json();

      if (savedRecord.id != null) {
        localStorage.setItem(
          "activeLoginRecordId",
          String(savedRecord.id)
        );
      } else {
        throw new Error(
          "The server did not return a login record ID."
        );
      }
    } catch (err) {
      // An attendance-record failure should not block a valid login.
      console.error("Login record error:", err);
      localStorage.removeItem("activeLoginRecordId");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const enteredEmail = username.trim().toLowerCase();

    if (!enteredEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate through Spring Boot.
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: enteredEmail,
          password,
        }),
      });

      let loginData: LoginResponse;

      try {
        loginData = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid login response."
        );
      }

      if (!response.ok) {
        throw new Error(
          loginData.message || "Invalid email or password."
        );
      }

      if (!loginData.token || !loginData.email) {
        throw new Error(
          "Login response must contain a token and email."
        );
      }

      // AuthController must return the role from app_users.
      const actualRole = normalizeRole(loginData.role);

      if (!["hr", "manager", "employee"].includes(actualRole)) {
        throw new Error(
          "The server did not return a valid role. " +
            "Check the role field in AuthController's login response."
        );
      }

      if (actualRole !== role) {
        throw new Error(
          `This account is registered as ${actualRole.toUpperCase()}. ` +
            "Select the correct option under Login As."
        );
      }

      // 2. Save the JWT before calling protected APIs.
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("username", loginData.email);
      localStorage.setItem("employeeEmail", loginData.email);
      localStorage.setItem("role", actualRole);
      localStorage.removeItem("activeLoginRecordId");

      // 3. HR does not require an employee profile.
      if (actualRole === "hr") {
        localStorage.removeItem("employeeId");
        localStorage.removeItem("employeeDepartment");

        await createLoginRecord("HR / Admin", "HR001");

        onLogin("hr");
        return;
      }

      // 4. Find the employee profile for Manager or Employee.
      const employeesResponse = await fetch(
        `${API_URL}/employees`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!employeesResponse.ok) {
        throw new Error(
          `Unable to fetch employee records (${employeesResponse.status}).`
        );
      }

      const employees: Employee[] = await employeesResponse.json();

      const employee = employees.find(
        (item) =>
          item.email?.trim().toLowerCase() ===
          loginData.email.trim().toLowerCase()
      );

      if (!employee) {
        throw new Error(
          "No employee profile matches this email. " +
            "Check that the email exists in both app_users and employees."
        );
      }

      // Ensure both tables have matching roles.
      const employeeRole = normalizeRole(employee.role);

      if (employeeRole !== actualRole) {
        throw new Error(
          "The role in app_users does not match the employees table. " +
            "Check both records in pgAdmin."
        );
      }

      // 5. Save employee information for other frontend pages.
      const formattedEmployeeId =
        `EMP${String(employee.id).padStart(3, "0")}`;

      localStorage.setItem("username", employee.name);
      localStorage.setItem("role", actualRole);
      localStorage.setItem("employeeId", formattedEmployeeId);
      localStorage.setItem("employeeEmail", employee.email);
      localStorage.setItem(
        "employeeDepartment",
        employee.department || ""
      );

      // 6. Create or reuse the login record and save its ID.
      await createLoginRecord(employee.name, formattedEmployeeId);

      // 7. Open the correct dashboard.
      onLogin(actualRole);
    } catch (err) {
      console.error("Login error:", err);

      [
        "token",
        "username",
        "role",
        "employeeId",
        "employeeEmail",
        "employeeDepartment",
        "activeLoginRecordId",
      ].forEach((key) => localStorage.removeItem(key));

      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">👥</div>

        <h1>Employee Management System</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <label>Login As</label>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setError("");
              setUsername("");
              setPassword("");
            }}
          >
            <option value="hr">HR / Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your registered email"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
          />

          {error && (
            <div className="login-error" role="alert">
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Login"}
          </button>
        </form>

        <div className="login-demo">
          <strong>Login Instructions</strong>
          <span>HR: Use your registered HR email and password.</span>
          <span>
            Manager: Use your registered Manager email and password.
          </span>
          <span>
            Employee: Use your registered Employee email and password.
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;

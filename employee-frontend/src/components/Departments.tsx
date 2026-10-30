
import { useEffect, useState } from "react";

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  role?: string;
}

interface Department {
  id: number;
  name: string;
  manager: string;
  employees: number;
}

// Backend URL from Vercel environment variables
const API_URL = `${import.meta.env.VITE_API_URL}/api/employees`;

function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = (localStorage.getItem("role") || "").toLowerCase();

  const loggedInDepartment =
    localStorage.getItem("employeeDepartment") || "";

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      // Get the JWT saved during login.
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Login token missing. Please log in again.");
      }

      // Fetch employees with JWT authentication.
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to fetch employees (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const employees: Employee[] = await response.json();

      // Managers see employees in their own department.
      const visibleEmployees =
        role === "manager"
          ? employees.filter(
              (employee) =>
                (employee.department || "").trim().toLowerCase() ===
                loggedInDepartment.trim().toLowerCase()
            )
          : employees;

      // Group employees by department.
      const departmentMap: {
        [key: string]: {
          manager: string;
          employees: number;
        };
      } = {};

      visibleEmployees.forEach((employee) => {
        const department = employee.department?.trim();

        if (!department) {
          return;
        }

        if (!departmentMap[department]) {
          departmentMap[department] = {
            manager: "-",
            employees: 0,
          };
        }

        departmentMap[department].employees += 1;

        if (employee.role?.toLowerCase() === "manager") {
          departmentMap[department].manager = employee.name;
        }
      });

      // Build the department list.
      const departmentList: Department[] = Object.keys(
        departmentMap
      ).map((departmentName, index) => ({
        id: index + 1,
        name: departmentName,
        manager: departmentMap[departmentName].manager,
        employees: departmentMap[departmentName].employees,
      }));

      setDepartments(departmentList);
    } catch (err) {
      console.error("Departments loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load departments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDepartments();
  }, []);

  return (
    <div>
      {/* HEADER */}
      <div className="section-card">
        <div className="section-title">
          <span>🏢</span>

          <div>
            <h2>Company Departments</h2>

            <p>
              {role === "manager"
                ? `Departments in your department - ${loggedInDepartment}`
                : "View departments based on employee records"}
            </p>
          </div>
        </div>

        {error && (
          <div className="form-error" role="alert">
            ✕ {error}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon">🏢</div>

          <div>
            <span>
              {role === "manager"
                ? "My Department"
                : "Total Departments"}
            </span>

            <strong>{departments.length}</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👥</div>

          <div>
            <span>
              {role === "manager"
                ? "Department Employees"
                : "Total Employees"}
            </span>

            <strong>
              {departments.reduce(
                (total, department) => total + department.employees,
                0
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* DEPARTMENT LIST */}
      <div className="section-card">
        <div className="section-title">
          <span>🏢</span>

          <div>
            <h2>
              {role === "manager"
                ? "My Department"
                : "Company Departments"}
            </h2>

            <p>
              {role === "manager"
                ? "View your department and its employees"
                : "Departments and their employee count"}
            </p>
          </div>
        </div>

        {loading && (
          <div className="no-employees">
            <p>Loading departments...</p>
          </div>
        )}

        {!loading && !error && departments.length === 0 && (
          <div className="no-employees">
            <p>
              {role === "manager"
                ? `No employees found in your department (${loggedInDepartment}).`
                : "No departments found."}
            </p>
          </div>
        )}

        {!loading && departments.length > 0 && (
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Employees</th>
                </tr>
              </thead>

              <tbody>
                {departments.map((department) => (
                  <tr key={department.id}>
                    <td>
                      <strong>{department.name}</strong>
                    </td>

                    <td>
                      {department.manager === "-"
                        ? "No manager assigned"
                        : department.manager}
                    </td>

                    <td>{department.employees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && error && (
          <button
            type="button"
            className="add-btn"
            onClick={() => void fetchDepartments()}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default Departments;

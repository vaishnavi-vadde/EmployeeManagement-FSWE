
import { useEffect, useState } from "react";

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  role?: string;
}

interface Leave {
  id: number;
  employeeName: string;
  department: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
}

interface Insurance {
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

interface Payroll {
  id: number;
  employeeName: string;
  employeeId: string;
  department: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  status: string;
}

// Backend URL from Vercel environment variables
const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function Dashboard() {
  const role = localStorage.getItem("role") || "";
  const username = localStorage.getItem("username") || "";
  const employeeId = localStorage.getItem("employeeId") || "";
  const employeeDepartment =
    localStorage.getItem("employeeDepartment") || "";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data with JWT authorization.
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");

        if (role !== "hr" && !token) {
          throw new Error("JWT token missing. Please log in again.");
        }

        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const endpoints = [
          { key: "employees", url: `${API_URL}/employees` },
          { key: "leaves", url: `${API_URL}/leaves` },
          { key: "insurance", url: `${API_URL}/insurance` },
          { key: "loginRecords", url: `${API_URL}/login-records` },
          { key: "payroll", url: `${API_URL}/payroll` },
        ];

        const results = await Promise.all(
          endpoints.map(async ({ key, url }) => {
            try {
              const response = await fetch(url, { headers });

              if (!response.ok) {
                console.error(
                  `${key} API failed: ${response.status}`,
                  await response.text()
                );

                return { key, data: [] as unknown[] };
              }

              const data: unknown = await response.json();

              return {
                key,
                data: Array.isArray(data) ? data : [],
              };
            } catch (error) {
              console.error(`${key} request failed:`, error);
              return { key, data: [] as unknown[] };
            }
          })
        );

        for (const result of results) {
          switch (result.key) {
            case "employees":
              setEmployees(result.data as Employee[]);
              break;

            case "leaves":
              setLeaves(result.data as Leave[]);
              break;

            case "insurance":
              setInsurance(result.data as Insurance[]);
              break;

            case "loginRecords":
              setLoginRecords(result.data as LoginRecord[]);
              break;

            case "payroll":
              setPayrollRecords(result.data as Payroll[]);
              break;
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role]);

  // HR dashboard calculations.
  const totalEmployees = employees.length;

  const departments = [
    ...new Set(
      employees
        .map((employee) => employee.department)
        .filter(Boolean)
    ),
  ];

  const totalDepartments = departments.length;

  const pendingLeaves = leaves.filter(
    (leave) => leave.status?.toUpperCase() === "PENDING"
  ).length;

  const activeInsurance = insurance.filter(
    (record) => record.status?.toUpperCase() === "ACTIVE"
  ).length;

  const totalPayroll = payrollRecords.length;

  // Manager dashboard calculations.
  const managerTeam = employees.filter(
    (employee) =>
      employee.department?.trim().toLowerCase() ===
        employeeDepartment.trim().toLowerCase() &&
      employee.name?.trim().toLowerCase() !==
        username.trim().toLowerCase()
  );

  const managerPendingLeaves = leaves.filter(
    (leave) =>
      leave.department?.trim().toLowerCase() ===
        employeeDepartment.trim().toLowerCase() &&
      leave.status?.toUpperCase() === "PENDING"
  ).length;

  const managerLoginRecords = loginRecords.filter((record) => {
    const employee = employees.find(
      (emp) =>
        record.employeeId === `EMP${String(emp.id).padStart(4, "0")}` ||
        record.employeeId === `EMP${String(emp.id).padStart(3, "0")}`
    );

    return (
      employee?.department?.trim().toLowerCase() ===
      employeeDepartment.trim().toLowerCase()
    );
  });

  const managerLoggedIn = managerLoginRecords.filter(
    (record) => record.status?.toUpperCase() === "LOGGED IN"
  ).length;

  const managerAttendance =
    managerLoginRecords.length > 0
      ? Math.round(
          (managerLoggedIn / managerLoginRecords.length) * 100
        )
      : 0;

  // Employee dashboard calculations.
  const currentEmployee = employees.find(
    (employee) =>
      employee.email?.trim().toLowerCase() ===
        (localStorage.getItem("employeeEmail") || "").trim().toLowerCase() ||
      employee.name?.trim().toLowerCase() ===
        username.trim().toLowerCase()
  );

  const employeeLeaves = leaves.filter(
    (leave) =>
      leave.employeeName?.trim().toLowerCase() ===
      username.trim().toLowerCase()
  );

  const employeePendingLeaves = employeeLeaves.filter(
    (leave) => leave.status?.toUpperCase() === "PENDING"
  ).length;

  const employeeInsurance = insurance.filter(
    (record) =>
      record.employeeId === employeeId ||
      record.employeeName?.trim().toLowerCase() ===
        username.trim().toLowerCase()
  );

  const employeeLoginRecords = loginRecords.filter(
    (record) =>
      record.employeeId === employeeId ||
      record.employeeName?.trim().toLowerCase() ===
        username.trim().toLowerCase()
  );

  const employeeLoggedIn = employeeLoginRecords.filter(
    (record) => record.status?.toUpperCase() === "LOGGED IN"
  ).length;

  const employeeAttendance =
    employeeLoginRecords.length > 0
      ? Math.round(
          (employeeLoggedIn / employeeLoginRecords.length) * 100
        )
      : 0;

  const employeeInsuranceStatus =
    employeeInsurance.length > 0
      ? employeeInsurance[0].status || "ACTIVE"
      : "Not Applied";

  if (loading) {
    return (
      <div className="section-card">
        <h2>Loading Dashboard...</h2>
        <p>Please wait while dashboard data is loading.</p>
      </div>
    );
  }

  // HR DASHBOARD.
  if (role === "hr") {
    return (
      <div>
        <div className="section-card">
          <div className="section-title">
            <span>📊</span>
            <div>
              <h2>HR Dashboard</h2>
              <p>Welcome back, HR</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-icon">👥</div>
            <div>
              <h3>{totalEmployees}</h3>
              <p>Total Employees</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">🏢</div>
            <div>
              <h3>{totalDepartments}</h3>
              <p>Departments</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">📝</div>
            <div>
              <h3>{pendingLeaves}</h3>
              <p>Pending Leaves</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">🏥</div>
            <div>
              <h3>{activeInsurance}</h3>
              <p>Active Insurance</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">💰</div>
            <div>
              <h3>{totalPayroll}</h3>
              <p>Payroll Records</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-title">
            <span>📋</span>
            <div>
              <h2>HR Overview</h2>
              <p>Current organization information</p>
            </div>
          </div>

          <div className="dashboard-info">
            <p><strong>Total Employees:</strong> {totalEmployees}</p>
            <p><strong>Total Departments:</strong> {totalDepartments}</p>
            <p><strong>Pending Leave Requests:</strong> {pendingLeaves}</p>
            <p><strong>Active Insurance:</strong> {activeInsurance}</p>
            <p><strong>Payroll Records:</strong> {totalPayroll}</p>
          </div>
        </div>
      </div>
    );
  }

  // MANAGER DASHBOARD.
  if (role === "manager") {
    return (
      <div>
        <div className="section-card">
          <div className="section-title">
            <span>📊</span>
            <div>
              <h2>Manager Dashboard</h2>
              <p>Welcome back, {username}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-icon">👥</div>
            <div>
              <h3>{managerTeam.length}</h3>
              <p>Team Employees</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">🏢</div>
            <div>
              <h3>{employeeDepartment || "-"}</h3>
              <p>Department</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">📝</div>
            <div>
              <h3>{managerPendingLeaves}</h3>
              <p>Pending Leaves</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">📈</div>
            <div>
              <h3>{managerAttendance}%</h3>
              <p>Team Attendance</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-title">
            <span>👥</span>
            <div>
              <h2>My Team</h2>
              <p>Employees in {employeeDepartment} department</p>
            </div>
          </div>

          {managerTeam.length === 0 ? (
            <div className="no-employees">
              <p>No employees found in your department.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {managerTeam.map((employee) => (
                    <tr key={employee.id}>
                      <td><strong>{employee.name}</strong></td>
                      <td>{employee.email}</td>
                      <td>{employee.department}</td>
                      <td>{employee.role || "employee"}</td>
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

  // EMPLOYEE DASHBOARD.
  return (
    <div>
      <div className="section-card">
        <div className="section-title">
          <span>📊</span>
          <div>
            <h2>Employee Dashboard</h2>
            <p>Welcome back, {username}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-icon">👤</div>
          <div>
            <h3>
              {currentEmployee?.department || employeeDepartment || "-"}
            </h3>
            <p>Department</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">📈</div>
          <div>
            <h3>{employeeAttendance}%</h3>
            <p>Attendance</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">📝</div>
          <div>
            <h3>{employeePendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">🏥</div>
          <div>
            <h3>{employeeInsuranceStatus}</h3>
            <p>Medical Insurance</p>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">
          <span>👤</span>
          <div>
            <h2>My Information</h2>
            <p>Your employee details</p>
          </div>
        </div>

        <div className="dashboard-info">
          <p><strong>Name:</strong> {currentEmployee?.name || username}</p>
          <p><strong>Employee ID:</strong> {employeeId || "-"}</p>
          <p><strong>Email:</strong> {currentEmployee?.email || "-"}</p>
          <p>
            <strong>Department:</strong>{" "}
            {currentEmployee?.department || employeeDepartment || "-"}
          </p>
          <p>
            <strong>Salary:</strong>{" "}
            {currentEmployee?.salary != null
              ? `₹${currentEmployee.salary.toLocaleString("en-IN")}`
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

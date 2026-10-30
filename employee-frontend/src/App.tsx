
import { useState } from "react";

import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import EmployeeList from "./components/EmployeeList";
import EmployeeForm from "./components/EmployeeForm";
import Departments from "./components/Departments";
import Announcements from "./components/Announcements";
import LeaveManagement from "./components/LeaveManagement";
import LeaveRequest from "./components/LeaveRequest";
import Attendance from "./components/LoginRecords";
import EmployeeProfile from "./components/EmployeeProfile";
import Payroll from "./components/Payroll";
import MedicalInsurance from "./components/MedicalInsurance";

import type { Employee } from "./employee";
import "./App.css";

// Backend URL from Vercel environment variables
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  // LOGIN STATE
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("role") !== null
  );

  // ROLE
  const [role, setRole] = useState(
    localStorage.getItem("role") || "employee"
  );

  // ACTIVE PAGE
  const [activePage, setActivePage] = useState("dashboard");

  // EMPLOYEE TO EDIT
  const [employeeToEdit, setEmployeeToEdit] =
    useState<Employee | null>(null);

  // LOGIN
  const handleLogin = (selectedRole: string) => {
    const savedRole =
      localStorage.getItem("role") || selectedRole;

    setRole(savedRole);
    setLoggedIn(true);
    setActivePage("dashboard");
    setEmployeeToEdit(null);
  };

  // LOGOUT: UPDATE LOGIN RECORD BEFORE CLEARING TOKEN
  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const recordId = localStorage.getItem("activeLoginRecordId");

    if (token && recordId) {
      try {
        const response = await fetch(
          `${API_URL}/api/login-records/${encodeURIComponent(
            recordId
          )}/logout`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error(
            "Failed to record logout:",
            response.status,
            await response.text()
          );
        } else {
          console.log("Logout time recorded successfully.");
        }
      } catch (error) {
        console.error(
          "Logout recording request failed:",
          error
        );
      }
    } else {
      console.warn(
        "No active login record ID or JWT token was found."
      );
    }

    // Clear login details after the request finishes.
    [
      "token",
      "username",
      "role",
      "employeeId",
      "employeeEmail",
      "employeeDepartment",
      "activeLoginRecordId",
    ].forEach((key) => localStorage.removeItem(key));

    setLoggedIn(false);
    setRole("employee");
    setActivePage("dashboard");
    setEmployeeToEdit(null);
  };

  // PAGE CHANGE
  const handlePageChange = (page: string) => {
    setActivePage(page);

    if (page !== "employees") {
      setEmployeeToEdit(null);
    }
  };

  // EDIT EMPLOYEE
  const handleEditEmployee = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setActivePage("employees");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ROLE-BASED PAGE ACCESS
  const hasAccess = (page: string): boolean => {
    if (role === "hr") {
      return true;
    }

    if (role === "manager") {
      const managerPages = [
        "dashboard",
        "employees",
        "departments",
        "announcements",
        "login",
        "leave",
        "profile",
        "leaveRequest",
        "insurance",
      ];

      return managerPages.includes(page);
    }

    if (role === "employee") {
      const employeePages = [
        "dashboard",
        "login",
        "profile",
        "leaveRequest",
        "insurance",
      ];

      return employeePages.includes(page);
    }

    return false;
  };

  // FINISH EMPLOYEE EDIT
  const handleEditComplete = () => {
    setEmployeeToEdit(null);
  };

  // PAGE CONTENT
  const renderPage = () => {
    if (!hasAccess(activePage)) {
      return <Dashboard />;
    }

    switch (activePage) {
      case "dashboard":
        return <Dashboard />;

      case "employees":
        return (
          <div className="page-content">
            <div className="section-card">
              <div className="section-title">
                <span>👥</span>
                <div>
                  <h2>
                    {employeeToEdit
                      ? "Edit Employee"
                      : "Employee Management"}
                  </h2>
                  <p>
                    Add, update and manage company employee information
                  </p>
                </div>
              </div>

              <EmployeeForm
                employeeToEdit={employeeToEdit}
                onEditComplete={handleEditComplete}
              />
            </div>

            <div className="section-card">
              <div className="section-title">
                <span>👥</span>
                <div>
                  <h2>Employees</h2>
                  <p>View and manage company employees</p>
                </div>
              </div>

              <EmployeeList onEdit={handleEditEmployee} />
            </div>
          </div>
        );

      case "departments":
        return <Departments />;

      case "announcements":
        return <Announcements />;

      case "leave":
        return <LeaveManagement />;

      case "leaveRequest":
        return <LeaveRequest />;

      case "login":
        return <Attendance role={role} />;

      case "profile":
        return (
          <EmployeeProfile
            username={localStorage.getItem("username") || ""}
          />
        );

      case "payroll":
        return <Payroll />;

      case "insurance":
        return <MedicalInsurance />;

      default:
        return <Dashboard />;
    }
  };

  // LOGIN SCREEN
  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // LOGGED-IN USER
  const loggedInUsername =
    localStorage.getItem("username") || "";

  // MAIN APPLICATION
  return (
    <div className="app-layout">
      <Sidebar
        role={role}
        activePage={activePage}
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <header className="top-header">
          <div>
            <h1>Employee Management System</h1>
            <p>Manage your workforce efficiently</p>
          </div>

          <div className="header-user">
            <div className="header-user-icon">
              {role === "hr"
                ? "👩‍💼"
                : role === "manager"
                  ? "👨‍💼"
                  : "👤"}
            </div>

            <div>
              <strong>
                {role === "hr"
                  ? "HR / Admin"
                  : loggedInUsername || "User"}
              </strong>

              <span>
                {role === "hr"
                  ? "HR"
                  : role === "manager"
                    ? "Manager"
                    : "Employee"}
              </span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;

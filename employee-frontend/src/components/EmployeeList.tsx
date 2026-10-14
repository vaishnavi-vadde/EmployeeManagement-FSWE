import { useEffect, useState } from "react";
import { useEmployeeStore } from "../store/employeeStore";
import type { Employee } from "../employee";

interface EmployeeListProps {
  onEdit: (employee: Employee) => void;
}

function EmployeeList({ onEdit }: EmployeeListProps) {
  const {
    employees,
    loading,
    fetchEmployees,
    removeEmployee,
  } = useEmployeeStore();

  const [search, setSearch] = useState("");

  // ==========================================
  // LOGGED-IN USER
  // ==========================================

  const role =
    localStorage.getItem("role") || "";

  const managerDepartment =
    localStorage.getItem("employeeDepartment") || "";

  // ==========================================
  // FETCH EMPLOYEES
  // ==========================================

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ==========================================
  // MANAGER DEPARTMENT FILTER
  // ==========================================

  const departmentEmployees =
    role === "manager"
      ? employees.filter((employee) => {
          return (
            (employee.department || "")
              .trim()
              .toLowerCase() ===
            managerDepartment
              .trim()
              .toLowerCase()
          );
        })
      : employees;

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const filteredEmployees =
    departmentEmployees.filter((employee) => {
      const text = search
        .trim()
        .toLowerCase();

      return (
        (employee.name || "")
          .toLowerCase()
          .includes(text) ||
        (employee.email || "")
          .toLowerCase()
          .includes(text) ||
        (employee.department || "")
          .toLowerCase()
          .includes(text)
      );
    });

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="no-employees">
        <p>Loading employees...</p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div>

      {/* SEARCH */}

      <div className="search-container">

        <div className="search-box">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>

      {/* NO EMPLOYEES */}

      {filteredEmployees.length === 0 ? (

        <div className="no-employees">

          <p>
            {role === "manager"
              ? `No employees found in your department (${managerDepartment}).`
              : "No employees found."}
          </p>

        </div>

      ) : (

        /* EMPLOYEE TABLE */

        <div className="table-wrapper">

          <table className="employee-table">

            <thead>

              <tr>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Department
                </th>

                <th>
                  Salary
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredEmployees.map(
                (employee) => (

                  <tr
                    key={employee.id}
                  >

                    <td>
                      {employee.name ||
                        "N/A"}
                    </td>

                    <td>
                      {employee.email}
                    </td>

                    <td>
                      {employee.department}
                    </td>

                    <td>
                      ₹
                      {Number(
                        employee.salary
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td>

                      <div className="action-buttons">

                        {/* EDIT */}

                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() =>
                            onEdit(
                              employee
                            )
                          }
                        >
                          ✎ Edit
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            removeEmployee(
                              employee.id
                            )
                          }
                        >
                          🗑 Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

export default EmployeeList;
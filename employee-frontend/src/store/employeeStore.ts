
import { create } from "zustand";
import type { Employee } from "../employee";

const API_URL = "http://localhost:8081/api/employees";

interface EmployeeStore {
  employees: Employee[];
  loading: boolean;

  fetchEmployees: () => Promise<void>;

  createEmployee: (
    employee: Omit<Employee, "id">
  ) => Promise<void>;

  editEmployee: (
    id: number,
    employee: Omit<Employee, "id">
  ) => Promise<void>;

  removeEmployee: (id: number) => Promise<void>;
}

// Get authentication headers for protected API requests.
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

export const useEmployeeStore = create<EmployeeStore>((set) => ({
  employees: [],
  loading: false,

  // GET EMPLOYEES
  fetchEmployees: async () => {
    set({ loading: true });

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Failed to fetch employees (${response.status})` +
            (details ? `: ${details}` : "")
        );
      }

      const data: Employee[] = await response.json();

      set({
        employees: data,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching employees:", error);

      set({
        employees: [],
        loading: false,
      });
    }
  },

  // CREATE EMPLOYEE
  createEmployee: async (employee) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(employee),
    });

    if (!response.ok) {
      const details = await response.text();

      throw new Error(
        `Failed to create employee (${response.status})` +
          (details ? `: ${details}` : "")
      );
    }

    const newEmployee: Employee = await response.json();

    set((state) => ({
      employees: [...state.employees, newEmployee],
    }));
  },

  // UPDATE EMPLOYEE
  editEmployee: async (id, employee) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(employee),
    });

    if (!response.ok) {
      const details = await response.text();

      throw new Error(
        `Failed to update employee (${response.status})` +
          (details ? `: ${details}` : "")
      );
    }

    const updatedEmployee: Employee = await response.json();

    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? updatedEmployee : emp
      ),
    }));
  },

  // DELETE EMPLOYEE
  removeEmployee: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const details = await response.text();

      throw new Error(
        `Failed to delete employee (${response.status})` +
          (details ? `: ${details}` : "")
      );
    }

    set((state) => ({
      employees: state.employees.filter(
        (employee) => employee.id !== id
      ),
    }));
  },
}));


interface SidebarProps {
  role: string;
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

function Sidebar({
  role,
  activePage,
  onPageChange,
  onLogout,
}: SidebarProps) {

  // =========================
  // EMPLOYEE MENU
  // =========================

  const employeeMenu = [
    {
      id: "dashboard",
      icon: "🏠",
      label: "Dashboard",
    },
    {
      id: "profile",
      icon: "👤",
      label: "My Profile",
    },
    {
      id: "login",
      icon: "🔐",
      label: "My Login",
    },
    {
      id: "leaveRequest",
      icon: "📋",
      label: "Apply Leave",
    },
    {
      id: "insurance",
      icon: "🏥",
      label: "Medical Insurance",
    },
  ];

  // =========================
  // MANAGER MENU
  // Manager + Employee access
  // =========================

  const managerMenu = [
    {
      id: "dashboard",
      icon: "🏠",
      label: "Dashboard",
    },
    {
      id: "employees",
      icon: "👥",
      label: "Employees",
    },
    {
      id: "departments",
      icon: "🏢",
      label: "Departments",
    },
    {
      id: "login",
      icon: "🔐",
      label: "Login",
    },
    {
      id: "leave",
      icon: "📋",
      label: "Leave Requests",
    },
    {
      id: "announcements",
      icon: "📢",
      label: "Announcements",
    },
    {
      id: "profile",
      icon: "👤",
      label: "My Profile",
    },
    {
      id: "leaveRequest",
      icon: "📝",
      label: "Apply Leave",
    },
    {
      id: "insurance",
      icon: "🏥",
      label: "Medical Insurance",
    },
  ];

  // =========================
  // HR MENU
  // HR manages records
  // =========================

  const hrMenu = [
    {
      id: "dashboard",
      icon: "🏠",
      label: "Dashboard",
    },
    {
      id: "employees",
      icon: "👥",
      label: "Employees",
    },
    {
      id: "departments",
      icon: "🏢",
      label: "Departments",
    },
    {
      id: "login",
      icon: "🔐",
      label: "Login",
    },
    {
      id: "leave",
      icon: "📋",
      label: "Leave Requests",
    },
    {
      id: "announcements",
      icon: "📢",
      label: "Announcements",
    },
    {
      id: "payroll",
      icon: "💰",
      label: "Payroll",
    },
    {
      id: "insurance",
      icon: "🏥",
      label: "Medical Insurance",
    },
    {
      id: "profile",
      icon: "👤",
      label: "My Profile",
    },
  ];

  // =========================
  // SELECT MENU BASED ON ROLE
  // =========================

  let menuItems;

  if (role === "hr") {
    menuItems = hrMenu;
  } else if (role === "manager") {
    menuItems = managerMenu;
  } else {
    menuItems = employeeMenu;
  }

  return (
    <aside className="sidebar">

      {/* =========================
          LOGO
      ========================= */}

      <div className="sidebar-logo">

        <div className="logo-icon">
          👥
        </div>

        <div>
          <h2>EMS</h2>
          <span>Employee System</span>
        </div>

      </div>


      {/* =========================
          USER
      ========================= */}

      <div className="sidebar-user">

        <div className="user-icon">

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
              : role === "manager"
              ? "Manager"
              : "Employee"}

          </strong>

          <span>

            {role === "hr"
              ? "HR / Admin"
              : role}

          </span>

        </div>

      </div>


      {/* =========================
          MENU
      ========================= */}

      <nav className="sidebar-menu">

        {menuItems.map((item) => (

          <button
            key={item.id}
            type="button"
            className={
              activePage === item.id
                ? "sidebar-menu-item active"
                : "sidebar-menu-item"
            }
            onClick={() =>
              onPageChange(item.id)
            }
          >

            <span>
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>

          </button>

        ))}

      </nav>


      {/* =========================
          LOGOUT
      ========================= */}

      <div className="sidebar-bottom">

        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
        >
          🚪 Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;

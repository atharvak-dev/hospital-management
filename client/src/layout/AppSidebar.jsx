import React, { useCallback, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import {
    GridIcon,
    CalenderIcon,
    UserCircleIcon,
    ListIcon,
    TableIcon,
    PageIcon,
    PieChartIcon,
    HorizontaLDots,
    ChevronDownIcon,
    MedicineIcon
} from "../icons";

const navItems = [
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/",
    },
    {
        icon: <CalenderIcon />,
        name: "Appointments",
        path: "/appointments",
    },
    {
        icon: <UserCircleIcon />,
        name: "Patients",
        path: "/patients",
    },
    {
        icon: <ListIcon />, // Using ListIcon for Visits
        name: "Visits",
        path: "/visits",
    },
    {
        icon: <TableIcon />,
        name: "Billing",
        path: "/billing",
    },
    {
        icon: <PieChartIcon />,
        name: "Reports",
        path: "/reports",
    },
    {
        icon: <PageIcon />, // Using PageIcon for Templates
        name: "Templates",
        path: "/templates",
    },
    {
        icon: <MedicineIcon />, // Using MedicineIcon for Medicines
        name: "Medicines",
        path: "/medicines",
    },
    {
        icon: <UserCircleIcon />, // Reusing UserIcon for Users
        name: "Users",
        path: "/users",
    },
];

const AppSidebar = () => {
    const { isMobileOpen } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = useCallback(
        (path) => location.pathname === path,
        [location.pathname]
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
            w-[290px] ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
            <div className="py-8 flex justify-start">
                <Link to="/">
                    <h1 className="text-2xl font-bold text-brand-600 dark:text-brand-400">MediCare</h1>
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <ul className="flex flex-col gap-4">
                                {navItems.map((nav, index) => (
                                    <li key={nav.name}>
                                        <Link
                                            to={nav.path}
                                            className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"} lg:justify-start`}
                                        >
                                            <span
                                                className={`menu-item-icon-size ${isActive(nav.path)
                                                    ? "menu-item-icon-active"
                                                    : "menu-item-icon-inactive"
                                                    }`}
                                            >
                                                {nav.icon}
                                            </span>
                                            <span className="menu-item-text">{nav.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="py-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between px-4">
                    <ThemeToggleButton />
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/login');
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                        {/* Using a simple text or icon if available. I'll simply use text 'Logout' as per image roughly */}
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;

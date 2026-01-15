import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import { MenuIcon } from "../icons";

// Stub for UserDropdown since I don't have it yet, implementing basic logout
const UserDropdown = () => {
    const navigate = useNavigate();
    return (
        <div className="relative">
            <button
                onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/login');
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-200 dark:hover:bg-gray-800"
            >
                <span>Logout</span>
            </button>
        </div>
    )
}

const AppHeader = () => {
    const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
    const handleToggle = () => {
        if (window.innerWidth >= 1024) {
            toggleSidebar();
        } else {
            toggleMobileSidebar();
        }
    };

    return (
        <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b lg:hidden">
            <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
                <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
                    <button
                        className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:hidden dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
                        onClick={handleToggle}
                        aria-label="Toggle Sidebar"
                    >
                        <MenuIcon />
                    </button>

                    <Link to="/" className="lg:hidden">
                        {/* Mobile Logo Fallback */}
                        <span className="font-bold text-xl text-brand-600">MediCare</span>
                    </Link>
                </div>

                <div className="flex items-center justify-end w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none">
                    <div className="flex items-center gap-2">
                        <ThemeToggleButton />
                        {/* NotificationDropdown Stub */}
                    </div>
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
};

export default AppHeader;

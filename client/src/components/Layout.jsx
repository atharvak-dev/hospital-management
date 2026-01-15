import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, FileText, Pill, CreditCard, LogOut, User, BarChart } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
        return (
            <Link
                to={to}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                    }`}
            >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-blue-600">MediCare</h1>
                    <p className="text-xs text-gray-500 mt-1">Hospital Management</p>
                </div>

                <nav className="flex-1 mt-6 overflow-y-auto">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/patients" icon={Users} label="Patients" />
                    <NavItem to="/visits" icon={FileText} label="Visits" />
                    <NavItem to="/appointments" icon={Calendar} label="Appointments" />
                    <NavItem to="/prescriptions" icon={Pill} label="Prescriptions" />
                    <NavItem to="/billing" icon={CreditCard} label="Billing" />
                    <NavItem to="/reports" icon={BarChart} label="Reports" />
                    <NavItem to="/templates" icon={FileText} label="Templates" />
                    {user?.role === 'admin' && <NavItem to="/users" icon={Users} label="Users" />}
                </nav>

                <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{user?.full_name || user?.username}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;

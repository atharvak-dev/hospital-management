import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { UserCircleIcon, CalenderIcon, PieChartIcon, GridIcon } from '../icons';
import { Activity, CreditCard, Users, Clock, CheckCircle } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total_patients: 0,
        total_doctors: 0,
        appointments_today: 0,
        visits_today: 0,
        total_revenue: 0,
        pending_payments: 0,
        appointment_stats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, colorClass, borderClass, textClass }) => (
        <div className={`p-4 rounded-xl border ${borderClass} ${colorClass} shadow-sm transition-all hover:shadow-md`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className={`text-sm font-semibold ${textClass} uppercase tracking-wide opacity-80`}>{title}</h4>
                    <p className={`text-3xl font-bold ${textClass} mt-2`}>{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-white/50 backdrop-blur-sm`}>
                    <Icon className={`w-6 h-6 ${textClass}`} />
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="p-6">Loading dashboard...</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Hospital Analytics Overview</h2>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-1">Welcome back, {user?.full_name}</h3>
                <p className="text-gray-500 text-sm">Here's what's happening in your hospital today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Appointments Today"
                    value={stats.appointments_today}
                    icon={Clock}
                    colorClass="bg-blue-50"
                    borderClass="border-blue-100"
                    textClass="text-blue-700"
                />
                <StatCard
                    title="Visits Today"
                    value={stats.visits_today}
                    icon={Activity}
                    colorClass="bg-green-50"
                    borderClass="border-green-100"
                    textClass="text-green-700"
                />
                <StatCard
                    title="Total Patients"
                    value={stats.total_patients}
                    icon={Users}
                    colorClass="bg-purple-50"
                    borderClass="border-purple-100"
                    textClass="text-purple-700"
                />
                <StatCard
                    title="Doctors Available"
                    value={stats.total_doctors}
                    icon={UserCircleIcon}
                    colorClass="bg-indigo-50"
                    borderClass="border-indigo-100"
                    textClass="text-indigo-700"
                />
            </div>

            {/* Financials - Only visible to Admin usually, but showing for now */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 rounded-full">
                            <CreditCard className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue Collected</p>
                            <p className="text-2xl font-bold text-gray-900">₹{stats.total_revenue?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-100 rounded-full">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Payments</p>
                            <p className="text-2xl font-bold text-gray-900">₹{stats.pending_payments?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointment Status Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4">Today's Appointment Status</h4>
                {stats.appointment_stats.length === 0 ? (
                    <p className="text-gray-500 text-sm">No appointments scheduled for today.</p>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        {stats.appointment_stats.map((status) => (
                            <div key={status.status} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                <div className={`w-3 h-3 rounded-full ${status.status === 'completed' ? 'bg-green-500' :
                                        status.status === 'cancelled' ? 'bg-red-500' :
                                            status.status === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}></div>
                                <span className="capitalize text-sm font-medium text-gray-700">{status.status}</span>
                                <span className="text-sm font-bold text-gray-900">{status.count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

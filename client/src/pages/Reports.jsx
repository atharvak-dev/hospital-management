import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart, Users, DollarSign, Calendar, Activity, Download, PieChart as PieIcon, AlertTriangle } from 'lucide-react';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Date Filters
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    const handleQuickFilter = (days) => {
        const end = new Date();
        const start = new Date();
        if (days === 0) {
            // Today
        } else if (days === 30) {
            start.setDate(end.getDate() - 30);
        } else if (days === 7) {
            start.setDate(end.getDate() - 7);
        }

        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
    };

    const downloadCSV = () => {
        if (!stats || !stats.daily_stats) return;

        const headers = ["Date", "Doctor Name", "Patient Count"];
        // For daily stats. We could also export Appointments list if we fetched it.
        // Let's export the Daily Doctor Stats which is useful.

        const rows = stats.daily_stats.map(row => [
            new Date(row.appointment_date).toLocaleDateString(),
            row.doctor_name,
            row.count
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `reports_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
        link.click();
    };

    if (loading && !stats) return <div className="p-8">Loading analytics...</div>;
    // Keep stats visible while reloading for smoothUX

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-gray-500 text-sm font-medium uppercase">{title}</h4>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-full bg-opacity-10`} style={{ backgroundColor: color }}>
                    <Icon className="w-8 h-8" style={{ color: color }} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <BarChart className="w-6 h-6 mr-2 text-indigo-600" /> Hospital Analytics
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-white border rounded-md overflow-hidden">
                        <button onClick={() => handleQuickFilter(0)} className="px-3 py-2 text-sm hover:bg-gray-50 border-r">Today</button>
                        <button onClick={() => handleQuickFilter(7)} className="px-3 py-2 text-sm hover:bg-gray-50 border-r">Last 7d</button>
                        <button onClick={() => handleQuickFilter(30)} className="px-3 py-2 text-sm hover:bg-gray-50">Last 30d</button>
                    </div>
                    <div className="flex items-center gap-1 bg-white border rounded-md px-2 py-1">
                        <input type="date" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} className="text-sm border-none focus:ring-0" />
                        <span className="text-gray-400">-</span>
                        <input type="date" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} className="text-sm border-none focus:ring-0" />
                    </div>
                    <button onClick={downloadCSV} className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center shadow-sm hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </button>
                </div>
            </div>

            {stats ? (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Visits"
                            value={stats.summary.total_visits}
                            icon={Activity}
                            color="#3B82F6"
                        />
                        <StatCard
                            title="Revenue"
                            value={`₹${stats.summary.total_revenue}`}
                            icon={DollarSign}
                            color="#10B981"
                        />
                        <StatCard
                            title="Cancellation Rate"
                            value={`${stats.appointment_analytics.metrics.cancellation_rate}%`}
                            icon={AlertTriangle}
                            color={stats.appointment_analytics.metrics.cancellation_rate > 20 ? "#EF4444" : "#F59E0B"}
                            subtitle="Target: < 10%"
                        />
                        <StatCard
                            title="No-Show Rate"
                            value={`${stats.appointment_analytics.metrics.no_show_rate}%`}
                            icon={Users} // or UserX
                            color="#8B5CF6"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Appointment Status Breakdown */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><PieIcon className="w-5 h-5 mr-2" /> Appointment Status</h3>
                            <div className="space-y-4">
                                {Object.entries(stats.appointment_analytics.breakdown).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <span className="capitalize text-gray-600 text-sm">{status}</span>
                                        <div className="flex items-center w-2/3">
                                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className={`h-2 rounded-full ${status === 'completed' ? 'bg-green-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${(count / (stats.appointment_analytics.total || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold w-8 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))}
                                {stats.appointment_analytics.total === 0 && <p className="text-gray-400 text-sm text-center">No appointments in range</p>}
                            </div>
                        </div>

                        {/* Top Doctors */}
                        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Doctors (by Visits)</h3>
                            <div className="space-y-4">
                                {stats.top_doctors.map((doc, idx) => (
                                    <div key={idx} className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3 text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">{doc.doctor_name}</span>
                                                <span className="text-sm font-medium text-gray-500">{doc.visit_count} visits</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full"
                                                    style={{ width: `${(doc.visit_count / (stats.top_doctors[0]?.visit_count || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {stats.top_doctors.length === 0 && <p className="text-gray-500 text-center">No data available for this range</p>}
                            </div>
                        </div>
                    </div>

                    {/* Daily Stats Table Preview */}
                    <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Daily Patient Count Log</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stats.daily_stats.map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(row.appointment_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">{row.doctor_name}</td>
                                            <td className="px-6 py-2 whitespace-nowrap text-sm font-bold text-gray-900">{row.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : <div className="p-8">No data loaded.</div>}
        </div>
    );
};

export default Reports;

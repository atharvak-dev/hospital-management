import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Plus, Calendar, User, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Visits = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters State
    const [doctors, setDoctors] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        date: '',
        doctor_id: ''
    });

    // Fetch Doctors for dropdown
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/master/doctors');
                setDoctors(res.data);
            } catch (err) {
                console.error("Error fetching doctors", err);
            }
        };
        fetchDoctors();
    }, []);

    const fetchVisits = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: 10 });
            if (filters.search) params.append('search', filters.search);
            if (filters.date) params.append('date', filters.date);
            if (filters.status) params.append('status', filters.status);
            if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);

            const res = await api.get(`/visits?${params.toString()}`);
            if (res.data.items) {
                setVisits(res.data.items);
                setTotalPages(res.data.pagination.totalPages);
            } else {
                setVisits(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits(page);
    }, [page, filters]); // Re-fetch on filter change or page change

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Reset to page 1 on filter change
    };

    const clearFilters = () => {
        setFilters({ search: '', status: '', date: '', doctor_id: '' });
        setPage(1);
    };

    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    const handleNext = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Visits History</h2>
                <Link to="/patients" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center shadow-sm w-full sm:w-auto justify-center">
                    <Plus className="w-5 h-5 mr-1" />
                    New Visit
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        placeholder="Search Patient..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                    />
                </div>

                {/* Doctor Filter */}
                <select
                    name="doctor_id"
                    value={filters.doctor_id}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                >
                    <option value="">All Doctors</option>
                    {doctors.map(doc => (
                        <option key={doc.user_id} value={doc.user_id}>{doc.full_name}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                {/* Date Filter */}
                <input
                    type="date"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                />

                {/* Clear Button */}
                <button
                    onClick={clearFilters}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm border border-gray-300"
                >
                    Clear Filters
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider flex">
                    <div className="w-1/6">Date</div>
                    <div className="w-1/4">Patient</div>
                    <div className="w-1/4">Doctor</div>
                    <div className="flex-1">Status/Diagnosis</div>
                    <div className="w-20 text-right">Actions</div>
                </div>
                <ul className="divide-y divide-gray-200">
                    {visits.length === 0 && !loading && (
                        <li className="px-6 py-4 text-center text-gray-500">No visits found.</li>
                    )}
                    {visits.map((visit) => (
                        <li key={visit.visit_id}>
                            <div className="px-6 py-4 flex items-center hover:bg-gray-50">
                                <div className="w-1/6 text-sm text-gray-900">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                        {new Date(visit.visit_date).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 pl-6">{visit.visit_time?.slice(0, 5)}</div>
                                </div>
                                <div className="w-1/4">
                                    <div className="text-sm font-medium text-blue-600">
                                        {visit.patient_first_name} {visit.patient_last_name}
                                    </div>
                                    <div className="text-xs text-gray-500">{visit.patient_code}</div>
                                </div>
                                <div className="w-1/4 text-sm text-gray-500">
                                    Dr. {visit.doctor_name || visit.doctor_id}
                                </div>
                                <div className="flex-1">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {visit.status}
                                    </span>
                                    {visit.diagnosis && <p className="text-sm text-gray-600 mt-1 truncate">{visit.diagnosis}</p>}
                                </div>
                                <div className="w-20 text-right">
                                    <Link to={`/visits/${visit.visit_id}`} className="text-gray-400 hover:text-blue-600">
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Pagination Controls */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button onClick={handlePrev} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button onClick={handleNext} disabled={page === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={handlePrev}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    {/* Chevron Left */}
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={page === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">Next</span>
                                    {/* Chevron Right */}
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Visits;

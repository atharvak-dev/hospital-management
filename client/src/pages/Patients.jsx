import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Plus, User, Edit, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPatients = async (query = '', p = 1) => {
        setLoading(true);
        try {
            // Send page param to trigger backend pagination
            const res = await api.get(`/patients/search?q=${query}&page=${p}&limit=10`);
            if (res.data.items) {
                setPatients(res.data.items);
                setTotalPages(res.data.pagination.totalPages);
            } else {
                setPatients(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search if needed, but for now simple trigger
        fetchPatients(search, page);
    }, [page]); // Trigger on page change

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on new search
        fetchPatients(search, 1);
    };

    const handlePrev = () => { if (page > 1) setPage(p => p - 1); };
    const handleNext = () => { if (page < totalPages) setPage(p => p + 1); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
                <Link to="/patients/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center shadow-sm">
                    <Plus className="w-5 h-5 mr-1" />
                    New Patient
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, phone, or ID..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md">Search</button>
                </form>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {patients.length === 0 && !loading && (
                        <li className="px-6 py-4 text-center text-gray-500">No patients found.</li>
                    )}
                    {patients.map((patient) => (
                        <li key={patient.patient_id}>
                            <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition">
                                <Link to={`/patients/${patient.patient_id}`} className="flex items-center flex-1 cursor-pointer">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {patient.first_name[0]}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-blue-600 truncate">
                                            {patient.first_name} {patient.last_name}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                            <span className="mr-2 font-mono bg-gray-100 px-1 rounded text-xs">{patient.patient_code}</span>
                                            <span className="mr-2">•</span>
                                            <span>{patient.phone}</span>
                                            <span className="mr-2">•</span>
                                            <span>{patient.city || 'N/A'}</span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex space-x-2">
                                    <Link to={`/visits/new?patient_id=${patient.patient_id}`} className="text-gray-400 hover:text-green-600 p-2" title="New Visit">
                                        <FileText className="w-5 h-5" />
                                    </Link>
                                    <Link to={`/patients/${patient.patient_id}/edit`} className="text-gray-400 hover:text-blue-600 p-2" title="Edit">
                                        <Edit className="w-5 h-5" />
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

export default Patients;

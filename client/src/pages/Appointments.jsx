import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar as CalendarIcon, Plus, Clock, Search, User, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Appointments = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]); // List view appointments (daily)
    const [calendarAppointments, setCalendarAppointments] = useState([]); // Calendar view appointments (monthly)
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Selected date for list
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Current month for calendar
    const [view, setView] = useState('list'); // list, calendar, new

    // State for pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch daily appointments for List View
    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/appointments?date=${date}&page=${page}&limit=50`);
            if (res.data.data) {
                setAppointments(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            } else {
                // Fallback if backend not ready (though it is)
                setAppointments(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // New Appointment State
    const [patients, setPatients] = useState([]); // For search
    const [patientSearch, setPatientSearch] = useState('');
    const [doctors, setDoctors] = useState([]); // List of doctors
    const [newAppt, setNewAppt] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        appointment_type: 'new',
        notes: ''
    });

    // Fetch monthly appointments for Calendar View
    const fetchCalendarAppointments = async () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        try {
            const res = await api.get(`/appointments?startDate=${startDate}&endDate=${endDate}`);
            setCalendarAppointments(res.data.data || res.data);
        } catch (err) { console.error(err); }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/master/doctors');
            setDoctors(res.data);
        } catch (err) { console.error(err); }
    };

    const searchPatients = async (q) => {
        if (q.length < 2) return;
        try {
            const res = await api.get(`/patients/search?q=${q}`);
            setPatients(res.data);
        } catch (err) { console.error(err); }
    };

    // Effect for List View - triggering on page change too
    useEffect(() => {
        if (view === 'list') {
            fetchAppointments();
        }
    }, [date, view, page]);

    // Reset page when date changes
    useEffect(() => {
        setPage(1);
    }, [date]);




    // Effect for Calendar View
    useEffect(() => {
        if (view === 'calendar') {
            fetchCalendarAppointments();
        }
    }, [currentMonth, view]);

    // Auto-select doctor if logged in user is a doctor
    useEffect(() => {
        if (user && user.role === 'doctor') {
            setNewAppt(prev => ({ ...prev, doctor_id: user.user_id }));
        }
    }, [user, view]); // Reset when opening form

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            searchPatients(patientSearch);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [patientSearch]);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newAppt.patient_id) return alert('Please select a patient');
        if (!newAppt.doctor_id) return alert('Please select a doctor');
        try {
            await api.post('/appointments', newAppt);
            alert('Appointment Scheduled');
            setView('list');
            fetchAppointments();
        } catch (err) {
            // Handle expected conflict error
            if (err.response && (err.response.status === 409 || err.response.status === 400 || err.response.status === 500)) {
                alert(`Error: ${err.response.data.error || 'Server Error'}`);
            } else {
                alert('Error booking appointment');
                console.error(err);
            }
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/appointments/${id}/status`, { status });
            fetchAppointments(); // Refresh list
            if (view === 'calendar') fetchCalendarAppointments(); // Refresh calendar if needed
        } catch (err) { console.error(err); }
    };

    // Calendar Helper Functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days: totalDays, firstDay } = getDaysInMonth(currentMonth);
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const onDateClick = (day) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${d}`;
        setDate(dateStr);
        setView('list');
    };

    // Filter appointments for a specific day in the calendar grid
    const getAppointmentsForDay = (day) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${d}`;
        return calendarAppointments.filter(appt => appt.appointment_date.startsWith(dateStr));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <CalendarIcon className="w-6 h-6 mr-2 text-purple-600" /> Appointments
                    </h2>

                    {/* View Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        <button
                            onClick={() => setView('list')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List className="w-4 h-4 inline-block mr-1" /> List
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <CalendarIcon className="w-4 h-4 inline-block mr-1" /> Calendar
                        </button>
                    </div>

                    {view === 'list' && (
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    )}
                </div>

                {view !== 'new' && (
                    <button
                        onClick={() => setView('new')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Book Appointment
                    </button>
                )}
            </div>

            {/* Calendar View */}
            {view === 'calendar' && (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                        <h3 className="text-lg font-bold text-gray-800">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {day}
                            </div>
                        ))}

                        {blanks.map((_, i) => (
                            <div key={`blank-${i}`} className="bg-white h-32 p-2"></div>
                        ))}

                        {daysArray.map(day => {
                            const dayAppts = getAppointmentsForDay(day);
                            return (
                                <div
                                    key={day}
                                    className="bg-white h-32 p-2 relative hover:bg-gray-50 cursor-pointer transition-colors group"
                                    onClick={() => onDateClick(day)}
                                >
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">{day}</span>
                                    <div className="mt-1 space-y-1 overflow-y-auto h-24 scrollbar-hide">
                                        {dayAppts.slice(0, 3).map(appt => (
                                            <div key={appt.appointment_id} className={`text-xs px-1.5 py-0.5 rounded truncate ${appt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                appt.status === 'cancelled' ? 'bg-red-50 text-red-800' :
                                                    'bg-purple-50 text-purple-700'
                                                }`}>
                                                {appt.appointment_time.slice(0, 5)} {appt.first_name}
                                            </div>
                                        ))}
                                        {dayAppts.length > 3 && (
                                            <div className="text-xs text-gray-400 text-center">+{dayAppts.length - 3} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* New Appointment Form */}
            {view === 'new' && (
                <div className="bg-white p-6 rounded-lg shadow mb-6 border border-purple-100 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Schedule New Appointment</h3>
                        <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600">
                            <Plus className="w-5 h-5 rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Patient Search */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                                {!newAppt.patient_id ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or phone..."
                                                className="pl-9 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                value={patientSearch}
                                                onChange={(e) => setPatientSearch(e.target.value)}
                                            />
                                        </div>
                                        {patients.length > 0 && patientSearch && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {patients.map((p) => (
                                                    <div
                                                        key={p.patient_id}
                                                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                                                        onClick={() => {
                                                            setNewAppt({ ...newAppt, patient_id: p.patient_id });
                                                            setPatientSearch(`${p.first_name} ${p.last_name}`);
                                                            setPatients([]);
                                                        }}
                                                    >
                                                        <div className="font-medium text-gray-900">{p.first_name} {p.last_name}</div>
                                                        <div className="text-xs text-gray-500">{p.phone} • {p.patient_code}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-100 rounded-md">
                                        <span className="text-sm font-medium text-purple-700">{patientSearch}</span>
                                        <button
                                            type="button"
                                            onClick={() => { setNewAppt({ ...newAppt, patient_id: '' }); setPatientSearch(''); }}
                                            className="text-purple-400 hover:text-purple-600 text-sm font-medium"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Doctor Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                                <select
                                    className={`w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${user?.role === 'doctor' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    value={newAppt.doctor_id}
                                    onChange={(e) => setNewAppt({ ...newAppt, doctor_id: e.target.value })}
                                    required
                                    disabled={user?.role === 'doctor'}
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map(doc => (
                                        <option key={doc.user_id} value={doc.user_id}>
                                            Dr. {doc.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={newAppt.appointment_date}
                                        onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="time"
                                            required
                                            className="pl-9 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            value={newAppt.appointment_time}
                                            onChange={(e) => setNewAppt({ ...newAppt, appointment_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newAppt.appointment_type}
                                    onChange={(e) => setNewAppt({ ...newAppt, appointment_type: e.target.value })}
                                >
                                    <option value="new">New Consultation</option>
                                    <option value="follow-up">Follow-up</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    rows="2"
                                    placeholder="Brief symptoms or reason for visit..."
                                    value={newAppt.notes}
                                    onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Appointment List View */}
            {view === 'list' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {appointments.length === 0 && !loading && (
                            <li className="px-6 py-8 text-center text-gray-500 flex flex-col items-center">
                                <CalendarIcon className="w-12 h-12 text-gray-300 mb-2" />
                                No appointments scheduled for {date}.
                            </li>
                        )}
                        {appointments.map((appt) => (
                            <li key={appt.appointment_id} className="hover:bg-gray-50 transition border-l-4 border-transparent hover:border-purple-500">
                                <div className="px-4 py-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex flex-col items-center mr-4 w-16">
                                            <div className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                {appt.appointment_time.slice(0, 5)}
                                            </div>
                                            {appt.queue_number && (
                                                <div className="text-xs text-purple-600 font-bold mt-1 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                                                    Q #{appt.queue_number}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-sm font-medium text-purple-600">
                                                {appt.first_name} {appt.last_name}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                                <User className="w-3 h-3 mr-1" />
                                                {appt.patient_code} • {appt.phone}
                                            </div>
                                            {appt.notes && (
                                                <div className="text-xs text-gray-500 mt-1 italic">
                                                    "{appt.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${appt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            appt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                appt.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {appt.status}
                                        </span>

                                        <div className="flex gap-1">
                                            {appt.status === 'scheduled' && (
                                                <>
                                                    <button onClick={() => updateStatus(appt.appointment_id, 'confirmed')} className="text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50">Confirm</button>
                                                    <button onClick={() => updateStatus(appt.appointment_id, 'cancelled')} className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50">Cancel</button>
                                                </>
                                            )}
                                            {appt.status === 'confirmed' && (
                                                <button onClick={() => updateStatus(appt.appointment_id, 'in-progress')} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow-sm">Call Patient</button>
                                            )}
                                            {appt.status === 'in-progress' && (
                                                <button onClick={() => updateStatus(appt.appointment_id, 'completed')} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 shadow-sm">Complete</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Appointments;

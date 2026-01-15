import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Activity, Calendar, Users, Plus, Link as LinkIcon, Edit, Upload, FileText, Trash2, X, Eye } from 'lucide-react';

const PatientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modals State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);

    // Linking State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [relationship, setRelationship] = useState('spouse');

    // Edit State
    const [editForm, setEditForm] = useState({});

    // Upload State
    const [uploadForm, setUploadForm] = useState({ test_name: '', notes: '', file: null });

    const fetchPatientData = async () => {
        try {
            const [patientRes, reportsRes] = await Promise.all([
                api.get(`/patients/${id}`),
                api.get(`/test-reports/patient/${id}`)
            ]);
            setPatient(patientRes.data);
            setEditForm(patientRes.data);
            setReports(reportsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatientData();
    }, [id, refreshTrigger]);

    // --- Handlers ---

    const handleSearch = async (q) => {
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await api.get(`/patients/search?q=${q}`);
            setSearchResults(res.data.filter(p => p.patient_id !== id));
        } catch (err) { console.error(err); }
    };

    const handleLink = async () => {
        if (!selectedMember) return;
        try {
            await api.post('/patients/link-family', {
                patient_id: id,
                member_id: selectedMember.patient_id,
                relationship
            });
            setShowLinkModal(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) { alert('Error linking family member'); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/patients/${id}`, editForm);
            alert('Profile updated successfully');
            setShowEditModal(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) { alert('Error updating profile'); }
    };

    const handleUploadReport = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('patient_id', id);
        formData.append('test_name', uploadForm.test_name);
        formData.append('notes', uploadForm.notes);
        formData.append('file', uploadForm.file);

        try {
            await api.post('/test-reports/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Report uploaded successfully');
            setShowUploadModal(false);
            setUploadForm({ test_name: '', notes: '', file: null });
            setRefreshTrigger(prev => prev + 1);
        } catch (err) { alert('Error uploading report'); }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await api.delete(`/test-reports/${reportId}`);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) { alert('Error deleting report'); }
    };

    const handleViewVisit = async (visitId) => {
        try {
            const res = await api.get(`/visits/${visitId}`);
            setSelectedVisit(res.data);
            setShowVisitModal(true);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!patient) return <div className="p-8">Patient not found</div>;

    return (
        <div className="max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => navigate('/patients')} className="mr-4 text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">Patient Details</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Basic Info & History */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200 relative">
                        <div className="absolute top-4 right-4 flex space-x-2">
                            <button onClick={() => navigate(`/visits/new?patient_id=${patient.patient_id}`)} className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded text-sm font-medium flex items-center">
                                <Plus className="w-4 h-4 mr-1" /> Start Visit
                            </button>
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium flex items-center"
                            >
                                <Edit className="w-4 h-4 mr-1" /> Edit Profile
                            </button>
                        </div>

                        <div className="flex items-center">
                            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                                {patient.first_name[0]}
                            </div>
                            <div className="ml-4">
                                <h3 className="text-xl font-bold text-gray-900">{patient.first_name} {patient.last_name}</h3>
                                <p className="text-sm text-gray-500">{patient.patient_code}</p>
                                <div className="flex items-center mt-1 space-x-2 text-sm text-gray-600">
                                    <span className="capitalize">{patient.gender}</span>
                                    <span>•</span>
                                    <span>{new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} yrs</span>
                                    <span>•</span>
                                    <span className="font-semibold bg-red-100 text-red-800 px-2 rounded-full text-xs">{patient.blood_group || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <span>{patient.phone}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span className="truncate">{patient.city}, {patient.state}</span>
                            </div>
                        </div>
                    </div>

                    {/* Medical Profile */}
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-red-500" /> Medical Profile
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-red-50 p-3 rounded">
                                <span className="text-xs font-bold text-red-800 uppercase">Allergies</span>
                                <p className="mt-1 text-sm text-gray-900">{patient.allergies || 'None'}</p>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded">
                                <span className="text-xs font-bold text-yellow-800 uppercase">Conditions</span>
                                <p className="mt-1 text-sm text-gray-900">{patient.chronic_conditions || 'None'}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded">
                                <span className="text-xs font-bold text-blue-800 uppercase">Family History</span>
                                <p className="mt-1 text-sm text-gray-900">{patient.family_medical_history || 'None'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Visit History */}
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-blue-500" /> Visit History
                        </h4>
                        <ul className="divide-y divide-gray-200">
                            {patient.history && patient.history.length > 0 ? patient.history.map(visit => (
                                <li
                                    key={visit.visit_id}
                                    className="py-3 cursor-pointer hover:bg-gray-50 transition px-2 rounded"
                                    onClick={() => handleViewVisit(visit.visit_id)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900">{new Date(visit.visit_date).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-500 line-clamp-1">{visit.diagnosis || 'No diagnosis recorded'}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded capitalize mr-3">{visit.visit_type}</span>
                                            <Eye className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </li>
                            )) : (
                                <p className="text-gray-500 italic">No previous visits.</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Right Column: Family & Reports */}
                <div className="space-y-6">
                    {/* Test Reports */}
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-purple-500" /> Test Reports
                            </h4>
                            <button onClick={() => setShowUploadModal(true)} className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-1 rounded-full">
                                <Upload className="w-4 h-4" />
                            </button>
                        </div>
                        <ul className="space-y-3">
                            {reports.length > 0 ? reports.map(report => (
                                <li key={report.report_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="overflow-hidden">
                                        <a
                                            href={`http://localhost:5000/uploads/${report.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-blue-600 hover:underline block truncate"
                                        >
                                            {report.test_name}
                                        </a>
                                        <p className="text-xs text-gray-500">{new Date(report.report_date).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={() => handleDeleteReport(report.report_id)} className="text-gray-400 hover:text-red-600 ml-2">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            )) : (
                                <p className="text-sm text-gray-500 italic">No reports uploaded.</p>
                            )}
                        </ul>
                    </div>

                    {/* Family Members */}
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-green-500" /> Family
                            </h4>
                            <button onClick={() => setShowLinkModal(true)} className="bg-green-100 hover:bg-green-200 text-green-700 p-1 rounded-full">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <ul className="space-y-3">
                            {patient.family && patient.family.length > 0 ? patient.family.map(mem => (
                                <li key={mem.patient_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs mr-3">
                                            {mem.first_name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{mem.first_name} {mem.last_name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{mem.relationship}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate(`/patients/${mem.patient_id}`)} className="text-gray-400 hover:text-blue-600">
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </button>
                                </li>
                            )) : (
                                <p className="text-sm text-gray-500 italic">No family members linked.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Link Family Modal */}
            {/* Link Family Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-gray-100">
                        <h3 className="text-xl font-bold mb-6 text-gray-900">Link Family Member</h3>
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Database</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg z-10 custom-scrollbar">
                                    {searchResults.map(p => (
                                        <div
                                            key={p.patient_id}
                                            className={`p-3 cursor-pointer hover:bg-gray-50 text-sm border-b last:border-0 border-gray-100 transition-colors
                                                ${selectedMember?.patient_id === p.patient_id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                            onClick={() => { setSelectedMember(p); setSearchResults([]); setSearchQuery(`${p.first_name} ${p.last_name}`); }}
                                        >
                                            {p.first_name} {p.last_name} <span className="text-gray-400 ml-1">({p.phone})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedMember && (
                            <div className="mb-5 bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center text-sm text-blue-800">
                                <Users className="w-4 h-4 mr-2" />
                                <span>Selected: <strong className="font-semibold">{selectedMember.first_name} {selectedMember.last_name}</strong></span>
                            </div>
                        )}

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={relationship}
                                onChange={(e) => setRelationship(e.target.value)}
                            >
                                <option value="spouse">Spouse</option>
                                <option value="child">Child</option>
                                <option value="parent">Parent</option>
                                <option value="sibling">Sibling</option>
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLink}
                                disabled={!selectedMember}
                                className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition-all
                                    ${!selectedMember ? 'bg-blue-400 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
                            >
                                Link Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Edit Profile</h3>
                            <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500">First Name</label><input className="w-full border p-2 rounded" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
                                <div><label className="text-xs font-bold text-gray-500">Last Name</label><input className="w-full border p-2 rounded" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500">Phone</label><input className="w-full border p-2 rounded" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                                <div><label className="text-xs font-bold text-gray-500">Blood Group</label><input className="w-full border p-2 rounded" value={editForm.blood_group} onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })} /></div>
                            </div>
                            <div><label className="text-xs font-bold text-gray-500">Address</label><input className="w-full border p-2 rounded" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
                            <div><label className="text-xs font-bold text-gray-500">Allergies</label><textarea className="w-full border p-2 rounded" value={editForm.allergies} onChange={e => setEditForm({ ...editForm, allergies: e.target.value })} /></div>
                            <div><label className="text-xs font-bold text-gray-500">Chronic Conditions</label><textarea className="w-full border p-2 rounded" value={editForm.chronic_conditions} onChange={e => setEditForm({ ...editForm, chronic_conditions: e.target.value })} /></div>
                            <div><label className="text-xs font-bold text-gray-500">Family History</label><textarea className="w-full border p-2 rounded" value={editForm.family_medical_history} onChange={e => setEditForm({ ...editForm, family_medical_history: e.target.value })} /></div>
                            <div className="flex justify-end pt-4"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Report Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Upload Test Report</h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUploadReport} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
                                <input
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Blood Test, X-Ray"
                                    value={uploadForm.test_name}
                                    onChange={e => setUploadForm({ ...uploadForm, test_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                                <input
                                    required
                                    type="file"
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                                    onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    rows="3"
                                    placeholder="Add any additional notes..."
                                    value={uploadForm.notes}
                                    onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Upload Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Visit Details Modal */}
            {showVisitModal && selectedVisit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start border-b pb-4 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Visit Details</h3>
                                <p className="text-sm text-gray-500">{new Date(selectedVisit.visit.visit_date).toLocaleDateString()} • Dr. {selectedVisit.visit.doctor_name}</p>
                            </div>
                            <button onClick={() => setShowVisitModal(false)}><X className="w-6 h-6 text-gray-500" /></button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Clinical Notes</h4>
                                <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                                    <p><strong>Symptoms:</strong> {selectedVisit.visit.symptoms}</p>
                                    <p><strong>Diagnosis:</strong> {selectedVisit.visit.diagnosis}</p>
                                    <p><strong>Advice:</strong> {selectedVisit.visit.advice}</p>
                                </div>
                            </div>

                            {selectedVisit.visit.vital_signs && (
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-2">Vitals</h4>
                                    <div className="grid grid-cols-4 gap-4 bg-blue-50 p-4 rounded text-center">
                                        <div><span className="text-xs text-gray-500 block">BP</span><span className="font-bold">{selectedVisit.visit.vital_signs.bp || '-'}</span></div>
                                        <div><span className="text-xs text-gray-500 block">Pulse</span><span className="font-bold">{selectedVisit.visit.vital_signs.pulse || '-'}</span></div>
                                        <div><span className="text-xs text-gray-500 block">Temp</span><span className="font-bold">{selectedVisit.visit.vital_signs.temp || '-'}</span></div>
                                        <div><span className="text-xs text-gray-500 block">Weight</span><span className="font-bold">{selectedVisit.visit.vital_signs.weight || '-'}</span></div>
                                    </div>
                                </div>
                            )}

                            {selectedVisit.prescriptions && selectedVisit.prescriptions.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-2">Prescription</h4>
                                    <div className="border rounded overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Medicine</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Dosage</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Freq</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedVisit.prescriptions.map((script, i) => (
                                                    script.items.map((item, j) => (
                                                        <tr key={`${i}-${j}`}>
                                                            <td className="px-4 py-2 text-sm">{item.medicine_name}</td>
                                                            <td className="px-4 py-2 text-sm">{item.dosage}</td>
                                                            <td className="px-4 py-2 text-sm">{item.frequency}</td>
                                                            <td className="px-4 py-2 text-sm">{item.duration}</td>
                                                        </tr>
                                                    ))
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowVisitModal(false)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-800">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDetails;

import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

const PatientForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', phone: '', alternate_phone: '',
        date_of_birth: '', gender: 'male', blood_group: '',
        email: '', address: '', city: '', state: '', pincode: '',
        preferred_language: 'english',
        emergency_contact_name: '', emergency_contact_phone: '',
        allergies: '', chronic_conditions: '', family_medical_history: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients', formData);
            navigate('/patients');
        } catch (err) {
            alert('Error creating patient: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">New Patient Registration</h2>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
                {/* Personal Info */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name *</label>
                            <input type="text" name="first_name" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                            <input type="text" name="last_name" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input type="date" name="date_of_birth" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select name="gender" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                            <input type="text" name="blood_group" placeholder="e.g. O+" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preferred Language</label>
                            <select name="preferred_language" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange}>
                                <option value="english">English</option>
                                <option value="hindi">Hindi</option>
                                <option value="marathi">Marathi</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                            <input type="tel" name="phone" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea name="address" rows="2" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input type="text" name="city" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Medical Info */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Medical History</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Known Allergies</label>
                            <textarea name="allergies" rows="2" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" placeholder="Drug allergies, food allergies etc." onChange={handleChange}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Chronic Conditions</label>
                            <textarea name="chronic_conditions" rows="2" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" placeholder="Diabetes, Hypertension etc." onChange={handleChange}></textarea>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={() => navigate('/patients')} className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md mr-3 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center shadow-sm">
                        <Save className="w-5 h-5 mr-2" />
                        Save Patient
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PatientForm;

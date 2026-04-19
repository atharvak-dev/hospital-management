import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import api from '../api/axios';
import PasswordInput from '../components/common/PasswordInput';

const ROLES = ['doctor', 'nurse', 'receptionist', 'staff'];

const Signup = () => {
    const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', phone: '', role: 'staff' });
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/signup', form);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                        <span className="text-3xl">⏳</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Request Submitted</h2>
                    <p className="text-gray-600 text-sm mb-6">
                        Your registration is awaiting admin approval. You'll be able to log in once the admin approves your account.
                    </p>
                    <Link to="/login" className="text-blue-600 hover:underline font-medium text-sm">Back to Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                            <Stethoscope className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
                        <p className="mt-2 text-sm text-gray-600">Register to access the hospital portal</p>
                    </div>

                    {error && <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4"><p className="text-red-700 text-sm">{error}</p></div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[
                            { label: 'Full Name', name: 'full_name', type: 'text' },
                            { label: 'Username', name: 'username', type: 'text' },
                            { label: 'Email', name: 'email', type: 'email' },
                            { label: 'Phone', name: 'phone', type: 'tel' },
                        ].map(({ label, name, type }) => (
                            <div key={name}>
                                <label className="block text-sm font-medium text-gray-700">{label}</label>
                                <input
                                    type={type}
                                    name={name}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={form[name]}
                                    onChange={handleChange}
                                />
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <PasswordInput name="password" value={form.password} onChange={handleChange} required className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select
                                name="role"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={form.role}
                                onChange={handleChange}
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            Sign Up
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;

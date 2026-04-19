import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { UserCircle } from 'lucide-react';
import PasswordInput from '../components/common/PasswordInput';

const MyAccount = () => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        api.get('/auth/me').then(res => {
            setForm(f => ({ ...f, full_name: res.data.full_name || '', email: res.data.email || '', phone: res.data.phone || '' }));
        });
    }, []);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.password && form.password !== form.confirmPassword) {
            return setError('Passwords do not match.');
        }

        const payload = {
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
        };
        if (form.password) payload.password = form.password;

        setSaving(true);
        try {
            await api.put(`/auth/users/${user.user_id}`, payload);
            setSuccess('Profile updated successfully.');
            setForm(f => ({ ...f, password: '', confirmPassword: '' }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <UserCircle className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">My Account</h2>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-900">{user?.full_name}</p>
                        <p className="text-sm text-gray-500">@{user?.username}</p>
                        <span className="mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">{user?.role}</span>
                    </div>
                </div>

                {error && <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm">{error}</div>}
                {success && <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-3 text-green-700 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input name="full_name" value={form.full_name} onChange={handleChange} required className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input name="phone" value={form.phone} onChange={handleChange} className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Change Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <PasswordInput name="password" value={form.password} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60 transition-colors">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyAccount;

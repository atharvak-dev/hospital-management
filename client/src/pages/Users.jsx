import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Pencil, Trash2, User, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/common/PasswordInput';

const ROLES = ['staff', 'doctor', 'nurse', 'receptionist', 'admin', 'pharmacist'];
const EMPTY_FORM = { username: '', password: '', full_name: '', email: '', phone: '', role: 'staff' };

const getRoleColor = (role) => {
    const map = { admin: 'bg-purple-100 text-purple-800', doctor: 'bg-blue-100 text-blue-800', nurse: 'bg-green-100 text-green-800', receptionist: 'bg-yellow-100 text-yellow-800' };
    return map[role] || 'bg-gray-100 text-gray-800';
};

const getStatusBadge = (status) => {
    if (status === 'pending')  return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    if (status === 'rejected') return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
};

const Users = () => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [modal, setModal] = useState(null); // null | 'add' | 'edit'
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    const fetchUsers = async (p = 1) => {
        try {
            const res = await api.get(`/auth/users?page=${p}&limit=10`);
            if (res.data.items) {
                setUsers(res.data.items);
                setTotalPages(res.data.pagination.totalPages);
            } else {
                setUsers(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(page); }, [page]);

    const openAdd = () => { setFormData(EMPTY_FORM); setEditingId(null); setError(''); setModal('add'); };
    const openEdit = (u) => { setFormData({ username: u.username, full_name: u.full_name, email: u.email, phone: u.phone, role: u.role, password: '' }); setEditingId(u.user_id); setError(''); setModal('edit'); };
    const closeModal = () => { setModal(null); setError(''); };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (modal === 'add') {
                await api.post('/auth/register', formData);
            } else {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await api.put(`/auth/users/${editingId}`, payload);
            }
            closeModal();
            fetchUsers(page);
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleApprove = async (id, action) => {
        try {
            await api.post(`/auth/approve/${id}`, { action });
            fetchUsers(page);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update status');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/auth/users/${id}`);
            fetchUsers(page);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    if (loading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <User className="w-8 h-8 mr-3 text-blue-600" /> User Management
                </h2>
                {isAdmin && (
                    <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
                        <Plus className="w-5 h-5 mr-2" /> New User
                    </button>
                )}
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((u) => (
                            <tr key={u.user_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold flex-shrink-0">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                                            <div className="text-sm text-gray-500">@{u.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(u.role)}`}>{u.role}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{u.email}</div>
                                    <div className="text-sm text-gray-500">{u.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(u.status)}
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {u.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleApprove(u.user_id, 'approve')} className="text-green-600 hover:text-green-800 mr-3 inline-flex items-center gap-1 text-sm">
                                                    <CheckCircle className="w-4 h-4" /> Approve
                                                </button>
                                                <button onClick={() => handleApprove(u.user_id, 'reject')} className="text-red-600 hover:text-red-800 mr-3 inline-flex items-center gap-1 text-sm">
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 mr-3 inline-flex items-center gap-1 text-sm">
                                            <Pencil className="w-4 h-4" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(u.user_id, u.full_name)} disabled={u.user_id === currentUser?.user_id} className="text-red-600 hover:text-red-800 inline-flex items-center gap-1 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <p className="text-sm text-gray-700">Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100000]">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-900">{modal === 'add' ? 'Create New User' : 'Edit User'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        {error && <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input required name="full_name" value={formData.full_name} onChange={handleChange} className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input required name="username" value={formData.username} onChange={handleChange} disabled={modal === 'edit'} className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select name="role" value={formData.role} onChange={handleChange} className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" required name="email" value={formData.email} onChange={handleChange} className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}</label>
                                <PasswordInput name="password" value={formData.password} onChange={handleChange} required={modal === 'add'} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    {modal === 'add' ? 'Create User' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;

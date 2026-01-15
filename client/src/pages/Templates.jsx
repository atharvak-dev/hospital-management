import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ template_name: '', template_type: 'advice', content: '', is_global: false });
    const [isCreating, setIsCreating] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTemplates(page);
    }, [page]);

    const fetchTemplates = async (p = 1) => {
        try {
            const res = await api.get(`/master/templates?page=${p}&limit=10`);
            if (res.data.items) {
                setTemplates(res.data.items);
                setTotalPages(res.data.pagination.totalPages);
            } else {
                setTemplates(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (tmpl) => {
        setEditingId(tmpl.template_id);
        setFormData({ ...tmpl });
        setIsCreating(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/master/templates/${id}`);
            fetchTemplates();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            if (isCreating) {
                await api.post('/master/templates', formData);
            } else {
                await api.put(`/master/templates/${editingId}`, formData);
            }
            fetchTemplates();
            resetForm();
        } catch (err) {
            console.error(err);
            alert('Error saving template');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({ template_name: '', template_type: 'advice', content: '', is_global: false });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
                <button
                    onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ template_name: '', template_type: 'advice', content: '', is_global: false }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> Create Template
                </button>
            </div>

            {(isCreating || editingId) && (
                <div className="bg-white p-4 rounded shadow border mb-6">
                    <h3 className="font-bold mb-4">{isCreating ? 'New Template' : 'Edit Template'}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder="Template Name"
                            className="border p-2 rounded"
                            value={formData.template_name}
                            onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                        />
                        <select
                            className="border p-2 rounded"
                            value={formData.template_type}
                            onChange={e => setFormData({ ...formData, template_type: e.target.value })}
                        >
                            <option value="advice">Advice</option>
                            <option value="pre-operation">Pre-Operation</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Content"
                        className="w-full border p-2 rounded mb-4"
                        rows="4"
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center">
                            <Save className="w-4 h-4 mr-2" /> Save
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Preview</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map(t => (
                            <tr key={t.template_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.template_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{t.template_type}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{t.content}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(t.template_id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination Controls */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded shadow">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
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
                                onClick={() => setPage(p => Math.max(1, p - 1))}
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
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
    );
};

export default Templates;

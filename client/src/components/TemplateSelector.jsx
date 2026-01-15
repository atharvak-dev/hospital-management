import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const TemplateSelector = ({ type, onSelect, label }) => {
    const [templates, setTemplates] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/master/templates');
            // Filter client-side for now, or backend could support ?type= query
            const filtered = res.data.filter(t => t.template_type === type);
            setTemplates(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTemplate.name || !newTemplate.content) return;
        try {
            const res = await api.post('/master/templates', {
                template_name: newTemplate.name,
                template_type: type,
                content: newTemplate.content,
                language: 'en', // Default
                is_global: false
            });
            setTemplates([...templates, res.data]);
            setShowCreate(false);
            setNewTemplate({ name: '', content: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to create template');
        }
    };

    return (
        <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                    {isOpen ? 'Hide Templates' : 'Use Template'}
                    {isOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </button>
            </div>

            {isOpen && (
                <div className="bg-gray-50 border rounded-md p-2 mb-2">
                    {loading ? <div className="text-xs text-gray-500">Loading...</div> : (
                        <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {templates.map(t => (
                                    <button
                                        key={t.template_id}
                                        onClick={() => { onSelect(t.content); setIsOpen(false); }}
                                        className="bg-white border hover:bg-blue-50 text-xs px-2 py-1 rounded text-gray-700 transition"
                                    >
                                        {t.template_name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowCreate(!showCreate)}
                                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-200 flex items-center"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> New
                                </button>
                            </div>

                            {showCreate && (
                                <div className="bg-white p-2 border rounded shadow-sm mt-2">
                                    <input
                                        placeholder="Template Name"
                                        className="w-full text-xs border p-1 rounded mb-1"
                                        value={newTemplate.name}
                                        onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Template Content"
                                        className="w-full text-xs border p-1 rounded mb-1"
                                        rows="2"
                                        value={newTemplate.content}
                                        onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowCreate(false)} className="text-xs text-gray-500">Cancel</button>
                                        <button onClick={handleCreate} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TemplateSelector;

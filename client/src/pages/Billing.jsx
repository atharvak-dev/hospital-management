import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, Plus, Receipt, FileText, CheckCircle, Download } from 'lucide-react';
// For simplicity, billing creation will be minimal or linked from visits, 
// but here we just list invoices and allow basic creation. 

const Billing = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'new'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // State for new invoice form (simplified for this instruction)
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [patients, setPatients] = useState([]); // Placeholder for patient search results
    const [invoiceItems, setInvoiceItems] = useState([
        { type: 'consultation', description: 'General Consultation', quantity: 1, unit_price: 500 }
    ]);
    // Placeholder for newInvoice object structure, as referenced in handleCreateInvoice
    const [newInvoice, setNewInvoice] = useState({
        discount: 0,
        tax: 0,
        payment_method: 'cash'
    });

    const fetchInvoices = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/billing?page=${p}&limit=10`);
            if (res.data.items) {
                setInvoices(res.data.items);
                setTotalPages(res.data.pagination.totalPages);
            } else {
                setInvoices(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(page);
    }, [page]);

    // Placeholder for item manipulation functions
    const addItem = () => {
        setInvoiceItems([...invoiceItems, { type: 'service', description: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (indexToRemove) => {
        setInvoiceItems(invoiceItems.filter((_, index) => index !== indexToRemove));
    };

    const updateItem = (index, field, value) => {
        const updatedItems = invoiceItems.map((item, idx) =>
            idx === index ? { ...item, [field]: value } : item
        );
        setInvoiceItems(updatedItems);
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        console.log('Creating invoice...', newInvoice);
        if (!selectedPatient) {
            alert('Please select a patient.');
            return;
        }
        if (invoiceItems.length === 0 || invoiceItems.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
            alert('Please add valid invoice items.');
            return;
        }

        try {
            const payload = {
                patient_id: selectedPatient.patient_id,
                items: invoiceItems,
                discount: parseFloat(newInvoice.discount) || 0,
                tax: parseFloat(newInvoice.tax) || 0,
                payment_method: newInvoice.payment_method,
                payment_status: 'pending' // Default to pending
            };

            await api.post('/billing', payload);
            alert('Draft Invoice Created');
            setView('list');
            fetchInvoices();
            // Reset form...
            setInvoiceItems([{ type: 'consultation', description: 'General Consultation', quantity: 1, unit_price: 500 }]);
            setSelectedPatient(null);
            setPatientSearch('');
            setNewInvoice({ discount: 0, tax: 0, payment_method: 'cash' });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error creating invoice');
        }
    };

    const handleFinalize = async (id) => {
        if (!window.confirm("Are you sure? Finalizing locks the invoice and generates a permanent Invoice Number.")) return;
        try {
            const res = await api.post(`/billing/${id}/finalize`);
            alert(`Invoice Finalized: ${res.data.invoice_number}`);
            fetchInvoices();

            // Auto-download PDF from base64
            if (res.data.pdf?.base64) {
                downloadBase64PDF(res.data.pdf.base64, res.data.pdf.filename);
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error finalizing invoice');
        }
    };

    const downloadBase64PDF = (base64, filename) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const handleDownloadPDF = async (id, invoiceNumber) => {
        try {
            const res = await api.get(`/billing/${id}/pdf`);
            if (res.data.pdf?.base64) {
                downloadBase64PDF(res.data.pdf.base64, res.data.pdf.filename || `${invoiceNumber}.pdf`);
            } else {
                throw new Error('No PDF data received');
            }
        } catch (err) {
            console.error(err);
            alert('Error downloading PDF');
        }
    };

    const handleMarkPaid = async (id) => {
        if (!window.confirm("Mark this invoice as PAID?")) return;
        try {
            await api.patch(`/billing/${id}/payment-status`, { payment_status: 'paid' });
            fetchInvoices(page);
        } catch (err) {
            console.error(err);
            alert('Error updating payment status');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-green-600" /> Billing & Invoices
                </h2>
                <button
                    onClick={() => setView('new')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-1" />
                    New Invoice
                </button>
            </div>

            {/* View: New Invoice Form (kept largely same, just updated handler) */}
            {view === 'new' && (
                <div className="bg-white p-6 rounded-lg shadow mb-6 border border-green-200">
                    <h3 className="text-lg font-semibold mb-4">Create Draft Invoice</h3>
                    {/* ... (Patient Search & Items Form inputs - Existing code reuse) ... */}
                    <form onSubmit={handleCreateInvoice}>
                        {/* ... Reusing existing form logic inputs ... */}
                        {/* Shortened for brevity in tool call, implementation should keep inputs */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Patient</label>
                                <input
                                    type="text"
                                    placeholder="Type name..."
                                    className="w-full border rounded p-2"
                                    value={patientSearch}
                                    onChange={async (e) => {
                                        const query = e.target.value;
                                        setPatientSearch(query);
                                        console.log('Searching for:', query); // Force HMR Update 123
                                        if (query.length > 1) {
                                            try {
                                                const res = await api.get(`/patients/search?q=${query}`);
                                                setPatients(res.data);
                                            } catch (err) {
                                                console.error("Error fetching patients", err);
                                            }
                                        } else {
                                            setPatients([]);
                                        }
                                    }}
                                />
                                {/* Dropdown logic ... */}
                                {patients.length > 0 && patientSearch && !selectedPatient && (
                                    <div className="absolute bg-white border mt-1 w-64 shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {patients.map(p => (
                                            <div key={p.patient_id} className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                onClick={() => { setSelectedPatient(p); setPatientSearch(`${p.first_name} ${p.last_name}`); setPatients([]); }}>
                                                {p.first_name} {p.last_name} ({p.phone})
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedPatient && (
                                    <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded text-sm flex justify-between items-center">
                                        <span>Selected: {selectedPatient.first_name} {selectedPatient.last_name}</span>
                                        <button type="button" onClick={() => setSelectedPatient(null)} className="text-blue-600 hover:text-blue-900 font-bold">x</button>
                                    </div>
                                )}
                            </div>
                            {/* Add other newInvoice fields here if needed, e.g., discount, tax, payment_method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-2"
                                    value={newInvoice.discount}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, discount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax (%)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-2"
                                    value={newInvoice.tax}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, tax: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={newInvoice.payment_method}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, payment_method: e.target.value })}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                </select>
                            </div>
                        </div>

                        {/* Invoice Items Table */}
                        <div className="mb-4">
                            <h4 className="font-medium mb-2">Items</h4>
                            <table className="w-full border-collapse border">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-xs uppercase">
                                        <th className="border p-2">Description</th>
                                        <th className="border p-2 w-20">Qty</th>
                                        <th className="border p-2 w-32">Price</th>
                                        <th className="border p-2 w-32">Total</th>
                                        <th className="border p-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2">
                                                <input type="text" className="w-full text-sm outline-none" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                                            </td>
                                            <td className="border p-2">
                                                <input type="number" className="w-full text-sm outline-none" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))} />
                                            </td>
                                            <td className="border p-2">
                                                <input type="number" className="w-full text-sm outline-none" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))} />
                                            </td>
                                            <td className="border p-2 text-right">₹{item.quantity * item.unit_price}</td>
                                            <td className="border p-2 text-center text-red-500 cursor-pointer" onClick={() => removeItem(index)}>x</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600">+ Add Item</button>
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                            <button type="button" onClick={() => setView('list')} className="px-4 py-2 border rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded shadow-sm">Save Draft</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Invoice List */}
            {view === 'list' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6 border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {invoices.length === 0 && !loading && <li className="px-6 py-8 text-center text-gray-500">No invoices found.</li>}
                        {loading && <li className="px-6 py-8 text-center text-gray-500">Loading invoices...</li>}
                        {invoices.map((inv) => (
                            <li key={inv.invoice_id} className="hover:bg-gray-50 transition">
                                <div className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center">
                                            <span className={`text-sm font-bold mr-3 ${inv.status === 'draft' ? 'text-gray-500 bg-gray-100 px-2 rounded' : 'text-blue-600'}`}>
                                                {inv.invoice_number || 'DRAFT'}
                                            </span>
                                            {inv.status === 'draft' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200 uppercase tracking-wide">Draft</span>}
                                            {inv.status === 'finalized' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wide">Final</span>}
                                        </div>
                                        <div className="text-sm text-gray-900 font-medium mt-1">{inv.first_name} {inv.last_name}</div>
                                        <div className="text-xs text-gray-500">{new Date(inv.invoice_date).toLocaleDateString()} • {inv.items_count || 1} items</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-4">
                                            <div className="text-lg font-bold text-gray-900">₹{inv.total_amount}</div>
                                            <div className={`text-xs capitalize ${inv.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>{inv.payment_status}</div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {inv.payment_status !== 'paid' && (
                                                <button
                                                    onClick={() => handleMarkPaid(inv.invoice_id)}
                                                    className="text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-xs font-semibold shadow-sm flex items-center"
                                                    title="Mark as Paid"
                                                >
                                                    <CreditCard className="w-3 h-3 mr-1" /> Pay
                                                </button>
                                            )}
                                            {inv.status === 'draft' ? (
                                                <button
                                                    onClick={() => handleFinalize(inv.invoice_id)}
                                                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-semibold shadow-sm flex items-center"
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Finalize
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDownloadPDF(inv.invoice_id, inv.invoice_number)}
                                                    className="text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded text-xs font-semibold flex items-center"
                                                >
                                                    <Download className="w-3 h-3 mr-1" /> PDF
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {/* Pagination Controls */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
            )}
        </div>
    );
};

export default Billing;

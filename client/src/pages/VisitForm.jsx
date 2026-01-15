import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Printer, Trash2, Share2 } from 'lucide-react';
import TemplateSelector from '../components/TemplateSelector';
import PrintSettingsModal from '../components/PrintSettingsModal';

const VisitForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patient_id = searchParams.get('patient_id');

    const [patient, setPatient] = useState(null);
    const [formData, setFormData] = useState({
        visit_type: 'consultation', symptoms: '', diagnosis: '', advice: '', pre_op_instructions: '',
        follow_up_date: '', follow_up_instructions: '',
        vital_signs: { bp: '', pulse: '', temp: '', weight: '' },
        tests: []
    });

    // Prescription State
    const [prescriptionItems, setPrescriptionItems] = useState([]);
    const [medicineOptions, setMedicineOptions] = useState([]);
    const [loadingMeds, setLoadingMeds] = useState(false);

    // Test Input State
    const [testInput, setTestInput] = useState('');

    const [activeTab, setActiveTab] = useState('clinical');
    const [savedVisitId, setSavedVisitId] = useState(null);

    // Output Modal State
    const [showPrintModal, setShowPrintModal] = useState(false);

    useEffect(() => {
        if (patient_id) {
            api.get(`/patients/${patient_id}`)
                .then(res => setPatient(res.data))
                .catch(err => console.error("Patient fetch error", err));
        }
    }, [patient_id]);

    // Medicine Search Logic
    const searchMedicines = async (query) => {
        if (!query) {
            setMedicineOptions([]);
            return;
        }
        setLoadingMeds(true);
        try {
            const res = await api.get(`/master/medicines/search?q=${query}`);
            setMedicineOptions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMeds(false);
        }
    };

    const handleVitalChange = (e) => {
        setFormData({
            ...formData,
            vital_signs: { ...formData.vital_signs, [e.target.name]: e.target.value }
        });
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Test Handlers
    const addTest = () => {
        if (testInput.trim()) {
            setFormData(prev => ({ ...prev, tests: [...prev.tests, { name: testInput, is_urgent: false }] }));
            setTestInput('');
        }
    };

    const removeTest = (idx) => {
        setFormData(prev => ({ ...prev, tests: prev.tests.filter((_, i) => i !== idx) }));
    };

    const [idempotencyKey] = useState(() => crypto.randomUUID());

    const saveVisit = async () => {
        try {
            const data = { ...formData, patient_id };
            const res = await api.post('/visits', data, {
                headers: { 'Idempotency-Key': idempotencyKey }
            });
            setSavedVisitId(res.data.visit_id);
            alert('Visit details saved successfully.');
        } catch (err) {
            if (err.response && err.response.status === 409) {
                alert('Visit already saved (duplicate detected).');
            } else {
                alert('Error saving visit');
                console.error(err);
            }
        }
    };

    // Prescription Handlers
    const addPrescriptionItem = () => {
        setPrescriptionItems([...prescriptionItems, { medicine_name: '', dosage: '1-0-1', duration: '3 days', timing: 'After Food', special_instructions: '', reminders: '' }]);
    };

    const updatePrescriptionItem = (index, field, value) => {
        const newItems = [...prescriptionItems];
        newItems[index][field] = value;
        setPrescriptionItems(newItems);

        if (field === 'medicine_name') {
            searchMedicines(value);
        }
    };

    const removePrescriptionItem = (index) => {
        setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    };

    const selectMedicine = (index, med) => {
        const newItems = [...prescriptionItems];
        newItems[index].medicine_name = med.medicine_name;
        newItems[index].medicine_id = med.medicine_id;
        newItems[index].dosage = med.default_dosage || newItems[index].dosage;
        newItems[index].frequency = med.default_frequency || newItems[index].frequency;
        newItems[index].duration = med.default_duration || newItems[index].duration;
        newItems[index].special_instructions = med.instructions || '';
        setPrescriptionItems(newItems);
        setMedicineOptions([]);
    };

    const savePrescription = async () => {
        if (!savedVisitId) return alert('Please save visit details first');
        try {
            const validItems = prescriptionItems.filter(i => i.medicine_name);
            await api.post('/prescriptions', { visit_id: savedVisitId, items: validItems });
            alert('Prescription saved!');
        } catch (err) {
            alert('Error saving prescription');
        }
    };

    // Output Handlers
    const handlePrintClick = () => {
        if (!savedVisitId) return alert('Please save visit first.');
        setShowPrintModal(true);
    };

    const handlePrintExecute = (settings) => {
        const params = new URLSearchParams();
        Object.keys(settings).forEach(key => {
            if (key.startsWith('show')) params.append(key, settings[key]);
        });
        params.append('lang', settings.language);

        window.open(`/print/visit/${savedVisitId}?${params.toString()}`, '_blank');
        setShowPrintModal(false);
    };

    const handleWhatsAppExecute = (settings) => {
        if (!patient || !patient.mobile_number) return alert('Patient mobile number invalid');

        const lang = settings.language;
        api.post('/share/whatsapp-text', { visit_id: savedVisitId, lang, settings })
            .then(res => {
                const link = `https://wa.me/${patient.mobile_number}?text=${encodeURIComponent(res.data.text)}`;
                window.open(link, '_blank');
                setShowPrintModal(false);
            })
            .catch(err => {
                console.error(err);
                alert('Error generating message');
            });
    };

    if (!patient) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">New Visit</h2>
                        <p className="text-sm text-blue-600 font-semibold">{patient.first_name} {patient.last_name} ({patient.patient_code})</p>
                    </div>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg space-x-1">
                    <button onClick={() => setActiveTab('clinical')} className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'clinical' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Clinical</button>
                    <button onClick={() => setActiveTab('prescription')} className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'prescription' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Prescription</button>
                </div>
            </div>

            <div className="flex gap-6">
                <div className="flex-1 space-y-6">
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        {activeTab === 'clinical' ? (
                            <div className="space-y-6">
                                {/* Vitals */}
                                <div className="grid grid-cols-4 gap-4 bg-blue-50 p-4 rounded-md">
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">BP</label><input type="text" name="bp" placeholder="120/80" className="w-full mt-1 p-1 border rounded" value={formData.vital_signs.bp} onChange={handleVitalChange} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Pulse</label><input type="text" name="pulse" placeholder="72" className="w-full mt-1 p-1 border rounded" value={formData.vital_signs.pulse} onChange={handleVitalChange} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Temp</label><input type="text" name="temp" placeholder="98.6" className="w-full mt-1 p-1 border rounded" value={formData.vital_signs.temp} onChange={handleVitalChange} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Weight</label><input type="text" name="weight" placeholder="kg" className="w-full mt-1 p-1 border rounded" value={formData.vital_signs.weight} onChange={handleVitalChange} /></div>
                                </div>

                                {/* Clinical Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                                        <textarea name="symptoms" rows="3" className="mt-1 block w-full border border-gray-300 rounded-md p-2" onChange={handleChange} value={formData.symptoms}></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                                        <textarea name="diagnosis" rows="3" className="mt-1 block w-full border border-gray-300 rounded-md p-2" onChange={handleChange} value={formData.diagnosis}></textarea>
                                    </div>
                                </div>

                                {/* Tests */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Recommended Tests</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            className="flex-1 border rounded p-2"
                                            placeholder="e.g. CBC, X-Ray Chest"
                                            value={testInput}
                                            onChange={e => setTestInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addTest()}
                                        />
                                        <button onClick={addTest} className="bg-gray-200 px-4 rounded hover:bg-gray-300">+</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tests.map((t, i) => (
                                            <span key={i} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm flex items-center">
                                                {t.name}
                                                <button onClick={() => removeTest(i)} className="ml-2 text-purple-600 hover:text-purple-900">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Advice Section */}
                                <div>
                                    <TemplateSelector
                                        label="Advice / Instructions"
                                        type="advice"
                                        onSelect={(content) => setFormData(prev => ({ ...prev, advice: (prev.advice ? prev.advice + '\n' : '') + content }))}
                                    />
                                    <textarea name="advice" rows="3" className="mt-1 block w-full border border-gray-300 rounded-md p-2" onChange={handleChange} value={formData.advice}></textarea>
                                </div>

                                {/* Pre-Operation Details Section */}
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-2">Pre-Operation Details</h3>
                                    <TemplateSelector
                                        label="Pre-Op Instructions"
                                        type="pre-operation"
                                        onSelect={(content) => setFormData(prev => ({ ...prev, pre_op_instructions: (prev.pre_op_instructions ? prev.pre_op_instructions + '\n' : '') + content }))}
                                    />
                                    <textarea
                                        name="pre_op_instructions"
                                        placeholder="Enter specific pre-op instructions..."
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        onChange={handleChange}
                                        value={formData.pre_op_instructions || ''}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                                        <input type="date" name="follow_up_date" className="mt-1 block w-full border border-gray-300 rounded-md p-2" onChange={handleChange} value={formData.follow_up_date} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {!savedVisitId && <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm">Please save clinical details first before adding prescription.</div>}
                                {prescriptionItems.map((item, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded border space-y-2">
                                        <div className="flex gap-2 items-start">
                                            <div className="flex-1 relative">
                                                <input
                                                    placeholder="Medicine Search..."
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={item.medicine_name}
                                                    onChange={(e) => updatePrescriptionItem(index, 'medicine_name', e.target.value)}
                                                />
                                                {medicineOptions.length > 0 && item.medicine_name && medicineOptions[0].medicine_name.toLowerCase().includes(item.medicine_name.toLowerCase()) && (
                                                    <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto shadow-lg rounded-md mt-1">
                                                        {medicineOptions.map(med => (
                                                            <li
                                                                key={med.medicine_id}
                                                                className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                                onClick={() => selectMedicine(index, med)}
                                                            >
                                                                {med.medicine_name} <span className="text-gray-400 text-xs">({med.strength})</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="w-24"><input placeholder="Dose" className="w-full p-2 border rounded text-sm" value={item.dosage} onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)} /></div>
                                            <div className="w-28"><input placeholder="Freq" className="w-full p-2 border rounded text-sm" value={item.frequency} onChange={(e) => updatePrescriptionItem(index, 'frequency', e.target.value)} /></div>
                                            <div className="w-24"><input placeholder="Dur" className="w-full p-2 border rounded text-sm" value={item.duration} onChange={(e) => updatePrescriptionItem(index, 'duration', e.target.value)} /></div>
                                            <button onClick={() => removePrescriptionItem(index)} className="text-red-500 hover:bg-red-50 p-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <input placeholder="Timing (e.g. After Food)" className="w-full p-2 border rounded text-sm bg-white" value={item.timing} onChange={(e) => updatePrescriptionItem(index, 'timing', e.target.value)} />
                                            </div>
                                            <div className="flex-1">
                                                <input placeholder="Instructions (e.g. With warm water)" className="w-full p-2 border rounded text-sm bg-white" value={item.special_instructions || ''} onChange={(e) => updatePrescriptionItem(index, 'special_instructions', e.target.value)} />
                                            </div>
                                            <div className="flex-1">
                                                <input placeholder="Reminders (e.g. 8 AM, 8 PM)" className="w-full p-2 border rounded text-sm bg-white" value={item.reminders || ''} onChange={(e) => updatePrescriptionItem(index, 'reminders', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={addPrescriptionItem} className="text-blue-600 font-semibold text-sm flex items-center hover:bg-blue-50 p-2 rounded"><Plus className="w-4 h-4 mr-2" /> Add Medicine</button>
                                <div className="flex justify-end pt-4"><button onClick={savePrescription} disabled={!savedVisitId} className={`px-4 py-2 rounded text-white ${!savedVisitId ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>Save Prescription</button></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="w-64 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-3">Actions</h3>
                        <button onClick={saveVisit} className="w-full bg-blue-600 text-white py-2 rounded mb-3 hover:bg-blue-700 flex items-center justify-center">
                            <Save className="w-4 h-4 mr-2" /> {savedVisitId ? 'Update Visit' : 'Save Visit'}
                        </button>
                        <button onClick={handlePrintClick} disabled={!savedVisitId} className={`w-full border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 flex items-center justify-center ${!savedVisitId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Share2 className="w-4 h-4 mr-2" /> Output Options
                        </button>
                    </div>
                </div>
            </div>

            <PrintSettingsModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                onPrint={handlePrintExecute}
                onWhatsApp={handleWhatsAppExecute}
            />
        </div>
    );
};

export default VisitForm;

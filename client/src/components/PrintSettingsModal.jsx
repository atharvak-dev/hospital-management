import React, { useState } from 'react';
import { X, Printer, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrintSettingsModal = ({ isOpen, onClose, onPrint, onWhatsApp, initialSettings }) => {
    const { t, i18n } = useTranslation();
    const [settings, setSettings] = useState(initialSettings || {
        showDiagnosis: true,
        showNotes: true,
        showVitals: true,
        showRx: true,
        showTests: true,
        showAdvice: true,
        showPreOp: true,
        showFollowUp: true,
        language: 'en'
    });

    if (!isOpen) return null;

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLanguageChange = (lang) => {
        setSettings(prev => ({ ...prev, language: lang }));
    };

    const handlePrintAction = () => {
        onPrint(settings);
    };

    const handleShareAction = () => {
        onWhatsApp(settings);
    };

    // Edge case handling: Show preview in selected language
    // This ensures the user sees that the language selection works even if the UI remains in App Language.
    const tPreview = i18n.getFixedT(settings.language);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Output Options</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                {/* Language Selector */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Output Language</label>
                    <div className="flex gap-2">
                        {['en', 'hi', 'mr'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className={`px-3 py-1 text-sm border rounded ${settings.language === lang ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}
                            >
                                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Live Preview Snippet (Edge Case Fix) */}
                <div className="bg-gray-50 border border-gray-200 p-3 rounded mb-4 text-xs">
                    <p className="font-bold text-gray-500 mb-1">Output Preview:</p>
                    <div className="text-gray-800">
                        <span className="font-semibold">{tPreview('print.header')}</span>
                        <br />
                        <span>{tPreview('print.patient_name')}: John Doe</span>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2 mb-6">
                    <p className="text-sm font-semibold text-gray-500 mb-2">Include Sections:</p>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={settings.showVitals} onChange={() => handleToggle('showVitals')} />
                        <span className="text-sm">Vitals (BP, Pulse etc.)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={settings.showDiagnosis} onChange={() => handleToggle('showDiagnosis')} />
                        <span className="text-sm">Diagnosis & Symptoms</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={settings.showRx} onChange={() => handleToggle('showRx')} />
                        <span className="text-sm">Prescription (Rx)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={settings.showTests} onChange={() => handleToggle('showTests')} />
                        <span className="text-sm">Recommended Tests</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={settings.showAdvice} onChange={() => handleToggle('showAdvice')} />
                        <span className="text-sm">Advice</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={settings.showPreOp} onChange={() => handleToggle('showPreOp')} />
                        <span className="text-sm">Pre-Op Instructions</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={handlePrintAction} className="flex-1 bg-blue-600 text-white py-2 rounded flex items-center justify-center hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" /> Print PDF
                    </button>
                    <button onClick={handleShareAction} className="flex-1 bg-green-600 text-white py-2 rounded flex items-center justify-center hover:bg-green-700">
                        <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintSettingsModal;

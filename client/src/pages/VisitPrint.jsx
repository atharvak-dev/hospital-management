import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

const VisitPrint = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);

    // Parse visibility settings (default true if not provided, or check strict 'false')
    // Actually URLSearchParams returns strings. 'true'/'false'.
    // If param is missing, we assume true? No, the modal sends what is checked.
    // Let's rely on what is passed. If not passed, we assume true for backward compatibility?
    // Modal sends ALL 'showX' keys.
    const getShowString = (key) => searchParams.get(key);
    const showVitals = getShowString('showVitals') !== 'false';
    const showDiagnosis = getShowString('showDiagnosis') !== 'false';
    const showRx = getShowString('showRx') !== 'false';
    const showTests = getShowString('showTests') !== 'false';
    const showAdvice = getShowString('showAdvice') !== 'false';
    const showPreOp = getShowString('showPreOp') !== 'false';
    const showFollowUp = getShowString('showFollowUp') !== 'false';

    const lang = searchParams.get('lang') || 'en';

    useEffect(() => {
        if (lang) {
            i18n.changeLanguage(lang);
        }
        api.get(`/visits/${id}`)
            .then(res => {
                setData(res.data);
                // Auto-print after a short delay
                setTimeout(() => window.print(), 1000);
            })
            .catch(console.error);
    }, [id, lang, i18n]);

    if (!data) return <div className="p-10">Loading...</div>;

    const { visit, prescriptions, tests } = data;

    return (
        <div className="bg-white min-h-screen p-8 max-w-4xl mx-auto print:p-0">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">City Hospital</h1>
                    <p className="text-gray-600">123 Health Avenue, Medical City, ST 12345</p>
                    <p className="text-gray-600">Phone: (555) 123-4567 | Email: contact@cityhospital.com</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{t('print.header')}</h2>
                    <p className="text-sm"><b>{t('print.visit_no')}:</b> {visit.visit_number}</p>
                    <p className="text-sm"><b>{t('print.date')}:</b> {new Date(visit.visit_date).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded print:bg-transparent print:p-0 print:border">
                <div>
                    <p><span className="font-bold">{t('print.patient_name')}:</span> {visit.first_name} {visit.last_name}</p>
                    <p><span className="font-bold">{t('print.patient_id')}:</span> {visit.patient_code}</p>
                    <p><span className="font-bold">{t('print.age_gender')}:</span> {new Date().getFullYear() - new Date(visit.date_of_birth).getFullYear()} yrs / {visit.gender}</p>
                </div>
                <div className="text-right print:text-left">
                    <p><span className="font-bold">{t('print.doctor')}:</span> Dr. {visit.doctor_name || 'N/A'}</p>
                </div>
            </div>

            {/* Vitals */}
            {showVitals && visit.vital_signs && (
                <div className="mb-6">
                    <h3 className="font-bold border-b border-gray-300 mb-2">{t('print.vitals')}</h3>
                    <div className="flex space-x-8">
                        {visit.vital_signs.bp && <span><b>{t('print.bp')}:</b> {visit.vital_signs.bp}</span>}
                        {visit.vital_signs.pulse && <span><b>{t('print.pulse')}:</b> {visit.vital_signs.pulse}</span>}
                        {visit.vital_signs.temp && <span><b>{t('print.temp')}:</b> {visit.vital_signs.temp}</span>}
                        {visit.vital_signs.weight && <span><b>{t('print.weight')}:</b> {visit.vital_signs.weight}</span>}
                    </div>
                </div>
            )}

            {/* Clinical Notes (Symptoms & Diagnosis) */}
            {showDiagnosis && (
                <div className="grid grid-cols-1 gap-6 mb-6">
                    <div>
                        <h3 className="font-bold border-b border-gray-300 mb-2">{t('print.symptoms_diagnosis')}</h3>
                        <p className="mb-1"><b>{t('print.symptoms')}:</b> {visit.symptoms || 'NiL'}</p>
                        <p><b>{t('print.diagnosis')}:</b> {visit.diagnosis || 'Pending'}</p>
                    </div>
                </div>
            )}

            {/* Rx */}
            {showRx && prescriptions && prescriptions.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold border-b border-gray-300 mb-2">{t('print.rx')}</h3>
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="py-2">{t('print.medicine')}</th>
                                <th className="py-2">{t('print.dosage')}</th>
                                <th className="py-2">{t('print.frequency')}</th>
                                <th className="py-2">{t('print.duration')}</th>
                                <th className="py-2">{t('print.instruction')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.map((item, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="py-2 font-medium">{item.medicine_name}</td>
                                    <td className="py-2">{item.dosage}</td>
                                    <td className="py-2">{item.frequency}</td>
                                    <td className="py-2">{item.duration}</td>
                                    <td className="py-2">
                                        {item.timing && <div>{item.timing}</div>}
                                        {item.special_instructions && <div className="text-gray-600 text-xs">{item.special_instructions}</div>}
                                        {item.reminders && <div className="text-gray-500 text-xs italic">Reminders: {item.reminders}</div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tests */}
            {showTests && tests && tests.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold border-b border-gray-300 mb-2">{t('print.tests')}</h3>
                    <ul className="list-disc list-inside">
                        {tests.map((t, i) => (
                            <li key={i}>{t.test_name} {t.is_urgent ? '(URGENT)' : ''}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Advice */}
            {showAdvice && (
                <div className="mb-6">
                    <h3 className="font-bold border-b border-gray-300 mb-2">{t('print.advice')}</h3>
                    <p className="whitespace-pre-line">{visit.advice || 'No specific advice.'}</p>
                </div>
            )}

            {/* Pre-Op Instructions */}
            {showPreOp && visit.pre_op_instructions && (
                <div className="mb-12">
                    <h3 className="font-bold border-b border-gray-300 mb-2">{t('print.pre_op')}</h3>
                    <p className="whitespace-pre-line">{visit.pre_op_instructions}</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-20 flex justify-between items-top">
                <div className="text-sm">
                    {showFollowUp && visit.follow_up_date && <p><b>{t('print.follow_up')}:</b> {new Date(visit.follow_up_date).toLocaleDateString()}</p>}
                </div>
                <div className="text-center">
                    <div className="h-16 mb-2"></div> {/* Space for sign */}
                    <p className="font-bold border-t px-8 pt-1">Dr. {visit.doctor_name || 'Signature'}</p>
                </div>
            </div>
        </div>
    );
};

export default VisitPrint;

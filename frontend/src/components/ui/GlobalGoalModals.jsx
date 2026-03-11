import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import DatePickerElite from './DatePickerElite';

export default function GlobalGoalModals() {
    const { t, language } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [formData, setFormData] = useState({ name: '', target_amount: '', current_amount: '', deadline: '' });

    const [progressModal, setProgressModal] = useState(null);

    useEffect(() => {
        const handleOpenEdit = (e) => {
            const goal = e.detail;
            setEditingGoal(goal);
            setFormData({
                name: goal.name,
                target_amount: goal.target_amount,
                current_amount: goal.current_amount || '',
                deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
            });
            setShowModal(true);
        };

        const handleOpenProgress = (e) => {
            const goal = e.detail;
            setProgressModal({ goal, value: goal.current_amount || 0 });
        };

        window.addEventListener('open-edit-goal', handleOpenEdit);
        window.addEventListener('open-progress-goal', handleOpenProgress);

        return () => {
            window.removeEventListener('open-edit-goal', handleOpenEdit);
            window.removeEventListener('open-progress-goal', handleOpenProgress);
        };
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') {
                setShowModal(false);
                setProgressModal(null);
                setEditingGoal(null);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const triggerRefresh = () => {
        window.dispatchEvent(new CustomEvent('refresh-data'));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                target_amount: Number(formData.target_amount),
                current_amount: Number(formData.current_amount || 0),
            };
            if (editingGoal) {
                await api.put(`/goals/${editingGoal.id}`, payload);
                toast.success(t('goal_updated'));
            } else {
                await api.post('/goals', payload);
                toast.success(t('goal_created'));
            }
            setShowModal(false);
            setEditingGoal(null);
            setFormData({ name: '', target_amount: '', current_amount: '', deadline: '' });
            triggerRefresh();
        } catch (error) {
            toast.error(t('goal_save_error'));
        }
    };

    const handleUpdateProgress = async () => {
        if (!progressModal) return;
        const newAmount = Number(progressModal.value);
        if (isNaN(newAmount) || newAmount < 0) {
            toast.error(t('invalid_amount'));
            return;
        }
        try {
            await api.put(`/goals/${progressModal.goal.id}`, { current_amount: newAmount });
            toast.success(t('progress_updated'));
            setProgressModal(null);
            triggerRefresh();
        } catch (error) {
            toast.error(t('progress_error'));
        }
    };

    return (
        <>
            {/* Modal Editar/Añadir Meta (Global) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex justify-center items-center z-[100] p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="card p-6 w-full max-w-md border-white/10 animate-scale-in bg-finance-800 overflow-visible relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-finance-muted hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-5 text-finance-text">{editingGoal ? t('edit_goal') : t('add_goal')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-finance-muted mb-1.5">{t('goal_name_label')} *</label>
                                <input type="text" required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-finance-muted mb-1.5">{t('target_amount')} *</label>
                                    <input type="number" required className="input-field" value={formData.target_amount} onChange={e => setFormData({ ...formData, target_amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-finance-muted mb-1.5">{t('current_amount')}</label>
                                    <input type="number" className="input-field" value={formData.current_amount} onChange={e => setFormData({ ...formData, current_amount: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-finance-muted mb-1.5">{t('target_date')} *</label>
                                <DatePickerElite
                                    value={formData.deadline}
                                    onChange={(val) => setFormData({ ...formData, deadline: val })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">{t('cancel')}</button>
                                <button type="submit" className="btn-primary flex-1">{t('save_changes')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Actualizar Progreso (Global) */}
            {progressModal && (
                <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex justify-center items-center z-[100] p-4" onClick={(e) => e.target === e.currentTarget && setProgressModal(null)}>
                    <div className="card p-6 w-full max-w-sm border-white/10 animate-scale-in bg-finance-800 relative">
                        <button onClick={() => setProgressModal(null)} className="absolute top-4 right-4 text-finance-muted hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-2 text-finance-text">{t('update_progress')}</h2>
                        <p className="text-sm text-finance-muted mb-5">{progressModal.goal.name}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-finance-muted mb-1.5">{t('current_amount_label')}</label>
                                <input type="number" className="input-field text-xl font-bold font-mono"
                                    value={progressModal.value}
                                    onChange={e => setProgressModal({ ...progressModal, value: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-finance-muted mb-2">
                                <span>{t('target_amount')}: ${Number(progressModal.goal.target_amount).toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</span>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setProgressModal(null)} className="btn-secondary flex-1">{t('cancel')}</button>
                                <button onClick={handleUpdateProgress} className="btn-epic flex-1">{t('save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Lock, Globe, Moon, Sun, Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import i18n from '../i18n';

const profileSchema = z.object({
  fullName: z.string().min(2, 'At least 2 characters'),
  whatsappNumber: z.string().optional(),
  preferredLang: z.enum(['en', 'rw', 'sw', 'fr']),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'fr', label: 'Français' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName, whatsappNumber: user?.whatsappNumber || '', preferredLang: user?.preferredLang || 'en' },
  });

  // Password form
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors, isSubmitting: pwdSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (values) => {
    try {
      const { data } = await api.put('/users/profile', values);
      updateUser(data.data);
      i18n.changeLanguage(values.preferredLang);
      localStorage.setItem('genzura-lang', values.preferredLang);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed. Please log in again.');
      resetPwd();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'password', label: t('settings.changePassword'), icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Sun },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title={t('settings.title')} />

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 border border-slate-700/50 rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{user?.fullName}</h3>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <span className="badge-purple mt-1 inline-block">{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...regProfile('fullName')} className="input" />
              {profileErrors.fullName && <p className="text-red-400 text-xs mt-1">{profileErrors.fullName.message}</p>}
            </div>
            <div>
              <label className="label">Email <span className="text-slate-500">(read-only)</span></label>
              <input value={user?.email} disabled className="input opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">WhatsApp Number</label>
              <input {...regProfile('whatsappNumber')} className="input" placeholder="+250700000000" />
              <p className="text-xs text-slate-500 mt-1">Used for low stock alerts</p>
            </div>
            <div>
              <label className="label"><Globe size={14} className="inline mr-1" />{t('settings.language')}</label>
              <select {...regProfile('preferredLang')} className="input">
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={profileSubmitting} className="btn-primary flex items-center gap-2">
                {profileSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">{t('settings.changePassword')}</h3>
          <form onSubmit={handlePwd(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="label">{t('settings.currentPassword')}</label>
              <input {...regPwd('currentPassword')} type="password" className="input" placeholder="••••••••" />
              {pwdErrors.currentPassword && <p className="text-red-400 text-xs mt-1">{pwdErrors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="label">{t('settings.newPassword')}</label>
              <input {...regPwd('newPassword')} type="password" className="input" placeholder="Min 8 chars, 1 uppercase, 1 number" />
              {pwdErrors.newPassword && <p className="text-red-400 text-xs mt-1">{pwdErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input {...regPwd('confirmPassword')} type="password" className="input" placeholder="••••••••" />
              {pwdErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{pwdErrors.confirmPassword.message}</p>}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwdSubmitting} className="btn-primary flex items-center gap-2">
                {pwdSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                Change Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white mb-4">Appearance</h3>
          <div className="flex items-center justify-between p-4 bg-dark-900/50 rounded-xl">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={20} className="text-primary-400" /> : <Sun size={20} className="text-yellow-400" />}
              <div>
                <p className="font-medium text-slate-100">{darkMode ? t('settings.darkMode') : t('settings.lightMode')}</p>
                <p className="text-xs text-slate-500">Toggle interface theme</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

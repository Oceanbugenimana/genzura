import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, User, Mail, Lock, Phone, Globe, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  fullName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  whatsappNumber: z.string().optional(),
  preferredLang: z.enum(['en', 'rw', 'sw', 'fr']).default('en'),
});

const LANGS = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'rw', label: '🇷🇼 Kinyarwanda' },
  { value: 'sw', label: '🇹🇿 Kiswahili' },
  { value: 'fr', label: '🇫🇷 Français' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { preferredLang: 'en' },
  });

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/register', values);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success('Account created! Welcome to GENZURA 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const Field = ({ name, label, icon: Icon, type = 'text', placeholder, required, children }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--text-muted)' }} />}
        {children || <input {...register(name)} type={type} className={`input ${Icon ? 'pl-10' : ''}`} placeholder={placeholder} />}
      </div>
      {errors[name] && <p className="error-msg">⚠ {errors[name].message}</p>}
    </div>
  );

  return (
    <div className="card animate-scale-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <h2 className="text-xl font-black mb-0.5" style={{ color: 'var(--text-primary)' }}>Create account</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Start managing your inventory today</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field name="fullName" label="Full Name" icon={User} placeholder="John Doe" required />
        <Field name="email" label="Email" icon={Mail} type="email" placeholder="you@example.com" required />

        <div>
          <label className="label">Password <span className="text-red-400">*</span></label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input {...register('password')} type={showPwd ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="Min 8 chars, 1 uppercase, 1 number" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon p-1">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="error-msg">⚠ {errors.password.message}</p>}
        </div>

        <Field name="whatsappNumber" label="WhatsApp Number" icon={Phone} placeholder="+250700000000">
          <input {...register('whatsappNumber')} className="input pl-10" placeholder="+250700000000" />
        </Field>

        <div>
          <label className="label"><Globe size={12} className="inline mr-1" />Preferred Language</label>
          <select {...register('preferredLang')} className="input">
            {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  );
}

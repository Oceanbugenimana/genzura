import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

const DEMO = [
  { role: 'Admin',   email: 'admin@genzura.com',   pass: 'Admin@123',   color: 'text-red-400' },
  { role: 'Manager', email: 'manager@genzura.com', pass: 'Manager@123', color: 'text-amber-400' },
  { role: 'Staff',   email: 'staff@genzura.com',   pass: 'Staff@123',   color: 'text-emerald-400' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/login', values);
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      toast.success(`Welcome back, ${data.data.user.fullName}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const fillDemo = (email, pass) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="card animate-scale-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <h2 className="text-xl font-black mb-0.5" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Sign in to your GENZURA account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input {...register('email')} type="email" className="input pl-10" placeholder="you@example.com" autoComplete="email" />
          </div>
          {errors.email && <p className="error-msg"><span>⚠</span>{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input {...register('password')} type={showPwd ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon p-1">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="error-msg"><span>⚠</span>{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
          Create one
        </Link>
      </p>

      {/* Demo credentials */}
      <div className="mt-5 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          🚀 Demo Accounts — click to fill
        </p>
        <div className="space-y-2">
          {DEMO.map(({ role, email, pass, color }) => (
            <button
              key={role}
              type="button"
              onClick={() => fillDemo(email, pass)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all hover:scale-[1.01]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span className={`font-bold ${color}`}>{role}</span>
              <span style={{ color: 'var(--text-muted)' }}>{email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

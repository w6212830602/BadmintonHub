import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { 
  Trophy, Calendar, Users, Home, Plus, ChevronRight, MapPin, 
  Trash2, Mail, Clock, CheckCircle, AlertTriangle, ArrowLeft, 
  X, Activity, Brain, Shield, User as UserIcon, Image as ImageIcon, LogOut, Edit, Repeat, Lock, History,
  Loader2, Camera, ArrowLeftRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { mockDb } from './services/mockDb';
import { getBadmintonTips } from './services/geminiService';
import { User, Club, Session, ClubMember, Match } from './types';

// --- Context & Custom Hooks ---

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const UserContext = React.createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  login: () => {}, 
  logout: () => {},
  updateProfile: async () => {} 
});

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (user: User) => {
    setUser(user);
    localStorage.setItem('badmintonHub_userId', user.id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('badmintonHub_userId');
    localStorage.removeItem('badmintonHub_lastPath');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await mockDb.updateUser(user.id, data);
      setUser(updatedUser);
    } catch (e) {
      console.error("Failed to update profile", e);
      throw e;
    }
  };

  useEffect(() => {
    const savedId = localStorage.getItem('badmintonHub_userId');
    if (savedId) {
      mockDb.getCurrentUser(savedId).then(u => {
        setUser(u);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading, login, logout, updateProfile };
}

// --- Reusable UI Components ---

const Button = ({ 
  children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon 
}: { 
  children?: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; 
  className?: string;
  disabled?: boolean;
  icon?: any;
}) => {
  const base = "flex items-center justify-center px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-emerald-600 text-white shadow-lg shadow-emerald-200",
    secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm",
    danger: "bg-red-50 text-red-600 border border-red-100",
    ghost: "text-slate-500 hover:bg-slate-100"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${className}`}>
    {children}
  </div>
);

interface AvatarProps {
  url?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ url, alt, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-20 h-20' };
  return (
    <img 
      src={url || `https://ui-avatars.com/api/?name=${alt}&background=random`} 
      alt={alt} 
      className={`rounded-full object-cover border-2 border-white shadow-sm ${sizes[size]} ${className}`} 
    />
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-slate-50">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X className="w-6 h-6 text-slate-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
  <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
    {tabs.map(tab => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
          active === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

// --- Feature Components ---

const MatchRecorder = ({ session, players, onClose, onRecord }: { session: Session; players: User[]; onClose: () => void; onRecord: () => void }) => {
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePlayer = (id: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (teamA.includes(id)) setTeamA(teamA.filter(p => p !== id));
      else if (teamA.length < 2 && !teamB.includes(id)) setTeamA([...teamA, id]);
    } else {
      if (teamB.includes(id)) setTeamB(teamB.filter(p => p !== id));
      else if (teamB.length < 2 && !teamA.includes(id)) setTeamB([...teamB, id]);
    }
  };

  const swapSides = () => {
    const tempTeam = teamA;
    setTeamA(teamB);
    setTeamB(tempTeam);
    const tempScore = scoreA;
    setScoreA(scoreB);
    setScoreB(tempScore);
  };

  const submitMatch = async () => {
    if (scoreA === scoreB) return alert("Matches cannot end in a draw");
    setIsSubmitting(true);
    await mockDb.recordMatch({
      sessionId: session.id,
      teamA,
      teamB,
      scoreA,
      scoreB,
      winner: scoreA > scoreB ? 'A' : 'B'
    });
    setIsSubmitting(false);
    onRecord();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Team A Selection */}
        <div className="space-y-2">
          <div className="text-center font-bold text-emerald-600 bg-emerald-50 py-1 rounded-lg text-sm">Team A</div>
          <div className="space-y-2 h-48 overflow-y-auto pr-1 no-scrollbar bg-slate-50 rounded-xl p-2">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id, 'A')}
                disabled={teamB.includes(p.id)}
                className={`w-full text-left p-2 rounded-lg border flex items-center gap-2 transition-all ${teamA.includes(p.id) ? 'bg-white border-emerald-500 ring-2 ring-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300 disabled:opacity-30 disabled:bg-slate-100'}`}
              >
                <Avatar url={p.avatarUrl} alt={p.name} size="sm" />
                <span className="text-xs font-medium text-slate-700 truncate flex-1">{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Team B Selection */}
        <div className="space-y-2">
          <div className="text-center font-bold text-blue-600 bg-blue-50 py-1 rounded-lg text-sm">Team B</div>
          <div className="space-y-2 h-48 overflow-y-auto pr-1 no-scrollbar bg-slate-50 rounded-xl p-2">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id, 'B')}
                disabled={teamA.includes(p.id)}
                className={`w-full text-left p-2 rounded-lg border flex items-center gap-2 transition-all ${teamB.includes(p.id) ? 'bg-white border-blue-500 ring-2 ring-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300 disabled:opacity-30 disabled:bg-slate-100'}`}
              >
                <Avatar url={p.avatarUrl} alt={p.name} size="sm" />
                <span className="text-xs font-medium text-slate-700 truncate flex-1">{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Controls */}
      <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl relative shadow-sm">
        {/* Swap Button */}
        <button 
            onClick={swapSides} 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 p-2 rounded-full shadow-md text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all z-10 active:scale-95"
            title="Swap Sides"
        >
            <ArrowLeftRight className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <button onClick={() => setScoreA(s => s + 1)} className="w-12 h-12 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full border border-emerald-100 flex items-center justify-center text-xl font-bold transition-colors active:scale-90">+</button>
          <span className={`text-5xl font-black ${scoreA > scoreB ? 'text-emerald-600' : 'text-slate-800'}`}>{scoreA}</span>
          <button onClick={() => setScoreA(s => Math.max(0, s - 1))} className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold transition-colors active:scale-90">-</button>
        </div>
        
        <div className="flex flex-col items-center gap-2 w-1/3">
          <button onClick={() => setScoreB(s => s + 1)} className="w-12 h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-100 flex items-center justify-center text-xl font-bold transition-colors active:scale-90">+</button>
          <span className={`text-5xl font-black ${scoreB > scoreA ? 'text-blue-600' : 'text-slate-800'}`}>{scoreB}</span>
          <button onClick={() => setScoreB(s => Math.max(0, s - 1))} className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold transition-colors active:scale-90">-</button>
        </div>
      </div>

      <Button onClick={submitMatch} disabled={teamA.length === 0 || teamB.length === 0 || isSubmitting} className="w-full">
        {isSubmitting ? 'Saving Match...' : 'Record Result'}
      </Button>
    </div>
  );
};

interface MatchItemProps {
  match: Match;
  players: User[];
}

const MatchItem: React.FC<MatchItemProps> = ({ match, players }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isWinnerA = match.winner === 'A';

  const getPlayer = (id: string) => players.find(u => u.id === id);

  return (
    <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="group border border-slate-100 rounded-xl p-3 bg-white hover:border-emerald-300 transition-all cursor-pointer shadow-sm relative overflow-hidden"
    >
        <div className="flex items-center justify-between">
             {/* Team A Avatars */}
             <div className={`flex-1 flex justify-end gap-1 ${isWinnerA ? 'opacity-100' : 'opacity-60'}`}>
                {match.teamA.map(pid => (
                    <Avatar key={pid} url={getPlayer(pid)?.avatarUrl} alt="" size="sm" className="w-8 h-8 border-2 border-white" />
                ))}
             </div>

             {/* Score */}
             <div className="mx-4 flex flex-col items-center min-w-[80px]">
                 <div className={`text-xl font-black tracking-widest px-3 py-1 rounded-lg ${
                     isWinnerA ? 'text-emerald-600' : match.winner === 'B' ? 'text-blue-600' : 'text-slate-700'
                 }`}>
                     {match.scoreA}-{match.scoreB}
                 </div>
                 <div className="text-[10px] text-slate-400 font-medium mt-1">
                    {isExpanded ? 'Hide Details' : 'View Details'}
                 </div>
             </div>

             {/* Team B Avatars */}
             <div className={`flex-1 flex justify-start gap-1 ${!isWinnerA ? 'opacity-100' : 'opacity-60'}`}>
                {match.teamB.map(pid => (
                    <Avatar key={pid} url={getPlayer(pid)?.avatarUrl} alt="" size="sm" className="w-8 h-8 border-2 border-white" />
                ))}
             </div>
        </div>

        {/* Expanded Names */}
        <div className={`grid grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-60 mt-4 pt-3 border-t border-slate-100 opacity-100' : 'max-h-0 opacity-0'}`}>
             <div className="text-center">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team A</div>
                 {match.teamA.map(pid => (
                     <div key={pid} className={`text-sm mb-1 truncate px-2 ${isWinnerA ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>
                         {getPlayer(pid)?.name || 'Unknown Player'}
                     </div>
                 ))}
             </div>
             <div className="text-center">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team B</div>
                 {match.teamB.map(pid => (
                     <div key={pid} className={`text-sm mb-1 truncate px-2 ${!isWinnerA ? 'font-bold text-blue-700' : 'text-slate-600'}`}>
                         {getPlayer(pid)?.name || 'Unknown Player'}
                     </div>
                 ))}
             </div>
        </div>
        
        {/* Chevron Indicator */}
        <div className="text-center mt-1 -mb-1">
             <ChevronRight className={`w-4 h-4 text-slate-300 mx-auto transition-transform duration-300 ${isExpanded ? '-rotate-90' : 'rotate-90'}`} />
        </div>
    </div>
  );
};

// --- Views ---

const AuthView = () => {
  const { login } = React.useContext(UserContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      skillLevel: 5
  });

  useEffect(() => {
    mockDb.getAllUsers().then(setDemoUsers);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({...formData, [e.target.name]: e.target.value});
      setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        if (isRegistering) {
            const newUser = await mockDb.createUser({
                name: formData.name,
                email: formData.email,
                skillLevel: parseInt(formData.skillLevel.toString())
            });
            login(newUser);
        } else {
            const user = await mockDb.login(formData.email);
            login(user);
        }
    } catch (err: any) {
        setError(err.message || 'Authentication failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8 animate-in slide-in-from-top-10">
            <div className="inline-block p-4 rounded-full bg-slate-800 mb-4 ring-1 ring-slate-700">
                <Trophy className="w-12 h-12 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">BadmintonHub</h1>
            <p className="text-slate-400">Level up your game.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl text-slate-900 mb-6 animate-in scale-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-center">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                        <input 
                            name="name" 
                            required 
                            placeholder="John Doe"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                )}
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                    <input 
                        name="email" 
                        type="email" 
                        required 
                        placeholder="you@example.com"
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                            name="password" 
                            type="password" 
                            required 
                            placeholder="••••••••"
                            className="w-full p-3 pl-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {isRegistering && (
                     <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Skill Level (1-10)</label>
                            <span className="text-emerald-600 font-bold">{formData.skillLevel}</span>
                        </div>
                        <input 
                            name="skillLevel" 
                            type="range" 
                            min="1" 
                            max="10" 
                            className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            value={formData.skillLevel}
                            onChange={handleChange}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Beginner</span>
                            <span>Pro</span>
                        </div>
                    </div>
                )}

                <Button className="w-full shadow-xl shadow-emerald-200/50 mt-4" disabled={loading}>
                    {loading ? 'Please wait...' : isRegistering ? 'Sign Up' : 'Sign In'}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                    className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
                >
                    {isRegistering ? 'Already have an account? Sign In' : 'New here? Create Account'}
                </button>
            </div>
        </div>

        {/* Developer / Demo Quick Access */}
        <div className="text-center">
             <button 
                onClick={() => setShowDemo(!showDemo)} 
                className="text-xs text-slate-600 hover:text-slate-400 mb-4"
            >
                 {showDemo ? 'Hide Demo Users' : 'Show Demo Users (Dev)'}
             </button>
             
             {showDemo && (
                 <div className="bg-slate-800 rounded-2xl p-2 animate-in slide-in-from-bottom-5">
                    <p className="text-xs text-slate-500 mb-2">Tap to login instantly:</p>
                    <div className="grid gap-2">
                        {demoUsers.map(u => (
                            <button
                                key={u.id}
                                onClick={() => login(u)}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700 transition-colors text-left"
                            >
                                <Avatar url={u.avatarUrl} alt={u.name} size="sm" />
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-sm font-bold text-slate-200 truncate">{u.name}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            </button>
                        ))}
                    </div>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

const CreateClubView = () => {
  const { user } = React.useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newClubData = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      bannerUrl: formData.get('bannerUrl') as string || undefined,
    };

    try {
      const club = await mockDb.createClub(newClubData, user.id);
      navigate(`/club/${club.id}`, { replace: true });
    } catch (error) {
      alert("Failed to create club");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border rounded-full">
          <ArrowLeft className="w-5 h-5"/>
        </button>
        <h1 className="text-xl font-bold">Create New Club</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Club Name</label>
            <input 
              name="name" 
              required 
              placeholder="e.g. Downtown Shuttlers"
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                name="location" 
                required 
                placeholder="e.g. City Sports Center"
                className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              name="description" 
              required 
              rows={3}
              placeholder="Tell people about your club..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image URL (Optional)</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                name="bannerUrl" 
                placeholder="https://..."
                className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Leave empty for a random badminton image.</p>
          </div>

          <div className="pt-4">
            <Button disabled={loading} className="w-full">
              {loading ? 'Creating Club...' : 'Create Club'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const DashboardView = () => {
  const { user } = React.useContext(UserContext);
  const [clubs, setClubs] = useState<Club[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      mockDb.getUserClubs(user.id).then(setClubs);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="pb-20 space-y-6 animate-in fade-in">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm">Ready to play?</p>
        </div>
        <Link to="/profile">
           <Avatar url={user.avatarUrl} alt={user.name} />
        </Link>
      </header>

      {/* Hero Card - Next Session (Mocked for Demo) */}
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-emerald-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">Next Up</span>
            <Trophy className="w-6 h-6 text-emerald-100" />
          </div>
          <h3 className="text-lg font-bold mb-1">Thursday Night Smash</h3>
          <p className="text-emerald-100 text-sm mb-4">Smash City • Court 1 & 2</p>
          <div className="flex items-center gap-3 text-sm font-medium">
             <Clock className="w-4 h-4" /> 7:00 PM
             <span className="w-1 h-1 bg-white/50 rounded-full"></span>
             <Users className="w-4 h-4" /> 5/8 Joined
          </div>
        </div>
      </Card>

      {/* Club List */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Your Clubs</h2>
        <div className="grid gap-4">
          {clubs.map(club => (
            <Link key={club.id} to={`/club/${club.id}`} className="block">
              <Card className="flex items-center gap-4 hover:border-emerald-200 transition-colors group">
                <img src={club.bannerUrl} alt={club.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{club.name}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1" /> {club.location}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
              </Card>
            </Link>
          ))}
          {clubs.length === 0 && (
             <div className="text-center p-8 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 mb-2">You haven't joined any clubs yet.</p>
                <Link to="/create-club" className="text-emerald-600 font-bold text-sm">Create a Club</Link>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SessionCard: React.FC<{ session: Session }> = ({ session }) => {
  const navigate = useNavigate();
  const fillPercent = (session.registeredPlayerIds.length / session.maxPlayers) * 100;
  
  return (
    <div onClick={() => navigate(`/session/${session.id}`)} className="cursor-pointer">
      <Card className="hover:border-emerald-300 transition-colors">
        <div className="flex justify-between mb-3">
          <div className="flex gap-2">
            <span className="font-bold text-lg text-slate-800">{session.date.slice(5)}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-medium">{session.startTime}</span>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            session.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 
            session.status === 'FULL' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {session.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <MapPin className="w-4 h-4" /> Court {session.courtNumber}
        </div>
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${fillPercent}%` }}></div>
        </div>
        <div className="text-xs text-slate-400 text-right">
          {session.registeredPlayerIds.length} / {session.maxPlayers} Spots
        </div>
      </Card>
    </div>
  );
};

const ClubDetailView = () => {
  const { id } = useParams();
  const { user } = React.useContext(UserContext);
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Initialize from storage with per-club persistence
  const [activeTab, setActiveTab] = useState(() => {
     if (id) {
       return localStorage.getItem(`badmintonHub_clubTab_${id}`) || 'Home';
     }
     return 'Home';
  });

  const [userRole, setUserRole] = useState<string>('member');
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<{id?: string, type: 'info'|'alert'|'success', content: string} | null>(null);
  
  // Session Creation State
  const [isRecurring, setIsRecurring] = useState(false);

  const navigate = useNavigate();

  // Sync tab when ID changes (navigation between clubs)
  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`badmintonHub_clubTab_${id}`);
      setActiveTab(saved || 'Home');
    }
  }, [id]);

  // Save tab state on change with per-club key
  useEffect(() => {
    if (id) {
      localStorage.setItem(`badmintonHub_clubTab_${id}`, activeTab);
    }
  }, [activeTab, id]);

  const fetchClubData = useCallback(() => {
    if (id && user) {
      mockDb.getClubDetails(id).then(setClub);
      mockDb.getClubMembers(id).then(m => {
        setMembers(m);
        const me = m.find(x => x.id === user.id);
        if (me) setUserRole(me.role);
      });
      mockDb.getSessions(id).then(setSessions);
    }
  }, [id, user]);

  useEffect(() => {
    fetchClubData();
  }, [fetchClubData]);

  const handleKick = async (userId: string) => {
    if (confirm("Are you sure you want to kick this member?")) {
      await mockDb.kickMember(id!, userId);
      setMembers(members.filter(m => m.id !== userId));
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;

    try {
        const result = await mockDb.inviteMember(id!, email);
        alert(result.message);
        setInviteModalOpen(false);
        // Refresh members if a user was actually added
        if (result.user) {
             const updatedMembers = await mockDb.getClubMembers(id!);
             setMembers(updatedMembers);
        }
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
     e.preventDefault();
     // Simplified creation for demo
     const form = e.target as HTMLFormElement;
     const formData = new FormData(form);
     const recurrenceWeeks = isRecurring ? parseInt(formData.get('recurrenceWeeks') as string || '1') : 1;

     await mockDb.createSession(id!, {
         date: formData.get('date') as string,
         startTime: formData.get('startTime') as string,
         endTime: formData.get('endTime') as string,
         courtNumber: formData.get('court') as string,
         maxPlayers: parseInt(formData.get('max') as string)
     }, recurrenceWeeks);

     const updated = await mockDb.getSessions(id!);
     setSessions(updated);
     alert(isRecurring ? `${recurrenceWeeks} Sessions Created!` : "Session Created!");
     form.reset();
     setIsRecurring(false); // Reset checkbox
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const type = (form.elements.namedItem('type') as HTMLSelectElement).value as 'info' | 'alert' | 'success';
      const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;

      try {
          if (editingAnnouncement?.id) {
              await mockDb.updateAnnouncement(id!, editingAnnouncement.id, { type, content });
          } else {
              await mockDb.addAnnouncement(id!, type, content);
          }
          fetchClubData();
          setAnnouncementModalOpen(false);
          setEditingAnnouncement(null);
      } catch (error) {
          alert('Failed to save announcement');
      }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
      if (confirm('Delete this announcement?')) {
          await mockDb.deleteAnnouncement(id!, announcementId);
          fetchClubData();
      }
  };

  if (!club) return <div className="p-8 text-center">Loading Club...</div>;

  // Split sessions for Events tab
  const now = new Date();
  const upcomingSessions = sessions.filter(s => {
      const sDate = new Date(`${s.date}T${s.endTime}`);
      return sDate > now;
  });
  const pastSessions = sessions.filter(s => {
      const sDate = new Date(`${s.date}T${s.endTime}`);
      return sDate <= now;
  }).reverse(); // Most recent past first

  return (
    <div className="pb-24 animate-in slide-in-from-right-10 duration-300">
      {/* Club Banner */}
      <div className="relative h-48 w-full">
        <img src={club.bannerUrl} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        {/* Navigation Home */}
        <Link to="/" className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur rounded-full text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <p className="text-sm opacity-90 flex items-center gap-1"><MapPin className="w-3 h-3"/> {club.location}</p>
        </div>
      </div>

      <div className="p-4">
        {/* Stats */}
        <div className="flex gap-4 mb-6 overflow-x-auto no-scrollbar">
          <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 min-w-[100px]">
            <div className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Members</div>
            <div className="text-xl font-bold text-slate-800">{members.length}</div>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 min-w-[100px]">
            <div className="text-xs text-blue-600 uppercase font-bold tracking-wider">Matches</div>
            <div className="text-xl font-bold text-slate-800">{members.reduce((a,b) => a + b.stats.played, 0)}</div>
          </div>
        </div>

        <TabBar tabs={['Home', 'Events', 'Rank', 'About']} active={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'Home' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-slate-800">Announcements</h3>
                 {userRole === 'admin' && (
                     <button 
                        onClick={() => { setEditingAnnouncement(null); setAnnouncementModalOpen(true); }}
                        className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"
                     >
                         + New
                     </button>
                 )}
             </div>
             
             {club.announcements.length === 0 && (
                 <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-400 text-sm">No announcements yet.</div>
             )}

             {club.announcements.map(a => (
               <div key={a.id} className={`relative p-4 rounded-xl border-l-4 ${
                    a.type === 'alert' ? 'bg-amber-50 border-amber-500 text-amber-900' : 
                    a.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' :
                    'bg-blue-50 border-blue-500 text-blue-900'
               }`}>
                 <p className="font-medium pr-6">{a.content}</p>
                 <span className="text-xs opacity-70 mt-1 block">{a.date}</span>
                 
                 {userRole === 'admin' && (
                     <div className="absolute top-2 right-2 flex gap-1">
                        <button 
                            onClick={() => { setEditingAnnouncement(a); setAnnouncementModalOpen(true); }}
                            className="p-1 hover:bg-black/10 rounded"
                        >
                            <Edit className="w-3.5 h-3.5 opacity-60" />
                        </button>
                        <button 
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            className="p-1 hover:bg-black/10 rounded"
                        >
                            <Trash2 className="w-3.5 h-3.5 opacity-60" />
                        </button>
                     </div>
                 )}
               </div>
             ))}

             <div className="my-6 border-t border-slate-100"></div>

             <h3 className="font-bold text-slate-800">Upcoming Session</h3>
             {upcomingSessions.length > 0 ? (
               <SessionCard session={upcomingSessions[0]} />
             ) : (
                <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-xl">No upcoming sessions</div>
             )}
          </div>
        )}

        {activeTab === 'Events' && (
          <div className="space-y-4">
             {userRole === 'admin' && (
                <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/50">
                  <h4 className="font-bold text-emerald-800 mb-2">Create Session</h4>
                  <form onSubmit={handleCreateSession} className="grid grid-cols-2 gap-2 text-sm">
                      <input name="date" type="date" required className="p-2 rounded border" />
                      <input name="startTime" type="time" required className="p-2 rounded border" />
                      <input name="endTime" type="time" required className="p-2 rounded border" />
                      <input name="court" placeholder="Court # (Optional)" className="p-2 rounded border" />
                      <input name="max" type="number" placeholder="Max" defaultValue={8} className="p-2 rounded border col-span-2" />
                      
                      {/* Recurrence Options */}
                      <div className="col-span-2 flex items-center gap-3 mt-1 bg-white p-2 rounded border border-emerald-100">
                          <button 
                            type="button" 
                            onClick={() => setIsRecurring(!isRecurring)}
                            className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded transition-colors ${isRecurring ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
                          >
                             <Repeat className="w-3 h-3" />
                             {isRecurring ? 'Repeat Weekly' : 'One-time Only'}
                          </button>
                          {isRecurring && (
                              <div className="flex items-center gap-2 text-xs animate-in slide-in-from-left-2">
                                  <span>for</span>
                                  <input 
                                    name="recurrenceWeeks" 
                                    type="number" 
                                    min="2" 
                                    max="12" 
                                    defaultValue={4} 
                                    className="w-12 p-1 rounded border text-center" 
                                  />
                                  <span>weeks</span>
                              </div>
                          )}
                      </div>

                      <Button className="col-span-2 py-2 text-sm mt-2">Schedule</Button>
                  </form>
                </Card>
             )}
             
             {/* Upcoming Sessions */}
             <div className="space-y-3">
                 <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                     <Calendar className="w-4 h-4" /> Upcoming
                 </h3>
                 {upcomingSessions.length > 0 ? (
                     upcomingSessions.map(s => <SessionCard key={s.id} session={s} />)
                 ) : (
                     <p className="text-sm text-slate-400 italic">No upcoming sessions.</p>
                 )}
             </div>

             {/* Past Sessions */}
             {pastSessions.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                     <h3 className="font-bold text-slate-500 flex items-center gap-2">
                         <History className="w-4 h-4" /> Past Sessions
                     </h3>
                     <div className="opacity-80">
                         {pastSessions.map(s => <SessionCard key={s.id} session={s} />)}
                     </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'Rank' && (
          <div className="space-y-2">
            {members.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                 <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                   {idx + 1}
                 </div>
                 <Avatar url={m.avatarUrl} alt={m.name} size="sm" />
                 <div className="flex-1">
                   <div className="font-semibold text-slate-800">{m.name}</div>
                   <div className="text-xs text-slate-500">Win Rate: {m.stats.played ? Math.round((m.stats.won/m.stats.played)*100) : 0}%</div>
                 </div>
                 <div className="text-right">
                    <div className="font-bold text-slate-800">{m.stats.won} W</div>
                    <div className="text-xs text-slate-400">{m.stats.played} M</div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'About' && (
          <div>
            <p className="text-slate-600 mb-6 leading-relaxed">{club.description}</p>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Members ({members.length})</h3>
              {userRole === 'admin' && (
                <Button 
                    variant="ghost" 
                    className="text-xs py-1 px-2 h-auto" 
                    onClick={() => setInviteModalOpen(true)}
                >
                    <Users className="w-3 h-3 mr-1"/> Invite
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Avatar url={m.avatarUrl} alt={m.name} size="sm" />
                     <div>
                       <div className="font-medium text-slate-800">{m.name}</div>
                       <div className="text-xs text-slate-500 capitalize">{m.role}</div>
                     </div>
                   </div>
                   {userRole === 'admin' && m.id !== user!.id && (
                     <button onClick={() => handleKick(m.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-full">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Member">
        <form onSubmit={handleInvite} className="space-y-4">
            <p className="text-sm text-slate-500">
                Enter an email address to invite a new player to this club. 
                If they are already on BadmintonHub, they will be added immediately.
            </p>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                        type="email" 
                        name="email" 
                        required 
                        placeholder="player@example.com"
                        className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>
            <Button className="w-full">Send Invitation</Button>
        </form>
      </Modal>

      {/* Announcement Modal */}
      <Modal 
        isOpen={isAnnouncementModalOpen} 
        onClose={() => setAnnouncementModalOpen(false)} 
        title={editingAnnouncement ? "Edit Announcement" : "Post Announcement"}
      >
          <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select 
                    name="type" 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    defaultValue={editingAnnouncement?.type || 'info'}
                  >
                      <option value="info">Info (Blue)</option>
                      <option value="alert">Alert (Amber)</option>
                      <option value="success">Success (Green)</option>
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                  <textarea 
                      name="content"
                      required
                      rows={4}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      defaultValue={editingAnnouncement?.content || ''}
                      placeholder="Type your announcement here..."
                  />
              </div>
              <Button className="w-full">
                  {editingAnnouncement ? 'Update Announcement' : 'Post Announcement'}
              </Button>
          </form>
      </Modal>
    </div>
  );
};

const SessionDetailView = () => {
  const { id } = useParams();
  const { user } = React.useContext(UserContext);
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<(User & { stats: { played: number, won: number } })[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // For history lookup
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isRecorderOpen, setRecorderOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // New state for loading interactions
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    const s = await mockDb.getSessionDetails(id);
    setSession(s);
    
    if (s) {
      const [members, matchesList, allUsersList] = await Promise.all([
        mockDb.getClubMembers(s.clubId),
        mockDb.getSessionMatches(id),
        mockDb.getAllUsers()
      ]);
      
      const sessionPlayers = members.filter(m => s.registeredPlayerIds.includes(m.id));
      setPlayers(sessionPlayers);
      setMatches(matchesList);
      setAllUsers(allUsersList);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const updatedSession = await mockDb.joinSession(id!, user!.id);
      setSession(updatedSession);
      fetchData(); // Fetch players to refresh the avatars
    } catch (e: any) { alert(e.message); }
    finally { setIsProcessing(false); }
  };

  const handleLeave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const updatedSession = await mockDb.leaveSession(id!, user!.id);
      setSession(updatedSession);
      setLeaveModalOpen(false);
      fetchData(); // Fetch players to refresh the avatars
    } catch (e: any) { alert(e.message); }
    finally { setIsProcessing(false); }
  };
  
  const getPlayerName = (id: string) => {
    const p = players.find(u => u.id === id);
    return p ? p.name.split(' ')[0] : 'Player';
  };

  if (!session || !user) return <div>Loading...</div>;

  const isJoined = session.registeredPlayerIds.includes(user.id);
  const isLocked = new Date(session.date + 'T' + session.startTime).getTime() < Date.now();
  const fillPercent = (session.registeredPlayerIds.length / session.maxPlayers) * 100;

  return (
    <div className="pb-24 p-4 space-y-6 animate-in zoom-in-95 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border rounded-full"><ArrowLeft className="w-5 h-5"/></button>
        <h1 className="text-xl font-bold">Session Details</h1>
      </div>

      <Card>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                session.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 
                session.status === 'FULL' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {session.status}
              </span>
              <p className="text-slate-500 text-sm">{session.date}</p>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{session.startTime} - {session.endTime}</h2>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Court</div>
            <div className="font-bold text-lg text-emerald-600">{session.courtNumber}</div>
          </div>
        </div>

        <TabBar tabs={['Overview', 'Matches']} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'Overview' && (
            <>
                {/* Capacity Progress Bar */}
                <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-700">Session Capacity</span>
                    <span className="text-xs font-medium text-slate-500">
                    {session.registeredPlayerIds.length} of {session.maxPlayers} players
                    </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                    <div 
                    className={`h-full transition-all duration-500 ease-out ${
                        fillPercent >= 100 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${fillPercent}%` }}
                    />
                </div>
                </div>

                {/* Players List - Scrollable Row */}
                <div className="mb-6">
                <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 no-scrollbar items-end">
                    {Array.from({ length: session.maxPlayers }).map((_, i) => {
                    const player = players[i];
                    const winRate = player ? Math.round((player.stats.won / (player.stats.played || 1)) * 100) : 0;
                    
                    return (
                        <div key={i} className="flex-shrink-0 w-16 flex flex-col items-center gap-1">
                        {player ? (
                            <>
                            {/* Stats Summary */}
                            <div className="flex flex-col items-center justify-end mb-1 h-7">
                                <span className="text-[10px] font-bold text-emerald-600 leading-none">{winRate}%</span>
                                <span className="text-[9px] text-slate-400 leading-none scale-90">{player.stats.played}G</span>
                            </div>

                            <div className="relative">
                                <Avatar url={player.avatarUrl} alt={player.name} size="lg" className="w-12 h-12" />
                                {player.id === user.id && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-600 text-[9px] text-white px-1.5 py-0.5 rounded-full shadow-sm z-10 whitespace-nowrap">
                                    YOU
                                </span>
                                )}
                            </div>
                            <span className="text-[11px] text-slate-700 font-medium text-center truncate w-full leading-tight">
                                {player.name.split(' ')[0]}
                            </span>
                            </>
                        ) : (
                            <>
                            {/* Spacer for empty slots to align with filled ones */}
                            <div className="h-7 w-full mb-1"></div>
                            
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50/50">
                                <span className="text-slate-400 text-xs font-bold">{i + 1}</span>
                            </div>
                            <span className="text-slate-400 text-xs font-bold">Open</span>
                            </>
                        )}
                        </div>
                    );
                    })}
                </div>
                </div>

                {!isJoined ? (
                <Button onClick={handleJoin} disabled={session.status === 'FULL' || isLocked || isProcessing} className="w-full">
                    {isProcessing && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    {isProcessing ? 'Joining...' : session.status === 'FULL' ? 'Session Full' : 'Join Session'}
                </Button>
                ) : (
                <div className="flex gap-2">
                    <Button variant="danger" onClick={() => setLeaveModalOpen(true)} disabled={isLocked || isProcessing} className="flex-1">
                    {isLocked ? 'Locked' : 'Leave'}
                    </Button>
                    <Button variant="secondary" onClick={() => setRecorderOpen(true)} className="flex-1">
                    Record Match
                    </Button>
                </div>
                )}
            </>
        )}

        {activeTab === 'Matches' && (
            <div className="space-y-3">
                {matches.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p>No matches recorded yet.</p>
                        {isJoined && (
                            <button onClick={() => { setActiveTab('Overview'); setRecorderOpen(true); }} className="text-emerald-600 font-bold mt-2 text-sm">
                                Record the first match!
                            </button>
                        )}
                    </div>
                ) : (
                    matches.map(match => (
                        <MatchItem key={match.id} match={match} players={allUsers} />
                    ))
                )}
            </div>
        )}

      </Card>

      <Modal isOpen={isLeaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Confirm Leave">
        <p className="text-slate-600 mb-6">Are you sure you want to give up your spot? Someone else might take it immediately.</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setLeaveModalOpen(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleLeave} disabled={isProcessing} className="flex-1">
            {isProcessing && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isProcessing ? 'Leaving...' : 'Leave'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isRecorderOpen} onClose={() => setRecorderOpen(false)} title="Record Match">
         <MatchRecorder 
            session={session} 
            players={players} 
            onClose={() => setRecorderOpen(false)} 
            onRecord={() => { 
                setRecorderOpen(false); 
                fetchData(); // Refresh matches
                setActiveTab('Matches'); // Auto switch to matches tab
            }} 
         />
      </Modal>
    </div>
  );
};

const ProfileView = () => {
  const { user, logout, updateProfile } = React.useContext(UserContext);
  const [matches, setMatches] = useState<Match[]>([]);
  const [history, setHistory] = useState<Session[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [activeTab, setActiveTab] = useState('Stats');
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if(user) {
      mockDb.getUserMatches(user.id).then(setMatches);
      mockDb.getUserSessions(user.id).then(setHistory);
    }
  }, [user]);

  const stats = useMemo(() => {
    if (!user) return { won: 0, played: 0, form: [] };
    const played = matches.length;
    let won = 0;
    const form: string[] = [];
    
    // Sort matches by date desc
    const sorted = [...matches].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    sorted.forEach(m => {
      const isTeamA = m.teamA.includes(user.id);
      const isWinner = (isTeamA && m.winner === 'A') || (!isTeamA && m.winner === 'B');
      if (isWinner) won++;
      if (form.length < 5) form.push(isWinner ? 'W' : 'L');
    });

    return { won, played, form: form.reverse() };
  }, [matches, user]);

  const handleAiCoach = async () => {
    setLoadingTips(true);
    // Prepare data for AI
    const matchData = matches.slice(0, 5).map(m => {
        const isTeamA = m.teamA.includes(user!.id);
        return {
            scoreA: m.scoreA,
            scoreB: m.scoreB,
            result: (isTeamA && m.winner === 'A') || (!isTeamA && m.winner === 'B') ? 'Win' : 'Loss'
        }
    });
    
    const newTips = await getBadmintonTips(stats, matchData);
    setTips(newTips);
    setLoadingTips(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const avatarUrl = (form.elements.namedItem('avatarUrl') as HTMLInputElement).value;
    const skillLevel = parseInt((form.elements.namedItem('skillLevel') as HTMLInputElement).value);
    
    await updateProfile({ name, avatarUrl: avatarUrl || undefined, skillLevel });
    setEditModalOpen(false);
  };

  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const pieData = [{ name: 'Won', value: stats.won }, { name: 'Lost', value: stats.played - stats.won }];
  const COLORS = ['#10b981', '#cbd5e1'];

  return (
    <div className="pb-24 p-4 animate-in fade-in">
       {/* Changed navigate(-1) to navigate('/') for reliable 'Back' behavior */}
       <button onClick={() => navigate('/')} className="mb-4 p-2 bg-white border rounded-full">
          <ArrowLeft className="w-5 h-5"/>
       </button>
       
       <div className="flex items-center gap-4 mb-8">
         <div className="relative">
             <Avatar url={user?.avatarUrl} alt={user?.name || ''} size="xl" />
             <button 
                onClick={() => setEditModalOpen(true)}
                className="absolute -bottom-1 -right-1 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-500 hover:text-emerald-600"
             >
                 <Edit className="w-3 h-3" />
             </button>
         </div>
         <div className="flex-1">
           <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
           <div className="flex items-center gap-2">
             <p className="text-slate-500">Skill Level: {user?.skillLevel}/10</p>
           </div>
         </div>
       </div>

       <TabBar tabs={['Stats', 'History']} active={activeTab} onChange={setActiveTab} />

       {activeTab === 'Stats' && (
         <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="flex flex-col items-center justify-center p-6">
                <div className="h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={30} outerRadius={40} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-2xl font-bold text-slate-800">{winRate}%</div>
                <div className="text-xs text-slate-400">Win Rate</div>
            </Card>
            <div className="space-y-4">
              <Card className="flex-1 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-slate-800">{stats.played}</div>
                  <div className="text-xs text-slate-400">Matches</div>
              </Card>
              <Card className="flex-1 flex flex-col justify-center items-center">
                  <div className="flex gap-1">
                    {stats.form.map((r, i) => (
                      <span key={i} className={`font-bold ${r === 'W' ? 'text-emerald-500' : 'text-red-400'}`}>{r}</span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-400">Recent Form</div>
              </Card>
            </div>
          </div>

          <Card className="mb-6 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Brain className="w-5 h-5"/></div>
                  <h3 className="font-bold text-slate-800">AI Coach</h3>
                </div>
                <Button onClick={handleAiCoach} variant="secondary" className="text-xs py-1 px-3 h-auto" disabled={loadingTips}>
                  {loadingTips ? 'Analyzing...' : 'Analyze My Game'}
                </Button>
              </div>
              
              {tips.length > 0 ? (
                <ul className="space-y-3">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Tap "Analyze" to get personalized coaching tips based on your match history.
                </p>
              )}
          </Card>
         </>
       )}

       {activeTab === 'History' && (
         <div className="space-y-6">
            {(() => {
                const now = new Date();
                const getDate = (s: Session) => new Date(`${s.date}T${s.endTime}`);
                
                const upcoming = history
                  .filter(s => getDate(s) > now)
                  .sort((a,b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());
                
                const past = history.filter(s => getDate(s) <= now); 

                if (history.length === 0) {
                     return (
                        <div className="text-center p-8 bg-slate-100 rounded-2xl text-slate-500">
                            You haven't joined any sessions yet.
                        </div>
                     );
                }

                return (
                    <>
                         {upcoming.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Upcoming
                                </h3>
                                {upcoming.map(s => <SessionCard key={s.id} session={s} />)}
                            </div>
                         )}

                         {past.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-500 flex items-center gap-2">
                                    <History className="w-4 h-4" /> Past Sessions
                                </h3>
                                <div className="opacity-80">
                                    {past.map(s => <SessionCard key={s.id} session={s} />)}
                                </div>
                            </div>
                         )}
                    </>
                );
            })()}
         </div>
       )}

       <Button variant="danger" onClick={logout} className="w-full mt-6">
         <LogOut className="w-5 h-5 mr-2" /> Log Out
       </Button>

       <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                  <input 
                      name="name" 
                      required 
                      defaultValue={user?.name}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
                  <div className="relative">
                      <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input 
                          name="avatarUrl" 
                          defaultValue={user?.avatarUrl}
                          placeholder="https://..."
                          className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Paste a link to an image.</p>
              </div>
              <div className="space-y-2 pt-2">
                    <div className="flex justify-between">
                        <label className="text-sm font-medium text-slate-700">Skill Level (1-10)</label>
                        <span className="text-emerald-600 font-bold"></span>
                    </div>
                    <input 
                        name="skillLevel" 
                        type="range" 
                        min="1" 
                        max="10" 
                        defaultValue={user?.skillLevel}
                        className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Beginner</span>
                        <span>Pro</span>
                    </div>
              </div>
              <Button className="w-full mt-4">Save Changes</Button>
          </form>
       </Modal>
    </div>
  );
};

// --- Layout & Nav ---

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = React.useContext(UserContext);
  
  const isHome = location.pathname === '/';
  
  // Simple FAB logic
  const [fabOpen, setFabOpen] = useState(false);

  // Restore path on mount
  useEffect(() => {
    const savedPath = localStorage.getItem('badmintonHub_lastPath');
    if (savedPath && savedPath !== '/' && location.pathname === '/') {
      navigate(savedPath);
    }
  }, []);

  // Save path on change
  useEffect(() => {
    if (location.pathname !== '/') {
        localStorage.setItem('badmintonHub_lastPath', location.pathname);
    }
  }, [location]);

  // If not authenticated, render LoginView (App handles conditional rendering, but extra safety here)
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans text-slate-900">
      <main className="min-h-screen overflow-y-auto no-scrollbar pt-4 px-4">
         <Routes>
           <Route path="/" element={<DashboardView />} />
           <Route path="/create-club" element={<CreateClubView />} />
           <Route path="/club/:id" element={<ClubDetailView />} />
           <Route path="/session/:id" element={<SessionDetailView />} />
           <Route path="/profile" element={<ProfileView />} />
         </Routes>
      </main>

      {/* Persistent FAB */}
      <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-3">
         {fabOpen && (
           <>
            <button 
              onClick={() => { setFabOpen(false); navigate('/create-club'); }} 
              className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in slide-in-from-bottom-5 hover:bg-emerald-50"
            >
               Create Club <Shield className="w-4 h-4 text-emerald-600"/>
            </button>
           </>
         )}
         <button 
           onClick={() => setFabOpen(!fabOpen)}
           className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all ${fabOpen ? 'bg-slate-700 rotate-45' : 'bg-emerald-600 hover:scale-105'}`}
         >
           <Plus className="w-7 h-7" />
         </button>
      </div>

      {/* Simple Bottom Nav for context switching */}
      {isHome && (
         <div className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-100 flex justify-around p-3 pb-6 z-30">
            <button className="flex flex-col items-center text-emerald-600">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">Home</span>
            </button>
            <button onClick={() => navigate('/profile')} className="flex flex-col items-center text-slate-400 hover:text-emerald-500">
              <UserIcon className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-1">Profile</span>
            </button>
         </div>
      )}
    </div>
  );
};

// --- Entry ---

const App = () => {
  const auth = useAuth();

  return (
    <UserContext.Provider value={auth}>
      {auth.loading ? (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-emerald-600">
           <Activity className="w-8 h-8 animate-spin" />
        </div>
      ) : !auth.user ? (
        <AuthView />
      ) : (
        <HashRouter>
          <Layout />
        </HashRouter>
      )}
    </UserContext.Provider>
  );
};

export default App;
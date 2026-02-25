import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Plus, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Thermometer, 
  Wind, 
  ChevronRight,
  X,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { User, Location as PropertyLocation } from './types';
import { getLeakAssessment } from './services/geminiService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [locations, setLocations] = useState<PropertyLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PropertyLocation | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  
  const [assessment, setAssessment] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  const fetchLocations = async () => {
    const res = await fetch('/api/locations');
    const data = await res.json();
    setLocations(data);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      setShowLogin(false);
    } else {
      setLoginError(data.message);
    }
  };

  const handleAddLocation = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLocationName }),
    });
    const data = await res.json();
    setLocations([...locations, data]);
    setNewLocationName('');
    setShowAddLocation(false);
  };

  const analyzeLocation = async (loc: PropertyLocation) => {
    setIsAnalyzing(true);
    setAssessment(null);
    const result = await getLeakAssessment({
      locationName: loc.name,
      humidity: loc.humidity,
      waterPresence: loc.water_presence === 1,
      temperature: loc.temperature
    });
    setAssessment(result);
    setIsAnalyzing(false);
  };

  const simulateLeak = async (loc: PropertyLocation) => {
    const isLeaking = loc.status === 'Safe';
    const res = await fetch(`/api/locations/${loc.id}/simulate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: isLeaking ? 'Leaking' : 'Safe',
        humidity: isLeaking ? 85.0 : 45.0,
        water_presence: isLeaking ? 1 : 0,
        temperature: loc.temperature
      }),
    });
    if (res.ok) {
      fetchLocations();
      if (selectedLocation?.id === loc.id) {
        const updated = { ...loc, status: isLeaking ? 'Leaking' : 'Safe' as any, humidity: isLeaking ? 85.0 : 45.0, water_presence: isLeaking ? 1 : 0 };
        setSelectedLocation(updated);
        analyzeLocation(updated);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full"
        >
          <div className="mb-8 flex justify-center">
            <div className="bg-primary-blue/10 p-6 rounded-full">
              <Droplets className="w-16 h-16 text-primary-blue" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary-blue mb-4 tracking-tight">
            Welcome to Your Home Leak Detection App
          </h1>
          <p className="text-slate-500 mb-12 text-lg">
            Protect your property with real-time monitoring and intelligent AI insights.
          </p>
          <button 
            onClick={() => setShowLogin(true)}
            className="btn-primary w-full text-xl py-4"
          >
            Login
          </button>
        </motion.div>

        <AnimatePresence>
          {showLogin && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-primary-blue">Login to AquaGuard</h2>
                  <button onClick={() => setShowLogin(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field w-full" 
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field w-full" 
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  
                  {loginError && (
                    <p className="text-safety-red font-bold text-center">{loginError}</p>
                  )}
                  
                  <button type="submit" className="btn-primary w-full py-4 text-lg">
                    Submit
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-primary-blue text-white p-6 sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">AquaGuard</h1>
          </div>
          <button onClick={() => setUser(null)} className="flex items-center gap-2 font-bold hover:opacity-80">
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Command Center</h2>
            <p className="text-slate-500">Monitoring {locations.length} locations</p>
          </div>
          <button 
            onClick={() => setShowAddLocation(true)}
            className="flex items-center gap-2 bg-white text-primary-blue font-bold py-2 px-4 rounded-lg border-2 border-primary-blue hover:bg-primary-blue hover:text-white transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Location
          </button>
        </div>

        {/* Location List */}
        <div className="grid gap-4">
          {locations.map((loc) => (
            <motion.div 
              key={loc.id}
              layoutId={`loc-${loc.id}`}
              onClick={() => {
                setSelectedLocation(loc);
                analyzeLocation(loc);
              }}
              className={`bg-white p-6 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                loc.status === 'Leaking' ? 'border-safety-red/30' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${loc.status === 'Leaking' ? 'bg-safety-red/10' : 'bg-primary-blue/10'}`}>
                    {loc.status === 'Leaking' ? (
                      <AlertTriangle className="w-6 h-6 text-safety-red" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-primary-blue" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{loc.name}</h3>
                    <p className={`font-bold ${loc.status === 'Leaking' ? 'text-safety-red' : 'text-emerald-600'}`}>
                      {loc.status === 'Leaking' ? 'ACTIVE LEAK DETECTED' : 'System Safe'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Location Detail Modal */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              layoutId={`loc-${selectedLocation.id}`}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className={`p-6 flex justify-between items-center text-white ${
                selectedLocation.status === 'Leaking' ? 'bg-safety-red' : 'bg-primary-blue'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedLocation.status === 'Leaking' ? <ShieldAlert className="w-8 h-8" /> : <Droplets className="w-8 h-8" />}
                  <h2 className="text-2xl font-bold">{selectedLocation.name}</h2>
                </div>
                <button onClick={() => setSelectedLocation(null)} className="p-2 hover:bg-white/20 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <Wind className="w-6 h-6 text-primary-blue mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Humidity</p>
                    <p className="text-xl font-bold text-slate-900">{selectedLocation.humidity}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <Thermometer className="w-6 h-6 text-primary-blue mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Temp</p>
                    <p className="text-xl font-bold text-slate-900">{selectedLocation.temperature}°C</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <Droplets className="w-6 h-6 text-primary-blue mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Water</p>
                    <p className={`text-xl font-bold ${selectedLocation.water_presence ? 'text-safety-red' : 'text-emerald-600'}`}>
                      {selectedLocation.water_presence ? 'YES' : 'NO'}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Loader2 className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : 'hidden'}`} />
                    Gemini Intelligence Assessment
                  </h4>
                  <div className={`p-6 rounded-2xl border-2 ${
                    selectedLocation.status === 'Leaking' ? 'bg-safety-red/5 border-safety-red/20' : 'bg-primary-blue/5 border-primary-blue/20'
                  }`}>
                    {isAnalyzing ? (
                      <div className="flex items-center gap-4 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="font-medium">Analyzing sensor telemetry...</p>
                      </div>
                    ) : (
                      <div className="prose prose-slate max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">
                          {assessment || "No assessment available."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {selectedLocation.status === 'Leaking' && (
                    <button className="btn-danger flex-1 flex items-center justify-center gap-2 py-4">
                      <ShieldAlert className="w-6 h-6" />
                      SHUT OFF MAIN VALVE
                    </button>
                  )}
                  <button 
                    onClick={() => simulateLeak(selectedLocation)}
                    className="bg-slate-100 text-slate-600 font-bold py-4 px-6 rounded-lg hover:bg-slate-200 transition-all"
                  >
                    Simulate {selectedLocation.status === 'Safe' ? 'Leak' : 'Safe State'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddLocation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-primary-blue">Add New Location</h2>
                <button onClick={() => setShowAddLocation(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddLocation} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Location Name</label>
                  <input 
                    type="text" 
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="input-field w-full" 
                    placeholder="e.g. Master Bathroom, Garage"
                    required
                    autoFocus
                  />
                </div>
                
                <button type="submit" className="btn-primary w-full py-4 text-lg">
                  Add Location
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

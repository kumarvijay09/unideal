import React, { useState } from "react";
import { Icon } from "./Icons";
import { api, User } from "../services/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onNotify: (msg: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [email, setEmail] = useState("aarav@campus.edu");
  const [password, setPassword] = useState("student123");

  // Register form state
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [campusLocation, setCampusLocation] = useState("North Campus");
  const [hostel, setHostel] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      onNotify(`Welcome back, ${res.user.name}!`);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.register({
        name,
        email: regEmail,
        password: regPassword,
        campusLocation,
        hostel,
      });
      onNotify(`Account created! Welcome to UniDeal, ${res.user.name}!`);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.demoLogin(demoEmail);
      onNotify(`Logged in as demo student ${res.user.name}!`);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#F3F3EE] text-[#556070] transition hover:bg-[#E8E8E3] hover:text-[#102033]"
        >
          <Icon name="x" size={18} />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 rotate-[-4deg] place-items-center rounded-xl bg-[#C8FF35] text-[#102033]">
            <Icon name="shield" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#102033]">
              Campus Student Access
            </h2>
            <p className="text-xs text-[#6B7582]">
              Verified peer-to-peer campus marketplace
            </p>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mb-6 rounded-2xl bg-[#F8F7F3] p-3 border border-[#EBEBE5]">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#798390]">
            ⚡ Instant 1-Click Demo Login:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Aarav", email: "aarav@campus.edu", loc: "North Campus" },
              { name: "Meera", email: "meera@campus.edu", loc: "Block B" },
              { name: "Kabir", email: "kabir@campus.edu", loc: "Library Gate" },
              { name: "Rahul", email: "rahul@campus.edu", loc: "South Campus" },
            ].map((st) => (
              <button
                key={st.email}
                type="button"
                onClick={() => handleDemoLogin(st.email)}
                className="flex items-center gap-1.5 rounded-xl border border-[#DFDFD8] bg-white px-2.5 py-1.5 text-xs font-bold text-[#102033] shadow-sm transition hover:border-[#6D45D8] hover:bg-[#F3EFFE]"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#E5F8D2] text-[10px] font-extrabold text-[#2F5B10]">
                  {st.name[0]}
                </span>
                <span>{st.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mb-5 flex rounded-xl bg-[#F1F1EC] p-1">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              tab === "login"
                ? "bg-white text-[#102033] shadow-sm"
                : "text-[#69727E] hover:text-[#102033]"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              tab === "register"
                ? "bg-white text-[#102033] shadow-sm"
                : "text-[#69727E] hover:text-[#102033]"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#3B4758]">
                Student Email (.edu or campus mail)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D45D8] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#3B4758]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D45D8] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#102033] py-3 text-sm font-bold text-white transition hover:bg-[#6D45D8] disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In to Campus Market"}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#3B4758]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D45D8] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#3B4758]">
                Campus Email
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="priya@campus.edu"
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D45D8] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#3B4758]">
                Create Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D45D8] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#3B4758]">
                  Campus Area
                </label>
                <select
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                  className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3 py-2.5 text-xs font-medium outline-none"
                >
                  <option value="North Campus">North Campus</option>
                  <option value="South Campus">South Campus</option>
                  <option value="Hostel Block A">Hostel Block A</option>
                  <option value="Hostel Block B">Hostel Block B</option>
                  <option value="Girls Hostel 2">Girls Hostel 2</option>
                  <option value="Library Gate">Library Gate</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#3B4758]">
                  Hostel / Room
                </label>
                <input
                  type="text"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="Block B, 204"
                  className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3 py-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#6D45D8] py-3 text-sm font-bold text-white transition hover:bg-[#5833B5] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Join Campus Community"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

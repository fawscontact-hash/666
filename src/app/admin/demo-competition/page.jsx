"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Play, Pause, RefreshCw, Zap, Trophy,
  Settings, AlertTriangle, CheckCircle, Loader2,
} from "lucide-react";

const SPEED_OPTIONS = [
  { value: "slow",   label: "Slow",   desc: "0.4× growth",  color: "blue"   },
  { value: "medium", label: "Medium", desc: "1× growth",    color: "indigo" },
  { value: "fast",   label: "Fast",   desc: "2.5× growth",  color: "red"    },
];

export default function DemoCompetitionAdminPage() {
  const [competition, setCompetition] = useState(null);
  const [loading,     setLoading    ] = useState(true);
  const [busy,        setBusy       ] = useState(false);
  const [toast,       setToast      ] = useState(null);
  const [count,       setCount      ] = useState(75);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/demo-competition/summary");
      if (res.ok) {
        const data = await res.json();
        setCompetition(data.competition);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function apiPost(url, body = {}) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      return json;
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    if (!confirm(`Generate ${count} demo affiliates? This will replace all existing demo data.`)) return;
    try {
      const res = await apiPost("/api/admin/demo-competition/generate", { count });
      showToast(`✅ Generated ${res.count} demo affiliates!`);
      await loadStatus();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function handleToggle() {
    try {
      const res = await apiPost("/api/admin/demo-competition/toggle", {
        isEnabled: !competition?.isEnabled,
      });
      setCompetition(res);
      showToast(res.isEnabled ? "Competition enabled!" : "Competition paused.");
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function handleSpeed(speed) {
    try {
      const res = await apiPost("/api/admin/demo-competition/speed", { speed });
      setCompetition(res);
      showToast(`Speed set to ${speed}`);
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function handleSimulate() {
    try {
      const res = await apiPost("/api/demo-competition/simulate");
      if (res.skipped) showToast("Competition is paused — enable it first.", "warn");
      else showToast(`Simulated tick for ${res.ticked} affiliates!`);
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function handleRestart() {
    if (!confirm("Reset all demo stats and start a new 30-day competition?")) return;
    try {
      await apiPost("/api/admin/demo-competition/restart");
      showToast("Competition restarted!");
      await loadStatus();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  const daysLeft = competition?.endDate
    ? Math.max(0, Math.ceil((new Date(competition.endDate) - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast.type === "error" ? "bg-red-600 text-white" :
            toast.type === "warn"  ? "bg-amber-500 text-white" :
            "bg-green-600 text-white"}`}>
          {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 rounded-xl p-2.5">
          <Trophy className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Demo Competition</h1>
          <p className="text-sm text-gray-500">Manage fake affiliate leaderboard simulation</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Competition Status
        </h2>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : competition ? (
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Status" value={
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                competition.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {competition.isEnabled ? "🟢 Active" : "⏸ Paused"}
              </span>
            } />
            <InfoItem label="Speed"     value={<SpeedBadge speed={competition.speed} />} />
            <InfoItem label="Days left" value={`${daysLeft} days`} />
            <InfoItem label="Ends"      value={competition.endDate
              ? new Date(competition.endDate).toLocaleDateString("fr-MA")
              : "—"} />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No competition found. Generate demo affiliates to start.</p>
        )}
      </div>

      {/* Generate */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4" /> Generate Demo Affiliates
        </h2>
        <p className="text-xs text-gray-500">
          Creates fake affiliate accounts with 30 days of back-history. <strong>Replaces all existing demo data.</strong>
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Count:</label>
            <input
              type="number"
              min={10}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <ActionButton onClick={handleGenerate} busy={busy} icon={<Users className="w-4 h-4" />} color="indigo">
            Generate
          </ActionButton>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Simulation Controls
        </h2>

        <div className="flex flex-wrap gap-3">
          {/* Toggle */}
          <ActionButton
            onClick={handleToggle}
            busy={busy}
            icon={competition?.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            color={competition?.isEnabled ? "amber" : "green"}
          >
            {competition?.isEnabled ? "Pause" : "Enable"}
          </ActionButton>

          {/* Manual tick */}
          <ActionButton onClick={handleSimulate} busy={busy} icon={<Zap className="w-4 h-4" />} color="purple">
            Run Tick
          </ActionButton>

          {/* Restart */}
          <ActionButton onClick={handleRestart} busy={busy} icon={<RefreshCw className="w-4 h-4" />} color="red">
            Restart Competition
          </ActionButton>
        </div>

        {/* Speed */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Simulation Speed</p>
          <div className="flex gap-2">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => handleSpeed(s.value)}
                disabled={busy}
                className={`flex-1 rounded-xl border-2 py-2 px-3 text-center transition-all text-sm font-medium ${
                  competition?.speed === s.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                } disabled:opacity-50`}
              >
                <p>{s.label}</p>
                <p className="text-xs font-normal text-gray-400 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View leaderboard */}
      <a
        href="/affiliate/dashboard"
        className="block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        View Leaderboard → Affiliate Dashboard
      </a>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

const SPEED_COLORS = {
  slow:   "bg-blue-100 text-blue-700",
  medium: "bg-indigo-100 text-indigo-700",
  fast:   "bg-red-100 text-red-700",
};

function SpeedBadge({ speed }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SPEED_COLORS[speed] ?? "bg-gray-100 text-gray-600"}`}>
      {speed}
    </span>
  );
}

const BTN_COLORS = {
  indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
  green:  "bg-green-600  hover:bg-green-700  text-white",
  amber:  "bg-amber-500  hover:bg-amber-600  text-white",
  purple: "bg-purple-600 hover:bg-purple-700 text-white",
  red:    "bg-red-600    hover:bg-red-700    text-white",
};

function ActionButton({ onClick, busy, icon, color = "indigo", children }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${BTN_COLORS[color]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

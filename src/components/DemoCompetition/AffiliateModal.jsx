"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trophy, Users, TrendingUp, Clock, Star, ChevronRight, BarChart2 } from "lucide-react";

const RANK_EMOJI = { 1: "🥇", 2: "🥈", 3: "🥉" };
const BADGE_COLOR = {
  "Top Performer": "bg-yellow-100 text-yellow-800",
  "Fast Growing":  "bg-green-100  text-green-800",
  "Consistent":    "bg-blue-100   text-blue-800",
  "Rising Star":   "bg-purple-100 text-purple-800",
  "Power Seller":  "bg-red-100    text-red-800",
};

function fmt(n)  { return Number(n ?? 0).toLocaleString("fr-MA"); }
function fmtDH(n){ return `${fmt(n)} DH`; }

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Team", "Earnings"];

export default function AffiliateModal({ affiliateId, onClose }) {
  const [tab,     setTab    ] = useState("Overview");
  const [data,    setData   ] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/demo-competition/details?id=${affiliateId}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <HeaderSkeleton />
          ) : data ? (
            <HeaderContent data={data} />
          ) : null}

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-white text-indigo-700 shadow"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {loading ? (
            <BodySkeleton />
          ) : data ? (
            <>
              {tab === "Overview"  && <OverviewTab  data={data} />}
              {tab === "Team"      && <TeamTab      data={data} />}
              {tab === "Earnings"  && <EarningsTab  data={data} />}
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">Unable to load data.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function HeaderContent({ data }) {
  const rankEmoji = RANK_EMOJI[data.rank] ?? `#${data.rank}`;
  const badgeCls  = BADGE_COLOR[data.badge] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="flex items-start gap-4">
      <div className="relative shrink-0">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt={data.name} className="w-16 h-16 rounded-full border-2 border-white/40 bg-white" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
            {data.name?.[0]}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-lg">{rankEmoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-white font-bold text-lg leading-tight truncate">{data.name}</h2>
        <p className="text-white/70 text-sm">@{data.username}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.badge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
              {data.badge}
            </span>
          )}
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
            Rank #{data.rank}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
            {(data.followers ?? 0).toLocaleString()} followers
          </span>
        </div>
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-start gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-white/20" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 bg-white/20 rounded w-36" />
        <div className="h-3 bg-white/15 rounded w-24" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-white/15 rounded-full w-20" />
          <div className="h-5 bg-white/15 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data }) {
  const { stats } = data;
  return (
    <div className="space-y-4">
      <SectionTitle icon={<Trophy className="w-4 h-4" />} label="Main Stats" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Orders"     value={fmt(stats.totalOrders)}    color="indigo" />
        <StatCard label="Total Revenue"    value={fmtDH(stats.totalRevenue)} color="green"  />
        <StatCard label="Confirmed"        value={fmt(stats.confirmedOrders)} color="emerald"/>
        <StatCard label="Cancelled"        value={fmt(stats.cancelledOrders)} color="red"   />
      </div>

      <SectionTitle icon={<Clock className="w-4 h-4" />} label="Today's Performance" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Today Orders"   value={fmt(stats.todayOrders)}   color="blue"  />
        <StatCard label="Today Revenue"  value={fmtDH(stats.todayRevenue)} color="teal" />
      </div>
      {stats.lastHourOrders > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>+{stats.lastHourOrders} orders in the last hour</span>
        </div>
      )}
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────

function TeamTab({ data }) {
  const { stats } = data;
  return (
    <div className="space-y-4">
      <SectionTitle icon={<Users className="w-4 h-4" />} label="Team Summary" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Team Size"       value={fmt(stats.teamSize)}       color="purple" />
        <StatCard label="Team Orders"     value={fmt(stats.teamOrders)}     color="indigo" />
        <StatCard label="Team Revenue"    value={fmtDH(stats.teamRevenue)}  color="green"  />
        <StatCard label="Your Commission" value={fmtDH(stats.teamCommission)} color="amber"/>
      </div>
      <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
        <p className="font-semibold mb-1">Commission rate: 5%</p>
        <p className="text-purple-600">
          You earn <strong>{fmtDH(stats.teamCommission)}</strong> from your team's{" "}
          <strong>{fmt(stats.teamOrders)}</strong> orders this month.
        </p>
      </div>
    </div>
  );
}

// ── Earnings Tab ──────────────────────────────────────────────────────────────

function EarningsTab({ data }) {
  const history = data.earningsHistory ?? [];
  const maxRevenue = Math.max(...history.map(h => h.revenue), 1);

  return (
    <div className="space-y-4">
      <SectionTitle icon={<BarChart2 className="w-4 h-4" />} label="Daily Earnings (last 30 days)" />

      {history.length === 0 ? (
        <p className="text-center text-gray-400 py-6">No earnings history yet.</p>
      ) : (
        <>
          {/* Mini bar chart */}
          <div className="flex items-end gap-0.5 h-16 bg-gray-50 rounded-xl p-2">
            {[...history].reverse().map((h, i) => {
              const heightPct = Math.round((h.revenue / maxRevenue) * 100);
              return (
                <div key={i} className="flex-1 flex items-end" title={`${fmtDH(h.revenue)}`}>
                  <div
                    className="w-full rounded-sm bg-indigo-400 hover:bg-indigo-600 transition-colors"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* List */}
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-gray-500">
                  {new Date(h.date).toLocaleDateString("fr-MA", { day: "2-digit", month: "short" })}
                </span>
                <span className="font-medium text-gray-800">{fmt(h.orders)} orders</span>
                <span className="font-semibold text-indigo-700">{fmtDH(h.revenue)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-700",  label: "text-indigo-500"  },
  green:   { bg: "bg-green-50",   text: "text-green-700",   label: "text-green-500"   },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", label: "text-emerald-500" },
  red:     { bg: "bg-red-50",     text: "text-red-700",     label: "text-red-500"     },
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    label: "text-blue-500"    },
  teal:    { bg: "bg-teal-50",    text: "text-teal-700",    label: "text-teal-500"    },
  purple:  { bg: "bg-purple-50",  text: "text-purple-700",  label: "text-purple-500"  },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   label: "text-amber-500"   },
};

function StatCard({ label, value, color = "indigo" }) {
  const c = COLOR_MAP[color];
  return (
    <div className={`${c.bg} rounded-xl p-3`}>
      <p className={`text-xs font-medium ${c.label} mb-1`}>{label}</p>
      <p className={`text-lg font-bold ${c.text}`}>{value}</p>
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm border-b pb-2">
      <span className="text-indigo-500">{icon}</span>
      {label}
    </div>
  );
}

function BodySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

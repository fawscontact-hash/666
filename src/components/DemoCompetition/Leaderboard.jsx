"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, TrendingUp, RefreshCw, Users, Flame, ChevronRight } from "lucide-react";
import AffiliateModal from "./AffiliateModal";

// ── Constants ─────────────────────────────────────────────────────────────────

const RANK_META = {
  1: { emoji: "🥇", gradient: "from-amber-400  to-yellow-300",  ring: "ring-amber-300",  bg: "bg-amber-50",   text: "text-amber-700",  glow: "shadow-amber-200/60"  },
  2: { emoji: "🥈", gradient: "from-slate-400   to-gray-300",   ring: "ring-slate-300",  bg: "bg-slate-50",   text: "text-slate-600",  glow: "shadow-slate-200/60"  },
  3: { emoji: "🥉", gradient: "from-orange-400  to-amber-300",  ring: "ring-orange-300", bg: "bg-orange-50",  text: "text-orange-700", glow: "shadow-orange-200/60" },
};


const fmt   = (n) => Number(n ?? 0).toLocaleString("fr-MA");
const fmtDH = (n) => `${fmt(n)} DH`;

// ── Main Component ────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [data,       setData      ] = useState(null);
  const [loading,    setLoading   ] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo-competition/summary");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const leaderboard = data?.leaderboard ?? [];
  const competition = data?.competition;
  const daysLeft    = competition
    ? Math.max(0, Math.ceil((new Date(competition.endDate) - Date.now()) / 86_400_000))
    : null;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <>
      <div className="rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 pt-5 pb-6">

          {/* decorative circles */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute top-8 -left-4 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Trophy className="w-4.5 h-4.5 w-[18px] h-[18px] text-yellow-300" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">Top Affiliés du Mois</h2>
                <p className="text-white/60 text-xs mt-0.5">
                  {daysLeft !== null ? `⏳ ${daysLeft} jours restants` : "Compétition en direct"}
                </p>
              </div>
            </div>
            <button
              onClick={load}
              aria-label="Refresh"
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white/80 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* ── Top 3 Podium ── */}
          {!loading && top3.length === 3 ? (
            <div className="flex items-end justify-center gap-3">
              <PodiumCard aff={top3[1]} rank={2} onTap={setSelectedId} />
              <PodiumCard aff={top3[0]} rank={1} onTap={setSelectedId} hero />
              <PodiumCard aff={top3[2]} rank={3} onTap={setSelectedId} />
            </div>
          ) : loading ? (
            <PodiumSkeleton />
          ) : null}
        </div>

        {/* ── Rank 4+ Cards ── */}
        <div className="px-3 py-3 space-y-2">
          {loading ? (
            [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
          ) : rest.length === 0 && leaderboard.length === 0 ? (
            <EmptyState />
          ) : (
            rest.map((aff) => (
              <RankCard
                key={aff.id}
                aff={aff}
                onTap={() => setSelectedId(aff.id)}
              />
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && leaderboard.length > 0 && (
          <p className="text-center text-[11px] text-gray-400 py-3 border-t border-gray-50">
            Mis à jour toutes les 60s · Appuyez pour voir les détails
          </p>
        )}
      </div>

      {/* ── Modal ── */}
      {selectedId && (
        <AffiliateModal
          affiliateId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

// ── Podium Card (top 3, inside header) ───────────────────────────────────────

function PodiumCard({ aff, rank, onTap, hero = false }) {
  const meta = RANK_META[rank];

  return (
    <button
      onClick={() => onTap(aff.id)}
      className={`flex flex-col items-center active:scale-95 transition-transform ${
        hero ? "flex-[1.25]" : "flex-1"
      }`}
    >
      {/* medal */}
      <span className={`text-2xl mb-1.5 drop-shadow ${hero ? "text-3xl" : ""}`}>
        {meta.emoji}
      </span>

      {/* avatar ring */}
      <div className={`relative rounded-full bg-gradient-to-br ${meta.gradient} p-0.5 shadow-lg ${meta.glow} ${hero ? "shadow-xl" : ""}`}>
        {aff.avatarUrl ? (
          <img
            src={aff.avatarUrl}
            alt={aff.name}
            className={`rounded-full bg-white object-cover ${hero ? "w-16 h-16" : "w-12 h-12"}`}
          />
        ) : (
          <div className={`rounded-full bg-white flex items-center justify-center font-bold text-gray-700 ${hero ? "w-16 h-16 text-xl" : "w-12 h-12 text-base"}`}>
            {aff.name?.[0]}
          </div>
        )}
        {/* live dot */}
        {aff.todayOrders > 0 && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
        )}
      </div>

      {/* name */}
      <p className="text-white font-semibold text-xs mt-1.5 max-w-[72px] truncate text-center leading-tight">
        {aff.name.split(" ")[0]}
      </p>

      {/* orders pill */}
      <div className={`mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${meta.bg} ${meta.text}`}>
        {fmt(aff.totalOrders)} cmd
      </div>

      {/* today badge */}
      {aff.todayOrders > 0 && (
        <span className="mt-1 flex items-center gap-0.5 text-[10px] text-emerald-300 font-semibold">
          <Flame className="w-2.5 h-2.5" />
          +{aff.todayOrders}
        </span>
      )}
    </button>
  );
}

const BADGE_STYLE = {
  "Top Performer": "bg-yellow-100 text-yellow-800",
  "Fast Growing":  "bg-emerald-100 text-emerald-800",
  "Consistent":    "bg-blue-100 text-blue-800",
  "Rising Star":   "bg-purple-100 text-purple-800",
  "Power Seller":  "bg-rose-100 text-rose-700",
};

// ── Rank Card (rank 4+) ───────────────────────────────────────────────────────

function RankCard({ aff, onTap }) {
  const isHot = aff.todayOrders >= 5;

  return (
    <button
      onClick={onTap}
      className="w-full bg-gray-50 active:bg-indigo-50 rounded-2xl px-4 py-3 active:scale-[0.98] transition-all text-left group"
    >
      <div className="flex items-center gap-3">

        {/* rank */}
        <div className="w-6 text-center shrink-0">
          <span className="text-sm font-extrabold text-gray-300">#{aff.rank}</span>
        </div>

        {/* avatar */}
        <div className="relative shrink-0">
          {aff.avatarUrl ? (
            <img src={aff.avatarUrl} alt={aff.name} className="w-11 h-11 rounded-xl object-cover bg-gray-200" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base">
              {aff.name?.[0]}
            </div>
          )}
          {isHot && <span className="absolute -top-1 -right-1 text-sm leading-none">🔥</span>}
        </div>

        {/* name + badge + stats — takes all remaining space */}
        <div className="flex-1 min-w-0">

          {/* row 1: name */}
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{aff.name}</p>

          {/* row 2: badge */}
          {aff.badge && (
            <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${BADGE_STYLE[aff.badge] ?? "bg-gray-100 text-gray-600"}`}>
              {aff.badge}
            </span>
          )}

          {/* row 3: orders + today */}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3 text-indigo-400 shrink-0" />
              <strong className="text-gray-800">{fmt(aff.totalOrders)}</strong> cmd
            </span>
            {aff.todayOrders > 0 && (
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                +{aff.todayOrders} auj.
              </span>
            )}
          </div>
        </div>

        {/* revenue + team + arrow — fixed width so it never overlaps */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-indigo-600 whitespace-nowrap">
              {fmtDH(aff.totalRevenue)}
            </p>
            <p className="text-[10px] text-gray-400 flex items-center justify-end gap-0.5 mt-0.5">
              <Users className="w-2.5 h-2.5" />{aff.teamSize}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-active:text-indigo-400 transition-colors shrink-0" />
        </div>

      </div>
    </button>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function PodiumSkeleton() {
  return (
    <div className="flex items-end justify-center gap-3 animate-pulse">
      {[12, 16, 10].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className={`w-${h} h-${h} rounded-full bg-white/20`} />
          <div className="h-2.5 bg-white/15 rounded-full w-14" />
          <div className="h-5 bg-white/10 rounded-full w-16" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 animate-pulse">
      <div className="w-7 h-4 bg-gray-200 rounded" />
      <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-28" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
        <div className="h-2.5 bg-gray-100 rounded w-8 ml-auto" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Trophy className="w-10 h-10 mb-3 text-gray-200" />
      <p className="font-semibold text-gray-500 text-sm">Aucune donnée</p>
      <p className="text-xs mt-1 text-center px-4">Générez des affiliés depuis le panneau admin.</p>
    </div>
  );
}

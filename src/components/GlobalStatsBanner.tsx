/**
 * GlobalStatsBanner — live stats bar powered by Firestore.
 *
 * Subscribes to the top-burners snapshot (same query the leaderboard uses)
 * and aggregates totals in real-time. Stats animate on mount and whenever
 * the value changes via a smooth count-up effect.
 */

import { useEffect, useRef, useState } from "react";
import { subscribeTopBurners, type GlobalStats } from "@/lib/firebaseService";
import { Flame, Users, Wallet, TrendingUp } from "lucide-react";

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const rafRef     = useRef<number>(0);
  const startRef   = useRef<number>(0);
  const fromRef    = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed  = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 4);
      const current  = from + delta * eased;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({
  icon: Icon,
  label,
  value,
  suffix = "",
  iconColor = "text-primary",
  valueColor = "text-foreground",
  decimals = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  iconColor?: string;
  valueColor?: string;
  decimals?: number;
}) {
  const animated = useCountUp(value);

  const formatted =
    decimals > 0
      ? animated.toFixed(decimals)
      : Math.round(animated).toLocaleString();

  return (
    <div className="flex flex-col items-center gap-1.5 px-5 py-4 min-w-[110px]">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-0.5 ${iconColor}`}
        style={{ background: "hsl(var(--secondary)/0.8)", border: "1px solid hsl(var(--border)/0.6)" }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className={`text-2xl font-black tabular-nums tracking-tight leading-none ${valueColor}`}
        style={{ fontFamily: "'Syne', sans-serif" }}>
        {formatted}
        {suffix && <span className="text-sm font-semibold ml-0.5 opacity-60">{suffix}</span>}
      </span>
      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground)/0.45)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GlobalStatsBanner({ activeUsers = 0 }: { activeUsers?: number }) {
  const [stats, setStats] = useState<GlobalStats>({
    totalBurned:  0,
    totalWallets: 0,
    totalFeeSol:  0,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = subscribeTopBurners(200, (_entries, globalStats) => {
      setStats(globalStats);
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) {
    return (
      <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(var(--border)/0.4)", background: "hsl(var(--card))" }}>
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.25), transparent)" }} />
        <div className="flex items-center justify-center gap-6 px-6 py-5 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-7 w-20 rounded-lg" style={{ background: "hsl(var(--muted)/0.4)" }} />
              <div className="h-2 w-14 rounded" style={{ background: "hsl(var(--muted)/0.25)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(var(--primary)/0.12)", background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)/0.6))", boxShadow: "0 0 60px hsl(var(--primary)/0.04), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
      {/* Top accent */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.4), transparent)" }} />

      <div className="flex flex-wrap items-center justify-center gap-0" style={{ borderBottom: "none" }}>

        {/* Burning now */}
        <div className="flex flex-col items-center gap-1.5 px-5 py-4 min-w-[110px]" style={{ borderRight: "1px solid hsl(var(--border)/0.25)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-0.5"
            style={{ background: "hsl(142 70% 45% / 0.10)", border: "1px solid hsl(142 70% 45% / 0.22)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
          </div>
          <span className="text-2xl font-black tabular-nums tracking-tight leading-none text-green-400" style={{ fontFamily: "'Syne', sans-serif" }}>
            {activeUsers}
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground)/0.45)" }}>
            Burning Now
          </span>
        </div>

        {/* Dividers between tiles */}
        <div style={{ borderRight: "1px solid hsl(var(--border)/0.25)" }}>
          <StatTile
            icon={Flame}
            label="NFTs Burned"
            value={stats.totalBurned}
            iconColor="text-primary"
            valueColor="text-primary"
          />
        </div>

        <div style={{ borderRight: "1px solid hsl(var(--border)/0.25)" }}>
          <StatTile
            icon={Wallet}
            label="Total SOL Fees"
            value={stats.totalFeeSol}
            suffix="◎"
            iconColor="text-yellow-400"
            valueColor="text-yellow-400"
            decimals={3}
          />
        </div>

        <div style={{ borderRight: "1px solid hsl(var(--border)/0.25)" }}>
          <StatTile
            icon={Users}
            label="Unique Burners"
            value={stats.totalWallets}
            iconColor="text-blue-400"
            valueColor="text-blue-400"
          />
        </div>

        <StatTile
          icon={TrendingUp}
          label="Avg per Wallet"
          value={stats.totalWallets > 0 ? stats.totalBurned / stats.totalWallets : 0}
          iconColor="text-violet-400"
          valueColor="text-violet-400"
          decimals={1}
        />
      </div>

      {/* Bottom accent */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.20), transparent)" }} />
    </div>
  );
}

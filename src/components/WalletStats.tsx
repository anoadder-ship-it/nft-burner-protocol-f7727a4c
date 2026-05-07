/**
 * WalletStats — personal burn history panel for the connected wallet.
 * Reads live from Firestore via onSnapshot; shows stats, rank badge,
 * and a scrollable list of every burn transaction with Explorer links.
 */

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Flame, Trophy, Wallet, ExternalLink, Clock,
  TrendingDown, Hash, Skull, Crown, Medal,
} from "lucide-react";
import { subscribeWalletStats, type WalletStats as WalletStatsType } from "@/lib/firebaseService";

// ── Rank badge ────────────────────────────────────────────────────────────────

const RankDisplay = ({ rank }: { rank: number | null }) => {
  if (rank === null) return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-black text-muted-foreground/30">—</span>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/30 mt-0.5">unranked</span>
    </div>
  );

  const Icon   = rank === 1 ? Crown : rank <= 3 ? Medal : Trophy;
  const color  = rank === 1
    ? "text-yellow-400"
    : rank === 2
      ? "text-slate-400"
      : rank === 3
        ? "text-amber-600"
        : "text-primary/60";

  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className={`text-3xl font-black tabular-nums ${color}`}>#{rank}</span>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">global rank</span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const WalletStats = () => {
  const { publicKey, connected } = useWallet();
  const [stats,   setStats]   = useState<WalletStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) { setStats(null); setLoading(false); return; }

    setLoading(true);
    const unsub = subscribeWalletStats(publicKey.toString(), (s) => {
      setStats(s);
      setLoading(false);
    });
    return () => unsub();
  }, [publicKey]);

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-16 text-center slide-up">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border/40 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground/60">Connect your wallet to view your burn history</p>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-16 text-center slide-up">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[12px] text-muted-foreground/40 font-mono">Loading your stats…</p>
      </div>
    );
  }

  // ── Never burned ─────────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 slide-up">
        <div className="rounded-2xl border border-border/40 bg-card p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center mx-auto">
            <Skull className="w-7 h-7 text-primary/30" />
          </div>
          <div>
            <p className="font-bold text-muted-foreground/60 text-sm">No burns yet</p>
            <p className="text-[11px] text-muted-foreground/30 mt-1">
              Head to the <span className="text-primary/60 font-semibold">Burn</span> tab and start destroying.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 bg-secondary/30 font-mono text-[10px] text-muted-foreground/40">
            <Wallet className="w-3 h-3" />
            {publicKey?.toString().slice(0, 8)}…{publicKey?.toString().slice(-6)}
          </div>
        </div>
      </div>
    );
  }

  const lastDate = stats.lastBurnAt ? new Date(stats.lastBurnAt) : null;

  // ── Stats panel ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6 slide-up">

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
          Your <span className="text-primary fire-glow">Stats</span>
        </h2>
        <p className="text-[11px] font-mono text-muted-foreground/40 flex items-center justify-center gap-1.5">
          <Wallet className="w-3 h-3" />
          {stats.walletShort}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "NFTs Burned",
            value: stats.burned.toLocaleString(),
            icon:  Flame,
            iconBg: "hsl(var(--primary)/0.12)",
            iconBorder: "hsl(var(--primary)/0.28)",
            iconColor: "text-primary",
            valueColor: "text-primary",
          },
          {
            label: "SOL in Fees",
            value: `${stats.feeSol.toFixed(4)}`,
            sub:   "SOL",
            icon:  TrendingDown,
            iconBg: "hsl(48 96% 53% / 0.10)",
            iconBorder: "hsl(48 96% 53% / 0.24)",
            iconColor: "text-yellow-400",
            valueColor: "text-yellow-400",
          },
          {
            label: "Transactions",
            value: stats.signatures.length.toString(),
            icon:  Hash,
            iconBg: "hsl(210 90% 60% / 0.10)",
            iconBorder: "hsl(210 90% 60% / 0.22)",
            iconColor: "text-blue-400",
            valueColor: "text-blue-400",
          },
          {
            label: "Avg per Tx",
            value: stats.signatures.length > 0
              ? (stats.burned / stats.signatures.length).toFixed(1)
              : "—",
            sub:   stats.signatures.length > 0 ? "NFTs" : undefined,
            icon:  Skull,
            iconBg: "hsl(270 70% 60% / 0.10)",
            iconBorder: "hsl(270 70% 60% / 0.22)",
            iconColor: "text-violet-400",
            valueColor: "text-violet-400",
          },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconBorder, iconColor, valueColor }) => (
          <div key={label} className="stat-card rounded-xl px-4 py-4 text-center"
            style={{ background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--secondary)/0.5))", border: "1px solid hsl(var(--border)/0.7)", boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className={`font-black text-2xl font-mono leading-none tabular-nums ${valueColor}`}
              style={{ fontFamily: "'Syne', sans-serif" }}>
              {value}
              {sub && <span className="text-xs font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</span>}
            </div>
            <div className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: "hsl(var(--muted-foreground)/0.45)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Rank + last burn */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/40 bg-card px-4 py-5 flex flex-col items-center justify-center gap-1">
          <RankDisplay rank={stats.rank} />
        </div>
        <div className="rounded-xl border border-border/40 bg-card px-4 py-5 flex flex-col items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground/30" />
          {lastDate ? (
            <>
              <p className="font-mono text-sm font-bold tabular-nums text-foreground/70">
                {lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/40">
                {lastDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground/30">—</p>
          )}
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30">last burn</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-secondary/30">
          <Hash className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Burn Transactions</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground/30">
            {stats.signatures.length} stored
          </span>
        </div>

        {stats.signatures.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-muted-foreground/30">
            No transactions recorded yet
          </div>
        ) : (
          <div className="divide-y divide-border/20 max-h-[340px] overflow-y-auto">
            {stats.signatures.map((sig, i) => (
              <a
                key={sig}
                href={`https://explorer.solana.com/tx/${sig}?cluster=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors group"
              >
                {/* Index badge */}
                <span className="w-5 text-center text-[10px] font-mono text-muted-foreground/30 shrink-0">
                  {i + 1}
                </span>

                {/* Flame icon */}
                <Flame className="w-3 h-3 text-primary/40 shrink-0" />

                {/* Signature */}
                <span className="font-mono text-[11px] text-muted-foreground/60 truncate flex-1 group-hover:text-foreground/80 transition-colors">
                  {sig.slice(0, 20)}…{sig.slice(-12)}
                </span>

                {/* Explorer link icon */}
                <ExternalLink className="w-3 h-3 text-muted-foreground/20 group-hover:text-primary/60 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Solana Explorer deep link */}
      <a
        href={`https://explorer.solana.com/address/${stats.wallet}?cluster=mainnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-border/30 bg-secondary/20 text-[11px] font-mono text-muted-foreground/40 hover:text-primary hover:border-primary/30 transition-all"
      >
        <ExternalLink className="w-3 h-3" />
        View wallet on Solana Explorer
      </a>
    </div>
  );
};
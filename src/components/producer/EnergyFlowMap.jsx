import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;
const eligibleStatuses = new Set(["completed", "accepted"]);

const colors = {
  navy: "#0B1420", surface: "#131F30", surfaceAlt: "#182742",
  border: "rgba(255,255,255,0.09)", text: "#EDF1F7", muted: "#9AA8BD",
  cyan: "#3FD0E0", green: "#5FD98A", amber: "#F2A93B", red: "#FF6B6B",
};

function formatEnergy(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function shortenLabel(value, maxLength = 23) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export default function EnergyFlowMap() {
  const username = localStorage.getItem("username");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async () => {
    if (!username) {
      setTransactions([]);
      setError("Producer username not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API}/trading/transactions/producer/${encodeURIComponent(username)}`);

      if (!response.ok) throw new Error("Failed to fetch producer transactions.");

      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Energy flow transaction fetch error:", requestError);
      setTransactions([]);
      setError("Unable to load energy distribution data.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const consumerFlows = useMemo(() => {
    const flowsByConsumer = new Map();

    transactions.forEach((transaction) => {
      const status = String(transaction.status || "").toLowerCase();
      const energy = Number(transaction.energy || 0);
      const consumer = String(transaction.consumer || "Unknown consumer").trim();

      if (!eligibleStatuses.has(status) || !Number.isFinite(energy) || energy <= 0) return;

      // A normalized key keeps multiple transactions for the same consumer in one node.
      const key = consumer.toLocaleLowerCase();
      const existing = flowsByConsumer.get(key);
      flowsByConsumer.set(key, {
        consumer: existing?.consumer || consumer,
        energy: (existing?.energy || 0) + energy,
      });
    });

    return [...flowsByConsumer.values()].sort((a, b) => b.energy - a.energy);
  }, [transactions]);

  const totalDistributed = useMemo(
    () => consumerFlows.reduce((total, flow) => total + flow.energy, 0),
    [consumerFlows]
  );
  const eligibleTransactionCount = transactions.filter((item) =>
    eligibleStatuses.has(String(item.status || "").toLowerCase())
  ).length;

  // Every consumer gets its own vertical lane. The SVG grows with the data, avoiding overlap.
  const nodeHeight = 70;
  const laneGap = 22;
  const topPadding = 42;
  const diagramHeight = Math.max(260, topPadding * 2 + consumerFlows.length * nodeHeight + Math.max(0, consumerFlows.length - 1) * laneGap);
  const producerY = diagramHeight / 2 - nodeHeight / 2;
  const maxConsumerEnergy = Math.max(...consumerFlows.map((flow) => flow.energy), 1);

  return (
    <section style={{ minHeight: "100%", color: colors.text, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ color: colors.amber, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Producer dashboard</div>
          <h1 style={{ margin: "5px 0 0", color: "#172033", fontSize: 26 }}>Energy Flow Map</h1>
          <p style={{ margin: "7px 0 0", color: "#64748b", fontSize: 14 }}>Completed energy distributed from your listings to each consumer.</p>
        </div>
        <button type="button" onClick={loadTransactions} disabled={loading} style={{ border: "none", borderRadius: 9, padding: "10px 14px", background: colors.cyan, color: "#08212A", fontWeight: 800, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Refreshing…" : "Refresh data"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 18 }}>
        <SummaryCard label="Energy Distributed" value={`${formatEnergy(totalDistributed)} kWh`} accent={colors.cyan} />
        <SummaryCard label="Consumers Reached" value={String(consumerFlows.length)} accent={colors.green} />
        <SummaryCard label="Eligible Transactions" value={String(eligibleTransactionCount)} accent={colors.amber} />
      </div>

      <div style={{ background: colors.navy, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 22, overflowX: "auto", boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12)" }}>
        {loading ? <StateMessage text="Loading completed energy transactions…" color={colors.muted} /> : error ? <StateMessage text={error} color={colors.red} /> : consumerFlows.length === 0 ? <StateMessage text="No completed or accepted energy transactions yet. Completed sales will appear here when you refresh this map." color={colors.muted} /> : (
          <svg role="img" aria-label={`Energy distributed from ${username} to ${consumerFlows.length} consumers`} viewBox={`0 0 1000 ${diagramHeight}`} width="100%" style={{ minWidth: 650, height: "auto", display: "block" }}>
            <defs>
              <linearGradient id="energy-flow-gradient" x1="0" x2="1"><stop offset="0%" stopColor={colors.cyan} /><stop offset="100%" stopColor={colors.green} /></linearGradient>
              <filter id="energy-flow-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <text x="60" y="24" fill={colors.muted} fontSize="14" fontWeight="700">SOURCE</text>
            <text x="690" y="24" fill={colors.muted} fontSize="14" fontWeight="700">CONSUMERS</text>

            {consumerFlows.map((flow, index) => {
              const y = topPadding + index * (nodeHeight + laneGap);
              const centerY = y + nodeHeight / 2;
              const flowWidth = 3 + (flow.energy / maxConsumerEnergy) * 8;

              return <g key={flow.consumer}>
                <path d={`M 360 ${producerY + nodeHeight / 2} C 480 ${producerY + nodeHeight / 2}, 540 ${centerY}, 670 ${centerY}`} fill="none" stroke="url(#energy-flow-gradient)" strokeWidth={flowWidth} strokeLinecap="round" opacity="0.86" filter="url(#energy-flow-glow)" />
                <circle cx="670" cy={centerY} r="6" fill={colors.green} />
                <rect x="690" y={y} width="250" height={nodeHeight} rx="12" fill={colors.surface} stroke={colors.border} />
                <circle cx="720" cy={centerY} r="16" fill="rgba(95,217,138,0.15)" />
                <text x="720" y={centerY + 5} textAnchor="middle" fill={colors.green} fontSize="15">↓</text>
                <text x="748" y={y + 29} fill={colors.text} fontSize="16" fontWeight="700">{shortenLabel(flow.consumer)}</text>
                <text x="748" y={y + 51} fill={colors.cyan} fontSize="14" fontWeight="700">{formatEnergy(flow.energy)} kWh</text>
              </g>;
            })}

            <rect x="60" y={producerY} width="300" height={nodeHeight} rx="14" fill={colors.surfaceAlt} stroke="rgba(63,208,224,0.55)" />
            <circle cx="95" cy={producerY + nodeHeight / 2} r="17" fill="rgba(63,208,224,0.16)" />
            <text x="95" y={producerY + nodeHeight / 2 + 6} textAnchor="middle" fill={colors.cyan} fontSize="18">⚡</text>
            <text x="125" y={producerY + 29} fill={colors.text} fontSize="17" fontWeight="700">{shortenLabel(username || "Producer")}</text>
            <text x="125" y={producerY + 51} fill={colors.cyan} fontSize="14" fontWeight="700">{formatEnergy(totalDistributed)} kWh distributed</text>
          </svg>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ label, value, accent }) {
  return <div style={{ background: "#131F30", border: "1px solid rgba(255,255,255,0.09)", borderLeft: `3px solid ${accent}`, borderRadius: 11, padding: "15px 17px" }}>
    <div style={{ color: "#9AA8BD", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
    <div style={{ color: "#EDF1F7", fontSize: 23, fontWeight: 800, marginTop: 8 }}>{value}</div>
  </div>;
}

function StateMessage({ text, color }) {
  return <div style={{ minHeight: 240, display: "grid", placeItems: "center", padding: 28, textAlign: "center", color, lineHeight: 1.55 }}>{text}</div>;
}

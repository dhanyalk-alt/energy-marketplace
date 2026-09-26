import React from "react";

export const ANALYTICS_RANGES = ["Day", "Week", "Month", "Year"];

const monthLabel = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
});

const weekdayLabel = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
});

function weekStart(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isInSelectedPeriod(date, range, currentDate) {
  if (range === "Day") {
    return date.toDateString() === currentDate.toDateString();
  }

  if (range === "Week") {
    const start = weekStart(currentDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  }

  if (range === "Month") {
    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth()
    );
  }

  return date.getFullYear() === currentDate.getFullYear();
}

function bucketForSelectedPeriod(date, range) {
  if (range === "Day") {
    const hour = new Date(date);
    hour.setMinutes(0, 0, 0);
    return {
      key: `hour-${hour.getHours()}`,
      timestamp: hour.getTime(),
      label: `${String(hour.getHours()).padStart(2, "0")}:00`,
    };
  }

  if (range === "Week") {
    const day = startOfDay(date);
    return {
      key: `day-${day.toISOString().slice(0, 10)}`,
      timestamp: day.getTime(),
      label: weekdayLabel.format(day),
    };
  }

  if (range === "Month") {
    const day = startOfDay(date);
    return {
      key: `day-${day.toISOString().slice(0, 10)}`,
      timestamp: day.getTime(),
      label: String(day.getDate()),
    };
  }

  const month = new Date(date.getFullYear(), date.getMonth(), 1);
  return {
    key: `month-${month.getMonth()}`,
    timestamp: month.getTime(),
    label: monthLabel.format(month),
  };
}

/**
 * Filter completed transactions to the selected current calendar period and
 * derive the graph buckets and totals from those same records.
 */
export function buildPeriodAnalytics(transactions, range, now = new Date()) {
  const currentDate = new Date(now);
  const buckets = new Map();
  let amount = 0;
  let energy = 0;
  let trades = 0;

  transactions.forEach((transaction) => {
    if (transaction.status !== "Completed" || !transaction.created_at) {
      return;
    }

    const transactionDate = new Date(transaction.created_at);
    if (Number.isNaN(transactionDate.getTime())) {
      return;
    }

    if (!isInSelectedPeriod(transactionDate, range, currentDate)) {
      return;
    }

    const bucket = bucketForSelectedPeriod(transactionDate, range);
    const existing = buckets.get(bucket.key) || {
      label: bucket.label,
      timestamp: bucket.timestamp,
      amount: 0,
      energy: 0,
      trades: 0,
    };

    existing.amount += Number(transaction.total_amount || 0);
    existing.energy += Number(transaction.energy || 0);
    existing.trades += 1;
    buckets.set(bucket.key, existing);

    amount += Number(transaction.total_amount || 0);
    energy += Number(transaction.energy || 0);
    trades += 1;
  });

  const chartData = [...buckets.values()]
    .sort((first, second) => first.timestamp - second.timestamp)
    .map(({ timestamp, ...bucket }) => ({
      ...bucket,
      amount: Number(bucket.amount.toFixed(2)),
      energy: Number(bucket.energy.toFixed(2)),
    }));

  return {
    chartData,
    summary: {
      amount: Number(amount.toFixed(2)),
      energy: Number(energy.toFixed(2)),
      trades,
    },
  };
}

export function TimeRangeSelect({ value, onChange, accent, text, muted, border, surface }) {
  return (
    <label
      title="Choose how completed transactions are grouped in this chart"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: muted,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      Range
      <select
        aria-label="Analytics time range"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          appearance: "auto",
          background: surface,
          color: text,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: "8px 28px 8px 10px",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          outlineColor: accent,
        }}
      >
        {ANALYTICS_RANGES.map((range) => (
          <option key={range} value={range}>
            {range}
          </option>
        ))}
      </select>
    </label>
  );
}

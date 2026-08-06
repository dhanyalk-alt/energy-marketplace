from app.market_service import (
    load_iex_market_data,
    get_market_records,
    get_latest_market_record,
    get_market_summary
)


print("========================================")
print("       IEX MARKET SERVICE TEST")
print("========================================")


# ============================================================
# TEST 1 — LOAD DATA
# ============================================================

print("\n========== LOAD DATA ==========")

df = load_iex_market_data()

print("Rows:", len(df))

print("\nColumns:")
print(df.columns.tolist())


# ============================================================
# TEST 2 — FIRST 5 RECORDS
# ============================================================

print("\n========== FIRST 5 RECORDS ==========")

print(
    df.head(5).to_string(index=False)
)


# ============================================================
# TEST 3 — ALL MARKET RECORDS
# ============================================================

print("\n========== MARKET RECORD COUNT ==========")

records = get_market_records()

print("Records returned:", len(records))


# ============================================================
# TEST 4 — LATEST RECORD
# ============================================================

print("\n========== LATEST MARKET RECORD ==========")

latest = get_latest_market_record()

print(latest)


# ============================================================
# TEST 5 — MARKET SUMMARY
# ============================================================

print("\n========== MARKET SUMMARY ==========")

summary = get_market_summary()

print(summary)


# ============================================================
# SUCCESS
# ============================================================

print("\n========================================")
print("       MARKET SERVICE TEST PASSED")
print("========================================")
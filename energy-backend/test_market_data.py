import pandas as pd
from pathlib import Path


# ============================================================
# DATASET PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MARKET_FILE = (
    BASE_DIR
    / "datasets"
    / "market"
    / "IEX"
    / "DAM_Market Snapshot.xlsx"
)


print("========================================")
print("        IEX RAW DATASET TEST")
print("========================================")


# ============================================================
# TEST 1 — FILE EXISTS
# ============================================================

print("\n========== FILE CHECK ==========")

print("Dataset path:")
print(MARKET_FILE)

if not MARKET_FILE.exists():

    print("\n❌ Dataset NOT found.")

    raise SystemExit(1)

print("\n✅ Dataset found!")


# ============================================================
# TEST 2 — READ RAW EXCEL
# ============================================================

print("\n========== READING EXCEL ==========")

raw_df = pd.read_excel(
    MARKET_FILE,
    header=None
)

print("Total Excel rows:", len(raw_df))

print("Total Excel columns:", len(raw_df.columns))


# ============================================================
# TEST 3 — DISPLAY FIRST ROWS
# ============================================================

print("\n========== FIRST 8 EXCEL ROWS ==========")

print(
    raw_df.head(8).to_string(
        index=False,
        header=False
    )
)


# ============================================================
# TEST 4 — FIND MARKET HEADER
# ============================================================

print("\n========== SEARCHING FOR HEADER ==========")

header_row = None

for index, row in raw_df.iterrows():

    values = [
        str(value).strip()
        for value in row.tolist()
        if pd.notna(value)
    ]

    if (
        "Date" in values
        and "Hour" in values
        and "Time Block" in values
    ):

        header_row = index
        break


if header_row is None:

    print(
        "\n❌ Market header could not be found."
    )

    raise SystemExit(1)


print(
    f"\n✅ Market header found at Excel row: "
    f"{header_row + 1}"
)


# ============================================================
# TEST 5 — DISPLAY ACTUAL COLUMNS
# ============================================================

headers = [
    str(value).strip()
    for value in raw_df.iloc[header_row].tolist()
]

print("\n========== MARKET COLUMNS ==========")

for column in headers:

    print(
        "•",
        column
    )


# ============================================================
# TEST 6 — CREATE RAW MARKET TABLE
# ============================================================

df = raw_df.iloc[
    header_row + 1:
].copy()

df.columns = headers

df = df.dropna(
    how="all"
)


# ============================================================
# TEST 7 — DISPLAY MARKET DATA
# ============================================================

print("\n========== FIRST 5 MARKET DATA ROWS ==========")

print(
    df.head(5).to_string(
        index=False
    )
)


# ============================================================
# TEST 8 — BASIC DATA VALIDATION
# ============================================================

print("\n========== DATA VALIDATION ==========")

required_columns = [
    "Date",
    "Hour",
    "Time Block",
    "Purchase Bid (MW)",
    "Sell Bid (MW)",
    "MCV (MW)",
    "Final Scheduled Volume (MW)",
    "MCP (Rs/MWh) *"
]


missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]


if missing_columns:

    print("\n❌ Missing columns:")

    for column in missing_columns:
        print("•", column)

else:

    print(
        "✅ All required IEX columns are present."
    )


# ============================================================
# FINAL
# ============================================================

print("\n========================================")
print("       RAW DATASET TEST COMPLETE")
print("========================================")
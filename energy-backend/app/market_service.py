import pandas as pd
from pathlib import Path
from functools import lru_cache


# ============================================================
# PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MARKET_FILE = (
    BASE_DIR
    / "datasets"
    / "market"
    / "IEX"
    / "DAM_Market Snapshot.xlsx"
)


# ============================================================
# LOAD IEX MARKET DATA
# ============================================================

@lru_cache(maxsize=1)
def load_iex_market_data():
    """
    Load the real IEX Day-Ahead Market Snapshot Excel file.

    The Excel file contains metadata rows before the actual
    market table. This function automatically finds the row
    containing the real column headers.
    """

    if not MARKET_FILE.exists():
        raise FileNotFoundError(
            f"IEX market dataset not found: {MARKET_FILE}"
        )

    # Read the Excel file without assuming a header
    raw_df = pd.read_excel(
        MARKET_FILE,
        header=None
    )

    # --------------------------------------------------------
    # Find actual header row
    # --------------------------------------------------------

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
        raise ValueError(
            "Could not find the IEX market table header."
        )

    # --------------------------------------------------------
    # Create dataframe using actual header
    # --------------------------------------------------------

    headers = [
        str(value).strip()
        for value in raw_df.iloc[header_row].tolist()
    ]

    df = raw_df.iloc[
        header_row + 1:
    ].copy()

    df.columns = headers

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Remove unnamed/nan columns
    valid_columns = [
        column
        for column in df.columns
        if column != "nan"
        and not str(column).startswith("Unnamed")
    ]

    df = df[valid_columns]

    # --------------------------------------------------------
    # Rename MCP column
    # --------------------------------------------------------

    if "MCP (Rs/MWh) *" in df.columns:

        df = df.rename(
            columns={
                "MCP (Rs/MWh) *": "mcp_rs_mwh"
            }
        )

    # --------------------------------------------------------
    # Convert numeric columns
    # --------------------------------------------------------

    numeric_columns = [
        "Hour",
        "Purchase Bid (MW)",
        "Sell Bid (MW)",
        "MCV (MW)",
        "Final Scheduled Volume (MW)",
        "mcp_rs_mwh"
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    # --------------------------------------------------------
    # Convert date
    # --------------------------------------------------------

    if "Date" in df.columns:

        df["Date"] = pd.to_datetime(
            df["Date"],
            dayfirst=True,
            errors="coerce"
        )

    # --------------------------------------------------------
    # Remove invalid market rows
    # --------------------------------------------------------

    if "mcp_rs_mwh" in df.columns:

        df = df.dropna(
            subset=["mcp_rs_mwh"]
        )

    # Reset index
    df = df.reset_index(drop=True)

    return df


# ============================================================
# GET ALL MARKET RECORDS
# ============================================================

def get_market_records():

    df = load_iex_market_data()

    records = []

    for _, row in df.iterrows():

        records.append({

            "date": (
                row["Date"].strftime("%Y-%m-%d")
                if pd.notna(row["Date"])
                else None
            ),

            "hour": (
                int(row["Hour"])
                if pd.notna(row["Hour"])
                else None
            ),

            "time_block": str(
                row["Time Block"]
            ),

            "purchase_bid_mw": float(
                row["Purchase Bid (MW)"]
            ),

            "sell_bid_mw": float(
                row["Sell Bid (MW)"]
            ),

            "mcv_mw": float(
                row["MCV (MW)"]
            ),

            "scheduled_volume_mw": float(
                row["Final Scheduled Volume (MW)"]
            ),

            "mcp_rs_mwh": float(
                row["mcp_rs_mwh"]
            ),

            # ₹/MWh → ₹/kWh
            "mcp_rs_kwh": float(
                row["mcp_rs_mwh"] / 1000
            )
        })

    return records


# ============================================================
# GET LATEST MARKET RECORD
# ============================================================

def get_latest_market_record():

    df = load_iex_market_data()

    if df.empty:
        return None

    latest = df.iloc[-1]

    return {

        "date": (
            latest["Date"].strftime("%Y-%m-%d")
            if pd.notna(latest["Date"])
            else None
        ),

        "hour": int(
            latest["Hour"]
        ),

        "time_block": str(
            latest["Time Block"]
        ),

        "purchase_bid_mw": float(
            latest["Purchase Bid (MW)"]
        ),

        "sell_bid_mw": float(
            latest["Sell Bid (MW)"]
        ),

        "mcv_mw": float(
            latest["MCV (MW)"]
        ),

        "scheduled_volume_mw": float(
            latest["Final Scheduled Volume (MW)"]
        ),

        "mcp_rs_mwh": float(
            latest["mcp_rs_mwh"]
        ),

        # Convert ₹/MWh → ₹/kWh
        "mcp_rs_kwh": float(
            latest["mcp_rs_mwh"] / 1000
        )
    }


# ============================================================
# GET MARKET SUMMARY
# ============================================================

def get_market_summary():

    df = load_iex_market_data()

    if df.empty:
        return None

    latest = df.iloc[-1]

    return {

        "date": (
            latest["Date"].strftime("%Y-%m-%d")
            if pd.notna(latest["Date"])
            else None
        ),

        "latest_time_block": str(
            latest["Time Block"]
        ),

        "market_price_rs_mwh": float(
            latest["mcp_rs_mwh"]
        ),

        "market_price_rs_kwh": float(
            latest["mcp_rs_mwh"] / 1000
        ),

        "purchase_bid_mw": float(
            latest["Purchase Bid (MW)"]
        ),

        "sell_bid_mw": float(
            latest["Sell Bid (MW)"]
        ),

        "market_cleared_volume_mw": float(
            latest["MCV (MW)"]
        ),

        "scheduled_volume_mw": float(
            latest["Final Scheduled Volume (MW)"]
        ),

        "records": len(df)
    }
def get_market_summary():
    """
    Return the latest IEX market information
    in a frontend-friendly format.
    """

    record = get_latest_market_record()

    if record is None:
        return {
            "source": "IEX Day-Ahead Market",
            "available": False,
            "message": "No IEX market data available"
        }

    return {
        "source": "IEX Day-Ahead Market",
        "available": True,

        "date": record["date"],
        "time_block": record["time_block"],

        # IEX price
        "mcp_rs_mwh": record["mcp_rs_mwh"],
        "mcp_rs_kwh": record["mcp_rs_kwh"],

        # Market demand/supply
        "purchase_bid_mw": record["purchase_bid_mw"],
        "sell_bid_mw": record["sell_bid_mw"],
        "mcv_mw": record["mcv_mw"],
        "scheduled_volume_mw": record["scheduled_volume_mw"]
    }

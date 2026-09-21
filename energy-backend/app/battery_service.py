import pandas as pd
from pathlib import Path
from functools import lru_cache


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

CHARGE_FILE = BASE_DIR / "datasets" / "battery" / "charge-data.xlsx"
DISCHARGE_FILE = BASE_DIR / "datasets" / "battery" / "discharge-data.xlsx"


# =========================================================
# BATTERY CONFIGURATION
# =========================================================

# Capacity of the simulated battery.
# The SOC value itself comes from the real URI-PBEST dataset.
BATTERY_CAPACITY_KWH = 100.0


# =========================================================
# LOAD CHARGE DATA
# =========================================================

@lru_cache(maxsize=1)
def load_charge_data():
    """
    Load all charging measurements from the real
    URI-PBEST charge dataset.
    """

    if not CHARGE_FILE.exists():
        raise FileNotFoundError(
            f"Charge dataset not found: {CHARGE_FILE}"
        )

    excel_file = pd.ExcelFile(CHARGE_FILE)

    frames = []

    for sheet in excel_file.sheet_names:

        df = pd.read_excel(
            CHARGE_FILE,
            sheet_name=sheet
        )

        if not df.empty:

            df["source_sheet"] = sheet

            frames.append(df)

    if not frames:
        return pd.DataFrame()

    return pd.concat(
        frames,
        ignore_index=True
    )


# =========================================================
# LOAD DISCHARGE DATA
# =========================================================

@lru_cache(maxsize=1)
def load_discharge_data():
    """
    Load all discharging measurements from the real
    URI-PBEST discharge dataset.
    """

    if not DISCHARGE_FILE.exists():
        raise FileNotFoundError(
            f"Discharge dataset not found: {DISCHARGE_FILE}"
        )

    excel_file = pd.ExcelFile(DISCHARGE_FILE)

    frames = []

    for sheet in excel_file.sheet_names:

        df = pd.read_excel(
            DISCHARGE_FILE,
            sheet_name=sheet
        )

        if not df.empty:

            df["source_sheet"] = sheet

            frames.append(df)

    if not frames:
        return pd.DataFrame()

    return pd.concat(
        frames,
        ignore_index=True
    )


# =========================================================
# GET ONE REAL PV RECORD
# =========================================================

def get_real_pv_record(index=0):
    """
    Get an existing PV measurement from the real
    URI-PBEST charge dataset.

    No values are generated or hardcoded.
    """

    df = load_charge_data()

    if df.empty:
        raise ValueError(
            "URI-PBEST charge dataset is empty."
        )

    required_columns = [
        "time",
        "p_dc(W)",
        "soc(%)"
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing dataset columns: {missing}"
        )

    # Use an existing record from the dataset
    index = max(
        0,
        min(index, len(df) - 1)
    )

    row = df.iloc[index]

    # p_dc is measured power in watts.
    # Each charge record represents a 1-minute measurement.
    pv_power = float(row["p_dc(W)"])

    energy_wh = pv_power / 60.0

    return {
        "time": str(row["time"]),
        "pv_power_w": round(
            pv_power,
            2
        ),
        "energy_wh": round(
            energy_wh,
            4
        ),
        "soc": float(
            row["soc(%)"]
        )
    }


# =========================================================
# GET REAL PV ENERGY
# =========================================================

def get_real_pv_energy(
    start_index=0,
    number_of_records=60
):
    """
    Calculate solar energy from existing
    URI-PBEST measurements.

    Each charge-data record represents one minute.

    No synthetic or hardcoded PV measurements
    are used.
    """

    df = load_charge_data()

    if df.empty:
        raise ValueError(
            "URI-PBEST charge dataset is empty."
        )

    if "p_dc(W)" not in df.columns:
        raise ValueError(
            "p_dc(W) column not found in charge dataset."
        )

    if start_index < 0:
        start_index = 0

    if start_index >= len(df):
        raise ValueError(
            "start_index is outside the dataset."
        )

    end_index = min(
        start_index + number_of_records,
        len(df)
    )

    records = df.iloc[
        start_index:end_index
    ].copy()

    records["p_dc(W)"] = pd.to_numeric(
        records["p_dc(W)"],
        errors="coerce"
    )

    records = records.dropna(
        subset=["p_dc(W)"]
    )

    if records.empty:
        raise ValueError(
            "No valid PV power measurements found."
        )

    # Each record represents 1 minute.
    records["energy_wh"] = (
        records["p_dc(W)"] / 60.0
    )

    total_energy_wh = records[
        "energy_wh"
    ].sum()

    return {
        "records_used": len(records),

        "start_time": str(
            records.iloc[0]["time"]
        ),

        "end_time": str(
            records.iloc[-1]["time"]
        ),

        "solar_energy_wh": round(
            float(total_energy_wh),
            4
        ),

        "solar_energy_kwh": round(
            float(total_energy_wh / 1000),
            6
        ),
    }


# =========================================================
# GET AVAILABLE BATTERY ENERGY
# =========================================================

def get_available_battery_energy():
    """
    Get the latest real battery SOC from the
    URI-PBEST charge dataset.

    SOC comes directly from the real dataset.

    Available battery energy is calculated using:

        Available Energy =
        Battery Capacity × SOC / 100

    Example:

        Capacity = 100 kWh
        SOC      = 68%

        Available Energy = 68 kWh
    """

    # -----------------------------------------------------
    # Load real battery data
    # -----------------------------------------------------

    charge_data = load_charge_data()

    if charge_data.empty:
        raise ValueError(
            "URI-PBEST charge dataset is empty."
        )

    # -----------------------------------------------------
    # Check required column
    # -----------------------------------------------------

    if "soc(%)" not in charge_data.columns:
        raise ValueError(
            "soc(%) column not found in battery dataset."
        )

    # -----------------------------------------------------
    # Get latest real measurement
    # -----------------------------------------------------

    latest_record = charge_data.iloc[-1]

    soc = float(
        latest_record["soc(%)"]
    )

    # -----------------------------------------------------
    # Keep SOC between 0 and 100
    # -----------------------------------------------------

    soc = max(
        0.0,
        min(soc, 100.0)
    )

    # -----------------------------------------------------
    # Calculate available battery energy
    # -----------------------------------------------------

    available_energy_kwh = (
        BATTERY_CAPACITY_KWH
        * soc
        / 100.0
    )

    # -----------------------------------------------------
    # Return battery information
    # -----------------------------------------------------

    return {
        "soc": round(
            soc,
            2
        ),

        "capacity_kwh": BATTERY_CAPACITY_KWH,

        "available_energy_kwh": round(
            available_energy_kwh,
            2
        ),

        "source": "URI-PBEST"
    }

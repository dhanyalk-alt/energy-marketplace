import pandas as pd
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

CHARGE_FILE = BASE_DIR / "datasets" / "battery" / "charge-data.xlsx"
DISCHARGE_FILE = BASE_DIR / "datasets" / "battery" / "discharge-data.xlsx"


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

def get_real_pv_record(index=0):
    """
    Get an existing PV measurement from the real URI-PBEST
    charge dataset.

    No values are generated or hardcoded.
    """

    df = load_charge_data()

    if df.empty:
        raise ValueError("URI-PBEST charge dataset is empty.")

    required_columns = [
        "time",
        "p_dc(W)",
        "soc(%)"
    ]

    missing = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing dataset columns: {missing}"
        )

    # Use an existing record from the dataset
    index = max(0, min(index, len(df) - 1))

    row = df.iloc[index]

    # p_dc is measured power in watts.
    # Each charge record represents a 1-minute measurement.
    pv_power = float(row["p_dc(W)"])
    energy_wh = pv_power / 60.0

    return {
        "time": str(row["time"]),
        "pv_power_w": round(pv_power, 2),
        "energy_wh": round(energy_wh, 4),
        "soc": float(row["soc(%)"])
    }
def get_real_pv_energy(start_index=0, number_of_records=60):
    """
    Calculate solar energy from existing URI-PBEST measurements.

    Each charge-data record represents one minute.
    No synthetic or hardcoded PV measurements are used.
    """

    df = load_charge_data()

    if df.empty:
        raise ValueError("URI-PBEST charge dataset is empty.")

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

    records = df.iloc[start_index:end_index].copy()

    records["p_dc(W)"] = pd.to_numeric(
        records["p_dc(W)"],
        errors="coerce"
    )

    records = records.dropna(
        subset=["p_dc(W)"]
    )

    # Each record represents 1 minute.
    records["energy_wh"] = records["p_dc(W)"] / 60.0

    total_energy_wh = records["energy_wh"].sum()

    return {
        "records_used": len(records),
        "start_time": str(records.iloc[0]["time"]),
        "end_time": str(records.iloc[-1]["time"]),
        "solar_energy_wh": round(
            float(total_energy_wh), 4
        ),
        "solar_energy_kwh": round(
            float(total_energy_wh / 1000),
            6
        ),
    }
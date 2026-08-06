from app.battery_service import (
    load_charge_data,
    load_discharge_data
)


charge = load_charge_data()
discharge = load_discharge_data()

print("========== CHARGE DATA ==========")
print("Rows:", len(charge))
print("Columns:")
print(charge.columns.tolist())

print("\n========== DISCHARGE DATA ==========")
print("Rows:", len(discharge))
print("Columns:")
print(discharge.columns.tolist())
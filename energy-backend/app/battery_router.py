from fastapi import APIRouter, HTTPException

from app.battery_service import (
    load_charge_data,
    load_discharge_data
)

router = APIRouter(
    prefix="/battery",
    tags=["Battery"]
)


@router.get("/status")
async def get_battery_status():

    try:
        charge_data = load_charge_data()
        discharge_data = load_discharge_data()

        if charge_data.empty:
            raise HTTPException(
                status_code=404,
                detail="Battery charge dataset is empty"
            )

        # -----------------------------------------
        # Latest charging measurement
        # -----------------------------------------
        latest_charge = charge_data.iloc[-1]

        soc = float(latest_charge["soc(%)"])
        voltage = float(latest_charge["voltage(V)"])
        current = float(latest_charge["current(Amps)"])
        pv_power = float(latest_charge["p_dc(W)"])

        # -----------------------------------------
        # Determine battery state
        # -----------------------------------------
        if current > 0:
            state = "Charging"
        elif current < 0:
            state = "Discharging"
        else:
            state = "Idle"

        # -----------------------------------------
        # Calculate electrical power
        # P = V × I
        # -----------------------------------------
        battery_power = voltage * abs(current)

        # -----------------------------------------
        # Battery health indicator
        # -----------------------------------------
        if soc >= 80:
            health = "High"
        elif soc >= 40:
            health = "Normal"
        elif soc >= 20:
            health = "Low"
        else:
            health = "Critical"

        return {
            "soc": round(soc, 2),
            "voltage": round(voltage, 2),
            "current": round(current, 2),
            "battery_power": round(battery_power, 2),
            "pv_power": round(pv_power, 2),
            "state": state,
            "health": health,
            "source": "URI-PBEST"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
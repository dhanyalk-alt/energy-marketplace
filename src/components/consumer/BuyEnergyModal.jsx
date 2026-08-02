import React, { useState } from "react";
import axios from "axios";

export default function BuyEnergyModal({
    producer,
    onClose,
    onSuccess
}) {

    const [energy, setEnergy] = useState(1);
    const [loading, setLoading] = useState(false);

    const consumer =
        localStorage.getItem("username");

    const total = energy * producer.price;

    const sendRequest = async () => {

        try {

            setLoading(true);

            await axios.post(

                `http://127.0.0.1:8000/trading/buy/${producer.id}`,

                {
                    consumer: consumer,
                    energy: Number(energy)
                }

            );

            alert("Buy Request Sent Successfully!");

            onSuccess();

            onClose();

        }

        catch (err) {

            if (err.response) {

                alert(err.response.data.detail);

            } else {

                alert("Unable to connect to server.");

            }

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000
            }}
        >

            <div
                style={{
                    width: "500px",
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "30px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                }}
            >

                <h2
                    style={{
                        textAlign: "center",
                        marginBottom: "25px"
                    }}
                >
                    Buy Energy
                </h2>

                <p>
                    <b>Producer :</b> {producer.producer}
                </p>

                <p>
                    <b>Available Energy :</b> {producer.energy} kWh
                </p>

                <p>
                    <b>Price :</b> ₹{producer.price} / kWh
                </p>

                <div
                    style={{
                        marginTop: "25px"
                    }}
                >

                    <label>

                        Energy Required

                    </label>

                    <input
                        type="number"
                        min="1"
                        max={producer.energy}
                        value={energy}
                        onChange={(e) =>
                            setEnergy(e.target.value)
                        }
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginTop: "10px",
                            marginBottom: "20px"
                        }}
                    />

                </div>

                <h3
                    style={{
                        textAlign: "center",
                        marginBottom: "25px"
                    }}
                >
                    Total : ₹{total}
                </h3>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between"
                    }}
                >

                    <button

                        onClick={onClose}

                        style={{
                            padding: "10px 25px",
                            background: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}

                    >
                        Cancel
                    </button>

                    <button

                        onClick={sendRequest}

                        disabled={loading}

                        style={{
                            padding: "10px 25px",
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}

                    >

                        {loading
                            ? "Sending..."
                            : "Confirm Purchase"}

                    </button>

                </div>

            </div>

        </div>

    );

}
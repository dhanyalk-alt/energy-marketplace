import React, { useMemo, useState } from "react";

const colors = {
  bg: "#0B1420",
  surface: "#131F30",
  surfaceAlt: "#182742",
  border: "rgba(255,255,255,0.08)",
  text: "#EDF1F7",
  muted: "#7C8BA3",
  green: "#5FD98A",
  cyan: "#3FD0E0",
  violet: "#B98CF2",
  orange: "#FF8A65",
  red: "#FF6B6B",
};

const producers = [
  {
    id: 1,
    name: "Gokul",
    totalEnergy: 100,
    availableEnergy: 68,
    price: 10,
    flows: [
      {
        consumer: "Rahul",
        energy: 20,
        purpose: "Household",
      },
      {
        consumer: "Anu",
        energy: 15,
        purpose: "Small business",
      },
      {
        consumer: "Priya",
        energy: 10,
        purpose: "Agriculture",
      },
    ],
  },
  {
    id: 2,
    name: "Kripa",
    totalEnergy: 80,
    availableEnergy: 42,
    price: 20,
    flows: [
      {
        consumer: "Arjun",
        energy: 18,
        purpose: "Household",
      },
      {
        consumer: "Meera",
        energy: 20,
        purpose: "Farm",
      },
    ],
  },
];

function FlowLine({ energy }) {
  return (
    <div
      style={{
        position: "relative",
        width: 150,
        height: 4,
        background: "rgba(63,208,224,0.15)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: "100%",
          background: `linear-gradient(
            90deg,
            ${colors.green},
            ${colors.cyan},
            ${colors.violet}
          )`,
          borderRadius: 10,
          animation: "energyFlow 1.5s linear infinite",
        }}
      />

      <span
        style={{
          position: "absolute",
          top: -25,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          color: colors.cyan,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {energy} kWh
      </span>
    </div>
  );
}

function Node({ title, subtitle, icon, accent }) {
  return (
    <div
      style={{
        width: 150,
        minHeight: 100,
        background: colors.surface,
        border: `1px solid ${accent}55`,
        borderRadius: 14,
        padding: "18px 14px",
        textAlign: "center",
        boxShadow: `0 0 25px ${accent}12`,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          margin: "0 auto 9px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${accent}18`,
          border: `1px solid ${accent}55`,
          fontSize: 20,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: colors.text,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: colors.muted,
          fontSize: 11,
          marginTop: 5,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

export default function EnergyFlowMap() {
  const [selectedProducerId, setSelectedProducerId] = useState(1);

  const selectedProducer = useMemo(
    () =>
      producers.find(
        (producer) => producer.id === selectedProducerId
      ),
    [selectedProducerId]
  );

  const totalSent = selectedProducer.flows.reduce(
    (sum, flow) => sum + flow.energy,
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(
            circle at 15% 0%,
            #16233A 0%,
            ${colors.bg} 55%
          )
        `,
        color: colors.text,
        padding: "30px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes energyFlow {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulseNode {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(63,208,224,0.15);
          }

          50% {
            box-shadow: 0 0 0 10px rgba(63,208,224,0);
          }
        }

        .flow-card {
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: 14px;
        }

        .producer-select {
          background: ${colors.surfaceAlt};
          color: ${colors.text};
          border: 1px solid ${colors.border};
          border-radius: 8px;
          padding: 10px 14px;
          outline: none;
          cursor: pointer;
          font-size: 13px;
        }

        .consumer-row {
          display: grid;
          grid-template-columns: 160px 1fr 100px 140px;
          align-items: center;
          gap: 20px;
          padding: 16px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .consumer-row:last-child {
          border-bottom: none;
        }

        @media(max-width: 850px) {
          .consumer-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .flow-network {
            overflow-x: auto;
          }
        }
      `}</style>

      {/* HEADER */}

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 25px",
        }}
      >
        <div
          style={{
            color: colors.cyan,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 7,
          }}
        >
          Producer · Energy Simulation
        </div>

        <h1
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 30,
            margin: 0,
            fontWeight: 700,
          }}
        >
          Energy Flow Map
        </h1>

        <p
          style={{
            color: colors.muted,
            fontSize: 14,
            marginTop: 7,
          }}
        >
          See how energy moves from a producer through the grid to
          consumers.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* PRODUCER SELECTOR */}

        <div
          className="flow-card"
          style={{
            padding: 20,
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: colors.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Viewing energy flow for
            </div>

            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                marginTop: 5,
              }}
            >
              {selectedProducer.name}
            </div>
          </div>

          <select
            className="producer-select"
            value={selectedProducerId}
            onChange={(e) =>
              setSelectedProducerId(Number(e.target.value))
            }
          >
            {producers.map((producer) => (
              <option key={producer.id} value={producer.id}>
                {producer.name}
              </option>
            ))}
          </select>
        </div>

        {/* SUMMARY */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 15,
            marginBottom: 20,
          }}
        >
          <div className="flow-card" style={{ padding: 18 }}>
            <div style={{ color: colors.muted, fontSize: 11 }}>
              AVAILABLE ENERGY
            </div>

            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 25,
                fontWeight: 700,
                marginTop: 8,
              }}
            >
              {selectedProducer.availableEnergy}
              <span
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  marginLeft: 5,
                }}
              >
                kWh
              </span>
            </div>
          </div>

          <div className="flow-card" style={{ padding: 18 }}>
            <div style={{ color: colors.muted, fontSize: 11 }}>
              ENERGY BEING SENT
            </div>

            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 25,
                fontWeight: 700,
                color: colors.green,
                marginTop: 8,
              }}
            >
              {totalSent}
              <span
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  marginLeft: 5,
                }}
              >
                kWh
              </span>
            </div>
          </div>

          <div className="flow-card" style={{ padding: 18 }}>
            <div style={{ color: colors.muted, fontSize: 11 }}>
              SELLING PRICE
            </div>

            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 25,
                fontWeight: 700,
                color: colors.violet,
                marginTop: 8,
              }}
            >
              ₹{selectedProducer.price}
              <span
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  marginLeft: 5,
                }}
              >
                / kWh
              </span>
            </div>
          </div>
        </div>

        {/* MAIN SIMULATION */}

        <div
          className="flow-card"
          style={{
            padding: "30px 20px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 35,
            }}
          >
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              Live Energy Movement
            </div>

            <div
              style={{
                color: colors.muted,
                fontSize: 12,
                marginTop: 5,
              }}
            >
              {selectedProducer.name}'s energy is routed through the
              grid to consumers
            </div>
          </div>

          <div
            className="flow-network"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              padding: "20px 10px 35px",
            }}
          >
            {/* PRODUCER */}

            <div>
              <Node
                title={selectedProducer.name}
                subtitle="Renewable Producer"
                icon="☀️"
                accent={colors.orange}
              />
            </div>

            {/* FLOW */}

            <FlowLine energy={totalSent} />

            {/* GRID */}

            <div
              style={{
                animation: "pulseNode 2s infinite",
                borderRadius: 20,
              }}
            >
              <Node
                title="Grid"
                subtitle="Energy Distribution"
                icon="⚡"
                accent={colors.cyan}
              />
            </div>

            {/* FLOW */}

            <FlowLine energy={totalSent} />

            {/* CONSUMERS */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {selectedProducer.flows.map((flow) => (
                <div
                  key={flow.consumer}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 115,
                      padding: "10px 8px",
                      borderRadius: 9,
                      background: colors.surfaceAlt,
                      border: `1px solid ${colors.violet}44`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 16 }}>🏠</div>

                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        marginTop: 3,
                      }}
                    >
                      {flow.consumer}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: colors.muted,
                        marginTop: 2,
                      }}
                    >
                      Consumer
                    </div>
                  </div>

                  <div
                    style={{
                      width: 70,
                      height: 3,
                      background: colors.violet,
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        width: 25,
                        height: 3,
                        background: "#fff",
                        animation:
                          "energyFlow 1.2s linear infinite",
                      }}
                    />
                  </div>

                  <span
                    style={{
                      color: colors.violet,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {flow.energy} kWh
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONSUMER DETAILS */}

        <div className="flow-card">
          <div
            style={{
              padding: "18px 20px",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Current Energy Distribution
            </div>

            <div
              style={{
                color: colors.muted,
                fontSize: 12,
                marginTop: 5,
              }}
            >
              Consumers currently receiving energy from{" "}
              {selectedProducer.name}
            </div>
          </div>

          {/* TABLE HEADER */}

          <div
            className="consumer-row"
            style={{
              color: colors.muted,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            <div>Consumer</div>
            <div>Energy Flow</div>
            <div>Amount</div>
            <div>Purpose</div>
          </div>

          {selectedProducer.flows.map((flow) => (
            <div className="consumer-row" key={flow.consumer}>
              <div
                style={{
                  fontWeight: 700,
                  color: colors.text,
                }}
              >
                🏠 {flow.consumer}
              </div>

              <div>
                <div
                  style={{
                    height: 5,
                    width: "100%",
                    maxWidth: 300,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(
                        (flow.energy / 30) * 100,
                        100
                      )}%`,
                      background: colors.cyan,
                      borderRadius: 10,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  color: colors.green,
                  fontWeight: 700,
                }}
              >
                {flow.energy} kWh
              </div>

              <div
                style={{
                  color: colors.muted,
                  fontSize: 12,
                }}
              >
                {flow.purpose}
              </div>
            </div>
          ))}
        </div>

        {/* EXPLANATION */}

        <div
          style={{
            marginTop: 18,
            padding: "16px 18px",
            borderRadius: 10,
            background: "rgba(63,208,224,0.05)",
            border: "1px solid rgba(63,208,224,0.12)",
            color: colors.muted,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: colors.cyan }}>
            How this simulation works:
          </strong>{" "}
          {selectedProducer.name} generates renewable energy. The
          energy enters the electricity grid, and the grid distributes
          the required amount to the consumers who purchased or
          requested energy. The flow shown here represents the
          transaction-based energy movement in your simulation.
        </div>
      </div>
    </div>
  );
}
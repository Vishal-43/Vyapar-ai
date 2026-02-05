import { useState, useEffect } from "react";
import { FiTruck, FiMapPin, FiClock, FiPackage, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

interface SupplyChainNode {
  id: string;
  location: string;
  type: "farm" | "warehouse" | "market" | "transport";
  status: "active" | "delayed" | "completed";
  timestamp: string;
  details?: string;
}

interface Shipment {
  id: string;
  commodity: string;
  quantity: number;
  origin: string;
  destination: string;
  status: "in_transit" | "delivered" | "delayed" | "pending";
  eta: string;
  progress: number;
  nodes: SupplyChainNode[];
}

export default function SupplyChainTracker() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage or generate sample data
      const saved = localStorage.getItem("vypaar_shipments");
      if (saved) {
        setShipments(JSON.parse(saved));
      } else {
        // Generate sample shipments based on inventory
        const sampleShipments: Shipment[] = [
          {
            id: "SHIP-001",
            commodity: "Potato",
            quantity: 50,
            origin: "Agra Farm",
            destination: "Delhi Mandi",
            status: "in_transit",
            eta: new Date(Date.now() + 86400000).toISOString(),
            progress: 65,
            nodes: [
              { id: "1", location: "Agra Farm", type: "farm", status: "completed", timestamp: new Date(Date.now() - 86400000).toISOString() },
              { id: "2", location: "Agra Warehouse", type: "warehouse", status: "completed", timestamp: new Date(Date.now() - 43200000).toISOString() },
              { id: "3", location: "In Transit", type: "transport", status: "active", timestamp: new Date().toISOString(), details: "On NH-2 Highway" },
              { id: "4", location: "Delhi Mandi", type: "market", status: "delayed", timestamp: "" },
            ],
          },
          {
            id: "SHIP-002",
            commodity: "Onion",
            quantity: 100,
            origin: "Nashik Farm",
            destination: "Mumbai APMC",
            status: "delivered",
            eta: new Date().toISOString(),
            progress: 100,
            nodes: [
              { id: "1", location: "Nashik Farm", type: "farm", status: "completed", timestamp: new Date(Date.now() - 172800000).toISOString() },
              { id: "2", location: "Nashik Cold Storage", type: "warehouse", status: "completed", timestamp: new Date(Date.now() - 129600000).toISOString() },
              { id: "3", location: "Transport Complete", type: "transport", status: "completed", timestamp: new Date(Date.now() - 43200000).toISOString() },
              { id: "4", location: "Mumbai APMC", type: "market", status: "completed", timestamp: new Date().toISOString() },
            ],
          },
          {
            id: "SHIP-003",
            commodity: "Tomato",
            quantity: 30,
            origin: "Bangalore Rural",
            destination: "Bangalore City Market",
            status: "pending",
            eta: new Date(Date.now() + 172800000).toISOString(),
            progress: 0,
            nodes: [
              { id: "1", location: "Bangalore Rural Farm", type: "farm", status: "active", timestamp: "", details: "Harvesting scheduled" },
              { id: "2", location: "Collection Center", type: "warehouse", status: "delayed", timestamp: "" },
              { id: "3", location: "Transport", type: "transport", status: "delayed", timestamp: "" },
              { id: "4", location: "Bangalore City Market", type: "market", status: "delayed", timestamp: "" },
            ],
          },
        ];
        setShipments(sampleShipments);
        localStorage.setItem("vypaar_shipments", JSON.stringify(sampleShipments));
      }
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_transit":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "delivered":
      case "completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "delayed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "pending":
      case "active":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getNodeIcon = (type: string, status: string) => {
    if (status === "completed") {
      return <FiCheckCircle className="w-5 h-5 text-emerald-500" />;
    }
    if (status === "active") {
      return <FiTruck className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
    switch (type) {
      case "farm":
        return <FiPackage className="w-5 h-5 text-gray-400" />;
      case "warehouse":
        return <FiPackage className="w-5 h-5 text-gray-400" />;
      case "transport":
        return <FiTruck className="w-5 h-5 text-gray-400" />;
      case "market":
        return <FiMapPin className="w-5 h-5 text-gray-400" />;
      default:
        return <FiAlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Pending";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <FiTruck className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Supply Chain Tracker
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Shipment List */}
          {!selectedShipment && shipments.map((shipment) => (
            <div
              key={shipment.id}
              onClick={() => setSelectedShipment(shipment)}
              className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {shipment.commodity}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                      {shipment.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {shipment.quantity} Quintals • {shipment.id}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <FiClock className="w-3 h-3" />
                    ETA: {formatDate(shipment.eta)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  {shipment.origin} → {shipment.destination}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      shipment.status === "delayed" ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${shipment.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {shipment.progress}% complete
                </p>
              </div>
            </div>
          ))}

          {/* Shipment Detail View */}
          {selectedShipment && (
            <div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-sm text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-1"
              >
                ← Back to all shipments
              </button>
              
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {selectedShipment.commodity}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedShipment.quantity} Quintals • {selectedShipment.id}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedShipment.status)}`}>
                    {selectedShipment.status.replace("_", " ")}
                  </span>
                </div>

                {/* Timeline */}
                <div className="relative mt-6">
                  {selectedShipment.nodes.map((node, idx) => (
                    <div key={node.id} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        {getNodeIcon(node.type, node.status)}
                        {idx < selectedShipment.nodes.length - 1 && (
                          <div className={`w-0.5 h-full absolute top-6 ${
                            node.status === "completed" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {node.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(node.timestamp)}
                        </p>
                        {node.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {node.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {shipments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FiTruck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active shipments</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

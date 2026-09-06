"use client";

import { useState, useEffect } from "react";

export default function SSECivilizationsStream() {
  const [civilizations, setCivilizations] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("disconnected");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const eventSource = new EventSource("/api/sse/civilizations");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "connection") {
        setStatus("connected");
        setLoading(false);
      } else if (data.type === "civilization") {
        setCivilizations((prev) => [...prev, data.data]);
      } else if (data.type === "complete") {
        setStatus("complete");
        setLoading(false);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setStatus("error");
      setLoading(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-white shadow-lg max-w-md mx-auto fade-in">
      <h3 className="text-lg font-bold text-primary-dark mb-4">Live Civilization Data Stream</h3>
      
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-sm font-medium ${status === "connected" ? "text-primary-gold" : status === "error" ? "text-red-600" : "text-gray-500"}`}>
          {status}
        </span>
      </div>

      {loading && <p className="text-gray-500">Connecting to data stream...</p>}

      {status === "connected" && (
        <div className="space-y-3">
          {civilizations.map((civ, index) => (
            <div
              key={civ.id}
              className={`p-3 rounded-xl bg-primary-gold/10 hover:bg-primary-gold/20 transition-colors duration-300 animate-fade-in-up`}
            >
              <h4 className="font-medium text-primary-gold">{civ.name}</h4>
              <p className="text-sm text-gray-500">{civ.category}</p>
            </div>
          ))}
        </div>
      )}

      {status === "complete" && (
        <p className="text-green-600 font-medium mt-4">
          All civilization data streamed successfully!
        </p>
      )}

      {status === "error" && (
        <p className="text-red-600 font-medium mt-4">
          Failed to connect to data stream. Please try again.
        </p>
      )}
    </div>
  );
}
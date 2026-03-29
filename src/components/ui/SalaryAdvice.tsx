"use client";

import { useState } from "react";

export function SalaryAdvice() {
  const [position, setPosition] = useState("");
  const [experience, setExperience] = useState("");
  const [city, setCity] = useState("Rīga");
  const [salary, setSalary] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getAdvice() {
    if (!position.trim() || !salary.trim()) return;

    setLoading(true);
    setError("");
    setAdvice("");

    try {
      const res = await fetch("/api/salary-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: position.trim(),
          experience: experience ? parseInt(experience) : undefined,
          city: city || undefined,
          currentSalary: parseInt(salary.replace(/\s/g, "")),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setAdvice(data.advice);
    } catch {
      setError("Neizdevās savienot. Mēģini vēlreiz.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border rounded-xl p-5 sm:p-6 bg-bg-secondary">
      <h3 className="font-heading text-lg font-bold mb-1">
        Algas konsultants
      </h3>
      <p className="text-sm text-text-muted mb-4">
        Uzzini, vai tava alga atbilst tirgum, un saņem padomus sarunām
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Amats / profesija *
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="piem., grāmatvedis"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Bruto alga (€/mēn.) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="piem., 1500"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Pieredze (gadi)
          </label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Nav norādīts</option>
            <option value="1">Mazāk par 1 gadu</option>
            <option value="2">1-2 gadi</option>
            <option value="4">3-5 gadi</option>
            <option value="7">5-10 gadi</option>
            <option value="12">10+ gadi</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Pilsēta
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="Rīga">Rīga</option>
            <option value="Daugavpils">Daugavpils</option>
            <option value="Liepāja">Liepāja</option>
            <option value="Jelgava">Jelgava</option>
            <option value="Jūrmala">Jūrmala</option>
            <option value="Ventspils">Ventspils</option>
            <option value="">Cita</option>
          </select>
        </div>
      </div>

      <button
        onClick={getAdvice}
        disabled={loading || !position.trim() || !salary.trim()}
        className="w-full py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {loading ? "Analizē..." : "Saņemt padomu"}
      </button>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {advice && (
        <div className="mt-4 p-4 bg-white border border-border rounded-lg">
          <p className="text-sm text-text leading-relaxed">{advice}</p>
          <p className="text-[11px] text-text-muted mt-3">
            * Aptuvens novērtējums. Konkrētas algas var atšķirties atkarībā no uzņēmuma, nozares un individuālajiem apstākļiem.
          </p>
        </div>
      )}
    </div>
  );
}

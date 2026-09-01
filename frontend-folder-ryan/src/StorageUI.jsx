import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { FOLDERS, FILES } from "./data";

// File Filtering, (Ideally this should be received from the backend)
function getFileType(name) {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (ext === "blend" || ext === "blend1") return "Blender";
  if (ext === "xcf") return "Image";
  if (ext === "mp4") return "Video";
  if (ext === "zip") return "Archive";
  if (ext === "ini") return "System";
  return "Other";
}

const COLORS = {
  Blender: "#5B8DEF",
  Image: "#E8A33D",
  Video: "#EB5757",
  Archive: "#6FCF97",
  System: "#8B919B",
  Other: "#BB6BD9",
};

// Count files per type
function getTypeCounts() {
  const counts = {};
  FILES.forEach((f) => {
    const type = getFileType(f.name);
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.keys(counts).map((type) => ({
    name: type,
    value: counts[type],
  }));
}

// Search page
function SearchPage() {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();

  const matchedFolders = FOLDERS.filter((f) => f.name.toLowerCase().includes(q));
  const matchedFiles = FILES.filter((f) => f.name.toLowerCase().includes(q));

  return (
    <div>
      <h2>Search</h2>
      <input
        type="text"
        placeholder="Search folders and files..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: 300,
          background: "#3f3f3f",
          color: "#ffffff",
          border: "1px solid #555",
          padding: "6px 8px",
        }}
      />

      <h3>Folders ({matchedFolders.length})</h3>
      <table
        border="1"
        cellPadding="6"
        style={{ width: "100%", marginBottom: 20, borderColor: "#555", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          {matchedFolders.map((f) => (
            <tr key={f.name}>
              <td>[DIR] {f.name}</td>
              <td>{f.modified}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Files ({matchedFiles.length})</h3>
      <table
        border="1"
        cellPadding="6"
        style={{ width: "100%", borderColor: "#555", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          {matchedFiles.map((f) => (
            <tr key={f.name}>
              <td>{f.name}</td>
              <td>{getFileType(f.name)}</td>
              <td>{f.modified}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Storage page (Pie Chart)
function StoragePage() {
  const data = getTypeCounts();

  return (
    <div>
      <h2>Files by Type</h2>
      <p style={{ color: "#aaaaaa", fontSize: 13 }}>
        Note: Dummy Data
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PieChart width={300} height={300}>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>
    </div>
  );
}

// Main controller for switching pages
export default function App() {
  const [page, setPage] = useState("browse");

  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
        background: "#2b2b2b",
        color: "#ffffff",
      }}
    >
      <nav style={{ marginBottom: 20 }}>
        <button
          onClick={() => setPage("browse")}
          style={{
            background: "#3f3f3f",
            color: "#ffffff",
            border: "1px solid #555",
            padding: "6px 12px",
            marginRight: 8,
            cursor: "pointer",
          }}
        >
          Browse
        </button>
        <button
          onClick={() => setPage("storage")}
          style={{
            background: "#3f3f3f",
            color: "#ffffff",
            border: "1px solid #555",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          Storage
        </button>
      </nav>

      {page === "browse" ? <SearchPage /> : <StoragePage />}
    </div>
  );
}
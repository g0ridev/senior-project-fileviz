import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const API = "http://localhost:5000";        //browse
const SEARCH_API = "http://localhost:5001"; //search

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

// New component to browse the current folder/files

function BrowsePage({ entries, path, setPath, onFilesChange }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Debounced call to the real /search endpoint on port 5001
  useEffect(() => {
    if (!query || !path) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      fetch(
        `${SEARCH_API}/search?path=${encodeURIComponent(path)}&query=${encodeURIComponent(query)}`
      )
        .then((r) => r.json())
        .then((data) => {
          setSearchResults(data);
          setSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setSearching(false);
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [query, path]);

  const folders = entries.filter((e) => e.isDirectory);
  const files = entries.filter((e) => !e.isDirectory);

  useEffect(() => {
    onFilesChange(files);
  }, [entries]);

  return (
    <div>
      <h2>Browse</h2>
      <div style={{ marginBottom: 10, color: "#aaa" }}>{path}</div>

      <input
        type="text"
        placeholder="Search this folder tree..."
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

      {searching && <p style={{ color: "#888" }}>Searching...</p>}

      {searchResults ? (
        <>
          <h3>
            Search Results ({searchResults.length}
            {searchResults.length === 100 ? "+" : ""})
          </h3>
          <table
            border="1"
            cellPadding="6"
            style={{ width: "100%", borderColor: "#555", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Directory</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((f) => (
                <tr key={f.fullPath}>
                  <td>{f.name}</td>
                  <td>{getFileType(f.name)}</td>
                  <td>{f.directory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h3>Folders ({folders.length})</h3>
          <table
            border="1"
            cellPadding="6"
            style={{
              width: "100%",
              marginBottom: 20,
              borderColor: "#555",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {folders.map((f) => (
                <tr
                  key={f.fullPath}
                  onDoubleClick={() => setPath(f.fullPath)}
                  style={{ cursor: "pointer" }}
                >
                  <td>[DIR] {f.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Files ({files.length})</h3>
          <table
            border="1"
            cellPadding="6"
            style={{ width: "100%", borderColor: "#555", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.fullPath}>
                  <td>{f.name}</td>
                  <td>{getFileType(f.name)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Storage page (Pie Chart) *Updated*

function StoragePage({ files }) {
  const counts = {};
  files.forEach((f) => {
    const type = getFileType(f.name);
    counts[type] = (counts[type] || 0) + 1;
  });
  const data = Object.keys(counts).map((type) => ({
    name: type,
    value: counts[type],
  }));

  return (
    <div>
      <h2>Files by Type (current folder)</h2>
      <p style={{ color: "#aaaaaa", fontSize: 13 }}>
        Backend doesn't report file sizes yet, so this counts files per type
        instead of bytes used.
      </p>

      {data.length === 0 ? (
        <p style={{ color: "#888" }}>No files in this folder yet.</p>
      ) : (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PieChart width={300} height={300}>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] || "#888"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      )}
    </div>
  );
}

// Main controller for switching pages *Updated*
export default function App() {
  const [page, setPage] = useState("browse");
  const [path, setPath] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);

  // Get starting folder on mount
  useEffect(() => {
    fetch(`${API}/root`)
      .then((r) => r.json())
      .then((data) => setPath(data.path))
      .catch(console.error);
  }, []);

  // Load folder contents whenever path changes
  useEffect(() => {
    if (!path) return;
    fetch(`${API}/folder?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(console.error);
  }, [path]);

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

      {page === "browse" ? (
        <BrowsePage
          entries={entries}
          path={path}
          setPath={setPath}
          onFilesChange={setCurrentFiles}
        />
      ) : (
        <StoragePage files={currentFiles} />
      )}
    </div>
  );
}
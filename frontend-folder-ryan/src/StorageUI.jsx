import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://localhost:5000";        //browse
const SEARCH_API = "http://localhost:5001"; //search

const IMAGE_EXTENSIONS = new Set([
  "avif",
  "gif",
  "ico",
  "icns",
  "jpeg",
  "jpg",
  "png",
  "webp",
  "xcf",
]);

const VIDEO_EXTENSIONS = new Set([
  "mov",
  "mp4",
  "mpeg",
  "mpg",
  "rmvb",
  "webm",
]);

const CODE_EXTENSIONS = new Set([
  "c",
  "cc",
  "cfg",
  "class",
  "clj",
  "cljs",
  "cmake",
  "cpp",
  "cs",
  "cshtml",
  "css",
  "cxx",
  "dart",
  "htm",
  "html",
  "java",
  "js",
  "json",
  "jsonc",
  "jsx",
  "lua",
  "py",
  "sh",
  "sql",
  "svelte",
  "swift",
  "ts",
  "tsx",
  "xml",
  "yaml",
  "yml",
  "zsh",
]);

// File Filtering, (Ideally this should be received from the backend)
function getFileType(name) {
  const lowerName = name.toLowerCase();
  const ext = lowerName.includes(".") ? lowerName.split(".").pop() : "";
  if (ext === "blend" || ext === "blend1") return "Blender";
  if (IMAGE_EXTENSIONS.has(ext)) return "Image";
  if (VIDEO_EXTENSIONS.has(ext)) return "Video";
  if (ext === "zip") return "Archive";
  if (ext === "ini") return "System";
  if (CODE_EXTENSIONS.has(ext)) return "Code";
  return "Other";
}

const COLORS = {
  Blender: "#5B8DEF",
  Image: "#E8A33D",
  Video: "#EB5757",
  Archive: "#6FCF97",
  System: "#8B919B",
  Code: "#F2994A",
  Other: "#BB6BD9",
};

// Take reported byte sizes and format/print them

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** unitIndex;
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

async function addSearchResultSizes(results) {
  const directories = [
    ...new Set(
      results
        .filter((file) => !Number.isFinite(file.size) && file.directory)
        .map((file) => file.directory)
    ),
  ];
  const sizesByPath = new Map();

  for (let i = 0; i < directories.length; i += 8) {
    const batch = directories.slice(i, i + 8);
    const folderResults = await Promise.all(
      batch.map(async (directory) => {
        try {
          const response = await fetch(
            `${API}/folder?path=${encodeURIComponent(directory)}`
          );
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
          }
          return await response.json();
        } catch (error) {
          console.error(`Could not load file sizes for ${directory}`, error);
          return [];
        }
      })
    );

    folderResults.flat().forEach((file) => {
      if (!file.isDirectory && Number.isFinite(file.size)) {
        sizesByPath.set(file.fullPath, file.size);
      }
    });
  }

  return results.map((file) => ({
    ...file,
    size: Number.isFinite(file.size)
      ? file.size
      : sizesByPath.get(file.fullPath),
  }));
}

// New component to browse the current folder/files

function BrowsePage({entries, path, setPath, onFilesChange, onSearchResultsChange,
}) {
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
        .then((r) => {
          if (!r.ok) throw new Error(`Search request failed: ${r.status}`);
          return r.json();
        })
        .then(addSearchResultSizes)
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

  useEffect(() => {
    onSearchResultsChange(searchResults);
  }, [searchResults, onSearchResultsChange]);

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
                <th>Size</th>
                <th>Directory</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((f) => (
                <tr key={f.fullPath}>
                  <td>{f.name}</td>
                  <td>{getFileType(f.name)}</td>
                  <td>{formatBytes(f.size)}</td>
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
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.fullPath}>
                  <td>{f.name}</td>
                  <td>{getFileType(f.name)}</td>
                  <td>{formatBytes(f.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Storage page (Pie Chart)

// *Updated* - Shows storage types. Display adjusted

function StoragePage({ files, searchResults }) {
  const displayedFiles = searchResults === null ? files : searchResults;
  const sizesByType = {};
  let reportedFiles = 0;
  displayedFiles.forEach((f) => {
    if (!Number.isFinite(f.size) || f.size < 0) return;

    const type = getFileType(f.name);
    sizesByType[type] = (sizesByType[type] || 0) + f.size;
    reportedFiles += 1;
  });
  const data = Object.keys(sizesByType).map((type) => ({
    name: type,
    value: sizesByType[type],
  }));
  const chartData = data.filter((entry) => entry.value > 0);
  const totalSize = data.reduce((total, entry) => total + entry.value, 0);

  return (
    <div>
      <h2>
        Storage by Type ({searchResults === null ? "current folder" : "search results"})
      </h2>
      <p style={{ color: "#aaaaaa", fontSize: 13 }}>
        Total reported size: {formatBytes(totalSize)}
      </p>
      {reportedFiles < displayedFiles.length && (
        <p style={{ color: "#aaaaaa", fontSize: 13 }}>
          Sizes are unavailable for {displayedFiles.length - reportedFiles} file(s),
          so this total may be incomplete.
        </p>
      )}

      {totalSize === 0 ? (
        <p style={{ color: "#888" }}>
          {displayedFiles.length === 0
            ? searchResults === null
              ? "No files in this folder yet."
              : "No files in these search results."
            : reportedFiles === 0
              ? "No file sizes were reported for these files."
              : "All reported files have a size of 0 B."}
        </p>
      ) : (
        <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ width: "100%", height: 480 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="76%"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || "#888"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatBytes(value), "Size"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px 20px",
              padding: "0 12px 16px",
              boxSizing: "border-box",
            }}
          >
            {chartData.map((entry) => (
              <div
                key={entry.name}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                  maxWidth: "100%",
                  textAlign: "left",
                  overflowWrap: "anywhere",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 12px",
                    width: 12,
                    height: 12,
                    marginTop: 5,
                    borderRadius: "50%",
                    backgroundColor: COLORS[entry.name] || "#888",
                  }}
                />
                <span>
                  {entry.name}: {formatBytes(entry.value)}
                </span>
              </div>
            ))}
          </div>
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
  const [searchResults, setSearchResults] = useState(null);

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
          onSearchResultsChange={setSearchResults}
        />
      ) : (
        <StoragePage files={currentFiles} searchResults={searchResults} />
      )}
    </div>
  );
}
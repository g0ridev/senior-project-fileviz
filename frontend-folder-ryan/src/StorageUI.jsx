import React, { useState, useEffect } from "react";
import {Treemap, Tooltip,ResponsiveContainer,} from "recharts";
import { getFileType } from "./fileTypes.js";
import ThemeSelector from "./ThemeSelector.jsx";
import "./themes.css";

const API = "http://localhost:5000";        //browse
const SEARCH_API = "http://localhost:5001"; //search

const COLORS = {
  Blender: "#5B8DEF",
  Image: "#E8A33D",
  Video: "#EB5757",
  PDF: "#C0392B",
  Office: "#2D9CDB",
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

function BrowsePage({entries, path, setPath, canGoBack, onBack, query, onQueryChange, searchResults, onSearchResultsChange, onFilesChange,
}) {
  const [searching, setSearching] = useState(false);

  // Debounced call to the real /search endpoint on port 5001
  useEffect(() => {
    if (!query || !path) {
      onSearchResultsChange(null);
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
          onSearchResultsChange(data);
          setSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setSearching(false);
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [query, path, onSearchResultsChange]);

  const folders = entries.filter((e) => e.isDirectory);
  const files = entries.filter((e) => !e.isDirectory);

  useEffect(() => {
    onFilesChange(files);
  }, [entries]);

  return (
    <div>
      <button
        type="button"
        className="theme-button"
        onClick={onBack}
        disabled={!canGoBack}
        style={{ marginBottom: 12 }}
      >
        Back
      </button>
      <h2>Browse</h2>
      <div className="secondary-text" style={{ marginBottom: 10 }}>{path}</div>

      <input
        type="text"
        placeholder="Search this folder tree..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="theme-input"
      />

      {searching && <p className="muted-text">Searching...</p>}

      {searchResults ? (
        <details className="result-dropdown">
          <summary>
            Search Results ({searchResults.length}
            {searchResults.length === 100 ? "+" : ""})
          </summary>
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Directory</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((f) => (
                <tr key={f.fullPath}>
                  <td>{f.name}</td>
                  <td>{getFileType(f.name)}</td>
                  <td>{formatBytes(f.size)}</td>
                  <td>{f.directory}</td>
                  <td>
                    <button
                      type="button"
                      className="theme-button"
                      onClick={() => setPath(f.directory)}
                      disabled={!f.directory}
                    >
                      Open folder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : (
        <>
          <details className="result-dropdown">
            <summary>Folders ({folders.length})</summary>
            <table className="file-table">
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
                    className="folder-row"
                  >
                    <td>[DIR] {f.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <details className="result-dropdown">
            <summary>Files ({files.length})</summary>
            <table className="file-table">
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
          </details>
        </>
      )}
    </div>
  );
}

// New Visualizer (Treemap)

function renderTreemapNode({ x, y, width, height, name, type, value }) {
  if (width <= 0 || height <= 0) return null;
  const maxLabelLength = Math.floor((width - 12) / 7);
  const label =
    maxLabelLength > 3 && height >= 24
      ? name.length > maxLabelLength
        ? `${name.slice(0, maxLabelLength - 3)}...`
        : name
      : "";

  return (
    <g>
      <title>{`${name} (${type}) - ${formatBytes(value)}`}</title>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={COLORS[type] || "var(--muted-text)"}
        stroke="var(--surface-background)"
        strokeWidth={2}
      />
      {label && (
        <text
          x={x + 6}
          y={y + 17}
          fill="white"
          fontSize={12}
          pointerEvents="none"
        >
          {label}
        </text>
      )}
    </g>
  );
}

// Storage page (Treemap)

// *Updated* - Shows storage types. Display adjusted

function StoragePage({ files, searchResults, onBackToSearch }) {
  const displayedFiles = searchResults === null ? files : searchResults;
  const sizesByType = {};
  let reportedFiles = 0;
  const treemapData = [];
  displayedFiles.forEach((f) => {
    if (!Number.isFinite(f.size) || f.size < 0) return;

    const type = getFileType(f.name);
    sizesByType[type] = (sizesByType[type] || 0) + f.size;
    reportedFiles += 1;
    if (f.size > 0) {
      treemapData.push({
        name: f.name,
        fullPath: f.fullPath,
        type,
        value: f.size,
      });
    }
  });
  const data = Object.keys(sizesByType).map((type) => ({
    name: type,
    value: sizesByType[type],
  }));
  const typeTotals = data.filter((entry) => entry.value > 0);
  const totalSize = data.reduce((total, entry) => total + entry.value, 0);

  return (
    <div>
      <button
        className="theme-button"
        onClick={onBackToSearch}
        style={{ marginBottom: 12 }}
      >
        Back
      </button>
      <h2>
        Storage by Type ({searchResults === null ? "current folder" : "search results"})
      </h2>
      <p className="secondary-text" style={{ fontSize: 13 }}>
        Total reported size: {formatBytes(totalSize)}
      </p>
      {reportedFiles < displayedFiles.length && (
        <p className="secondary-text" style={{ fontSize: 13 }}>
          Sizes are unavailable for {displayedFiles.length - reportedFiles} file(s),
          so this total may be incomplete.
        </p>
      )}
      {totalSize === 0 ? (
        <p className="muted-text">
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
          <p className="secondary-text" style={{ fontSize: 13 }}>
            Files shown as blocks. Larger block = larger file.
          </p>
          <div style={{ width: "100%", height: 480 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="value"
                nameKey="name"
                content={renderTreemapNode}
              >
                <Tooltip
                  formatter={(value) => [formatBytes(value), "Size"]}
                  contentStyle={{
                    backgroundColor: "var(--surface-background)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                  labelStyle={{ color: "var(--text-color)" }}
                  itemStyle={{ color: "var(--text-color)" }}
                />
              </Treemap>
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
            {typeTotals.map((entry) => (
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
                    backgroundColor: COLORS[entry.name] || "var(--muted-text)",
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
  const [theme, setTheme] = useState("dark");
  const [path, setPath] = useState(null);
  const [pathHistory, setPathHistory] = useState([]);
  const [entries, setEntries] = useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [query, setQuery] = useState("");

  function navigateToPath(nextPath) {
    if (!nextPath || nextPath === path) return;
    setPathHistory((history) => path ? [...history, path] : history);
    setPath(nextPath);
  }

  function navigateBack() {
    if (pathHistory.length === 0) return;
    setPath(pathHistory[pathHistory.length - 1]);
    setPathHistory(pathHistory.slice(0, -1));
  }

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
    <div className="app-shell" data-theme={theme}>
      <nav className="app-navigation">
        <button
          className="theme-button"
          onClick={() => setPage("browse")}
        >
          Browse
        </button>
        <button
          className="theme-button"
          onClick={() => setPage("storage")}
        >
          Storage
        </button>
        <ThemeSelector theme={theme} onThemeChange={setTheme} />
      </nav>

      {page === "browse" ? (
        <BrowsePage
          entries={entries}
          path={path}
          setPath={navigateToPath}
          canGoBack={pathHistory.length > 0}
          onBack={navigateBack}
          query={query}
          onQueryChange={setQuery}
          searchResults={searchResults}
          onSearchResultsChange={setSearchResults}
          onFilesChange={setCurrentFiles}
        />
      ) : (
        <StoragePage
          files={currentFiles}
          searchResults={searchResults}
          onBackToSearch={() => setPage("browse")}
        />
      )}
    </div>
  );
}
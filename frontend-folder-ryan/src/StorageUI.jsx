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

// Added basic file operations (rename, delete, etc.)

function BrowsePage({entries, path, setPath, canGoBack, onBack, query, onQueryChange, searchResults, onSearchResultsChange, onFilesChange, onEntriesChange,
}) {
  const [searching, setSearching] = useState(false);
  const [operationPending, setOperationPending] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [operationStatus, setOperationStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  async function runOperation(route, method, params, successMessage) {
    setOperationPending(true);
    setOperationError("");
    setOperationStatus("");

    try {
      const response = await fetch(
        `${API}${route}?${new URLSearchParams(params)}`,
        { method }
      );
      if (!response.ok) {
        const detail = (await response.text()).trim();
        throw new Error(detail || `Request failed: ${response.status}`);
      }
    } catch (error) {
      setOperationError(error.message || "The operation failed.");
      setOperationPending(false);
      return;
    }

    setOperationStatus(successMessage);
    try {
      const response = await fetch(
        `${API}/folder?path=${encodeURIComponent(path)}`
      );
      if (!response.ok) {
        const detail = (await response.text()).trim();
        throw new Error(detail || `Request failed: ${response.status}`);
      }
      onEntriesChange(await response.json());
      onQueryChange("");
      onSearchResultsChange(null);
      setSelectedFile(null);
    } catch (error) {
      setOperationError(
        `${successMessage}, but the folder could not be refreshed: ${error.message}`
      );
    } finally {
      setOperationPending(false);
    }
  }

  function renameEntry(entry) {
    const newName = window.prompt("Enter a new name:", entry.name);
    if (newName === null) return;

    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === "." || trimmedName === ".." ||
        /[\\/]/.test(trimmedName)) {
      setOperationError("Enter a valid name without path separators.");
      return;
    }
    if (trimmedName === entry.name) return;
    if (entries.some((other) =>
      other.fullPath !== entry.fullPath &&
      other.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
    )) {
      setOperationError("An item with that name already exists in this folder.");
      return;
    }

    const separator = entry.fullPath.includes("\\") ? "\\" : "/";
    const separatorIndex = entry.fullPath.lastIndexOf(separator);
    const parentPath = entry.fullPath.slice(0, separatorIndex);
    const newPath = `${parentPath}${parentPath.endsWith(separator) ? "" : separator}${trimmedName}`;
    const itemType = entry.isDirectory ? "folder" : "file";
    runOperation(
      `/${itemType}`,
      "PATCH",
      { oldPath: entry.fullPath, newPath },
      `${itemType === "folder" ? "Folder" : "File"} renamed.`
    );
  }

  function deleteEntry(entry) {
    const itemType = entry.isDirectory ? "folder" : "file";
    const warning = entry.isDirectory
      ? `Permanently delete "${entry.name}" and everything inside it?`
      : `Permanently delete "${entry.name}"?`;
    if (!window.confirm(warning)) return;

    runOperation(
      `/${itemType}`,
      "DELETE",
      { path: entry.fullPath },
      `${itemType === "folder" ? "Folder" : "File"} deleted.`
    );
  }

  function openFile(entry) {
    runOperation(
      "/open",
      "POST",
      { path: entry.fullPath },
      "File opened."
    );
  }

  function createFolder() {
    const name = window.prompt("Name for the new folder:");
    if (name === null) return;

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === "." || trimmedName === ".." ||
        /[\\/]/.test(trimmedName)) {
      setOperationError("Enter a valid folder name without path separators.");
      return;
    }
    if (entries.some((entry) =>
      entry.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
    )) {
      setOperationError("An item with that name already exists in this folder.");
      return;
    }

    const separator = path.includes("\\") ? "\\" : "/";
    const folderPath = `${path}${path.endsWith(separator) ? "" : separator}${trimmedName}`;
    runOperation(
      "/folder",
      "POST",
      { path: folderPath },
      "Folder created."
    );
  }

  function renderActions(entry) {
    return (
      <>
        {!entry.isDirectory && (
          <button
            type="button"
            className="theme-button"
            onClick={() => openFile(entry)}
            disabled={operationPending}
          >
            Open
          </button>
        )}
        <button
          type="button"
          className="theme-button"
          onClick={() => renameEntry(entry)}
          disabled={operationPending}
        >
          Rename
        </button>
        <button
          type="button"
          className="theme-button"
          onClick={() => deleteEntry(entry)}
          disabled={operationPending}
        >
          Delete
        </button>
      </>
    );
  }

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
  const selectedFileIsVisible = selectedFile?.browsePath === path && (
    searchResults === null
      ? files.some((file) => file.fullPath === selectedFile.fullPath)
      : searchResults.some((file) => file.fullPath === selectedFile.fullPath)
  );

  function renderSelectedFileActions() {
    if (!selectedFileIsVisible) return null;

    return (
      <section className="selected-file-actions" aria-label="Selected file actions">
        <div>
          <strong>{selectedFile.name}</strong>
          <div className="secondary-text">
            {getFileType(selectedFile.name)} · {formatBytes(selectedFile.size)}
          </div>
        </div>
        <div className="selected-file-buttons">
          <button
            type="button"
            className="theme-button"
            onClick={() => openFile(selectedFile)}
            disabled={operationPending}
          >
            Open
          </button>
          <button
            type="button"
            className="theme-button"
            onClick={() => renameEntry(selectedFile)}
            disabled={operationPending}
          >
            Rename
          </button>
          <button
            type="button"
            className="theme-button"
            onClick={() => deleteEntry(selectedFile)}
            disabled={operationPending}
          >
            Delete
          </button>
        </div>
      </section>
    );
  }

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
      <button
        type="button"
        className="theme-button"
        onClick={createFolder}
        disabled={operationPending || !path}
        style={{ margin: "0 0 12px 8px" }}
      >
        New folder
      </button>
      {operationError && (
        <p className="operation-error" role="alert">{operationError}</p>
      )}
      {operationStatus && !operationError && (
        <p className="operation-status" role="status">{operationStatus}</p>
      )}
      <h2>Search</h2>
      <div className="secondary-text" style={{ marginBottom: 10 }}>{path}</div>

      <input
        type="text"
        placeholder="Search this folder tree..."
        value={query}
        onChange={(e) => {
          setSelectedFile(null);
          onQueryChange(e.target.value);
        }}
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
                <th>Folder</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((f) => (
                <tr key={f.fullPath}>
                  <td>
                    <button
                      type="button"
                      className="file-select-button"
                      aria-pressed={
                        selectedFile?.browsePath === path &&
                        selectedFile.fullPath === f.fullPath
                      }
                      onClick={() => setSelectedFile({ ...f, browsePath: path })}
                    >
                      {f.name}
                    </button>
                  </td>
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
          {renderSelectedFileActions()}
        </details>
      ) : (
        <>
          <details className="result-dropdown">
            <summary>Folders ({folders.length})</summary>
            <table className="file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Actions</th>
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
                    <td>{renderActions(f)}</td>
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
                    <td>
                      <button
                        type="button"
                        className="file-select-button"
                        aria-pressed={
                          selectedFile?.browsePath === path &&
                          selectedFile.fullPath === f.fullPath
                        }
                        onClick={() => setSelectedFile({ ...f, browsePath: path })}
                      >
                        {f.name}
                      </button>
                    </td>
                    <td>{getFileType(f.name)}</td>
                    <td>{formatBytes(f.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderSelectedFileActions()}
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
          onEntriesChange={setEntries}
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
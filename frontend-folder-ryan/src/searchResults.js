import { useEffect, useState } from 'react';

// Converts raw file path strings to {name, folder, fullPath}
function parseSearchResults(paths) {
  return paths.map((fullPath) => {
    const parts = fullPath.split("\\");
    const name = parts[parts.length - 1];
    const folder = parts.slice(0, -1).join("\\");
    return { name, folder, fullPath };
  });
}

// Polls search-results.json and returns the latest parsed results
export function useSearchResults(pollInterval = 2000) {
  const [results, setResults] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchResults = async () => {
      try {
        const res = await fetch(`/search-results.json?t=${Date.now()}`);
        if (!res.ok) return;
        const rawPaths = await res.json();
        const parsed = parseSearchResults(rawPaths);
        if (isMounted) setResults(parsed);
      } catch (err) {
        console.error('Failed to load search results:', err);
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, pollInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollInterval]);

  return results;
}
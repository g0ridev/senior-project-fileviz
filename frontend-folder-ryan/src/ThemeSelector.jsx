const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

export default function ThemeSelector({ theme, onThemeChange }) {
  return (
    <label className="theme-selector">
      Theme
      <select
        value={theme}
        onChange={(event) => onThemeChange(event.target.value)}
        aria-label="Choose theme"
      >
        {THEMES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProgressTitle({ value, onChange, label, small = false, rigid = false }: { value: string; onChange: (value: string) => void; label: string; small?: boolean; rigid?: boolean }) {
  return <span className={`progress-title ${small ? "progress-title-small" : ""} ${rigid ? "progress-title-rigid" : ""}`}>
    <span aria-hidden="true">{value || " "}</span>
    <textarea rows={1} aria-label={label} value={value} onChange={event => onChange(event.target.value)} />
  </span>;
}
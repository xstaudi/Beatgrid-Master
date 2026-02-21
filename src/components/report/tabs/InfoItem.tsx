export function InfoItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-mono font-medium ${className ?? ''}`}>{value}</p>
    </div>
  )
}

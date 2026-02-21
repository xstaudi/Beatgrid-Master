export function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-mono font-medium">{value}</p>
    </div>
  )
}

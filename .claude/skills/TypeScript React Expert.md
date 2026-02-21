---
name: typescript-react-expert
description: TypeScript und React Best Practices. Verwenden bei Components, Hooks, State, Props, React Query, Types, Interfaces, Performance, Memoization.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# TypeScript React Expert

## Quick Reference

**Components:** Function Declaration (kein FC), Props typed, `type="button"` Pflicht
**Hooks:** Query Keys serializable, `enabled` bei nullable IDs
**Types:** `unknown` at boundaries + Zod parse, no `any`
**Performance:** Memoization nur wenn messbar hilfreich

---

## Component Pattern

```tsx
type Props = {
  title: string;
  onSelect?: (id: string) => void;
};

export function MyComponent({ title, onSelect }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <button type="button" onClick={() => onSelect?.('1')}>
        Action
      </button>
    </div>
  );
}
```

**Regeln:**
- `type="button"` bei Buttons (Pflicht, außer Submit)
- Event-Handler Props typisiert
- DOM Events: `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`

---

## Hooks

**React Query:**
```tsx
export const queryKeys = {
  all: ['items'] as const,
  detail: (id: string) => [...queryKeys.all, id] as const,
};

export function useItem(id: string | null) {
  return useQuery({
    queryKey: queryKeys.detail(id ?? 'none'),
    queryFn: () => api.getItem(id as string),
    enabled: Boolean(id), // Pflicht bei nullable
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}
```

**Regeln:**
- QueryKey Inputs serialisierbar
- `enabled` für conditional queries
- `select` für derived data

**Custom Hook:**
```tsx
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

---

## TypeScript Patterns

**Zod Boundary Pattern (Pflicht):**
```tsx
const itemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

type Item = z.infer<typeof itemSchema>;

// unknown → Item
async function fetchItem(id: string): Promise<Item> {
  const response = await api.get(`/items/${id}`);
  return itemSchema.parse(response.data); // Boundary
}
```

**Discriminated Unions:**
```tsx
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

// Exhaustiveness Check
function assertNever(x: never): never {
  throw new Error('Unexpected: ' + String(x));
}
```

**Utility Types:**
```tsx
Pick<T, 'a' | 'b'>  // Nur a, b
Omit<T, 'id'>       // Ohne id
Partial<T>          // Alles optional
Record<string, T>   // Map
```

---

## Performance

**Memoization (nur wenn messbar hilfreich):**
```tsx
// Component
export const Item = memo(function Item({ data }: Props) {
  return <div>{data.name}</div>;
});

// Value
const filtered = useMemo(() => items.filter(i => i.active), [items]);

// Callback (nur bei memoized child/dependency stability)
const handleClick = useCallback((id) => setSelected(id), []);
```

**Lazy Loading:**
```tsx
const Detail = lazy(() => import('./Detail'));

<Suspense fallback={<Skeleton />}>
  <Detail />
</Suspense>
```

---

## Anti-Patterns

```tsx
// ❌ Index als Key
{items.map((item, i) => <Item key={i} />)}
// ✅ Unique ID
{items.map(item => <Item key={item.id} />)}

// ❌ any
const data: any = res;
// ✅ unknown → parse
const data: unknown = res;
const item = itemSchema.parse(data);

// ❌ Non-null assertion
const value = data!.property;
// ✅ Optional Chaining
const value = data?.property ?? defaultValue;
```

---

## Wann aktiv

React Components, Hooks, TypeScript Types, State Management, Performance.

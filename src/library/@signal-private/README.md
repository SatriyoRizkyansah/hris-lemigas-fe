# Signal Library

Signal library yang kompatibel dengan React, terinspirasi dari Preact signals. Library ini menyediakan state management yang reaktif dengan automatic dependency tracking dan optimized re-renders.

## Fitur

- ✅ **Reactive State Management** - State yang otomatis memperbarui UI saat berubah
- ✅ **Automatic Dependency Tracking** - Computed values yang otomatis terupdate saat dependencies berubah
- ✅ **React Hooks Integration** - Hook yang mudah digunakan untuk React components
- ✅ **Batching Support** - Batching updates untuk performa optimal
- ✅ **Utility Functions** - Debounce, throttle, localStorage integration, dan lainnya
- ✅ **TypeScript Support** - Full TypeScript support dengan type safety
- ✅ **Lightweight** - Minimal bundle size dengan performa tinggi

## Instalasi

Library ini sudah tersedia di folder `src/library`. Untuk menggunakannya:

```typescript
import { signal, useSignal, computed } from "@/library";
```

## Quick Start

### Basic Signal

```typescript
import { signal } from "@/library";

// Membuat signal
const count = signal(0);

// Membaca nilai
console.log(count.value); // 0

// Mengubah nilai
count.value = 1;
```

### React Integration

```typescript
import { useSignal, useComputed } from '@/library';

function Counter() {
  const [count, setCount] = useSignal(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Computed Values

```typescript
import { signal, computed, useSignalValue } from '@/library';

const firstName = signal('John');
const lastName = signal('Doe');

const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);

function UserProfile() {
  const name = useSignalValue(fullName);

  return <h1>Hello, {name}!</h1>;
}
```

## API Reference

### Core Functions

#### `signal<T>(initialValue: T): Signal<T>`

Membuat signal baru dengan nilai awal.

```typescript
const name = signal("John");
const age = signal(25);
const user = signal({ name: "John", age: 25 });
```

#### `computed<T>(computeFn: () => T): Signal<T>`

Membuat computed signal yang otomatis terupdate saat dependencies berubah.

```typescript
const count = signal(5);
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 10
count.value = 10;
console.log(doubled.value); // 20
```

#### `effect(fn: () => void | (() => void)): () => void`

Menjalankan function yang akan dipanggil saat dependencies berubah.

```typescript
const count = signal(0);

const cleanup = effect(() => {
  console.log("Count changed to:", count.value);

  // Optional cleanup function
  return () => {
    console.log("Cleaning up effect");
  };
});

// Cleanup effect
cleanup();
```

#### `batch(fn: () => void): void`

Menggabungkan multiple updates dalam satu batch untuk mencegah unnecessary re-renders.

```typescript
const firstName = signal("John");
const lastName = signal("Doe");

batch(() => {
  firstName.value = "Jane";
  lastName.value = "Smith";
  // UI hanya akan update sekali setelah batch selesai
});
```

### React Hooks

#### `useSignal<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void]`

Hook untuk membuat dan menggunakan signal dalam React component.

```typescript
function Counter() {
  const [count, setCount] = useSignal(0);

  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Count: {count}
    </button>
  );
}
```

#### `useSignalValue<T>(signal: Signal<T>): T`

Hook untuk subscribe ke signal eksternal.

```typescript
const globalCount = signal(0);

function Display() {
  const count = useSignalValue(globalCount);
  return <div>Global count: {count}</div>;
}
```

#### `useComputed<T>(computeFn: () => T, deps: DependencyList): T`

Hook untuk membuat computed value dalam component.

```typescript
function UserProfile({ userId }: { userId: number }) {
  const user = useComputed(() => {
    return fetchUser(userId); // Akan recompute saat userId berubah
  }, [userId]);

  return <div>User: {user.name}</div>;
}
```

#### `useSignals<T>(initialValues: T): [T, (updates: Partial<T>) => void]`

Hook untuk mengelola multiple signals sekaligus.

```typescript
function Form() {
  const [form, updateForm] = useSignals({
    name: '',
    email: '',
    age: 0
  });

  return (
    <div>
      <input
        value={form.name}
        onChange={e => updateForm({ name: e.target.value })}
      />
      <input
        value={form.email}
        onChange={e => updateForm({ email: e.target.value })}
      />
    </div>
  );
}
```

### Utility Functions

#### `debounce<T>(signal: Signal<T>, delay: number): Signal<T>`

Membuat debounced signal yang hanya update setelah delay tertentu.

```typescript
const searchTerm = signal("");
const debouncedSearch = debounce(searchTerm, 300);

// searchTerm akan langsung berubah, tapi debouncedSearch akan menunggu 300ms
```

#### `throttle<T>(signal: Signal<T>, delay: number): Signal<T>`

Membuat throttled signal yang membatasi update frequency.

```typescript
const scrollPosition = signal(0);
const throttledScroll = throttle(scrollPosition, 100);

// scrollPosition bisa berubah cepat, tapi throttledScroll maksimal update setiap 100ms
```

#### `fromLocalStorage<T>(key: string, defaultValue: T): Signal<T>`

Membuat signal yang sync dengan localStorage.

```typescript
const theme = fromLocalStorage("theme", "light");

// Otomatis tersimpan ke localStorage saat berubah
theme.value = "dark";
```

#### `combine<T>(signals: Signal<T>[]): Signal<T[]>`

Menggabungkan multiple signals menjadi satu.

```typescript
const name = signal("John");
const age = signal(25);
const combined = combine([name, age]);

console.log(combined.value); // ['John', 25]
```

#### `map<T, U>(signal: Signal<T>, fn: (value: T) => U): Signal<U>`

Transform nilai signal dengan function.

```typescript
const count = signal(5);
const doubled = map(count, (x) => x * 2);

console.log(doubled.value); // 10
```

#### `filter<T>(signal: Signal<T>, predicate: (value: T) => boolean): Signal<T | undefined>`

Filter signal updates berdasarkan predicate.

```typescript
const numbers = signal(1);
const evenNumbers = filter(numbers, (x) => x % 2 === 0);

numbers.value = 2; // evenNumbers.value = 2
numbers.value = 3; // evenNumbers.value tetap 2
```

## Advanced Usage

### Custom Computed Signals

```typescript
const todos = signal([
  { id: 1, text: "Learn signals", completed: false },
  { id: 2, text: "Build app", completed: true },
]);

const completedCount = computed(
  () => todos.value.filter((todo) => todo.completed).length
);

const progress = computed(() =>
  todos.value.length > 0 ? (completedCount.value / todos.value.length) * 100 : 0
);
```

### Async Signals with Promises

```typescript
const userId = signal(1);
const userDataSignal = fromPromise(
  fetch(`/api/users/${userId.value}`).then(r => r.json()),
  null // initial value
);

function UserProfile() {
  const userData = useSignalValue(userDataSignal);

  if (userData.loading) return <div>Loading...</div>;
  if (userData.error) return <div>Error: {userData.error.message}</div>;

  return <div>Welcome, {userData.value.name}!</div>;
}
```

### Complex State Management

```typescript
// Store pattern
const createStore = <T extends Record<string, any>>(initialState: T) => {
  const signals = Object.fromEntries(
    Object.entries(initialState).map(([key, value]) => [
      key,
      signal(value)
    ])
  ) as Record<keyof T, Signal<T[keyof T]>>;

  const state = computed(() => {
    const result = {} as T;
    for (const key in signals) {
      result[key] = signals[key].value;
    }
    return result;
  });

  const actions = {
    set: <K extends keyof T>(key: K, value: T[K]) => {
      signals[key].value = value;
    },
    update: <K extends keyof T>(key: K, updater: (prev: T[K]) => T[K]) => {
      signals[key].value = updater(signals[key].value);
    },
    batch: (fn: () => void) => batch(fn)
  };

  return { state, actions, signals };
};

// Usage
const userStore = createStore({
  name: 'John',
  age: 25,
  email: 'john@example.com'
});

function UserForm() {
  const user = useSignalValue(userStore.state);

  return (
    <form>
      <input
        value={user.name}
        onChange={e => userStore.actions.set('name', e.target.value)}
      />
      <input
        value={user.email}
        onChange={e => userStore.actions.set('email', e.target.value)}
      />
    </form>
  );
}
```

## Best Practices

1. **Gunakan batch() untuk multiple updates**

   ```typescript
   // ❌ Tidak optimal
   firstName.value = "Jane";
   lastName.value = "Smith";

   // ✅ Optimal
   batch(() => {
     firstName.value = "Jane";
     lastName.value = "Smith";
   });
   ```

2. **Gunakan computed untuk derived state**

   ```typescript
   // ❌ Manual updates
   const [firstName, setFirstName] = useSignal("John");
   const [lastName, setLastName] = useSignal("Doe");
   const [fullName, setFullName] = useSignal("John Doe");

   // Update manual fullName setiap kali firstName/lastName berubah

   // ✅ Automatic updates
   const firstName = signal("John");
   const lastName = signal("Doe");
   const fullName = computed(() => `${firstName.value} ${lastName.value}`);
   ```

3. **Gunakan effects untuk side effects**

   ```typescript
   // ✅ Proper side effect handling
   const searchTerm = signal("");

   effect(() => {
     if (searchTerm.value) {
       analytics.track("search", { term: searchTerm.value });
     }
   });
   ```

4. **Gunakan utility functions untuk common patterns**

   ```typescript
   // ✅ Gunakan debounce untuk search
   const searchInput = signal("");
   const debouncedSearch = debounce(searchInput, 300);

   // ✅ Gunakan localStorage untuk persistence
   const userSettings = fromLocalStorage("settings", { theme: "light" });
   ```

## Performance Tips

- Signal updates otomatis di-batch untuk performa optimal
- Computed values hanya recalculate saat dependencies berubah
- Gunakan `signal.peek()` untuk membaca nilai tanpa create dependency
- Gunakan `debounce` atau `throttle` untuk high-frequency updates
- Prefer `useSignalValue` over `useEffect` untuk subscribing ke signals

## TypeScript Support

Library ini memiliki full TypeScript support:

```typescript
// Type inference otomatis
const count = signal(0); // Signal<number>
const user = signal({ name: "John", age: 25 }); // Signal<{name: string, age: number}>

// Generic types
const items = signal<string[]>([]);
const status = signal<"loading" | "success" | "error">("loading");

// Custom interfaces
interface User {
  id: number;
  name: string;
  email: string;
}

const currentUser = signal<User | null>(null);
```

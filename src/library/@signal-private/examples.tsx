import React from 'react'
import { signal, computed, batch, debounce, fromLocalStorage, combine } from './index'
import { useComputed, useSignal, useSignalValue } from './hooks'

// Global signals for shared state
export const globalCount = signal(0)
export const theme = fromLocalStorage('app-theme', 'light')
export const user = signal<{ name: string; email: string } | null>(null)

// Computed signals
export const isLoggedIn = computed(() => user.value !== null)
export const greeting = computed(() => (user.value ? `Hello, ${user.value.name}!` : 'Please log in'))

// Example: Simple Counter Component
export function CounterExample() {
  const [count, setCount] = useSignal(0)
  const globalCountValue = useSignalValue(globalCount)

  return (
    <div className="p-4 border rounded">
      <h3>Counter Example</h3>
      <p>Local count: {count}</p>
      <p>Global count: {globalCountValue}</p>

      <div className="space-x-2">
        <button onClick={() => setCount(count + 1)} className="px-3 py-1 bg-blue-500 text-white rounded">
          Local +1
        </button>
        <button onClick={() => globalCount.value++} className="px-3 py-1 bg-green-500 text-white rounded">
          Global +1
        </button>
        <button
          onClick={() => {
            batch(() => {
              setCount(0)
              globalCount.value = 0
            })
          }}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Reset Both
        </button>
      </div>
    </div>
  )
}

// Example: Form with Multiple Signals
export function FormExample() {
  const [formData, setFormData] = useSignal({
    firstName: '',
    lastName: '',
    email: '',
    age: 0,
  })

  const fullName = useComputed(() => `${formData.firstName} ${formData.lastName}`.trim(), [formData.firstName, formData.lastName])

  const isValid = useComputed(
    () => formData.firstName.length > 0 && formData.lastName.length > 0 && formData.email.includes('@'),
    [formData.firstName, formData.lastName, formData.email]
  )

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-4 border rounded">
      <h3>Form Example</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium">First Name:</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Last Name:</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Age:</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded">
        <p>
          <strong>Full Name:</strong> {fullName}
        </p>
        <p>
          <strong>Valid:</strong> {isValid ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Form Data:</strong> {JSON.stringify(formData, null, 2)}
        </p>
      </div>
    </div>
  )
}

// Example: Search with Debouncing
export function SearchExample() {
  const [searchTerm, setSearchTerm] = useSignal('')
  const [results, setResults] = useSignal<string[]>([])
  const [loading, setLoading] = useSignal(false)

  // Create debounced search signal
  const debouncedSearchTerm = React.useMemo(() => debounce(signal(searchTerm), 300), [])

  // Update debounced signal when search term changes
  React.useEffect(() => {
    debouncedSearchTerm.value = searchTerm
  }, [searchTerm, debouncedSearchTerm])

  const debouncedValue = useSignalValue(debouncedSearchTerm)

  // Simulate API search
  React.useEffect(() => {
    if (debouncedValue.trim() === '') {
      setResults([])
      return
    }

    setLoading(true)

    // Simulate API delay
    const timeoutId = setTimeout(() => {
      const mockResults = [
        `Result 1 for "${debouncedValue}"`,
        `Result 2 for "${debouncedValue}"`,
        `Result 3 for "${debouncedValue}"`,
        `Result 4 for "${debouncedValue}"`,
      ]
      setResults(mockResults)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [debouncedValue, setResults, setLoading])

  return (
    <div className="p-4 border rounded">
      <h3>Search Example (Debounced)</h3>

      <div>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Search term: "{searchTerm}" | Debounced: "{debouncedValue}"
        </p>

        {loading && <p className="text-blue-600">Searching...</p>}

        {!loading && results.length > 0 && (
          <ul className="mt-2 space-y-1">
            {results.map(
              (
                result:
                  | string
                  | number
                  | bigint
                  | boolean
                  | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactPortal
                      | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
                      | Iterable<React.ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined,
                index: React.Key | null | undefined
              ) => (
                <li key={index} className="p-2 bg-gray-100 rounded">
                  {result}
                </li>
              )
            )}
          </ul>
        )}

        {!loading && debouncedValue && results.length === 0 && <p className="text-gray-500">No results found</p>}
      </div>
    </div>
  )
}

// Example: Theme Toggle
export function ThemeExample() {
  const currentTheme = useSignalValue(theme)

  const toggleTheme = () => {
    theme.value = currentTheme === 'light' ? 'dark' : 'light'
  }

  return (
    <div className="p-4 border rounded">
      <h3>Theme Example (LocalStorage)</h3>

      <p>
        Current theme: <strong>{currentTheme}</strong>
      </p>

      <button onClick={toggleTheme} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Toggle Theme
      </button>

      <p className="mt-2 text-sm text-gray-600">Theme is automatically saved to localStorage</p>
    </div>
  )
}

// Example: User Authentication
export function AuthExample() {
  const currentUser = useSignalValue(user)
  const loginStatus = useSignalValue(isLoggedIn)
  const greetingMessage = useSignalValue(greeting)

  const login = () => {
    user.value = {
      name: 'John Doe',
      email: 'john@example.com',
    }
  }

  const logout = () => {
    user.value = null
  }

  return (
    <div className="p-4 border rounded">
      <h3>Authentication Example</h3>

      <p>{greetingMessage}</p>
      <p>Logged in: {loginStatus ? 'Yes' : 'No'}</p>

      {currentUser && (
        <div className="mt-2 p-2 bg-green-100 rounded">
          <p>
            <strong>Name:</strong> {currentUser.name}
          </p>
          <p>
            <strong>Email:</strong> {currentUser.email}
          </p>
        </div>
      )}

      <div className="mt-3 space-x-2">
        {!loginStatus ? (
          <button onClick={login} className="px-4 py-2 bg-green-500 text-white rounded">
            Login
          </button>
        ) : (
          <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded">
            Logout
          </button>
        )}
      </div>
    </div>
  )
}

// Example: Combined Signals
export function CombinedSignalsExample() {
  const [number1, setNumber1] = useSignal(5)
  const [number2, setNumber2] = useSignal(10)
  const [number3, setNumber3] = useSignal(15)

  const combinedNumbers = React.useMemo(() => combine([signal(number1), signal(number2), signal(number3)]), [])

  const numbers = useSignalValue(combinedNumbers)
  const sum = numbers.reduce((acc: any, num: any) => acc + num, 0)
  const average = sum / numbers.length

  return (
    <div className="p-4 border rounded">
      <h3>Combined Signals Example</h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-sm">Number 1:</label>
          <input
            type="number"
            value={number1}
            onChange={(e) => setNumber1(Number(e.target.value) || 0)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Number 2:</label>
          <input
            type="number"
            value={number2}
            onChange={(e) => setNumber2(Number(e.target.value) || 0)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Number 3:</label>
          <input
            type="number"
            value={number3}
            onChange={(e) => setNumber3(Number(e.target.value) || 0)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="p-3 bg-gray-100 rounded">
        <p>
          <strong>Numbers:</strong> {JSON.stringify(numbers)}
        </p>
        <p>
          <strong>Sum:</strong> {sum}
        </p>
        <p>
          <strong>Average:</strong> {average.toFixed(2)}
        </p>
      </div>
    </div>
  )
}

// Main examples showcase component
export function SignalExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Signal Library Examples</h2>

      <CounterExample />
      <FormExample />
      <SearchExample />
      <ThemeExample />
      <AuthExample />
      <CombinedSignalsExample />

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold">Tips:</h3>
        <ul className="mt-2 space-y-1 text-sm">
          <li>• Signals automatically update components when values change</li>
          <li>• Use computed signals for derived state</li>
          <li>• Use debounce for search inputs to avoid excessive API calls</li>
          <li>• Use batch() when updating multiple signals at once</li>
          <li>• localStorage signals persist across browser sessions</li>
        </ul>
      </div>
    </div>
  )
}

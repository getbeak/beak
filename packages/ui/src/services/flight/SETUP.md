# Flight System Setup Guide

This guide shows you how to integrate the self-contained flight system into your application.

## 1. Add Flight Reducer to Store

The flight system is completely self-contained. Just add it to your Redux store:

```typescript
// In your store configuration
import { flightReducer } from '@beak/ui/services/flight';

const store = configureStore({
  reducer: {
    // ... other reducers
    flight: flightReducer,
  },
});
```

## 2. Use Flight Hooks in Components

The flight system provides custom hooks that make it easy to use:

```typescript
import { 
  useExecuteFlight,
  useFlightStatus,
  useFlightRequirements 
} from '@beak/ui/services/flight';

function MyComponent() {
  const requestId = 'request-123';
  
  // Execute a flight
  const executeFlight = useExecuteFlight();
  const handleExecute = async () => {
    try {
      await executeFlight(requestId, flightRequest, { 
        reason: 'request_editor' 
      });
    } catch (error) {
      console.error('Flight failed:', error);
    }
  };
  
  // Get flight state (automatically updates)
  const flightStatus = useFlightStatus(requestId);
  const requirements = useFlightRequirements(requestId);
  
  return (
    <div>
      <button onClick={handleExecute}>
        Execute Flight
      </button>
      
      {flightStatus.status === 'active' && <div>🚀 In progress...</div>}
      {flightStatus.status === 'complete' && <div>✅ Complete!</div>}
      {flightStatus.status === 'failed' && <div>❌ Failed</div>}
    </div>
  );
}
```

## 3. Available Hooks

### Core Flight Operations
- `useExecuteFlight()` - Execute a flight request
- `useLoadFlightHistory()` - Load flight history for a request

### State Access
- `useFlightState(requestId)` - Get current flight state
- `useFlightHistory(requestId)` - Get flight history
- `useActiveFlight(requestId)` - Get currently executing flight
- `useFlightLoading(requestId)` - Get loading state
- `useFlightError(requestId)` - Get error state

### Convenience Hooks
- `useFlightStatus(requestId)` - Get flight status summary
- `useFlightRequirements(requestId)` - Get navigation requirements

### Navigation
- `useFlightHistoryNavigation()` - Navigate through flight history
- `useClearFlightData()` - Clear flight data

## 4. Flight State Structure

The flight system manages state for each request ID:

```typescript
interface FlightSliceState {
  flightStates: Record<string, FlightState>;      // Current state per request
  flightHistories: Record<string, FlightHistory>; // History per request
  activeFlights: Record<string, FlightInProgress>; // Currently executing
  loading: Record<string, boolean>;               // Loading states
  errors: Record<string, FlightError | null>;     // Error states
}
```

## 5. Flight Lifecycle

1. **Idle** → **Preparing** → **Executing** → **Completed/Failed**
2. State automatically updates as flights progress
3. Components automatically re-render on state changes
4. Full Redux DevTools support for debugging

## 6. Error Handling

The system provides typed errors:

```typescript
import { 
  FlightValidationError,
  FlightNetworkError,
  FlightTimeoutError 
} from '@beak/ui/services/flight';

try {
  await executeFlight(requestId, request, options);
} catch (error) {
  if (error instanceof FlightValidationError) {
    // Handle validation errors
  } else if (error instanceof FlightNetworkError) {
    // Handle network errors
  }
}
```

## 7. Integration with Your IPC Layer

The flight system integrates with your new IPC architecture:

```typescript
// The FlightService handles IPC communication automatically
// No need to manually manage IPC events
```

## 8. Testing

All components are thoroughly tested:

```bash
# Run flight system tests
yarn test src/services/flight

# Run with coverage
yarn test:coverage src/services/flight
```

## 9. Performance

- **Automatic Memoization**: Redux Toolkit handles optimization
- **Selective Updates**: Components only re-render when their data changes
- **Efficient State**: Immutable updates with Immer

## 10. Migration from Old System

| Old System | New System |
|------------|------------|
| Redux Sagas | Redux Toolkit Async Thunks |
| Complex state management | Simple, typed state |
| Manual IPC handling | Automatic IPC integration |
| Hard to test | Easy to test with dependency injection |
| Scattered logic | Centralized in flight service |

## Next Steps

1. **Add the reducer** to your store
2. **Start using hooks** in your components
3. **Set up dependency injection** for FlightService/Repository
4. **Add error boundaries** for flight errors
5. **Customize** the flight system as needed

The flight system is designed to be completely self-contained and easy to integrate! 🚀

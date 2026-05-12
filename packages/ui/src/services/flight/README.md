# Modern Flight Architecture with Redux Toolkit

This directory contains the modern flight architecture that replaces the old Redux Sagas-based system with a clean Redux Toolkit + Service/Repository pattern that integrates with your new IPC layer.

## Architecture Overview

```
flight/
├── types.ts              # Modern TypeScript types with discriminated unions
├── errors.ts             # Custom error classes for flight scenarios
├── utils.ts              # Utility functions for validation and request handling
├── flight-service.ts     # Main service layer for flight execution
├── flight-slice.ts       # Redux Toolkit slice for state management
├── flight-hooks.ts       # Custom hooks for easy component integration
├── repositories/         # Data access and persistence layer
├── adapters/            # IPC integration adapters
└── index.ts             # Clean exports
```

## Key Benefits

1. **Type Safety**: Discriminated unions and readonly properties provide compile-time guarantees
2. **Testability**: Pure functions and dependency injection make testing straightforward
3. **Maintainability**: Clear separation of concerns between service, repository, and state layers
4. **Modern Redux**: Redux Toolkit eliminates boilerplate while keeping Redux benefits
5. **Modern IPC**: Integrates with your new `IpcFlightServiceRenderer` architecture
6. **No Redux Sagas**: Replaced with traditional async/await patterns

## How It Works

### 1. Redux Toolkit Slice (`flight-slice.ts`)
- **State Management**: Centralized flight state using Redux Toolkit
- **Async Thunks**: Handle async operations like flight execution
- **Immutability**: Automatic with Immer integration
- **Dev Tools**: Full Redux DevTools support

### 2. Custom Hooks (`flight-hooks.ts`)
- **useExecuteFlight**: Execute a flight request
- **useFlightState**: Get current flight state
- **useFlightHistory**: Get flight history
- **useFlightStatus**: Get flight status summary
- **useFlightRequirements**: Get navigation requirements

### 3. Service Layer (`flight-service.ts`)
- **Business Logic**: Encapsulates flight execution logic
- **IPC Integration**: Works with your new IPC architecture
- **Error Handling**: Normalizes and handles errors
- **Progress Tracking**: Manages flight progress updates

### 4. Repository Layer (`repositories/`)
- **Data Persistence**: Manages flight data storage
- **History Navigation**: Handles flight history navigation
- **Metrics**: Tracks flight performance metrics

## Usage Example

```typescript
import { 
  useExecuteFlight,
  useFlightState,
  useFlightHistory,
  useFlightStatus,
  useFlightRequirements
} from '@beak/ui/services/flight/flight-hooks';

function MyComponent() {
  const requestId = 'request-123';
  
  // Execute a flight
  const executeFlight = useExecuteFlight();
  const handleExecute = async () => {
    try {
      await executeFlight(requestId, flightRequest, { reason: 'request_editor' });
    } catch (error) {
      console.error('Flight failed:', error);
    }
  };
  
  // Get flight state
  const flightState = useFlightState(requestId);
  const flightHistory = useFlightHistory(requestId);
  const flightStatus = useFlightStatus(requestId);
  const requirements = useFlightRequirements(requestId);
  
  return (
    <div>
      <button onClick={handleExecute}>Execute Flight</button>
      
      {flightStatus.status === 'active' && <div>Flight in progress...</div>}
      {flightStatus.status === 'complete' && <div>Flight completed!</div>}
      {flightStatus.status === 'failed' && <div>Flight failed: {flightStatus.error.message}</div>}
      
      {requirements && (
        <div>
          <button disabled={!requirements.canGoBack}>Previous</button>
          <button disabled={!requirements.canGoForward}>Next</button>
        </div>
      )}
    </div>
  );
}
```

## Migration from Old System

- **Redux Sagas** → **Redux Toolkit Async Thunks**
- **Event-based IPC** → **Request/Response IPC** with your new architecture
- **Scattered logic** → **Centralized service layer**
- **Hard to test** → **Dependency injection and pure functions**
- **Complex state** → **Simple Redux Toolkit state management**

## Integration with New IPC Layer

The system integrates with your new IPC architecture:
- Uses `IpcFlightServiceRenderer` from `@beak/common/ipc/flight`
- Handles `FlightMessages` constants and structured payloads
- Supports the new request/response pattern with `ipcMain.handle()`
- Maintains backward compatibility during transition

## Testing

All components are thoroughly tested with Vitest:
- Unit tests for utilities and error classes
- Integration tests for services and repositories
- Redux Toolkit slice tests
- Type safety tests for discriminated unions

## Next Steps

1. **Dependency Injection**: Set up a way to inject `FlightService` and `FlightRepository` instances
2. **Tab Integration**: Connect the flight system with your tab management system
3. **Component Updates**: Update remaining components to use the new hooks
4. **Error Boundaries**: Add React error boundaries for flight errors
5. **Performance**: Add memoization and optimization where needed

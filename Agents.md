# React Native Project Setup Guide for Coding Agents

## Overview

This guide provides detailed specifications for creating robust, scalable React Native projects based on analysis of four exemplary codebases: Ignite CLI, React Native Boilerplate, React Native Clean Architecture, and Bluesky Social App. These patterns represent best practices for architecture, testing, and development workflow.

## Core Architecture Patterns

### 1. Project Structure Standards

#### Recommended Directory Structure
```
/src
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives
│   ├── forms/           # Form-specific components
│   └── common/          # Shared components
├── screens/             # Screen-level components
├── navigation/          # Navigation configuration
├── services/           # API and external services
├── store/ or state/    # State management
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── constants/          # App constants
├── config/             # Configuration files
├── assets/             # Static assets
└── __tests__/          # Test files
```

#### Alternative Clean Architecture Structure
For complex applications, consider domain-driven design:
```
/src
├── core/
│   ├── domain/         # Business entities, repositories
│   ├── application/    # Use cases, services
│   ├── infrastructure/ # External data sources
│   └── presentation/   # UI components, screens
├── shared/             # Shared utilities
└── modules/            # Feature modules
```

### 2. Technology Stack Recommendations

#### Essential Dependencies
```json
{
  "dependencies": {
    "react": "19.0.0",
    "react-native": "^0.79.x",
    "expo": "~53.x.x",
    "@react-navigation/native": "^7.x.x",
    "@react-navigation/native-stack": "^7.x.x",
    "react-native-safe-area-context": "^4.x.x",
    "react-native-screens": "^4.x.x",
    "react-native-gesture-handler": "^2.x.x",
    "react-native-reanimated": "~3.x.x"
  }
}
```

#### State Management Options
- **Simple Apps**: React Context + useReducer
- **Medium Apps**: Zustand or React Query
- **Complex Apps**: Redux Toolkit + RTK Query or MobX
- **Enterprise**: MobX with dependency injection (inversiland)

#### HTTP Client
```typescript
// Recommended: axios with interceptors
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Add request/response interceptors for auth, logging
```

### 3. TypeScript Configuration

#### tsconfig.json Template
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "jsx": "react-native",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@screens/*": ["./src/screens/*"],
      "@services/*": ["./src/services/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.*"]
}
```

## Testing Strategy & Code Coverage

### 1. Testing Stack
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-expo": "~53.x.x",
    "@testing-library/react-native": "^12.x.x",
    "@testing-library/jest-native": "^5.x.x",
    "react-test-renderer": "^19.x.x"
  }
}
```

### 2. Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules))'
  ]
};
```

### 3. Test Structure Requirements
- **Unit Tests**: Components, hooks, utilities (>90% coverage)
- **Integration Tests**: Navigation flows, API interactions
- **E2E Tests**: Critical user journeys (using Maestro or Detox)

### 4. Mock Strategy
```typescript
// test/setup.ts
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));
```

## Code Quality & Linting

### 1. ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'expo',
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'import'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/consistent-type-imports': ['warn', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports'
    }],
    'import/order': ['error', {
      groups: [['builtin', 'external'], 'internal', ['parent', 'sibling']],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true }
    }]
  }
};
```

### 2. Prettier Configuration
```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true
}
```

### 3. Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## Build & Development Configuration

### 1. Babel Configuration
```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@utils': './src/utils'
          }
        }
      ],
      'react-native-reanimated/plugin' // Must be last
    ],
    env: {
      production: {
        plugins: ['transform-remove-console']
      }
    }
  };
};
```

### 2. Metro Configuration
```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional asset types
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Enable symlinks support
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
```

### 3. Environment Configuration
```typescript
// src/config/index.ts
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  appVersion: process.env.EXPO_PUBLIC_VERSION || '1.0.0',
  isDev: __DEV__,
  isProduction: process.env.NODE_ENV === 'production',
};
```

## State Management Patterns

### 1. Simple Context Pattern
```typescript
// src/context/AuthContext.tsx
interface AuthState {
  user: User | null;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    token: null
  });

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2. Zustand Store Pattern
```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        // Implementation
      },
      logout: () => {
        set({ user: null, token: null });
      }
    }),
    { name: 'auth-store' }
  )
);
```

## Navigation Patterns

### 1. Type-Safe Navigation
```typescript
// src/navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

// src/navigation/NavigationContainer.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Component Architecture

### 1. Component Standards
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false
}: ButtonProps) {
  return (
    <Pressable
      style={[styles.button, styles[variant]]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator /> : <Text>{title}</Text>}
    </Pressable>
  );
}
```

### 2. Screen Component Template
```typescript
// src/screens/HomeScreen.tsx
interface HomeScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Home'>;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getData();
      setData(result);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen content */}
    </SafeAreaView>
  );
}
```

## Performance Optimization

### 1. Image Optimization
```typescript
// Use expo-image for better performance
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
/>
```

### 2. List Optimization
```typescript
// Use FlashList for large datasets
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
  keyExtractor={(item) => item.id}
/>
```

## Security Best Practices

### 1. Secure Storage
```typescript
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  }
};
```

### 2. API Security
```typescript
// Add request/response interceptors
apiClient.interceptors.request.use((config) => {
  const token = secureStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Development Workflow

### 1. Scripts Configuration
```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "build:ios": "eas build -p ios",
    "build:android": "eas build -p android"
  }
}
```

### 2. Development Environment
- **Code Editor**: VS Code with React Native extensions
- **Debugging**: Flipper or React Native Debugger
- **Device Testing**: Physical devices + simulators
- **Hot Reloading**: Fast Refresh enabled

## Deployment & CI/CD

### 1. EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {}
  }
}
```

### 2. GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:coverage
```

## Internationalization (i18n)

```typescript
// src/i18n/index.ts
import { I18n } from 'i18n-js';
import en from './locales/en.json';
import es from './locales/es.json';

export const i18n = new I18n({
  en,
  es
});

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
```

## Accessibility Standards

### 1. Component Accessibility
```typescript
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Submit form"
  accessibilityHint="Submits the current form data"
>
  <Text>Submit</Text>
</Pressable>
```

### 2. Screen Reader Support
- Use semantic markup
- Provide meaningful labels
- Test with VoiceOver/TalkBack

## Error Handling & Logging

### 1. Global Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Log to crash reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### 2. Structured Logging
```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.info(message, meta);
  },
  error: (error: Error, meta?: object) => {
    console.error(error.message, { ...meta, stack: error.stack });
  },
  warn: (message: string, meta?: object) => {
    console.warn(message, meta);
  }
};
```

## Implementation Checklist

### Initial Setup
- [ ] Initialize Expo project with TypeScript template
- [ ] Configure TypeScript with strict mode
- [ ] Set up ESLint and Prettier
- [ ] Configure path aliases
- [ ] Set up testing framework with coverage
- [ ] Configure pre-commit hooks

### Architecture
- [ ] Implement folder structure
- [ ] Set up navigation with type safety
- [ ] Choose and configure state management
- [ ] Set up API client with interceptors
- [ ] Implement error boundaries
- [ ] Configure environment management

### Development
- [ ] Create reusable component library
- [ ] Implement authentication flow
- [ ] Set up secure storage
- [ ] Add internationalization
- [ ] Implement accessibility features
- [ ] Configure performance monitoring

### Testing
- [ ] Write unit tests for utils and hooks
- [ ] Test all components with RTL
- [ ] Add integration tests for navigation
- [ ] Set up E2E testing
- [ ] Achieve >80% code coverage

### Deployment
- [ ] Configure EAS Build
- [ ] Set up CI/CD pipeline
- [ ] Configure crash reporting
- [ ] Set up analytics
- [ ] Prepare app store listings

This guide represents the distilled knowledge from analyzing production-ready React Native applications. Follow these patterns to create maintainable, testable, and scalable mobile applications.
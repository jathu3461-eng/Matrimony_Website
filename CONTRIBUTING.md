# 🤝 Contributing to Mukurtham Matrimony

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

---

## 📖 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Report security issues privately to security@mukurtham.com
- Follow professional standards in all communications

---

## 🚀 Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/Mukurtham_Matrimoney.git
cd "Mukurtham Matrimony"
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Set Up Development Environment
```bash
./quick-start.sh
# or manually:
npm install in both backend and frontend directories
docker-compose -f infrastructure/docker-compose.yml up -d
```

---

## 🏗️ Project Structure

```
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Authentication, validation, errors
│   │   ├── utils/        # Helper functions
│   │   └── config/       # Database, Redis config
│   └── tests/            # Unit tests
│
├── frontend/             # Next.js frontend
│   ├── app/              # Page routes & layouts
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utilities (API client, helpers)
│   └── public/           # Static assets
│
└── database/             # Prisma schema & migrations
    └── prisma/
        ├── schema.prisma # Database schema
        └── migrations/   # Version control for DB
```

---

## 💻 Development Guidelines

### Code Style

#### Backend (TypeScript)
```typescript
// ✓ Good
export const getUserProfile = async (userId: number): Promise<Profile> => {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  return profile;
};

// ✗ Bad
export const getProfile = async (id) => {
  let p = prisma.profile.findUnique({where: {userId: id}});
  return p;
};
```

#### Frontend (React/TypeScript)
```typescript
// ✓ Good
interface UserCardProps {
  name: string;
  age: number;
  isOnline: boolean;
}

export default function UserCard({ name, age, isOnline }: UserCardProps) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>{age} years old</p>
      {isOnline && <span className="online-badge">Online</span>}
    </div>
  );
}

// ✗ Bad
export default function UserCard(props) {
  let name = props.name;
  let age = props.age;
  return (
    <div>
      <h2>{name}</h2>
      <p>{age}</p>
    </div>
  );
}
```

### Naming Conventions

**Directories:** `lowercase`
```bash
src/controllers/  ✓
src/Controllers/  ✗
```

**Files:** `camelCase.ts` for utilities, `PascalCase.tsx` for components
```
src/utils/auth.utils.ts  ✓
src/Controllers/AuthController.ts  ✗
components/UserProfile.tsx  ✓
components/userProfile.tsx  ✗
```

**Functions/Variables:** `camelCase`
```typescript
const getUserProfile = () => {};  ✓
const get_user_profile = () => {};  ✗
```

**Classes/Types:** `PascalCase`
```typescript
class UserProfile {}  ✓
interface IUser {}  ✓ (optional I prefix)
type UserData = {};  ✓
```

### TypeScript Best Practices

1. **Always use types**
```typescript
// ✓ Good
const getUserById = (id: number): Promise<User> => {
  // ...
};

// ✗ Bad
const getUserById = (id) => {
  // ...
};
```

2. **Use interfaces for objects**
```typescript
interface UserProfile {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional property
}
```

3. **Avoid `any` type**
```typescript
// ✓ Good
function processData(data: Record<string, unknown>): void {
  // ...
}

// ✗ Bad
function processData(data: any): void {
  // ...
}
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- auth.controller.test.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Example Test
```typescript
// backend/src/controllers/auth.controller.test.ts
import { register } from './auth.controller';

describe('Auth Controller', () => {
  it('should register a new user', async () => {
    const req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await register(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Registration successful',
      })
    );
  });
});
```

---

## 🔒 Security

### Security Checklist
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use Prisma parameterized queries)
- [ ] XSS protection (sanitize user input)
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting on sensitive endpoints
- [ ] Proper authentication/authorization checks

### Secure Coding Example
```typescript
// ✓ Good - Parameterized query with Prisma
const user = await prisma.user.findUnique({
  where: { email: userEmail },
});

// ✗ Bad - Raw SQL (vulnerable to injection)
const user = await db.query(`SELECT * FROM users WHERE email = '${userEmail}'`);

// ✓ Good - Input validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const validated = schema.parse(req.body);

// ✗ Bad - No validation
const user = await createUser(req.body.email, req.body.password);
```

---

## 📝 Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning
- `refactor`: Code change that neither fixes bugs nor adds features
- `perf`: Code change that improves performance
- `test`: Adding missing tests
- `chore`: Changes to build process or dependencies

### Example Commits
```bash
# Feature
git commit -m "feat(auth): add two-factor authentication"

# Bug fix
git commit -m "fix(search): correct filter logic for profile search"

# Documentation
git commit -m "docs(readme): update installation instructions"
```

---

## 🔄 Pull Request Process

### Before Creating PR
1. ✅ Tests pass: `npm test`
2. ✅ Code formatted: `npm run lint`
3. ✅ No TypeScript errors: `npm run build`
4. ✅ Updated README if needed
5. ✅ Commit message follows guidelines

### PR Template
```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Tested on multiple devices/browsers

## Screenshots (if UI change)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process
1. Create PR with clear description
2. Ensure CI/CD checks pass
3. Wait for code review
4. Address feedback
5. Merge when approved

---

## 🐛 Reporting Bugs

### Bug Report Template
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 10, macOS 12]
- Browser: [e.g., Chrome 100]
- Node version: [e.g., 18.0.0]

## Screenshots/Logs
[Attach relevant images or logs]
```

---

## 💡 Feature Requests

```markdown
## Summary
Brief summary of the feature

## Motivation
Why is this feature needed?

## Proposed Solution
How would you implement it?

## Alternative Solutions
Other ways to solve this

## Additional Context
Any other relevant information
```

---

## 📚 Documentation

### Code Comments
```typescript
/**
 * Generates a JWT access token for a user.
 * @param userId - The ID of the user
 * @param roles - Array of user roles
 * @returns A signed JWT token valid for 1 hour
 * @throws {Error} If JWT_SECRET is not set
 *
 * @example
 * const token = generateAccessToken(123, ['user']);
 */
export const generateAccessToken = (userId: number, roles: string[]): string => {
  // implementation
};
```

### JSDoc for Complex Functions
```typescript
/**
 * Calculates horoscope compatibility between two profiles
 * @param profile1Raasi - First profile's Raasi
 * @param profile2Raasi - Second profile's Raasi
 * @param profile1Star - First profile's Star
 * @param profile2Star - Second profile's Star
 * @returns Compatibility score 0-100
 *
 * Algorithm:
 * - Raasi compatibility: 50%
 * - Star (Nakshatram) compatibility: 50%
 */
function calculateHoroscopeMatch(
  profile1Raasi: string,
  profile2Raasi: string,
  profile1Star: string,
  profile2Star: string
): number {
  // ...
}
```

---

## 🔗 Useful Links

- [GitHub Issues](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/issues)
- [Project Board](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/projects)
- [Discussions](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/discussions)

---

## 📞 Questions?

- 💬 Start a [discussion](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/discussions)
- 📧 Email: dev@mukurtham.com
- 🐛 [Report an issue](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/issues)

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Mukurtham Matrimony! 🎉

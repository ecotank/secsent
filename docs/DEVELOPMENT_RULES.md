# Development Rules & Coding Standards: SecureOffice-AI

## 1. Code Quality & Standards

### General Guidelines
- Write readable, maintainable, and self-documenting code.
- Every public interface, function, and component must have docstrings or inline code comments.
- Maintain existing codebase comments and formatting unless explicitly instructed.

### Service-Specific Guidelines
- **Backend (`/backend`)**: Follow idiomatic patterns for Go (Golang) as the standardized primary core stack. Enforce strict error handling, explicit context cancellation, and zero unhandled errors.
- **Frontend (`/frontend`)**: Use React / Next.js (TypeScript) component architecture with Vanilla CSS variables/tokens. Ensure responsive, dynamic, high-aesthetics UI with WebCrypto integration.
- **AI Service (`/ai-service`)**: Python codebase. Enforce type hints (`mypy`). Handle LLM timeouts (5s limit) and fallback models gracefully.
- **Crypto Service (`/crypto-service`)**: Rust / Go microservice. Zero memory exposure for sensitive cryptographic keys (zeroization). Use constant-time algorithms to prevent timing attacks.

## 2. Git Workflow & Branching Strategy

### Branch Naming Convention
- `feature/<feature-name>`: New functionality
- `fix/<bug-name>`: Bug fixes
- `sec/<vulnerability-id>`: Security patches
- `docs/<doc-name>`: Documentation updates

### Commit Message Format
Follow Conventional Commits:
```
<type>(<scope>): <short description>

[optional body]
```
Examples:
- `feat(crypto): add Ed25519 signature verification support`
- `fix(backend): fix RBAC permission check on document share endpoint`
- `docs(api): update architecture diagram for ai-service`

## 3. Pull Request Requirements
1. All unit and integration tests in `/tests` must pass.
2. Code coverage must not decrease (target: > 80% coverage).
3. SAST scanning must return zero High or Critical severity findings.
4. Requires approval from at least 2 code reviewers.

# Contributing to PhotonX

Thank you for your interest in contributing to PhotonX! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Provide detailed information including steps to reproduce
- Include relevant logs, screenshots, or error messages

### Pull Requests
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with clear commit messages
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request with detailed description

### Development Setup
```bash
git clone https://github.com/ChikamsoChidebe/Photonx.git
cd Photonx
npm install
npm run dev
```

## 📋 Code Standards

### TypeScript
- Use strict TypeScript configuration
- Provide proper type definitions
- Avoid `any` types when possible

### React/Next.js
- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries

### Smart Contracts
- Follow Solidity style guide
- Include comprehensive tests
- Use OpenZeppelin standards

## 🧪 Testing

### Running Tests
```bash
# All tests
npm run test

# Contract tests
npm run contracts:test

# Web app tests
cd apps/web && npm run test
```

### Test Requirements
- Unit tests for new functions
- Integration tests for features
- Contract tests for all scenarios

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(trading): add real-time quote generation
fix(wallet): resolve MetaMask connection issue
docs(readme): update installation instructions
```

## 🔍 Code Review Process

1. All PRs require review from maintainers
2. Address feedback promptly
3. Keep PRs focused and reasonably sized
4. Include tests and documentation updates

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

## 🏆 Recognition

Contributors will be recognized in:
- README acknowledgments
- Release notes
- Project documentation

Thank you for helping make PhotonX better! 🚀
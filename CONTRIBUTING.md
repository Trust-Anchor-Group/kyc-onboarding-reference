# Contributing

Keep changes focused and explain their effect on applicant state, external service calls, or data handling. Do not add real identity information, credentials, production screenshots, or applicant data to code, tests, issues, or pull requests. Use synthetic values only.

Before opening a pull request, run:

```bash
npm ci
npm audit --audit-level=low
npm run lint
npm run test:agent-persistence
npm run build
```

Changes to the Agent or Legal integrations should describe the service assumptions and configuration needed to review them. Do not include production credentials in pull request checks.

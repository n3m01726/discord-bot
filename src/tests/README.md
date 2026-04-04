# Documentation des tests

Tous les tests du projet vivent sous `src/tests/` et sont executes avec Vitest.

## Structure

```text
src/tests/
|-- vitest.setup.js
|-- integration/
|-- performance/
|-- stress/
|-- utils/
`-- mocks/
```

## Commandes disponibles

```bash
npm test
npm run test:coverage
npm run test:integration
npm run test:performance
npm run test:stress
npm run test:security
npm run test:all
npm run test:ui
```

## Configuration

- Config Vitest: `src/config/vitest.config.js`
- Config ESLint: `src/config/eslint.config.js`
- Setup de tests: `src/tests/vitest.setup.js`

Les seuils de couverture actuels sont definis dans la config Vitest du depot. Ils ne doivent pas etre dupliques dans cette documentation.

## Notes

- L'ancien wording autour de Jest a ete retire: la suite active est Vitest.
- Les chemins des tests dans les scripts npm pointent tous vers `src/tests/...`.

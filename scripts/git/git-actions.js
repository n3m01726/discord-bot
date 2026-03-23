#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import chalk from 'chalk';

// Configuration des variables d'environnement de test (comme dans GitHub Actions)
const testEnv = {
  NODE_ENV: 'test',
  DISCORD_TOKEN: 'test-token',
  CLIENT_ID: 'test-client-id',
  API_PORT: '3000',
  BOT_TOKEN: 'test-bot-token',
  UNSPLASH_ACCESS_KEY: 'test-unsplash-key',
  STREAM_URL: 'test-stream-url',
  JSON_URL: 'test-json-url',
  ADMIN_ROLE_ID: 'test-admin-role',
  VOICE_CHANNEL_ID: 'test-voice-channel',
  PLAYLIST_CHANNEL_ID: 'test-playlist-channel',
  API_TOKEN: 'test-api-token',
  BOT_ROLE_NAME: 'soundSHINE',
  DEV_GUILD_ID: 'test-dev-guild'
};

// Fonction pour vérifier si les dépendances sont installées
function checkDependencies () {
  return existsSync('node_modules') && existsSync('node_modules/.bin');
}

// Fonction pour exécuter une commande avec gestion d'erreur
function runCommand (command, description, env = {}) {
  console.log(chalk.blue(`\n🔧 ${description}...`));

  try {
    const fullEnv = { ...process.env, ...env };
    execSync(command, {
      stdio: 'inherit',
      env: fullEnv,
      encoding: 'utf8'
    });
    console.log(chalk.green(`✅ ${description} - Succès`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ ${description} - Échec`));
    console.error(chalk.red(`Commande: ${command}`));
    console.error(chalk.red(`Erreur: ${error.message}`));
    return false;
  }
}

// Fonction pour vérifier si un fichier existe
function checkFileExists (filePath) {
  if (!existsSync(filePath)) {
    console.error(chalk.red(`❌ Fichier manquant: ${filePath}`));
    return false;
  }
  return true;
}

// Fonction principale
async function runGitActions () {
  console.log(chalk.bold.cyan('\n🚀 Simulation des GitHub Actions Locales'));
  console.log(chalk.gray('='.repeat(60)));

  let allTestsPassed = true;
  const startTime = Date.now();

  // Étape 1: Vérification des fichiers essentiels
  console.log(chalk.blue('\n📋 Vérification des fichiers essentiels...'));
  const essentialFiles = [
    'package.json',
    'index.js',
    'config/.eslintrc.json',
    '.github/workflows/ci-cd.yml'
  ];

  for (const file of essentialFiles) {
    if (!checkFileExists(file)) {
      allTestsPassed = false;
    }
  }

  if (!allTestsPassed) {
    console.error(
      chalk.red('\n❌ Fichiers essentiels manquants. Arrêt des tests.')
    );
    process.exit(1);
  }

  console.log(chalk.green('✅ Tous les fichiers essentiels sont présents'));

  // Étape 2: Vérification et installation des dépendances
  if (!checkDependencies()) {
    console.log(
      chalk.yellow('⚠️  Dépendances non installées. Installation...')
    );
    if (!runCommand('npm install', 'Installation des dépendances')) {
      console.error(
        chalk.red('❌ Impossible d\'installer les dépendances. Arrêt des tests.')
      );
      process.exit(1);
    }
  } else {
    console.log(chalk.green('✅ Dépendances déjà installées'));
  }

  // Étape 3: Linting
  if (!runCommand('npm run lint', 'Vérification du linting')) {
    allTestsPassed = false;
  }

  // Étape 4: Tests avec couverture
  if (
    !runCommand(
      'npm run test:coverage',
      'Exécution des tests avec couverture',
      testEnv
    )
  ) {
    allTestsPassed = false;
  }

  // Étape 5: Vérification du formatage
  if (
    !runCommand('npm run fix:all', 'Vérification du formatage du code')
  ) {
    allTestsPassed = false;
  }

  // Étape 6: Tests d'intégration
  if (!runCommand('npm run test:integration', 'Tests d\'intégration', testEnv)) {
    allTestsPassed = false;
  }

  // Étape 7: Tests de performance
  if (
    !runCommand('npm run test:performance', 'Tests de performance', testEnv)
  ) {
    allTestsPassed = false;
  }

  // Étape 8: Vérification de la syntaxe Node.js
  console.log(chalk.blue('\n🔍 Vérification de la syntaxe Node.js...'));
  const jsFiles = [
    'index.js',
    'api/server.js',
    'bot/config.js',
    'core/loadFiles.js',
    'utils/logger.js',
    'utils/errorHandler.js'
  ];

  for (const file of jsFiles) {
    if (existsSync(file)) {
      if (
        !runCommand(`node --check ${file}`, `Vérification syntaxe: ${file}`)
      ) {
        allTestsPassed = false;
      }
    }
  }

  // Résultats finaux
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(chalk.bold.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan('📊 RÉSULTATS FINAUX'));
  console.log(chalk.bold.cyan('='.repeat(60)));

  if (allTestsPassed) {
    console.log(chalk.bold.green('\n🎉 TOUS LES TESTS ONT RÉUSSI !'));
    console.log(chalk.green(`⏱️  Durée totale: ${duration}s`));
    console.log(chalk.green('✅ Prêt pour le push vers GitHub !'));

    // Suggestions pour le commit
    console.log(chalk.blue('\n💡 Suggestions:'));
    console.log(chalk.gray('git add .'));
    console.log(chalk.gray('git commit -m "feat: your commit message"'));
    console.log(chalk.gray('git push origin main'));

    process.exit(0);
  } else {
    console.log(chalk.bold.red('\n💥 CERTAINS TESTS ONT ÉCHOUÉ !'));
    console.log(chalk.red(`⏱️  Durée totale: ${duration}s`));
    console.log(chalk.red('❌ Corrigez les erreurs avant de push'));

    // Suggestions de correction
    console.log(chalk.blue('\n🔧 Suggestions de correction:'));
    console.log(chalk.gray('npm run lint:fix          # Corriger le linting'));
    console.log(
      chalk.gray('npm run format            # Corriger le formatage')
    );
    console.log(chalk.gray('npm run test              # Relancer les tests'));

    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, _promise) => {
  console.error(chalk.red('\n❌ Erreur non gérée:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Exception non capturée:'), error);
  process.exit(1);
});

// Exécution du script
runGitActions().catch((error) => {
  console.error(chalk.red('\n❌ Erreur fatale:'), error);
  process.exit(1);
});


import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkNodeVersion() {
  const requiredVersion = 18;
  const currentVersion = process.version.match(/^v(\d+)/)[1];
  const isValid = parseInt(currentVersion) >= requiredVersion;
  return {
    current: process.version,
    required: `v${requiredVersion}.x`,
    status: isValid
  };
}

function checkPackageManager() {
  try {
    const pnpmVersion = execSync('pnpm --version').toString().trim();
    return {
      name: 'pnpm',
      version: pnpmVersion,
      status: true
    };
  } catch {
    try {
      const npmVersion = execSync('npm --version').toString().trim();
      return {
        name: 'npm',
        version: npmVersion,
        status: false,
        message: 'pnpm is recommended over npm'
      };
    } catch (e) {
      return {
        name: 'none',
        version: null,
        status: false,
        message: 'No package manager found'
      };
    }
  }
}

function checkDependencies() {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  } catch (error) {
    console.error('Error reading package.json:', error);
    process.exit(1);
  }

  let installedDeps = {};
  try {
    const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
    installedDeps = {
      ...Object.entries(pkg.dependencies || {}).reduce((acc, [name, version]) => {
        acc[name] = { version: version.replace(/[\^~]/, '') };
        return acc;
      }, {}),
      ...Object.entries(pkg.devDependencies || {}).reduce((acc, [name, version]) => {
        acc[name] = { version: version.replace(/[\^~]/, '') };
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error reading package.json:', error);
    process.exit(1);
  }

  const results = {
    dependencies: [],
    devDependencies: []
  };

  for (const [name, version] of Object.entries(pkg.dependencies || {})) {
    const installedVersion = installedDeps[name]?.version;
    const requiredVersion = version.replace(/[\^~]/, '');
    results.dependencies.push({
      name,
      required: requiredVersion,
      installed: installedVersion || 'Not installed',
      status: installedVersion === requiredVersion
    });
  }

  for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
    const installedVersion = installedDeps[name]?.version;
    const requiredVersion = version.replace(/[\^~]/, '');
    results.devDependencies.push({
      name,
      required: requiredVersion,
      installed: installedVersion || 'Not installed',
      status: installedVersion === requiredVersion
    });
  }
  
  return results;
}

function printResults(nodeInfo, pmInfo, depResults) {
  console.log('\nNode.js Environment Verification');
  console.log('=' .repeat(50));
  
  console.log(`\nNode.js Version: ${nodeInfo.current} ${nodeInfo.status ? '✓' : '✗'} (required: ${nodeInfo.required})`);
  
  console.log(`\nPackage Manager: ${pmInfo.name} ${pmInfo.version} ${pmInfo.status ? '✓' : '✗'}`);
  if (pmInfo.message) {
    console.log(`Note: ${pmInfo.message}`);
  }
  
  console.log('\nProduction Dependencies:');
  console.log('-'.repeat(50));
  depResults.dependencies.forEach(dep => {
    console.log(`${dep.name}: ${dep.installed} ${dep.status ? '✓' : '✗'} (required: ${dep.required})`);
  });
  
  console.log('\nDevelopment Dependencies:');
  console.log('-'.repeat(50));
  depResults.devDependencies.forEach(dep => {
    console.log(`${dep.name}: ${dep.installed} ${dep.status ? '✓' : '✗'} (required: ${dep.required})`);
  });
  
  const allDeps = [...depResults.dependencies, ...depResults.devDependencies];
  const missingDeps = allDeps.filter(dep => !dep.status);
  
  console.log('\nVerification Summary:');
  console.log('='.repeat(50));
  console.log(`Node.js Version: ${nodeInfo.status ? '✓' : '✗'}`);
  console.log(`Package Manager: ${pmInfo.status ? '✓' : '✗'}`);
  console.log(`Dependencies: ${missingDeps.length === 0 ? '✓' : '✗'} (${allDeps.length - missingDeps.length}/${allDeps.length} match)`);
  
  if (missingDeps.length > 0) {
    console.log('\nMissing or Incorrect Dependencies:');
    console.log('-'.repeat(50));
    missingDeps.forEach(dep => {
      console.log(`- ${dep.name}: Have ${dep.installed}, need ${dep.required}`);
    });
  }
  
  process.exit(nodeInfo.status && pmInfo.status && missingDeps.length === 0 ? 0 : 1);
}

try {
  const nodeInfo = checkNodeVersion();
  const pmInfo = checkPackageManager();
  const depResults = checkDependencies();
  printResults(nodeInfo, pmInfo, depResults);
} catch (error) {
  console.error('Error during verification:', error);
  process.exit(1);
}

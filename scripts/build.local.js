#!/usr/bin/env node

const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const stealTools = require('steal-tools')
const { buildViewerHtml } = require('../demo/build.viewer.html')

const srcPath = path.join(__dirname, '..')
const outputPath = path.join(srcPath, 'dist_local')

console.log(chalk.cyan('🚀 Starting Optimized Local Build...'))

const buildConfig = {
  main: 'app',
  config: path.join(srcPath, 'package.json!npm')
}

const buildOptions = {
  minify: true,
  bundleSteal: true,
  dest: path.join(outputPath, 'dist')
}

// 1. Clean up previous build results
fs.removeSync(outputPath)

// 2. Execute StealJS Build
stealTools.build(buildConfig, buildOptions)
  .then(function () {
    console.log(chalk.yellow('📦 JS Build finished. Syncing static assets...'))
    makePackageFolder()
    console.log(chalk.green('✨ Build Complete! Assets are located in: ' + outputPath))
    console.log(chalk.blue('🔗 Command: npx http-server dist_local'))
  })
  .catch(function (error) {
    console.log(chalk.red('❌ Build failed!'))
    throw error
  })

/**
 * Orchestrates the copying of all necessary static files into the distribution folder.
 */
function makePackageFolder () {
  // Ensure the output directory exists
  fs.ensureDirSync(outputPath)

  // Generate the shell HTML (local_viewer.html) using the imported utility
  buildViewerHtml(true)

  // Copy interview-specific guides and default content
  fs.copySync(path.join(srcPath, 'demo/guides/default/'), path.join(outputPath, 'guides', 'default'))

  // Copy viewer-related templates and static assets
  fs.copySync(path.join(srcPath, 'scripts/viewer/'), outputPath)

  // Copy global styles and generic images
  fs.copySync(path.join(srcPath, 'styles', 'viewer-avatars.css'), path.join(outputPath, 'styles', 'viewer-avatars.css'))
  fs.copySync(path.join(srcPath, 'images'), path.join(outputPath, 'images'))

  // Ensure the default guide folder exists in the source for local development
  fs.ensureDirSync(path.join(srcPath, 'scripts/guides/default/'))
  fs.copySync(path.join(srcPath, 'scripts/guides/default/'), path.join(outputPath, 'guides', 'default'))

  // Sync dependency assets: Avatar images from @caliorg
  const depsPath = path.join(srcPath, 'node_modules', '@caliorg', 'a2jdeps', 'avatar', 'images')
  if (fs.existsSync(depsPath)) {
    fs.copySync(depsPath, path.join(outputPath, 'node_modules', '@caliorg', 'a2jdeps', 'avatar', 'images'))
  }

  // Sync dependency assets: Lightbox2 UI elements
  const lbPath = path.join(srcPath, 'node_modules', 'lightbox2', 'dist', 'images')
  if (fs.existsSync(lbPath)) {
    fs.copySync(lbPath, path.join(outputPath, 'node_modules', 'lightbox2', 'dist', 'images'))
  }

  console.log(chalk.yellow('✅ All static assets successfully merged into dist_local.'))
}

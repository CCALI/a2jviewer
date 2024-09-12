## A2J Viewer Release:
- Change to the `develop` branch if not already on it.
- Do a `git pull` to make sure you are up to date with all changes.
- Make sure you are logged into `npm`. In your terminal type `npm whoami` and that you have permissions to do npm releases with that account.
- Run `npm run release:<semverType>` where <semverType> could be either `patch`, `minor`, or `major`. Example, for a bug fix that is not a breaking change, you would run `npm run release:patch`.
- This will execute the release script, running the tests first (a release will not happen with failed tests) and also setting the A2J Viewer footer version to the current date.
- Once the npm release is successful, do a pull request from `develop` into `production` to keep it in parity with the npm release.
- Generate the Standalone Viewer zip file from the newly update `production` branch. Execute `npm run build:viewer-zip` and then update the [A2J Viewer Release](https://github.com/CCALI/a2jviewer/releases) with the latest .zip file and release info.
- OPTIONAL -> Update A2J Author to this npm package release as it uses the A2J Viewer for Preview Testing. Ggo to your terminal in the Author repo and execute `npm install @caliorg/a2jviewer@latest` which will update both the package.json file and the package-lock.json in Author to this latest release version in the respective codebase.

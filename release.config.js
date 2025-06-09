/* eslint-disable no-undef */
/* eslint-disable no-template-curly-in-string */
module.exports = {
  repositoryUrl: "https://github.com/TradeTrust/ethers-aws-kms-signer.git",
  branches: [
    "master", // Or your default branch like 'master'
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  github: true,
  changelog: true,
  npm: true,
  outputPath: "/dist",
  buildTarget: "build",
  tagFormat: "v${version}",
  debug: true,
  plugins: [
    "@semantic-release/commit-analyzer", // Analyzes commit messages to determine the next version
    "@semantic-release/release-notes-generator", // Generates release notes from commit messages
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md", // Specifies the name of the changelog file
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: true,
      },
    ],
    "@semantic-release/git",
    "@semantic-release/github", // Creates a GitHub release
  ],
};

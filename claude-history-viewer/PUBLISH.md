# Publishing Instructions for claude-history-viewer v0.2.0

## Prerequisites
You need to be logged in to npm with publish access to the `claude-history-viewer` package.

## Steps to Publish

1. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```

2. **Verify you're in the correct directory**:
   ```bash
   cd /home/runner/workspace/claude-history-viewer
   ```

3. **Double-check the version**:
   ```bash
   npm version
   ```
   Should show: `claude-history-viewer: '0.2.0'`

4. **Publish to npm**:
   ```bash
   npm publish
   ```

5. **Verify the package was published**:
   ```bash
   npm view claude-history-viewer@latest
   ```

6. **Test with npx**:
   ```bash
   npx claude-history-viewer@latest --help
   ```

## What's New in v0.2.0

### Critical Fixes:
- **Sidechain Display**: Task tool results (sub-agent conversations) are now properly displayed. Previously they were completely missing from the UI.
- **Object Display**: Fixed all "[object Object]" issues with comprehensive object detection and smart content processing.

### Testing the Fixes:
After publishing, users can test the fixes by:
1. Running `npx claude-history-viewer@latest`
2. Opening a conversation that has Task tools
3. Verifying that sub-agent conversations appear under Task tools
4. Checking that complex tool results display properly instead of "[object Object]"

## Post-Publish Checklist
- [ ] Tag the release on GitHub: `git tag v0.2.0 && git push origin v0.2.0`
- [ ] Create a GitHub release with the changelog
- [ ] Update the README if needed
- [ ] Announce the fix in relevant channels

## Rollback Instructions
If issues are found after publishing:
```bash
npm unpublish claude-history-viewer@0.2.0
```
Note: npm allows unpublishing within 72 hours of publication.
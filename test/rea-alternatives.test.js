const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('bounded metadata fallback reads real metadata without executing target', () => {
  const fixture = spawnSync('pwsh', ['-NoProfile', '-Command', '[Reflection.PortableExecutable.PEReader].Assembly.Location'], { encoding: 'utf8' });
  assert.ifError(fixture.error);
  assert.equal(fixture.status, 0, fixture.stderr);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-metadata-'));
  const output = path.join(directory, 'report.json');
  const script = path.resolve(__dirname, '../scripts/rea-alternatives/read-metadata.ps1');
  try {
    for (const [pattern, limit, expectedEmpty] of [['.', 2, false], ['THIS_TYPE_DOES_NOT_EXIST_93ca', 2, true]]) {
      const run = spawnSync('pwsh', ['-NoProfile', '-File', script, '-ArtifactPath', fixture.stdout.trim(), '-NamePattern', pattern, '-Limit', String(limit), '-OutputPath', output], { encoding: 'utf8' });
      assert.ifError(run.error);
      assert.equal(run.status, 0, run.stderr);
      const report = JSON.parse(fs.readFileSync(output, 'utf8').replace(/^\uFEFF/, ''));
      assert.equal(report.provider, 'external-System.Reflection.Metadata');
      assert.match(report.sha256, /^[a-f0-9]{64}$/);
      assert.ok(report.totalTypes > 0 && report.totalMethods > 2);
      assert.equal(report.methods.length, expectedEmpty ? 0 : 2);
      assert.equal(report.truncated, !expectedEmpty);
      if (!expectedEmpty) assert.match(report.methods[0].token, /^0x06[0-9a-f]{6}$/);
      else assert.equal(report.matches, 0);
    }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('native fallback refuses an existing evidence directory without modifying it', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-native-'));
  const marker = path.join(directory, 'keep.txt');
  fs.writeFileSync(marker, 'preserve');
  try {
    const run = spawnSync('pwsh', ['-NoProfile', '-File', path.resolve(__dirname, '../scripts/rea-alternatives/inspect-native.ps1'), '-ArtifactPath', 'nonexistent.exe', '-NativeRva', '1', '-WorkDirectory', directory], { encoding: 'utf8' });
    assert.ifError(run.error);
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /new work directory/);
    assert.equal(fs.readFileSync(marker, 'utf8'), 'preserve');
    assert.deepEqual(fs.readdirSync(directory), ['keep.txt']);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

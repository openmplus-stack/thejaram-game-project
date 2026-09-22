import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const incomingRoot = path.join(root, 'incoming');
const gamesRoot = path.join(root, 'games');
const registryPath = path.join(gamesRoot, 'registry.json');
const requested = process.argv.slice(2);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxFileBytes = 20 * 1024 * 1024;
const maxGameBytes = 50 * 1024 * 1024;
const textAssetPattern = /(?:src|href)\s*=\s*["']([^"'#?]+)["']/gi;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`심볼릭 링크는 허용되지 않습니다: ${full}`);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile()) result.push(full);
  }
  return result;
}

function assertLocalAssets(html, sourceDir) {
  const missing = [];
  for (const match of html.matchAll(textAssetPattern)) {
    const asset = match[1].trim();
    if (!asset || asset.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(asset)) continue;
    const resolved = path.resolve(sourceDir, asset);
    if (!resolved.startsWith(`${sourceDir}${path.sep}`) && resolved !== sourceDir) {
      throw new Error(`접수 폴더 밖을 가리키는 경로가 있습니다: ${asset}`);
    }
    if (!fs.existsSync(resolved)) missing.push(asset);
  }
  if (missing.length) throw new Error(`찾을 수 없는 내부 자산: ${[...new Set(missing)].join(', ')}`);
}

function validateMetadata(metadata, folderSlug) {
  for (const key of ['slug', 'title', 'description', 'status']) {
    if (typeof metadata[key] !== 'string' || !metadata[key].trim()) {
      throw new Error(`game.json의 ${key} 항목이 필요합니다.`);
    }
  }
  if (!slugPattern.test(metadata.slug)) throw new Error('slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.');
  if (metadata.slug !== folderSlug) throw new Error(`폴더 이름(${folderSlug})과 slug(${metadata.slug})가 다릅니다.`);
  if (!['published', 'draft'].includes(metadata.status)) throw new Error('status는 published 또는 draft만 사용할 수 있습니다.');
  if (metadata.title.length > 100) throw new Error('title은 100자 이하여야 합니다.');
  if (metadata.description.length > 300) throw new Error('description은 300자 이하여야 합니다.');
}

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(incomingRoot)) {
  fail('incoming 폴더가 없습니다.');
} else {
  const available = fs.readdirSync(incomingRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const slugs = requested.length ? requested : available;

  if (!slugs.length) {
    console.log('처리할 접수 게임이 없습니다. 종료합니다.');
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'slugs=\n');
    process.exit(0);
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  registry.games ??= [];
  const processed = [];

  for (const slug of slugs) {
    try {
      if (!slugPattern.test(slug)) throw new Error(`잘못된 접수 폴더 이름입니다: ${slug}`);
      const sourceDir = path.join(incomingRoot, slug);
      if (!fs.existsSync(sourceDir)) throw new Error(`접수 폴더가 없습니다: incoming/${slug}`);
      const metadataPath = path.join(sourceDir, 'game.json');
      const indexPath = path.join(sourceDir, 'index.html');
      if (!fs.existsSync(metadataPath)) throw new Error('game.json이 없습니다.');
      if (!fs.existsSync(indexPath)) throw new Error('index.html이 없습니다.');

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      validateMetadata(metadata, slug);
      const files = walk(sourceDir);
      let totalBytes = 0;
      for (const file of files) {
        const bytes = fs.statSync(file).size;
        totalBytes += bytes;
        if (bytes > maxFileBytes) throw new Error(`20MB를 넘는 파일이 있습니다: ${path.relative(sourceDir, file)}`);
      }
      if (totalBytes > maxGameBytes) throw new Error('게임 전체 크기가 50MB를 넘습니다.');

      const html = fs.readFileSync(indexPath, 'utf8');
      if (!/<title>[^<]+<\/title>/i.test(html)) throw new Error('index.html에 title이 없습니다.');
      if (!/<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html)
        && !/<meta\s+[^>]*content=["'][^"']+["'][^>]*name=["']description["']/i.test(html)) {
        throw new Error('index.html에 meta description이 없습니다.');
      }
      assertLocalAssets(html, sourceDir);

      const targetDir = path.join(gamesRoot, slug);
      if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
      copyDirectory(sourceDir, targetDir);

      const entry = {
        slug,
        title: metadata.title.trim(),
        description: metadata.description.trim(),
        status: metadata.status
      };
      const index = registry.games.findIndex((game) => game.slug === slug);
      if (index >= 0) registry.games[index] = entry;
      else registry.games.push(entry);

      fs.rmSync(sourceDir, { recursive: true, force: true });
      processed.push(slug);
      console.log(`OK: ${slug} 검사 및 등록 완료 (${files.length}개 파일, ${(totalBytes / 1024).toFixed(1)}KB)`);
    } catch (error) {
      fail(`${slug}: ${error.message}`);
    }
  }

  if (!process.exitCode && processed.length) {
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `slugs=${processed.join(',')}\n`);
    }
  }
}

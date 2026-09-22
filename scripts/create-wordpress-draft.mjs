import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug) throw new Error('사용법: node scripts/create-wordpress-draft.mjs <slug>');

const metadataPath = path.join(process.cwd(), 'games', slug, 'game.json');
if (!fs.existsSync(metadataPath)) {
  throw new Error(`WordPress 설정을 읽을 수 없습니다: games/${slug}/game.json`);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
if (!metadata.wordpress?.createDraft) {
  console.log('game.json에서 WordPress 초안 생성을 요청하지 않았습니다.');
  process.exit(0);
}

const { WP_URL, WP_USERNAME, WP_APP_PASSWORD } = process.env;
if (!WP_URL || !WP_USERNAME || !WP_APP_PASSWORD) {
  throw new Error('WP_URL, WP_USERNAME, WP_APP_PASSWORD GitHub Secrets가 필요합니다.');
}

const gameUrl = `https://games.thejaram.quest/${slug}/`;
const content = `
<p><a href="${gameUrl}">게임 바로 실행하기</a></p>
<h2>${metadata.title}</h2>
<p>${metadata.wordpress.content || metadata.description}</p>
<h2>게임 이용하기</h2>
<p>이 게임은 THE JARAM의 “독서를 위한 인지력 향상, 독서를 통한 인지력 발달” 방향에 따라 제작되었습니다.</p>
<p><a href="${gameUrl}">${metadata.title} 실행하기</a></p>`.trim();

const endpoint = `${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: metadata.title,
    slug: `${slug}-game`,
    status: 'draft',
    excerpt: metadata.wordpress.excerpt || metadata.description,
    content
  })
});

const body = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(`WordPress 오류 ${response.status}: ${body.message || '알 수 없는 오류'}`);
console.log(`WordPress 초안 생성 완료: ${body.link || `post ${body.id}`}`);

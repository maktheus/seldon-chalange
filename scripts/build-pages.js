#!/usr/bin/env node
/**
 * Monta o diretório publicável do GitHub Pages a partir de site/index.html.
 *
 * site/index.html é escrito como fragmento: sem <!doctype>, sem <html>, sem
 * <head> e sem <body>, porque a plataforma de artifacts envolve o arquivo nesse
 * esqueleto ao publicar. Servido cru pelo Pages, o mesmo arquivo cairia em
 * quirks mode, sem charset e sem viewport — acentos quebrados e layout de
 * desktop no celular. Este script devolve o esqueleto que o artifact fornece,
 * mantendo uma única fonte de verdade para o conteúdo.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'site', 'index.html');
const OUT_DIR = path.join(ROOT, '_site');
const PDF = path.join(ROOT, 'docs', 'desafio-tecnico.pdf');

const DESCRIPTION =
  'Desafio técnico de engenharia Android: um app Kotlin/Compose de duas telas ' +
  'que classifica uma frota de dispositivos a partir de um arquivo local defeituoso.';

const source = fs.readFileSync(SRC, 'utf8');

// O conteúdo de <head> vai do início do arquivo até a primeira faixa de markup.
const MARKER = '\n<!-- ═';
const cut = source.indexOf(MARKER);
if (cut === -1) {
  console.error('build-pages: marcador de início do corpo não encontrado em site/index.html.');
  console.error('Esperado um comentário iniciado por "<!-- ═" após o bloco <style>.');
  process.exit(1);
}

const head = source.slice(0, cut).trim();
const body = source.slice(cut).trim();

// O esqueleto que a plataforma de artifacts injeta, reproduzido aqui.
const page = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${DESCRIPTION}">
<meta property="og:type" content="website">
<meta property="og:title" content="Seldon Fleet">
<meta property="og:description" content="${DESCRIPTION}">
<meta name="twitter:card" content="summary_large_image">
<style>
  :root{
    color-scheme:light;
    padding-top:env(safe-area-inset-top,0px);
    padding-bottom:env(safe-area-inset-bottom,0px);
  }
  body{margin:0;font:14px system-ui,-apple-system,sans-serif}
  img{max-width:100%}
  [hidden]{display:none!important}
</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), page, 'utf8');
fs.copyFileSync(PDF, path.join(OUT_DIR, 'desafio-tecnico.pdf'));
fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '', 'utf8');

const kb = (n) => Math.round(fs.statSync(n).size / 1024) + ' KB';
console.log('_site/index.html            ' + kb(path.join(OUT_DIR, 'index.html')));
console.log('_site/desafio-tecnico.pdf   ' + kb(path.join(OUT_DIR, 'desafio-tecnico.pdf')));
console.log('_site/.nojekyll');

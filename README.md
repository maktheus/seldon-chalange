# Seldon Fleet

Desafio técnico de engenharia Android — **Residência Tecnológica, Módulo 1 (Núcleo Comum)**.

> Construir um app Android em Kotlin/Compose de duas telas que lê um `frota.json` local,
> lista os dispositivos classificando cada um como **OK**, **Atenção** ou **Crítico** por uma
> regra de negócio isolada em `domain/` e testável na JVM, abre o detalhe com a justificativa
> da classificação e persiste os favoritos — tratando os dados defeituosos do arquivo e
> documentando as decisões.

## Conteúdo deste repositório

| Caminho | O que é |
|---|---|
| `site/index.html` | Página de apresentação do desafio, com campo 3D, mockup das duas telas e demonstração interativa do defeito de unidade |
| `docs/desafio-tecnico.pdf` | Especificação técnica completa — 17 páginas, normativa |
| `docs/desafio-tecnico.html` | Fonte do PDF (renderizado com Chromium headless) |

## O que o desafio mede

Sete eixos do Módulo 1, com peso proporcional à carga horária das disciplinas:
Kotlin e Android (42h), Arquitetura de Software (18h), Testes e CI (30h),
Requisitos (24h), Metodologia Científica (30h), Ética e registro de decisões (30h)
e Inteligência Artificial (36h, via trilha opcional).

O instrumento central é a **regra de classificação**: uma decisão computada que precisa morar
numa camada sem Android, ser testável em milissegundos e continuar correta diante de um arquivo
de entrada com dois defeitos plantados de propósito — unidade de energia inconsistente
(`mAh` / `mWh`) e divisor nulo em registros incompletos.

## Avaliação

100 pontos: arquitetura e fronteiras (25), correção do domínio (25), interface e navegação (20),
testes e integração contínua (15), documentação e justificativa (15). Trilha de especialização
opcional vale +20. A rubrica completa, os critérios de aceitação de cada requisito e as condições
que limitam a nota estão no PDF.

## Regerar o PDF

```bash
node scripts/topdf.js   # requer playwright + chromium
```

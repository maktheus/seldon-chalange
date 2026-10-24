#!/usr/bin/env node
/**
 * Gera data/frota.json — o arquivo de entrada do desafio Seldon Fleet.
 *
 *   node tools/gen-frota.js [--seed N] [--out caminho]
 *
 * A semente torna a geração determinística: a mesma semente produz byte a byte
 * o mesmo arquivo, e sementes diferentes produzem frotas diferentes com a
 * mesma dificuldade. Isso permite entregar um arquivo distinto por candidato
 * sem alterar o enunciado nem a rubrica.
 *
 * Seis dispositivos são âncoras de valor fixo, independentes da semente,
 * porque aparecem com números literais na especificação técnica e na interface
 * de referência. Se eles variassem, a documentação passaria a mentir.
 *
 * Dois defeitos são plantados de propósito e estão documentados no enunciado:
 *   1. energyUnit alterna entre "mAh" e "mWh" (fator nominalVoltage ≈ 3,85×)
 *   2. divisor nulo — batteryCapacityMah igual a 0 e screenOnMinutes igual a 0
 *
 * O script termina com código diferente de zero se a distribuição de status
 * resultante não for exatamente 16 OK / 8 Atenção / 4 Crítico / 2 Indeterminado,
 * que é a contagem exibida nos filtros da interface de referência.
 */
'use strict';

const fs = require('fs');
const path = require('path');

/* ── argumentos ──────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const SEED = Number(argOf('--seed', '20261024'));
const OUT = path.resolve(argOf('--out', path.join(__dirname, '..', 'data', 'frota.json')));

if (!Number.isFinite(SEED)) {
  console.error('gen-frota: --seed precisa ser um número.');
  process.exit(1);
}

/* ── gerador pseudoaleatório determinístico (mulberry32) ─────────────── */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const between = (lo, hi) => lo + rnd() * (hi - lo);
const intBetween = (lo, hi) => Math.floor(between(lo, hi + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const round = (n, d) => Number(n.toFixed(d));

/* ── catálogo de aparelhos ───────────────────────────────────────────── */
const CATALOG = {
  low: [
    { model: 'Moto G13', soc: 'Helio G85', ram: 4096, api: 33, cap: 5000, v: 3.8 },
    { model: 'Galaxy A14', soc: 'Exynos 850', ram: 4096, api: 33, cap: 5000, v: 3.85 },
    { model: 'Redmi Note 12', soc: 'Snapdragon 685', ram: 4096, api: 33, cap: 5000, v: 3.87 },
    { model: 'Moto E22', soc: 'Helio G37', ram: 2048, api: 31, cap: 4020, v: 3.8 },
    { model: 'Galaxy A04e', soc: 'Helio P35', ram: 3072, api: 32, cap: 5000, v: 3.85 }
  ],
  mid: [
    { model: 'Pixel 6a', soc: 'Tensor G1', ram: 6144, api: 34, cap: 4410, v: 3.85 },
    { model: 'Galaxy A54', soc: 'Exynos 1380', ram: 8192, api: 34, cap: 5000, v: 3.85 },
    { model: 'Moto G84', soc: 'Snapdragon 695', ram: 8192, api: 33, cap: 5000, v: 3.87 },
    { model: 'Redmi Note 13 Pro', soc: 'Helio G99', ram: 8192, api: 34, cap: 5100, v: 3.87 },
    { model: 'Galaxy M34', soc: 'Exynos 1280', ram: 6144, api: 34, cap: 6000, v: 3.85 }
  ],
  high: [
    { model: 'Pixel 8', soc: 'Tensor G3', ram: 8192, api: 35, cap: 4575, v: 3.88 },
    { model: 'Galaxy S23', soc: 'Snapdragon 8 Gen 2', ram: 8192, api: 35, cap: 3900, v: 3.88 },
    { model: 'Pixel 7 Pro', soc: 'Tensor G2', ram: 12288, api: 34, cap: 5000, v: 3.87 },
    { model: 'Galaxy S24', soc: 'Snapdragon 8 Gen 3', ram: 12288, api: 35, cap: 4000, v: 3.88 }
  ]
};

const BASE = new Date('2026-10-20T03:12:44Z').getTime();
const seenAt = (minutesAgo) => new Date(BASE - minutesAgo * 60000).toISOString().replace('.000', '');

/* ── âncoras: valores fixos citados na especificação e na UI ─────────── */
const ANCHORS = [
  {
    id: 'DEV-0137', model: 'Pixel 6a', soc: 'Tensor G1', tier: 'mid', ramMb: 6144, androidApi: 34,
    batteryCapacityMah: 4410, batteryLevelPct: 38, screenOnMinutes: 214,
    energyConsumed: 980, energyUnit: 'mAh', nominalVoltage: 3.85,
    jankFramesPct: 7.4, crashCount7d: 2, lastSeen: seenAt(14)
  },
  {
    id: 'DEV-0204', model: 'Galaxy A54', soc: 'Exynos 1380', tier: 'mid', ramMb: 8192, androidApi: 34,
    batteryCapacityMah: 5000, batteryLevelPct: 61, screenOnMinutes: 186,
    energyConsumed: 3773, energyUnit: 'mWh', nominalVoltage: 3.85,
    jankFramesPct: 4.1, crashCount7d: 0, lastSeen: seenAt(22)
  },
  {
    // DEFEITO 2a — capacidade zerada: divisor nulo no dreno relativo.
    // jankFramesPct 11.2 dispararia Atenção, mas Indeterminado é avaliado
    // antes: serve de caso de teste para a ordem de precedência.
    id: 'DEV-0311', model: 'Moto G13', soc: 'Helio G85', tier: 'low', ramMb: 4096, androidApi: 33,
    batteryCapacityMah: 0, batteryLevelPct: 12, screenOnMinutes: 97,
    energyConsumed: 612, energyUnit: 'mAh', nominalVoltage: 3.8,
    jankFramesPct: 11.2, crashCount7d: 1, lastSeen: seenAt(131)
  },
  {
    id: 'DEV-0418', model: 'Pixel 8', soc: 'Tensor G3', tier: 'high', ramMb: 8192, androidApi: 35,
    batteryCapacityMah: 4575, batteryLevelPct: 77, screenOnMinutes: 168,
    energyConsumed: 712, energyUnit: 'mAh', nominalVoltage: 3.88,
    jankFramesPct: 2.3, crashCount7d: 0, lastSeen: seenAt(6)
  },
  {
    // Crítico exibido na tela de detalhe: 670 mAh/h sobre 5000 mAh = 13,4 %/h.
    // 670 × (142/60) = 1585,67 mAh → em mWh: × 3,87 = 6136,5.
    id: 'DEV-0522', model: 'Redmi Note 12', soc: 'Snapdragon 685', tier: 'low', ramMb: 4096, androidApi: 33,
    batteryCapacityMah: 5000, batteryLevelPct: 24, screenOnMinutes: 142,
    energyConsumed: 6136.5, energyUnit: 'mWh', nominalVoltage: 3.87,
    jankFramesPct: 9.8, crashCount7d: 1, lastSeen: seenAt(38)
  },
  {
    id: 'DEV-0630', model: 'Galaxy S23', soc: 'Snapdragon 8 Gen 2', tier: 'high', ramMb: 8192, androidApi: 35,
    batteryCapacityMah: 3900, batteryLevelPct: 55, screenOnMinutes: 151,
    energyConsumed: 2404, energyUnit: 'mWh', nominalVoltage: 3.88,
    jankFramesPct: 3.6, crashCount7d: 0, lastSeen: seenAt(9)
  },
  {
    // DEFEITO 2b — tempo de tela zerado: o outro divisor nulo.
    id: 'DEV-0745', model: 'Galaxy A14', soc: 'Exynos 850', tier: 'low', ramMb: 4096, androidApi: 33,
    batteryCapacityMah: 5000, batteryLevelPct: 94, screenOnMinutes: 0,
    energyConsumed: 0, energyUnit: 'mAh', nominalVoltage: 3.85,
    jankFramesPct: 0, crashCount7d: 0, lastSeen: seenAt(2874)
  }
];

/* ── a regra de classificação (a mesma do enunciado) ─────────────────── */
function toMah(d) {
  if (d.energyUnit === 'mWh') {
    if (!d.nominalVoltage) return null;
    return d.energyConsumed / d.nominalVoltage;
  }
  return d.energyConsumed;
}

function classify(d) {
  const cap = d.batteryCapacityMah;
  const mah = toMah(d);
  if (!cap || cap <= 0 || !d.screenOnMinutes || d.screenOnMinutes <= 0 || mah === null) {
    return 'INDETERMINADO';
  }
  const abs = mah / (d.screenOnMinutes / 60);
  const rel = (abs / cap) * 100;
  if (rel >= 12 || d.crashCount7d >= 3 || d.jankFramesPct >= 15) return 'CRITICO';
  if (rel >= 7 || d.crashCount7d >= 1 || d.jankFramesPct >= 8) return 'ATENCAO';
  return 'OK';
}

/* ── síntese dos demais dispositivos ─────────────────────────────────── */
// Faixas de dreno relativo que produzem cada status sem ambiguidade,
// mantendo folga das fronteiras para que o arquivo não dependa de
// arredondamento de ponto flutuante.
const PROFILE = {
  OK:      { rel: [2.2, 6.4],   jank: [0.8, 7.2],  crash: 0 },
  ATENCAO: { rel: [7.4, 11.3],  jank: [1.5, 7.6],  crash: 0 },
  CRITICO: { rel: [12.6, 19.5], jank: [2.0, 7.8],  crash: 0 }
};

function synth(id, status, usedModels) {
  const tier = pick(['low', 'mid', 'high']);
  let hw = pick(CATALOG[tier]);
  // evita repetir o mesmo modelo em excesso
  for (let i = 0; i < 4 && usedModels.has(hw.model); i++) hw = pick(CATALOG[tier]);
  usedModels.add(hw.model);

  const p = PROFILE[status];
  const screenOn = intBetween(55, 265);
  const rel = between(p.rel[0], p.rel[1]);
  const mah = (rel / 100) * hw.cap * (screenOn / 60);

  // ~35% dos registros vêm em mWh: o Defeito 1, distribuído pela frota.
  const asMwh = rnd() < 0.35;

  const d = {
    id,
    model: hw.model,
    soc: hw.soc,
    tier,
    ramMb: hw.ram,
    androidApi: hw.api,
    batteryCapacityMah: hw.cap,
    batteryLevelPct: intBetween(8, 98),
    screenOnMinutes: screenOn,
    energyConsumed: asMwh ? round(mah * hw.v, 1) : round(mah, 1),
    energyUnit: asMwh ? 'mWh' : 'mAh',
    nominalVoltage: hw.v,
    jankFramesPct: round(between(p.jank[0], p.jank[1]), 1),
    crashCount7d: p.crash,
    lastSeen: seenAt(intBetween(3, 720))
  };

  // Confere o que acabou de ser sintetizado; se divergir, o chamador tenta de novo.
  return classify(d) === status ? d : null;
}

/* ── montagem ────────────────────────────────────────────────────────── */
const TARGET = { OK: 16, ATENCAO: 8, CRITICO: 4, INDETERMINADO: 2 };

const devices = ANCHORS.slice();
const counts = { OK: 0, ATENCAO: 0, CRITICO: 0, INDETERMINADO: 0 };
for (const d of devices) counts[classify(d)]++;

const usedModels = new Set(devices.map((d) => d.model));
let nextId = 800;

for (const status of ['OK', 'ATENCAO', 'CRITICO']) {
  while (counts[status] < TARGET[status]) {
    const id = 'DEV-' + String(nextId).padStart(4, '0');
    const d = synth(id, status, usedModels);
    if (!d) continue;             // perfil não bateu, sorteia de novo
    nextId += intBetween(7, 94);
    devices.push(d);
    counts[status]++;
  }
}

devices.sort((a, b) => a.id.localeCompare(b.id));

const payload = {
  schemaVersion: '1.0',
  exportedAt: '2026-10-20T03:12:44Z',
  fleetId: 'SELDON-BR-01',
  deviceCount: devices.length,
  devices
};

/* ── verificação antes de escrever ───────────────────────────────────── */
const final = { OK: 0, ATENCAO: 0, CRITICO: 0, INDETERMINADO: 0 };
for (const d of devices) final[classify(d)]++;

const mismatch = Object.keys(TARGET).filter((k) => final[k] !== TARGET[k]);
const mwh = devices.filter((d) => d.energyUnit === 'mWh').length;

console.log('semente ........... ' + SEED);
console.log('dispositivos ...... ' + devices.length);
console.log('em mWh ............ ' + mwh + ' de ' + devices.length + '  (Defeito 1)');
console.log('divisor nulo ...... ' + devices.filter((d) => !d.batteryCapacityMah || !d.screenOnMinutes).length + '  (Defeito 2)');
console.log('distribuição ...... OK ' + final.OK + ' · Atenção ' + final.ATENCAO +
            ' · Crítico ' + final.CRITICO + ' · Indeterminado ' + final.INDETERMINADO);

if (mismatch.length) {
  console.error('\ngen-frota: distribuição fora do alvo em ' + mismatch.join(', ') +
                '. Esperado ' + JSON.stringify(TARGET) + ', obtido ' + JSON.stringify(final) + '.');
  console.error('A interface de referência exibe essas contagens nos filtros; o arquivo não foi escrito.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log('\nescrito ........... ' + OUT + '  (' + Math.round(fs.statSync(OUT).size / 1024) + ' KB)');

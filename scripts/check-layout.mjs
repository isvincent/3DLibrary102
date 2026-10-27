// 以 Node 執行的配置資料檢查：方位規則、ID 唯一、mapBounds 在 0～1 之間、必要欄位齊全
// 用法：npm run check:layout
import { ZONES } from '../src/data/zones.js';
import { RULES } from '../src/data/layout-rules.js';
import { FAQS } from '../src/data/faq-data.js';
import { QUIZ } from '../src/data/quiz-data.js';

let failed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✔' : '✘'} ${msg}`);
  if (!cond) failed++;
};

const REQUIRED = ['id', 'name', 'floor', 'category', 'position', 'size', 'rotation', 'description', 'interactionType', 'quizIds', 'mapBounds'];
const ids = new Set();
ZONES.forEach((z) => {
  REQUIRED.forEach((k) => z[k] === undefined && ok(false, `${z.id} 缺少欄位 ${k}`));
  if (ids.has(z.id)) ok(false, `重複 ID：${z.id}`);
  ids.add(z.id);
  const b = z.mapBounds;
  if (!(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1.001 && b.y + b.h <= 1.001 && b.w > 0 && b.h > 0)) ok(false, `${z.id} mapBounds 超出範圍`);
});
ok(true, `共 ${ZONES.length} 個場域，ID 唯一且欄位齊全檢查完成`);
RULES.forEach((r) => ok(r.test(), `[${r.floor || '1F↔2F'}${r.floor ? 'F' : ''}] ${r.text}`));
ok(FAQS.length === 11 && FAQS.every((f, i) => f.id === `Q${String(i + 1).padStart(2, '0')}`), 'FAQ Q01～Q11 完整');
ok(QUIZ.every((q) => q.answer >= 0 && q.answer < q.options.length), `測驗 ${QUIZ.length} 題答案索引正確`);
const quizRefs = ZONES.flatMap((z) => z.quizIds).filter((id) => !QUIZ.some((q) => q.id === id));
ok(quizRefs.length === 0, `場域 quizIds 皆對應到題庫${quizRefs.length ? `（缺：${quizRefs.join(',')}）` : ''}`);

console.log(failed ? `\n${failed} 項未通過` : '\n全部通過');
process.exit(failed ? 1 : 0);

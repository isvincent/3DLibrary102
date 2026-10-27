// 學習中心：六大單元 + 測驗（內容依 PDF）
import { openModal, closeModal, esc, toast, celebrate } from '../ui/dom.js';
import { startTask, endTask } from '../ui/task.js';
import { emit, on } from '../core/events.js';
import { progress, saveProgress } from '../core/store.js';
import { speak, speechSupported, sfx } from '../core/audio.js';
import { GUIDE_SECTIONS, FIND_TARGETS, RULE_SCENARIOS, PRINT_SERVICES, CARD_MIN_BALANCE, SEARCH_STEPS, SOURCE_NOTE, BORROW_RULES } from '../data/library-content.js';
import { FAQS, FAQ_CATEGORIES, FAQ_FOOTER } from '../data/faq-data.js';
import { QUIZ, QUIZ_SIZE, QUIZ_PASS } from '../data/quiz-data.js';
import { DEMO_BOOKS, DEMO_NOTICE } from '../data/books-data.js';

let sm;

const TABS = [
  { id: 'guide', label: '📖 圖書館導覽' },
  { id: 'find', label: '1 認識空間' },
  { id: 'borrow', label: '2 模擬借書' },
  { id: 'opac', label: '3 圖書查詢' },
  { id: 'copier', label: '4 數位服務' },
  { id: 'rules', label: '5 使用規範' },
  { id: 'faq', label: '6 FAQ' },
  { id: 'quiz', label: '✏️ 測驗' },
];

const steps = (arr) => `<div class="steps">${arr.map((s, i) => `${i ? '<i>➜</i>' : ''}<span>${esc(s)}</span>`).join('')}</div>`;

export function openLearn(tab = 'guide') {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="tabs" role="tablist">${TABS.map((t) => `<button role="tab" data-tab="${t.id}">${t.label}</button>`).join('')}</div><div id="unit-body"></div>`;
  openModal('🎓 學習中心｜圖書館利用教育', wrap, { wide: true });
  const show = (id) => {
    wrap.querySelectorAll('[data-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === id);
      b.setAttribute('aria-selected', b.dataset.tab === id);
    });
    const body = wrap.querySelector('#unit-body');
    body.innerHTML = '';
    RENDER[id](body);
  };
  wrap.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
  show(tab);
}

const RENDER = {
  guide(el) {
    el.innerHTML = `<p class="unit-intro">${SOURCE_NOTE} <a href="docs/library-guide.pdf" target="_blank" rel="noopener">開啟原始 PDF</a></p>
      ${GUIDE_SECTIONS.map((s) => `<div class="card-section"><h4>${esc(s.title)}</h4><ul class="rule-list">${s.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      ${speechSupported ? `<button class="btn sm" data-say="${s.id}">🔊 朗讀本節</button>` : ''}</div>`).join('')}`;
    el.querySelectorAll('[data-say]').forEach((b) =>
      b.addEventListener('click', () => {
        const s = GUIDE_SECTIONS.find((x) => x.id === b.dataset.say);
        speak(`${s.title}。${s.items.join('。')}`, { force: true });
      }),
    );
  },

  find(el) {
    const found = new Set(progress.findFound);
    el.innerHTML = `<p class="unit-intro">在 3D 模型中找出下列 ${FIND_TARGETS.length} 個地點。點「開始找」後關閉視窗，在模型上點擊正確區域。答錯 2 次會顯示提示。</p>
      <div class="progress-bar"><i style="width:${(found.size / FIND_TARGETS.length) * 100}%"></i></div>
      <p style="font-size:.9rem">已找到 ${found.size} / ${FIND_TARGETS.length}</p>
      <div class="grid-cards">${FIND_TARGETS.map((t, i) => `<div class="mcard ${found.has(i) ? 'done' : ''}"><h4>${found.has(i) ? '✔ ' : ''}${esc(t.prompt)}</h4><button class="btn sm primary" data-find="${i}">開始找</button></div>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn accent" id="find-all">依序挑戰全部</button></div>`;
    el.querySelectorAll('[data-find]').forEach((b) => b.addEventListener('click', () => runFind(+b.dataset.find, false)));
    el.querySelector('#find-all').addEventListener('click', () => runFind(FIND_TARGETS.findIndex((_, i) => !found.has(i)) >= 0 ? FIND_TARGETS.findIndex((_, i) => !found.has(i)) : 0, true));
  },

  borrow(el) {
    el.innerHTML = `<p class="unit-intro">跟著 3D 地面箭頭走一次完整借書流程：</p>
      ${steps(['一樓大門', '往 2F 樓梯', '二樓書庫', '選書', '返回一樓', '借還書櫃台', '出示學生證', '完成借書'])}
      <div class="grid-cards" style="margin:12px 0">
        <div class="mcard"><h4>📚 最多 ${BORROW_RULES.maxBooks} 本</h4>請攜學生證</div>
        <div class="mcard"><h4>📅 借期 2 週</h4>請於開放日 16:00 前完成借書程序</div>
        <div class="mcard"><h4>🔁 續借 2 週</h4>於到期日前 1～2 日到圖書館或圖書查詢系統辦理</div>
        <div class="mcard"><h4>⏰ 逾期</h4>暫停借閱權利；累計每本書逾期天數為暫停借閱權限天數</div>
      </div>
      <h4>逾期停權試算</h4>
      <div class="row"><div class="field"><label for="od-books">逾期書本數</label><input id="od-books" type="number" min="1" max="4" value="2"></div>
      <div class="field"><label for="od-days">每本逾期天數</label><input id="od-days" type="number" min="1" value="3"></div>
      <button class="btn" id="od-calc">計算</button></div><div id="od-out"></div>
      <p>已完成模擬借書：<b>${progress.borrowCompleted}</b> 次</p>
      <button class="btn accent" id="borrow-go">🚶 開始 3D 模擬借書</button>`;
    el.querySelector('#borrow-go').addEventListener('click', () => emit('borrow:start'));
    el.querySelector('#od-calc').addEventListener('click', () => {
      const n = Math.max(1, Math.min(4, +el.querySelector('#od-books').value || 1));
      const d = Math.max(1, +el.querySelector('#od-days').value || 1);
      el.querySelector('#od-out').innerHTML = `<div class="result-box bad">${n} 本 × ${d} 天 ＝ 暫停借閱權限 <b>${n * d} 天</b>（累計每本書逾期天數）</div>`;
    });
  },

  opac(el) {
    el.innerHTML = `<p class="unit-intro">查詢步驟：</p>${steps(SEARCH_STEPS)}
      <div class="card-section" style="background:#f2f7ff">
        <div class="row"><strong>🔎 館藏圖書查詢（模擬）</strong><span class="demo-tag">${DEMO_NOTICE}</span></div>
        <div class="row" style="margin-top:8px">
          <div class="field"><label for="op-type">查詢欄位</label><select id="op-type"><option value="keyword">關鍵字</option><option value="title">書名</option><option value="isbn">ISBN</option></select></div>
          <div class="field" style="flex:1;min-width:180px"><label for="op-q">查詢內容</label><input id="op-q" type="search" placeholder="例：SDGs、哲學、9789990000011"></div>
          <button class="btn primary" id="op-go">開始查詢</button>
        </div>
        <div id="op-out"></div>
      </div>
      <p style="font-size:.88rem;color:var(--ink-2)">提醒：資訊檢索電腦不可連線任何不當網頁，違者經查證、記錄後將受校規警告以上處分。</p>`;
    const run = () => {
      const type = el.querySelector('#op-type').value;
      const q = el.querySelector('#op-q').value.trim().toLowerCase();
      const out = el.querySelector('#op-out');
      if (!q) {
        out.innerHTML = '<div class="result-box bad">請輸入查詢內容。</div>';
        return;
      }
      const res = DEMO_BOOKS.filter((b) => {
        if (type === 'isbn') return b.isbn.includes(q.replace(/-/g, ''));
        if (type === 'title') return b.title.toLowerCase().includes(q);
        return [b.title, b.author, b.topic, b.callNo].join(' ').toLowerCase().includes(q);
      });
      out.innerHTML = res.length
        ? `<p>找到 ${res.length} 筆（示範資料）：</p>${res.map((b) => `<div class="book-row"><span class="spine" style="background:#3b7ddd"></span><div class="bi"><b>${esc(b.title)}</b><small>${esc(b.author)}｜ISBN ${b.isbn}｜索書號 ${esc(b.callNo)}｜位置：2F 書架 ${b.shelf}${b.inLibraryOnly ? '｜限館內閱讀' : '｜可外借'}</small></div><button class="btn sm" data-shelf="${b.shelf}">在 3D 中顯示</button></div>`).join('')}`
        : '<div class="result-box">查無資料，試試其他關鍵字（例：永續、藝術、科學）。</div>';
      out.querySelectorAll('[data-shelf]').forEach((b) =>
        b.addEventListener('click', () => {
          closeModal(true);
          const id = `f2-shelf-${String(b.dataset.shelf).padStart(2, '0')}`;
          sm.floor = 2;
          sm.setMode('interior');
          setTimeout(() => sm.select(id), 300);
        }),
      );
    };
    el.querySelector('#op-go').addEventListener('click', run);
    el.querySelector('#op-q').addEventListener('keydown', (e) => e.key === 'Enter' && run());
  },

  copier(el) {
    el.innerHTML = `<p class="unit-intro">事務機器（一樓東北側）提供影印、列印與掃描。請自備悠遊卡（餘額 ${CARD_MIN_BALANCE} 元以上）。</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">${PRINT_SERVICES.map((s) => `<tr><td style="padding:6px;border-bottom:1px solid var(--line)">${s.name}</td><td style="padding:6px;border-bottom:1px solid var(--line);text-align:right"><b>${s.price ? `每頁 ${s.price} 元` : '過卡，不收費'}</b></td></tr>`).join('')}</table>
      <div class="row">
        <div class="field"><label for="cp-svc">服務</label><select id="cp-svc">${PRINT_SERVICES.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        <div class="field"><label for="cp-pages">頁數</label><input id="cp-pages" type="number" min="1" value="10"></div>
        <div class="field"><label for="cp-bal">悠遊卡餘額（元）</label><input id="cp-bal" type="number" min="0" value="50"></div>
        <button class="btn primary" id="cp-calc">計算費用</button>
      </div><div id="cp-out"></div>
      <button class="btn" id="cp-3d" style="margin-top:10px">在 3D 中找到事務機器</button>`;
    el.querySelector('#cp-calc').addEventListener('click', () => {
      const svc = PRINT_SERVICES.find((s) => s.id === el.querySelector('#cp-svc').value);
      const pages = Math.floor(+el.querySelector('#cp-pages').value);
      const bal = +el.querySelector('#cp-bal').value;
      const out = el.querySelector('#cp-out');
      if (!(pages >= 1)) {
        out.innerHTML = '<div class="result-box bad">請輸入正確頁數（1 頁以上）。</div>';
        return;
      }
      const cost = svc.price * pages;
      if (!(bal >= CARD_MIN_BALANCE)) {
        sfx('bad');
        out.innerHTML = `<div class="result-box bad">悠遊卡餘額 ${bal} 元，未達 ${CARD_MIN_BALANCE} 元以上，<b>無法使用</b>事務機器，請先加值。</div>`;
        return;
      }
      if (cost > bal) {
        sfx('bad');
        out.innerHTML = `<div class="result-box bad">${svc.name} ${pages} 頁需 <b>${cost} 元</b>，餘額 ${bal} 元不足，請先加值。</div>`;
        return;
      }
      sfx('ok');
      out.innerHTML = `<div class="result-box ok">${svc.name} ${pages} 頁 × ${svc.price} 元 ＝ <b>${cost} 元</b>${svc.price === 0 ? '（掃描只需過卡，無需付費）' : ''}；扣款後餘額 <b>${bal - cost} 元</b>。</div>`;
    });
    el.querySelector('#cp-3d').addEventListener('click', () => {
      closeModal(true);
      sm.handleZoneClick('f1-machines');
    });
  },

  rules(el) {
    el.innerHTML = `<p class="unit-intro">判斷下列情境是否符合圖書館規定（答案依說明資料）。</p><div id="rs-list"></div>`;
    const list = el.querySelector('#rs-list');
    list.innerHTML = RULE_SCENARIOS.map((r) => {
      const ans = progress.rulesAnswered[r.id];
      return `<div class="card-section" data-rs="${r.id}"><b>${esc(r.q)}</b>
        <div class="row" style="margin-top:6px"><button class="btn sm" data-a="1">⭕ 可以</button><button class="btn sm" data-a="0">❌ 不可以</button></div>
        <div class="rs-fb">${ans ? fb(r, ans.correct) : ''}</div></div>`;
    }).join('');
    list.querySelectorAll('[data-rs]').forEach((box) =>
      box.querySelectorAll('[data-a]').forEach((b) =>
        b.addEventListener('click', () => {
          const r = RULE_SCENARIOS.find((x) => x.id === box.dataset.rs);
          const correct = (b.dataset.a === '1') === r.answer;
          sfx(correct ? 'ok' : 'bad');
          progress.rulesAnswered[r.id] = { correct, at: new Date().toISOString() };
          saveProgress();
          box.querySelector('.rs-fb').innerHTML = fb(r, correct);
        }),
      ),
    );
    function fb(r, correct) {
      return `<div class="result-box ${correct ? 'ok' : 'bad'}">${correct ? '✔ 答對了！' : '✘ 再想想。'}正確答案：<b>${r.answer ? '可以' : '不可以'}</b>。${esc(r.explain)}</div>`;
    }
  },

  faq(el) {
    el.innerHTML = `<div class="row"><div class="field" style="flex:1;min-width:200px"><label for="faq-q">搜尋 FAQ</label><input id="faq-q" type="search" placeholder="例：續借、影印、漫畫"></div>
      <div class="field"><label for="faq-cat">分類</label><select id="faq-cat"><option value="">全部分類</option>${Object.entries(FAQ_CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div></div>
      <div id="faq-list"></div><p style="font-weight:700;color:#c2185b">${FAQ_FOOTER}</p>`;
    const render = () => {
      const q = el.querySelector('#faq-q').value.trim();
      const cat = el.querySelector('#faq-cat').value;
      const items = FAQS.filter((f) => (!cat || f.category === cat) && (!q || (f.q + f.a).includes(q)));
      el.querySelector('#faq-list').innerHTML = items.length
        ? items.map((f) => `<details class="qa"><summary><span class="qid">${f.id}</span><span>${esc(f.q)}</span></summary><div class="ans">A${f.id.slice(1)}：${esc(f.a)}</div>
          <div class="ans-actions">${speechSupported ? `<button class="btn sm" data-say="${f.id}">🔊 朗讀</button>` : ''}<button class="btn sm" data-goto="${f.zoneId}">📍 相關位置</button><span class="demo-tag" style="background:#eef4ff;border-color:var(--line);color:var(--ink-2)">${FAQ_CATEGORIES[f.category]}</span></div></details>`).join('')
        : '<p>沒有符合的問題。</p>';
      el.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => {
        const f = FAQS.find((x) => x.id === b.dataset.say);
        speak(`${f.q}。${f.a}`, { force: true });
      }));
      el.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => {
        closeModal(true);
        sm.handleZoneClick(b.dataset.goto);
      }));
    };
    el.querySelector('#faq-q').addEventListener('input', render);
    el.querySelector('#faq-cat').addEventListener('change', render);
    render();
  },

  quiz(el) {
    const pool = QUIZ.slice().sort(() => Math.random() - 0.5).slice(0, QUIZ_SIZE);
    let i = 0;
    let score = 0;
    const wrong = [];
    const best = progress.quiz.best;
    const draw = () => {
      if (i >= pool.length) return finish();
      const q = pool[i];
      el.innerHTML = `<p class="unit-intro">第 ${i + 1} / ${pool.length} 題｜目前答對 ${score} 題${best != null ? `｜最佳成績 ${best} 分` : ''}</p>
        <div class="progress-bar"><i style="width:${(i / pool.length) * 100}%"></i></div>
        <div class="quiz-q">${esc(q.q)}</div>
        <div class="quiz-opts">${q.options.map((o, k) => `<button data-o="${k}">${'ABCD'[k]}. ${esc(o)}</button>`).join('')}</div>
        <div id="qz-fb"></div>`;
      el.querySelectorAll('[data-o]').forEach((b) =>
        b.addEventListener('click', () => {
          const k = +b.dataset.o;
          const ok = k === q.answer;
          el.querySelectorAll('[data-o]').forEach((x) => {
            x.disabled = true;
            if (+x.dataset.o === q.answer) x.classList.add('right');
          });
          if (!ok) {
            b.classList.add('wrong');
            wrong.push({ id: q.id, q: q.q, your: q.options[k], answer: q.options[q.answer] });
          } else score++;
          sfx(ok ? 'ok' : 'bad');
          el.querySelector('#qz-fb').innerHTML = `<div class="result-box ${ok ? 'ok' : 'bad'}">${ok ? '✔ 答對！' : '✘ 答錯了。'}${esc(q.explain)}</div>
            <div class="row" style="margin-top:8px"><button class="btn primary" id="qz-next">${i + 1 < pool.length ? '下一題' : '看成績'}</button></div>`;
          el.querySelector('#qz-next').addEventListener('click', () => {
            i++;
            draw();
          });
        }),
      );
    };
    const finish = () => {
      const percent = Math.round((score / pool.length) * 100);
      progress.quiz.last = percent;
      progress.quiz.best = Math.max(progress.quiz.best ?? 0, percent);
      progress.quiz.attempts += 1;
      progress.quiz.wrong = wrong;
      progress.quiz.lastAt = new Date().toISOString();
      saveProgress();
      if (percent >= QUIZ_PASS) celebrate(`測驗 ${percent} 分！`);
      el.innerHTML = `<div class="result-box ${percent >= QUIZ_PASS ? 'ok' : 'bad'}" style="font-size:1.1rem">答對 <b>${score}</b> / ${pool.length} 題，得分 <b>${percent}</b> 分（${percent >= QUIZ_PASS ? '通過' : `未達 ${QUIZ_PASS} 分`}）</div>
        ${wrong.length ? `<h4>錯誤題目</h4>${wrong.map((w) => `<div class="card-section"><b>${esc(w.q)}</b><br>你的答案：${esc(w.your)}<br>正確答案：<b style="color:var(--good)">${esc(w.answer)}</b></div>`).join('')}` : '<p>全部答對，太厲害了！</p>'}
        <div class="row" style="margin-top:10px"><button class="btn primary" id="qz-again">再測一次</button></div>`;
      el.querySelector('#qz-again').addEventListener('click', () => RENDER.quiz(el));
      emit('quiz:done', { percent, score, total: pool.length });
    };
    draw();
  },
};

function runFind(idx, chain) {
  closeModal(true);
  const t = FIND_TARGETS[idx];
  if (!t) return;
  sm.setMode('explode');
  startTask({
    title: `認識空間 ${idx + 1}/${FIND_TARGETS.length}`,
    text: `請在 3D 模型中找出：「${t.prompt}」`,
    hintZones: t.zoneIds.slice(0, 3),
    accept: (z) => t.zoneIds.includes(z.id),
    onSuccess: () => {
      if (!progress.findFound.includes(idx)) progress.findFound.push(idx);
      saveProgress();
      if (progress.findFound.length === FIND_TARGETS.length) celebrate('認識空間全部完成！');
      const next = FIND_TARGETS.findIndex((_, i) => !progress.findFound.includes(i));
      setTimeout(() => {
        if (chain && next >= 0) runFind(next, true);
        else {
          endTask();
          toast(next >= 0 ? '找到了！可到學習中心挑戰下一個' : '全部找到了！', 'ok');
        }
      }, 1200);
    },
    buttons: [{ label: '💡 提示', onClick: () => sm.focusZone(t.zoneIds[0]) }],
  });
}

export function initUnits(sceneManager) {
  sm = sceneManager;
  on('open:learn', ({ tab }) => openLearn(tab));
}

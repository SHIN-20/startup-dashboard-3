const TABS = {
  issue: { label: "課題", status: ["課題が存在した", "課題が存在しなかった"], fields: [
    { key: "issue",  label: "課題", type: "textarea" },
    { key: "whose",  label: "誰の課題か" },
    { key: "method", label: "検証方法" },
  ]},
  interview: { label: "インタビュー", fields: [
    { key: "who",     label: "誰に聞いたか" },
    { key: "date",    label: "聞いた日", type: "date" },
    { key: "quote",   label: "重要な一言", type: "textarea" },
    { key: "insight", label: "気づき", type: "textarea" },
  ]},
  competitor: { label: "競合", fields: [
    { key: "name",   label: "競合名" },
    { key: "url",    label: "URL" },
    { key: "strong", label: "強み" },
    { key: "weak",   label: "弱み" },
    { key: "diff",   label: "自分の差別化ポイント", type: "textarea" },
  ]},
  action: { label: "アクション", fields: [
    { key: "content", label: "今日やった起業の行動", type: "textarea" },
  ]},
  mvp: { label: "MVP", status: ["未実装", "実装済み"], fields: [
    { key: "feature", label: "機能名" },
  ]},
};

// データの読み書き（localStorage） 
const KEY = "startup-dashboard";
const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
const save = (items) => localStorage.setItem(KEY, JSON.stringify(items));

// 画面の状態関連
let tab = "issue";              
const $tabs = document.getElementById("tabs");
const $form = document.getElementById("add-form");
const $list = document.getElementById("list");
const $search = document.getElementById("search");

// 1つの入力欄のHTMLを作る
function inputHTML(f) {
  if (f.type === "textarea") return `<textarea data-key="${f.key}" placeholder="${f.label}"></textarea>`;
  if (f.type === "date")     return `<input type="date" data-key="${f.key}" title="${f.label}">`;
  return `<input data-key="${f.key}" placeholder="${f.label}">`;
}

// タブ＋フォームを描く（タブで入力欄が変わる） 
function renderForm() {
  const t = TABS[tab];

  // タブのボタン
  $tabs.innerHTML = "";
  for (const k in TABS) {
    const b = document.createElement("button");
    b.textContent = TABS[k].label;
    if (k === tab) b.classList.add("active");
    b.onclick = () => { tab = k; $search.value = ""; renderForm(); renderList(); };
    $tabs.appendChild(b);
  }

  // 入力欄（項目ごと）＋ 状態の選択肢 ＋ 追加ボタン
  $form.innerHTML = t.fields.map(inputHTML).join("")
    + (t.status ? `<select data-key="status">${t.status.map(s => `<option>${s}</option>`).join("")}</select>` : "")
    + `<button type="submit">＋ 追加</button>`;
}

// 追加する

$form.onsubmit = (e) => {
  e.preventDefault();

  // 入力をまとめて読み取る
  const fields = {};
  let status = "";
  $form.querySelectorAll("[data-key]").forEach(el => {
    if (el.dataset.key === "status") status = el.value;
    else fields[el.dataset.key] = el.value.trim();
  });

  // 全部空なら何もしない
  if (Object.values(fields).every(v => v === "")) return;

  // 保存して画面を更新
  const items = load();
  items.push({ id: Date.now(), type: tab, fields, status,
    createdAt: new Date().toLocaleString("ja-JP") });
  save(items);
  $form.reset();
  renderList();
};

// 一覧を描く（現在のタブ＋検索でしぼり込み） 
function renderList() {
  const t = TABS[tab];
  const kw = $search.value.trim().toLowerCase();

  const items = load()
    .filter(i => i.type === tab)
    .filter(i => JSON.stringify(i.fields).toLowerCase().includes(kw))
    .reverse();

  if (!items.length) { $list.innerHTML = '<p class="empty">まだ何もありません</p>'; return; }

  $list.innerHTML = items.map(i => {
    // 各項目（空は出さない / URLはリンク化）
    const rows = t.fields.filter(f => i.fields[f.key]).map(f => {
      const v = i.fields[f.key];
      const shown = v.startsWith("http") ? `<a href="${v}" target="_blank">${v}</a>` : v;
      return `<div class="row"><span class="field-label">${f.label}:</span> ${shown}</div>`;
    }).join("");

    const statusRow = i.status ? `<div class="row status-${i.status}">▸ ${i.status}</div>` : "";
    const done = i.status === "実装済み" ? " done" : "";

    return `<div class="card${done}">${rows}${statusRow}
      <div class="date">${i.createdAt}</div>
      <button class="edit" data-id="${i.id}">✏️</button>
      <button class="delete" data-id="${i.id}">🗑</button></div>`;
  }).join("");
}

// 編集・削除（カードのボタンをクリック） 
// 編集 = そのカードをフォームに戻して削除する（保存ボタンで再追加）
$list.onclick = (e) => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  const items = load();
  const target = items.find(i => i.id === id);

  if (e.target.classList.contains("edit")) {
    // フォームの各入力欄に値を戻す
    $form.querySelectorAll("[data-key]").forEach(el => {
      el.value = el.dataset.key === "status" ? target.status : (target.fields[el.dataset.key] || "");
    });
    window.scrollTo({ top: 0, behavior: "smooth" }); // フォームまで戻る
  }

  // 編集・削除どちらも、元のカードはいったん消す
  save(items.filter(i => i.id !== id));
  renderList();
};

// 検索（入力のたびに絞り込み） 
$search.oninput = renderList;

// 起動 
renderForm();
renderList();

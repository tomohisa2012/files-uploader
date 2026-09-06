"use strict";

/* =========================================================
   FileBox
   script.js 完全版
========================================================= */


/* =========================================================
   Supabase設定
========================================================= */

const SUPABASE_URL = "https://jlmskpyaftbndqhfqvwq.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_q3H9vNZW28PZVGHebbB72g_brELXdmZ";

const BUCKET_NAME = "files";
const MAX_FILE_SIZE = 100 * 1024 * 1024;

let supabaseClient = null;


/* =========================================================
   状態
========================================================= */

let allFiles = [];
let filteredFiles = [];

let selectedFile = null;
let authenticatedFiles = new Set();

let currentPage = 1;
let pageSize = 20;

let isLoading = false;
let isUploading = false;


/* =========================================================
   DOM
========================================================= */

const $ = (id) => document.getElementById(id);

let fileInput = null;
let fileNameText = null;
let uploadButton = null;
let uploadPassword = null;
let uploadArea = null;
let fileList = null;
let searchInput = null;
let loading = null;
let message = null;


/* =========================================================
   初期化
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  try {
    cacheElements();
    setupSupabase();
    setupEvents();
    restoreSettings();

    hideLoading();

    loadFiles();

  } catch (error) {
    console.error("FileBox initialization error:", error);

    hideLoading();

    showMessage(
      "ページの初期化中にエラーが発生しました。\n" +
      "Supabaseの設定を確認してください。",
      "error"
    );
  }
});


/* =========================================================
   DOM取得
========================================================= */

function cacheElements() {

  fileInput = $("fileInput");
  fileNameText = $("fileName");
  uploadButton = $("uploadButton");
  uploadPassword = $("uploadPassword");
  uploadArea = $("uploadArea");

  fileList = $("fileList");
  searchInput = $("searchInput");

  loading = $("loading");
  message = $("message");
}


/* =========================================================
   Supabase
========================================================= */

function setupSupabase() {

  if (
    typeof window.supabase === "undefined" ||
    typeof window.supabase.createClient !== "function"
  ) {
    throw new Error(
      "Supabase JavaScript SDKが読み込まれていません。"
    );
  }

  if (
    !SUPABASE_URL ||
    SUPABASE_URL.includes("ここに") ||
    !SUPABASE_KEY ||
    SUPABASE_KEY.includes("ここに")
  ) {
    throw new Error(
      "SUPABASE_URL または SUPABASE_KEY が設定されていません。"
    );
  }

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
}


/* =========================================================
   イベント
========================================================= */

function setupEvents() {

  /* ファイル選択 */
  if (fileInput) {

    fileInput.addEventListener(
      "change",
      handleFileSelect
    );
  }


  /* ドラッグ＆ドロップ */
  if (uploadArea) {

    uploadArea.addEventListener(
      "dragover",
      (event) => {

        event.preventDefault();

        uploadArea.classList.add("dragover");
      }
    );


    uploadArea.addEventListener(
      "dragleave",
      () => {

        uploadArea.classList.remove("dragover");
      }
    );


    uploadArea.addEventListener(
      "drop",
      (event) => {

        event.preventDefault();

        uploadArea.classList.remove("dragover");

        const files =
          event.dataTransfer &&
          event.dataTransfer.files;

        if (!files || !files.length) {
          return;
        }

        handleSelectedFile(files[0]);
      }
    );
  }


  /* アップロード */
  if (uploadButton) {

    uploadButton.addEventListener(
      "click",
      uploadFile
    );
  }


  /* 検索 */
  if (searchInput) {

    searchInput.addEventListener(
      "input",
      () => {

        currentPage = 1;

        filterFiles();
        renderFiles();
      }
    );
  }


  /* Enterでアップロード */
  if (uploadPassword) {

    uploadPassword.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {

          event.preventDefault();

          uploadFile();
        }
      }
    );
  }
}


/* =========================================================
   設定
========================================================= */

function restoreSettings() {

  /* 必要ならここに将来の設定を追加 */
}


/* =========================================================
   ローディング
========================================================= */

function showLoading(text = "読み込み中…") {

  if (!loading) {
    return;
  }

  loading.textContent = text;

  loading.classList.remove("hidden");

  loading.style.display = "";
}


function hideLoading() {

  if (!loading) {
    return;
  }

  loading.classList.add("hidden");

  loading.style.display = "none";
}


/* =========================================================
   メッセージ
========================================================= */

function showMessage(text, type = "info") {

  if (!message) {

    console.log(text);

    return;
  }

  message.textContent = text;

  message.className = "message";

  if (type) {
    message.classList.add(type);
  }

  message.classList.remove("hidden");

  clearTimeout(
    showMessage.timer
  );

  showMessage.timer =
    setTimeout(() => {

      if (message) {
        message.classList.add("hidden");
      }

    }, 5000);
}


/* =========================================================
   ファイル選択
========================================================= */

function handleFileSelect(event) {

  const files =
    event.target &&
    event.target.files;

  if (!files || !files.length) {
    return;
  }

  handleSelectedFile(files[0]);
}


function handleSelectedFile(file) {

  if (!file) {
    return;
  }

  if (file.size > MAX_FILE_SIZE) {

    showMessage(
      "ファイルサイズが100MBを超えています。",
      "error"
    );

    resetFileSelection();

    return;
  }

  selectedFile = file;

  if (fileNameText) {

    fileNameText.textContent =
      `${file.name} (${formatBytes(file.size)})`;
  }

  if (uploadArea) {
    uploadArea.classList.add("has-file");
  }

  showMessage(
    "ファイルを選択しました。",
    "success"
  );
}


/* =========================================================
   ファイル選択解除
========================================================= */

function resetFileSelection() {

  selectedFile = null;

  if (fileInput) {
    fileInput.value = "";
  }

  if (fileNameText) {
    fileNameText.textContent =
      "ファイルが選択されていません";
  }

  if (uploadArea) {
    uploadArea.classList.remove("has-file");
  }
}


/* =========================================================
   アップロード
========================================================= */

async function uploadFile() {

  if (isUploading) {
    return;
  }

  if (!supabaseClient) {

    showMessage(
      "Supabaseが初期化されていません。",
      "error"
    );

    return;
  }


  if (!selectedFile) {

    showMessage(
      "先にアップロードするファイルを選択してください。",
      "error"
    );

    return;
  }


  const password =
    uploadPassword
      ? uploadPassword.value
      : "";


  if (!password) {

    showMessage(
      "ファイルを保護するパスワードを入力してください。",
      "error"
    );

    if (uploadPassword) {
      uploadPassword.focus();
    }

    return;
  }


  if (password.length < 4) {

    showMessage(
      "パスワードは4文字以上にしてください。",
      "error"
    );

    if (uploadPassword) {
      uploadPassword.focus();
    }

    return;
  }


  if (
    selectedFile.size >
    MAX_FILE_SIZE
  ) {

    showMessage(
      "ファイルサイズが100MBを超えています。",
      "error"
    );

    return;
  }


  isUploading = true;

  setUploadButtonState(
    true,
    "アップロード中…"
  );

  showMessage(
    "ファイルをアップロードしています。",
    "info"
  );


  let storagePath = null;


  try {

    /*
      -------------------------------------------------------
      1. パスワードハッシュを作る
      -------------------------------------------------------
    */

    const passwordData =
      await createPasswordHash(password);


    /*
      -------------------------------------------------------
      2. Storage上のファイル名を作る
      -------------------------------------------------------
    */

    const uniqueId =
      createRandomId();

    const safeName =
      sanitizeFileName(
        selectedFile.name
      );

    storagePath =
      `${uniqueId}_${safeName}`;


    /*
      -------------------------------------------------------
      3. Storageへアップロード
      -------------------------------------------------------
    */

    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from(BUCKET_NAME)
        .upload(
          storagePath,
          selectedFile,
          {
            cacheControl: "3600",
            contentType:
              selectedFile.type ||
              "application/octet-stream",
            upsert: false
          }
        );


    if (uploadError) {

      console.error(
        "Storage upload error:",
        uploadError
      );

      throw new Error(
        uploadError.message ||
        "Storageへのアップロードに失敗しました。"
      );
    }


    /*
      -------------------------------------------------------
      4. DBへ登録
      -------------------------------------------------------
    */

    const {
      error: databaseError
    } =
      await supabaseClient
        .from("files")
        .insert({

          name:
            selectedFile.name,

          storage_path:
            storagePath,

          size:
            selectedFile.size,

          mime_type:
            selectedFile.type ||
            "application/octet-stream",

          /*
            Private bucketなので
            Public URLは使用しない。
          */
          public_url:
            "",

          password_salt:
            passwordData.salt,

          password_hash:
            passwordData.hash,

          has_password:
            true

        });


    if (databaseError) {

      console.error(
        "Database insert error:",
        databaseError
      );


      /*
        DB登録に失敗したら
        Storageだけ残らないように削除する。
      */

      try {

        await supabaseClient
          .storage
          .from(BUCKET_NAME)
          .remove([
            storagePath
          ]);

      } catch (cleanupError) {

        console.error(
          "Cleanup error:",
          cleanupError
        );
      }


      throw new Error(
        databaseError.message ||
        "ファイル情報の保存に失敗しました。"
      );
    }


    /*
      -------------------------------------------------------
      完了
      -------------------------------------------------------
    */

    showMessage(
      "アップロードが完了しました！",
      "success"
    );


    resetFileSelection();


    if (uploadPassword) {
      uploadPassword.value = "";
    }


    await loadFiles();


  } catch (error) {

    console.error(
      "Upload error:",
      error
    );


    showMessage(
      error.message ||
      "アップロードに失敗しました。",
      "error"
    );


  } finally {

    isUploading = false;

    setUploadButtonState(
      false,
      "アップロード"
    );
  }
}


/* =========================================================
   アップロードボタン
========================================================= */

function setUploadButtonState(
  disabled,
  text
) {

  if (!uploadButton) {
    return;
  }

  uploadButton.disabled =
    disabled;

  uploadButton.textContent =
    text;
}


/* =========================================================
   パスワードハッシュ
========================================================= */

async function createPasswordHash(
  password
) {

  const saltBytes =
    crypto.getRandomValues(
      new Uint8Array(16)
    );


  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );


  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",

        salt: saltBytes,

        iterations: 120000,

        hash: "SHA-256"
      },

      keyMaterial,

      256
    );


  return {

    salt:
      bytesToBase64(saltBytes),

    hash:
      bytesToBase64(
        new Uint8Array(
          derivedBits
        )
      )
  };
}


/* =========================================================
   ファイル一覧取得
========================================================= */

async function loadFiles() {

  if (!supabaseClient) {
    return;
  }

  if (isLoading) {
    return;
  }

  isLoading = true;

  showLoading(
    "ファイル一覧を読み込み中…"
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("files")
        .select(
          [
            "id",
            "name",
            "storage_path",
            "size",
            "mime_type",
            "public_url",
            "created_at",
            "has_password"
          ].join(",")
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "Load files error:",
        error
      );

      throw new Error(
        error.message ||
        "ファイル一覧を取得できませんでした。"
      );
    }


    allFiles =
      Array.isArray(data)
        ? data
        : [];


    filterFiles();

    renderFiles();


  } catch (error) {

    console.error(
      error
    );


    allFiles = [];

    filteredFiles = [];

    renderFiles();


    showMessage(
      error.message ||
      "ファイル一覧の読み込みに失敗しました。",
      "error"
    );


  } finally {

    isLoading = false;

    hideLoading();
  }
}


/* =========================================================
   検索
========================================================= */

function filterFiles() {

  const keyword =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";


  if (!keyword) {

    filteredFiles =
      [...allFiles];

    return;
  }


  filteredFiles =
    allFiles.filter(
      (file) => {

        const name =
          String(
            file.name || ""
          ).toLowerCase();

        return name.includes(
          keyword
        );
      }
    );


  currentPage = 1;
}


/* =========================================================
   ファイル一覧表示
========================================================= */

function renderFiles() {

  if (!fileList) {
    return;
  }


  if (!filteredFiles.length) {

    fileList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <div>ファイルがありません</div>
        <small>
          ${allFiles.length
            ? "検索条件に一致するファイルがありません。"
            : "まだファイルがアップロードされていません。"}
        </small>
      </div>
    `;

    renderPagination(
      0
    );

    return;
  }


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredFiles.length /
        pageSize
      )
    );


  if (
    currentPage >
    totalPages
  ) {

    currentPage =
      totalPages;
  }


  const start =
    (currentPage - 1) *
    pageSize;


  const files =
    filteredFiles.slice(
      start,
      start + pageSize
    );


  fileList.innerHTML =
    files
      .map(
        (file) =>
          createFileCard(file)
      )
      .join("");


  renderPagination(
    totalPages
  );
}


/* =========================================================
   ファイルカード
========================================================= */

function createFileCard(file) {

  const id =
    String(file.id);


  const authenticated =
    authenticatedFiles.has(id);


  const hasPassword =
    file.has_password !== false &&
    !!file.password_salt &&
    !!file.password_hash;


  /*
    パスワードが正しく入力されるまでは
    Download / URLを表示しない。
  */

  const actionHtml =
    authenticated
      ? `
        <div class="file-actions">

          <button
            class="download-button"
            onclick="downloadFile('${escapeAttr(id)}')"
          >
            ⬇ ダウンロード
          </button>

          <button
            class="url-button"
            onclick="copyFileUrl('${escapeAttr(id)}')"
          >
            🔗 URL
          </button>

          <button
            class="delete-button"
            onclick="deleteFile('${escapeAttr(id)}')"
          >
            🗑 削除
          </button>

        </div>
      `
      : `
        <div class="password-area">

          <input
            type="password"
            class="file-password-input"
            id="password-${escapeAttr(id)}"
            placeholder="パスワード"
            autocomplete="off"
            onkeydown="
              if(event.key === 'Enter'){
                verifyFilePassword('${escapeAttr(id)}');
              }
            "
          >

          <button
            class="password-button"
            onclick="verifyFilePassword('${escapeAttr(id)}')"
          >
            🔓 確認
          </button>

        </div>
      `;


  const passwordLabel =
    hasPassword
      ? `<span class="protected-label">🔒 パスワード保護</span>`
      : `<span class="protected-label">⚠ パスワード情報なし</span>`;


  return `
    <article
      class="file-card"
      data-file-id="${escapeAttr(id)}"
    >

      <div class="file-icon">
        ${getFileIcon(file.mime_type)}
      </div>

      <div class="file-info">

        <div class="file-title">
          ${escapeHtml(file.name || "無題")}
        </div>

        <div class="file-meta">

          <span>
            ${formatBytes(file.size)}
          </span>

          <span>・</span>

          <span>
            ${formatDate(file.created_at)}
          </span>

        </div>

        <div class="file-protection">
          ${passwordLabel}
        </div>

        ${actionHtml}

      </div>

    </article>
  `;
}


/* =========================================================
   パスワード確認
========================================================= */

async function verifyFilePassword(
  fileId
) {

  const file =
    allFiles.find(
      (item) =>
        String(item.id) ===
        String(fileId)
    );


  if (!file) {

    showMessage(
      "ファイルが見つかりません。",
      "error"
    );

    return;
  }


  const input =
    $(`password-${fileId}`);


  const password =
    input
      ? input.value
      : "";


  if (!password) {

    showMessage(
      "パスワードを入力してください。",
      "error"
    );

    if (input) {
      input.focus();
    }

    return;
  }


  try {

    showMessage(
      "パスワードを確認しています…",
      "info"
    );


    /*
      Edge Function側で
      パスワードを検証する。

      download actionを使うが、
      ここではURLを実際に使う必要はない。
    */

    const result =
      await callFileAccess(
        "url",
        file.id,
        password
      );


    if (
      !result ||
      !result.success ||
      !result.url
    ) {

      throw new Error(
        "パスワードを確認できませんでした。"
      );
    }


    authenticatedFiles.add(
      String(file.id)
    );


    renderFiles();


    showMessage(
      "パスワードが正しいです。操作ボタンを表示しました。",
      "success"
    );


  } catch (error) {

    console.error(
      "Password verification error:",
      error
    );


    showMessage(
      error.message ||
      "パスワードが違います。",
      "error"
    );
  }
}


/* =========================================================
   Edge Function
========================================================= */

async function callFileAccess(
  action,
  fileId,
  password = ""
) {

  const response =
    await fetch(
      `${SUPABASE_URL}/functions/v1/file-access`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "apikey":
            SUPABASE_KEY
        },

        body:
          JSON.stringify({
            action,
            fileId,
            password
          })
      }
    );


  let data = null;


  try {

    data =
      await response.json();

  } catch (error) {

    throw new Error(
      "サーバーから正しい応答を受け取れませんでした。"
    );
  }


  if (!response.ok) {

    throw new Error(
      data &&
      data.error
        ? data.error
        : `サーバーエラー (${response.status})`
    );
  }


  return data;
}


/* =========================================================
   ダウンロード
========================================================= */

async function downloadFile(
  fileId
) {

  const file =
    allFiles.find(
      (item) =>
        String(item.id) ===
        String(fileId)
    );


  if (!file) {

    showMessage(
      "ファイルが見つかりません。",
      "error"
    );

    return;
  }


  if (
    !authenticatedFiles.has(
      String(fileId)
    )
  ) {

    showMessage(
      "先にパスワードを確認してください。",
      "error"
    );

    return;
  }


  try {

    const password =
      await askForPasswordAgain(
        "ダウンロード用パスワードを入力してください。"
      );


    if (!password) {
      return;
    }


    showMessage(
      "ダウンロードURLを作成しています…",
      "info"
    );


    const result =
      await callFileAccess(
        "download",
        file.id,
        password
      );


    if (
      !result ||
      !result.success ||
      !result.url
    ) {

      throw new Error(
        "ダウンロードURLを取得できませんでした。"
      );
    }


    /*
      signed URLをfetchしてBlob化。

      これによって
      画像・PDFなどでも
      「別タブで開く」のではなく
      ダウンロードさせる。
    */

    const response =
      await fetch(
        result.url
      );


    if (!response.ok) {

      throw new Error(
        "ファイル本体を取得できませんでした。"
      );
    }


    const blob =
      await response.blob();


    const blobUrl =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      blobUrl;

    link.download =
      file.name ||
      "download";

    link.style.display =
      "none";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    setTimeout(
      () => {
        URL.revokeObjectURL(
          blobUrl
        );
      },
      1000
    );


    showMessage(
      "ダウンロードを開始しました。",
      "success"
    );


  } catch (error) {

    console.error(
      "Download error:",
      error
    );


    showMessage(
      error.message ||
      "ダウンロードに失敗しました。",
      "error"
    );
  }
}


/* =========================================================
   URL
========================================================= */

async function copyFileUrl(
  fileId
) {

  const file =
    allFiles.find(
      (item) =>
        String(item.id) ===
        String(fileId)
    );


  if (!file) {

    showMessage(
      "ファイルが見つかりません。",
      "error"
    );

    return;
  }


  try {

    const password =
      await askForPasswordAgain(
        "URL取得用パスワードを入力してください。"
      );


    if (!password) {
      return;
    }


    const result =
      await callFileAccess(
        "url",
        file.id,
        password
      );


    if (
      !result ||
      !result.success ||
      !result.url
    ) {

      throw new Error(
        "URLを取得できませんでした。"
      );
    }


    await copyText(
      result.url
    );


    showMessage(
      "ダウンロードURLをコピーしました。",
      "success"
    );


  } catch (error) {

    console.error(
      "URL error:",
      error
    );


    showMessage(
      error.message ||
      "URLの取得に失敗しました。",
      "error"
    );
  }
}


/* =========================================================
   再パスワード入力
========================================================= */

function askForPasswordAgain(
  messageText
) {

  return new Promise(
    (resolve) => {

      const password =
        window.prompt(
          messageText
        );

      resolve(
        password || ""
      );
    }
  );
}


/* =========================================================
   削除
========================================================= */

async function deleteFile(
  fileId
) {

  const file =
    allFiles.find(
      (item) =>
        String(item.id) ===
        String(fileId)
    );


  if (!file) {

    showMessage(
      "ファイルが見つかりません。",
      "error"
    );

    return;
  }


  const confirmed =
    window.confirm(
      `「${file.name}」を削除しますか？\n\nこの操作は取り消せません。`
    );


  if (!confirmed) {
    return;
  }


  /*
    匿名アップロードなので、
    「アップロードした本人」という
    アカウント情報は存在しない。

    そのため削除時には
    削除キーを入力してもらう。
  */

  const deleteKey =
    window.prompt(
      "削除キーを入力してください。"
    );


  if (!deleteKey) {
    return;
  }


  try {

    showMessage(
      "ファイルを削除しています…",
      "info"
    );


    const response =
      await fetch(
        `${SUPABASE_URL}/functions/v1/file-access`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_KEY
          },

          body:
            JSON.stringify({
              action: "delete",
              fileId: file.id,
              deleteKey
            })
        }
      );


    let data = null;


    try {
      data =
        await response.json();
    } catch (error) {
      data = null;
    }


    if (!response.ok) {

      throw new Error(
        data &&
        data.error
          ? data.error
          : "ファイルを削除できませんでした。"
      );
    }


    authenticatedFiles.delete(
      String(file.id)
    );


    showMessage(
      "ファイルを削除しました。",
      "success"
    );


    await loadFiles();


  } catch (error) {

    console.error(
      "Delete error:",
      error
    );


    showMessage(
      error.message ||
      "ファイルの削除に失敗しました。",
      "error"
    );
  }
}


/* =========================================================
   ページネーション
========================================================= */

function renderPagination(
  totalPages
) {

  const container =
    $("pagination");


  if (!container) {
    return;
  }


  if (
    totalPages <= 1
  ) {

    container.innerHTML = "";

    return;
  }


  let html = "";


  html += `
    <button
      type="button"
      ${currentPage <= 1 ? "disabled" : ""}
      onclick="changePage(${currentPage - 1})"
    >
      ‹
    </button>
  `;


  const maxButtons = 7;

  let start =
    Math.max(
      1,
      currentPage -
      Math.floor(maxButtons / 2)
    );


  let end =
    Math.min(
      totalPages,
      start + maxButtons - 1
    );


  if (
    end - start + 1 <
    maxButtons
  ) {

    start =
      Math.max(
        1,
        end - maxButtons + 1
      );
  }


  for (
    let i = start;
    i <= end;
    i++
  ) {

    html += `
      <button
        type="button"
        class="${i === currentPage ? "active" : ""}"
        onclick="changePage(${i})"
      >
        ${i}
      </button>
    `;
  }


  html += `
    <button
      type="button"
      ${currentPage >= totalPages ? "disabled" : ""}
      onclick="changePage(${currentPage + 1})"
    >
      ›
    </button>
  `;


  container.innerHTML =
    html;
}


function changePage(
  page
) {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredFiles.length /
        pageSize
      )
    );


  if (
    page < 1 ||
    page > totalPages
  ) {
    return;
  }


  currentPage =
    page;


  renderFiles();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   手動更新
========================================================= */

async function refreshFiles() {

  currentPage = 1;

  await loadFiles();
}


/* =========================================================
   ユーティリティ
========================================================= */

function formatBytes(
  bytes
) {

  const value =
    Number(bytes);


  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    return "0 B";
  }


  const units =
    [
      "B",
      "KB",
      "MB",
      "GB"
    ];


  const index =
    Math.min(
      Math.floor(
        Math.log(value) /
        Math.log(1024)
      ),
      units.length - 1
    );


  const number =
    value /
    Math.pow(
      1024,
      index
    );


  return (
    number.toFixed(
      index === 0 ? 0 : 2
    ) +
    " " +
    units[index]
  );
}


/* =========================================================
   日付
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";
  }


  return date.toLocaleString(
    "ja-JP",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


/* =========================================================
   ファイルアイコン
========================================================= */

function getFileIcon(
  mime
) {

  const type =
    String(
      mime || ""
    ).toLowerCase();


  if (
    type.startsWith(
      "image/"
    )
  ) {
    return "🖼️";
  }


  if (
    type.startsWith(
      "video/"
    )
  ) {
    return "🎬";
  }


  if (
    type.startsWith(
      "audio/"
    )
  ) {
    return "🎵";
  }


  if (
    type.includes(
      "pdf"
    )
  ) {
    return "📕";
  }


  if (
    type.includes(
      "zip"
    ) ||
    type.includes(
      "compressed"
    )
  ) {
    return "📦";
  }


  if (
    type.includes(
      "text"
    )
  ) {
    return "📄";
  }


  return "📁";
}


/* =========================================================
   ファイル名安全化
========================================================= */

function sanitizeFileName(
  name
) {

  let value =
    String(
      name || "file"
    );


  value =
    value.replace(
      /[\/\\:*?"<>|]/g,
      "_"
    );


  value =
    value.replace(
      /[\x00-\x1F]/g,
      ""
    );


  value =
    value.trim();


  if (!value) {
    value = "file";
  }


  /*
    Storageのパスが長くなりすぎるのを防ぐ。
  */

  if (
    value.length > 180
  ) {

    const extensionIndex =
      value.lastIndexOf(".");


    if (
      extensionIndex > 0
    ) {

      const extension =
        value.substring(
          extensionIndex
        );


      value =
        value.substring(
          0,
          180 - extension.length
        ) +
        extension;

    } else {

      value =
        value.substring(
          0,
          180
        );
    }
  }


  return value;
}


/* =========================================================
   ランダムID
========================================================= */

function createRandomId() {

  if (
    crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();
  }


  const bytes =
    crypto.getRandomValues(
      new Uint8Array(16)
    );


  return bytesToHex(
    bytes
  );
}


/* =========================================================
   Base64
========================================================= */

function bytesToBase64(
  bytes
) {

  let binary = "";


  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {

    binary +=
      String.fromCharCode(
        bytes[i]
      );
  }


  return btoa(
    binary
  );
}


/* =========================================================
   Hex
========================================================= */

function bytesToHex(
  bytes
) {

  let result = "";


  for (
    const byte of bytes
  ) {

    result +=
      byte
        .toString(16)
        .padStart(
          2,
          "0"
        );
  }


  return result;
}


/* =========================================================
   クリップボード
========================================================= */

async function copyText(
  text
) {

  if (
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {

    await navigator.clipboard.writeText(
      text
    );

    return;
  }


  /*
    Clipboard APIが使えない場合の
    Chromebook/ブラウザ向けフォールバック。
  */

  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    text;


  textarea.style.position =
    "fixed";

  textarea.style.left =
    "-9999px";


  document.body.appendChild(
    textarea
  );


  textarea.select();


  const success =
    document.execCommand(
      "copy"
    );


  textarea.remove();


  if (!success) {

    throw new Error(
      "URLをコピーできませんでした。"
    );
  }
}


/* =========================================================
   HTMLエスケープ
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* =========================================================
   属性用エスケープ
========================================================= */

function escapeAttr(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    );
}


/* =========================================================
   グローバル公開
   HTMLのonclickから呼べるようにする
========================================================= */

window.uploadFile =
  uploadFile;

window.downloadFile =
  downloadFile;

window.copyFileUrl =
  copyFileUrl;

window.verifyFilePassword =
  verifyFilePassword;

window.deleteFile =
  deleteFile;

window.refreshFiles =
  refreshFiles;

window.changePage =
  changePage;

window.handleSelectedFile =
  handleSelectedFile;

window.resetFileSelection =
  resetFileSelection;

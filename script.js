"use strict";


/* =========================================================
   FileBox
   Supabase + GitHub Pages
========================================================= */


/* =========================================================
   Supabase設定
=========================================================

   ↓↓↓ ここだけ自分のSupabaseの値にしてください ↓↓↓

========================================================= */

const SUPABASE_URL = "https://jlmskpyaftbndqhfqvwq.supabase.co"; 

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_q3H9vNZW28PZVGHebbB72g_brELXdmZ";


/* =========================================================
   Supabase初期化
========================================================= */

let supabaseClient = null;

function initSupabase() {

  if (
    typeof window.supabase === "undefined" ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error(
      "Supabase CDNが読み込まれていません。"
    );

    return false;
  }

  if (
    !SUPABASE_URL ||
    SUPABASE_URL.includes("ここに")
  ) {
    console.error(
      "Supabase URLが設定されていません。"
    );

    return false;
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY.includes("ここに")
  ) {
    console.error(
      "Supabase Publishable keyが設定されていません。"
    );

    return false;
  }

  try {

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );

    console.log(
      "Supabase initialized."
    );

    return true;

  } catch (error) {

    console.error(
      "Supabase initialization error:",
      error
    );

    return false;
  }
}


/* =========================================================
   DOM
========================================================= */

let fileInput;
let dropZone;
let dropIcon;
let dropTitle;
let dropDescription;

let selectedFile;
let fileName;
let fileSize;
let clearFileButton;

let uploadPassword;
let togglePassword;
let uploadButton;

let progressArea;
let progressText;
let progressPercent;
let progressValue;

let deleteKeyBox;
let deleteKeyText;
let copyDeleteKeyButton;

let reloadButton;
let searchInput;
let searchClear;
let fileCount;
let fileList;
let pagination;

let passwordModal;
let passwordModalFileName;
let accessPassword;
let passwordError;
let passwordSubmit;

let deleteModal;
let deleteModalFileName;
let deleteKeyInput;
let deleteError;
let deleteSubmit;

let urlModal;
let urlText;
let copyUrlButton;

let loadingModal;
let loadingText;


/* =========================================================
   State
========================================================= */

let currentFile = null;

let currentAction = null;

let currentDeleteFile = null;

let currentPage = 1;

const PAGE_SIZE = 10;

let allFiles = [];

let filteredFiles = [];


/* =========================================================
   Utility
========================================================= */

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(value) {

  const div = document.createElement("div");

  div.textContent =
    value == null ? "" : String(value);

  return div.innerHTML;
}


function formatFileSize(bytes) {

  if (!Number.isFinite(Number(bytes))) {
    return "0 B";
  }

  bytes = Number(bytes);

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(2)} GB`;
}


function formatDate(dateString) {

  if (!dateString) {
    return "";
  }

  const date =
    new Date(dateString);

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


function getFileIcon(file) {

  const mime =
    file?.mime_type || "";

  const name =
    file?.name || "";

  if (
    mime.startsWith("image/")
  ) {
    return "🖼️";
  }

  if (
    mime.startsWith("video/")
  ) {
    return "🎬";
  }

  if (
    mime.startsWith("audio/")
  ) {
    return "🎵";
  }

  if (
    mime.includes("pdf") ||
    name.toLowerCase().endsWith(".pdf")
  ) {
    return "📕";
  }

  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    name.toLowerCase().endsWith(".zip")
  ) {
    return "📦";
  }

  if (
    mime.includes("text") ||
    name.toLowerCase().endsWith(".txt")
  ) {
    return "📄";
  }

  return "📁";
}


/* =========================================================
   Loading
========================================================= */

function showLoading(text = "読み込み中...") {

  if (!loadingModal) {
    return;
  }

  loadingText.textContent =
    text;

  loadingModal.classList.remove(
    "hidden"
  );
}


function hideLoading() {

  if (!loadingModal) {
    return;
  }

  loadingModal.classList.add(
    "hidden"
  );
}


/* =========================================================
   Modal
========================================================= */

function openModal(id) {

  const modal =
    $(id);

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "hidden"
  );
}


function closeModal(id) {

  const modal =
    $(id);

  if (!modal) {
    return;
  }

  modal.classList.add(
    "hidden"
  );
}


function closeAllModals() {

  [
    "passwordModal",
    "deleteModal",
    "urlModal"
  ].forEach(closeModal);
}


/* =========================================================
   File Selection
========================================================= */

function showSelectedFile(file) {

  if (!file) {
    clearSelectedFile();

    return;
  }

  fileName.textContent =
    file.name;

  fileSize.textContent =
    formatFileSize(file.size);

  selectedFile.classList.remove(
    "hidden"
  );

  dropZone.classList.add(
    "has-file"
  );

  dropIcon.textContent =
    "✓";

  dropTitle.textContent =
    "ファイルが選択されています";

  dropDescription.textContent =
    "別のファイルに変更する場合は「ファイルを選ぶ」を押してください";

  uploadButton.disabled =
    false;
}


function clearSelectedFile() {

  if (fileInput) {
    fileInput.value = "";
  }

  selectedFile.classList.add(
    "hidden"
  );

  dropZone.classList.remove(
    "has-file"
  );

  dropIcon.textContent =
    "↑";

  dropTitle.textContent =
    "ファイルを選択";

  dropDescription.textContent =
    "ファイルを選ぶには下のボタンを押してください";

  uploadButton.disabled =
    true;
}


/* =========================================================
   Drag & Drop
========================================================= */

function setupFileSelection() {

  fileInput.addEventListener(
    "change",
    function () {

      const file =
        this.files &&
        this.files[0];

      if (!file) {
        return;
      }

      showSelectedFile(file);
    }
  );


  clearFileButton.addEventListener(
    "click",
    function (event) {

      event.preventDefault();

      event.stopPropagation();

      clearSelectedFile();
    }
  );


  dropZone.addEventListener(
    "dragover",
    function (event) {

      event.preventDefault();

      dropZone.classList.add(
        "dragover"
      );
    }
  );


  dropZone.addEventListener(
    "dragleave",
    function (event) {

      if (
        !dropZone.contains(
          event.relatedTarget
        )
      ) {

        dropZone.classList.remove(
          "dragover"
        );
      }
    }
  );


  dropZone.addEventListener(
    "drop",
    function (event) {

      event.preventDefault();

      dropZone.classList.remove(
        "dragover"
      );

      const files =
        event.dataTransfer.files;

      if (
        !files ||
        files.length === 0
      ) {
        return;
      }

      const file =
        files[0];

      try {

        const dataTransfer =
          new DataTransfer();

        dataTransfer.items.add(
          file
        );

        fileInput.files =
          dataTransfer.files;

      } catch (error) {

        console.warn(
          "DataTransfer failed:",
          error
        );
      }

      showSelectedFile(file);
    }
  );
}


/* =========================================================
   Password Toggle
========================================================= */

function setupPasswordToggle() {

  togglePassword.addEventListener(
    "click",
    function () {

      if (
        uploadPassword.type ===
        "password"
      ) {

        uploadPassword.type =
          "text";

        togglePassword.textContent =
          "非表示";

      } else {

        uploadPassword.type =
          "password";

        togglePassword.textContent =
          "表示";
      }
    }
  );
}


/* =========================================================
   Random String
========================================================= */

function randomString(length = 32) {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const array =
    new Uint32Array(length);

  crypto.getRandomValues(
    array
  );

  let result = "";

  for (
    let i = 0;
    i < array.length;
    i++
  ) {

    result +=
      chars[
        array[i] %
        chars.length
      ];
  }

  return result;
}


/* =========================================================
   Base64
========================================================= */

function bytesToBase64(bytes) {

  let binary = "";

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {

    binary += String.fromCharCode(
      bytes[i]
    );
  }

  return btoa(binary);
}


/* =========================================================
   Password Hash
========================================================= */

async function hashPassword(
  password,
  saltBase64
) {

  const binary =
    atob(saltBase64);

  const salt =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    salt[i] =
      binary.charCodeAt(i);
  }


  const encoder =
    new TextEncoder();


  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );


  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 120000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );


  return bytesToBase64(
    new Uint8Array(
      derivedBits
    )
  );
}


async function createPasswordData(
  password
) {

  const salt =
    new Uint8Array(16);

  crypto.getRandomValues(
    salt
  );

  const saltBase64 =
    bytesToBase64(salt);

  const hash =
    await hashPassword(
      password,
      saltBase64
    );

  return {
    salt: saltBase64,
    hash: hash
  };
}


/* =========================================================
   Upload
========================================================= */

async function uploadFile() {

  if (!supabaseClient) {

    alert(
      "Supabaseが初期化されていません。\n\nscript.jsのSupabase URLとPublishable keyを確認してください。"
    );

    return;
  }


  const file =
    fileInput.files &&
    fileInput.files[0];


  if (!file) {

    alert(
      "ファイルを選択してください。"
    );

    return;
  }


  const password =
    uploadPassword.value.trim();


  if (!password) {

    alert(
      "ダウンロードパスワードを入力してください。"
    );

    uploadPassword.focus();

    return;
  }


  uploadButton.disabled =
    true;

  progressArea.classList.remove(
    "hidden"
  );

  setProgress(
    5,
    "準備中..."
  );


  try {

    /* -----------------------------------------
       パスワード作成
    ----------------------------------------- */

    setProgress(
      10,
      "パスワードを準備しています..."
    );

    const passwordData =
      await createPasswordData(
        password
      );


    /* -----------------------------------------
       削除キー
    ----------------------------------------- */

    const deleteKey =
      randomString(32);

    const deleteData =
      await createPasswordData(
        deleteKey
      );


    /* -----------------------------------------
       Storage path
    ----------------------------------------- */

    const extension =
      getExtension(file.name);

    const storagePath =
      `${Date.now()}_${randomString(16)}${extension}`;


    /* -----------------------------------------
       Storage upload
    ----------------------------------------- */

    setProgress(
      20,
      "ファイルをアップロードしています..."
    );


    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from("files")
        .upload(
          storagePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type ||
              "application/octet-stream"
          }
        );


    if (uploadError) {
      throw uploadError;
    }


    setProgress(
      70,
      "ファイル情報を保存しています..."
    );


    /* -----------------------------------------
       DB
    ----------------------------------------- */

    const row = {

      name: file.name,

      storage_path:
        storagePath,

      size:
        file.size,

      mime_type:
        file.type ||
        "application/octet-stream",

      public_url:
        "",

      password_salt:
        passwordData.salt,

      password_hash:
        passwordData.hash,

      has_password:
        true,

      delete_salt:
        deleteData.salt,

      delete_hash:
        deleteData.hash
    };


    const {
      error: dbError
    } =
      await supabaseClient
        .from("files")
        .insert(row);


    if (dbError) {

      /* DB保存失敗時はStorageも削除 */

      await supabaseClient
        .storage
        .from("files")
        .remove([
          storagePath
        ]);

      throw dbError;
    }


    setProgress(
      100,
      "アップロード完了！"
    );


    /* -----------------------------------------
       Delete key display
    ----------------------------------------- */

    deleteKeyText.textContent =
      deleteKey;

    deleteKeyBox.classList.remove(
      "hidden"
    );


    alert(
      "アップロードが完了しました！\n\n削除キーは必ず保存してください。"
    );


    clearSelectedFile();

    uploadPassword.value =
      "";

    await loadFiles();


  } catch (error) {

    console.error(
      "Upload error:",
      error
    );

    alert(
      "アップロードに失敗しました。\n\n" +
      getErrorMessage(error)
    );

  } finally {

    uploadButton.disabled =
      !fileInput.files?.length;

    setTimeout(
      () => {

        progressArea.classList.add(
          "hidden"
        );

        setProgress(
          0,
          "アップロード中..."
        );

      },
      1200
    );
  }
}


function setProgress(
  percent,
  text
) {

  progressValue.style.width =
    `${percent}%`;

  progressPercent.textContent =
    `${percent}%`;

  progressText.textContent =
    text;
}


function getExtension(name) {

  const index =
    name.lastIndexOf(".");

  if (
    index === -1
  ) {
    return "";
  }

  return name.substring(
    index
  );
}


/* =========================================================
   Load Files
========================================================= */

async function loadFiles() {

  if (!supabaseClient) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("files")
        .select(
          "id,name,storage_path,size,mime_type,public_url,created_at,has_password"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    allFiles =
      Array.isArray(data)
        ? data
        : [];


    applySearch();


  } catch (error) {

    console.error(
      "Load files error:",
      error
    );

    fileList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <strong>ファイル一覧を読み込めませんでした</strong>
        <p>${escapeHTML(
          getErrorMessage(error)
        )}</p>
      </div>
    `;
  }
}


/* =========================================================
   Search
========================================================= */

function applySearch() {

  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();


  if (!keyword) {

    filteredFiles =
      [...allFiles];

  } else {

    filteredFiles =
      allFiles.filter(
        file =>
          String(
            file.name || ""
          )
            .toLowerCase()
            .includes(keyword)
      );
  }


  currentPage =
    1;

  renderFiles();
}


function renderFiles() {

  fileCount.textContent =
    `${filteredFiles.length}件`;


  if (
    filteredFiles.length === 0
  ) {

    fileList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <strong>ファイルがありません</strong>
        <p>アップロードされたファイルがここに表示されます。</p>
      </div>
    `;

    pagination.innerHTML =
      "";

    return;
  }


  const totalPages =
    Math.ceil(
      filteredFiles.length /
      PAGE_SIZE
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
    PAGE_SIZE;


  const pageFiles =
    filteredFiles.slice(
      start,
      start + PAGE_SIZE
    );


  fileList.innerHTML =
    pageFiles
      .map(
        createFileHTML
      )
      .join("");


  renderPagination(
    totalPages
  );
}


/* =========================================================
   File HTML
========================================================= */

function createFileHTML(file) {

  const passwordBadge =
    file.has_password !== false
      ? "🔒"
      : "";


  return `
    <div class="file-item">

      <div class="file-item-icon">
        ${getFileIcon(file)}
      </div>

      <div class="file-item-main">

        <div
          class="file-item-name"
          title="${escapeHTML(file.name)}"
        >
          ${escapeHTML(file.name)}
        </div>

        <div class="file-item-meta">

          <span>
            ${formatFileSize(file.size)}
          </span>

          <span>
            ${formatDate(file.created_at)}
          </span>

          <span>
            ${passwordBadge}
          </span>

        </div>

      </div>

      <div class="file-actions">

        <button
          type="button"
          class="file-action"
          data-action="download"
          data-id="${file.id}"
        >
          ↓ ダウンロード
        </button>

        <button
          type="button"
          class="file-action"
          data-action="url"
          data-id="${file.id}"
        >
          🔗 URL
        </button>

        <button
          type="button"
          class="file-action delete"
          data-action="delete"
          data-id="${file.id}"
        >
          🗑 削除
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   Pagination
========================================================= */

function renderPagination(
  totalPages
) {

  if (
    totalPages <= 1
  ) {

    pagination.innerHTML =
      "";

    return;
  }


  let html = "";


  html += `
    <button
      class="page-button"
      ${currentPage === 1 ? "disabled" : ""}
      data-page="${currentPage - 1}"
    >
      ‹
    </button>
  `;


  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    html += `
      <button
        class="page-button ${
          i === currentPage
            ? "active"
            : ""
        }"
        data-page="${i}"
      >
        ${i}
      </button>
    `;
  }


  html += `
    <button
      class="page-button"
      ${
        currentPage === totalPages
          ? "disabled"
          : ""
      }
      data-page="${currentPage + 1}"
    >
      ›
    </button>
  `;


  pagination.innerHTML =
    html;
}


/* =========================================================
   File Actions
========================================================= */

function handleFileAction(
  action,
  id
) {

  const file =
    allFiles.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!file) {

    alert(
      "ファイルが見つかりません。"
    );

    return;
  }


  if (
    action === "delete"
  ) {

    openDeleteModal(
      file
    );

    return;
  }


  openPasswordModal(
    file,
    action
  );
}


/* =========================================================
   Password Modal
========================================================= */

function openPasswordModal(
  file,
  action
) {

  currentFile =
    file;

  currentAction =
    action;


  passwordModalFileName.textContent =
    `「${file.name}」を操作するにはパスワードを入力してください。`;


  accessPassword.value =
    "";

  passwordError.classList.add(
    "hidden"
  );

  openModal(
    "passwordModal"
  );


  setTimeout(
    () => {
      accessPassword.focus();
    },
    50
  );
}


async function submitPassword() {

  if (!currentFile) {
    return;
  }

  const password =
    accessPassword.value;

  if (!password) {

    showPasswordError(
      "パスワードを入力してください。"
    );

    return;
  }

  passwordSubmit.disabled =
    true;

  passwordSubmit.textContent =
    "確認中...";

  try {

    /*
     * verify は使わない。
     *
     * download / url のリクエスト自体で
     * Edge Function側がパスワードを検証する。
     */

    closeModal("passwordModal");

    if (
      currentAction ===
      "download"
    ) {

      await downloadFile(
        currentFile.id,
        password
      );

    } else if (
      currentAction ===
      "url"
    ) {

      await showFileURL(
        currentFile.id,
        password
      );

    }

  } catch (error) {

    console.error(
      "Password verification error:",
      error
    );

    openModal("passwordModal");

    showPasswordError(
      getErrorMessage(error)
    );

  } finally {

    passwordSubmit.disabled =
      false;

    passwordSubmit.textContent =
      "確認する";
  }
}


function showPasswordError(
  message
) {

  passwordError.textContent =
    message;

  passwordError.classList.remove(
    "hidden"
  );
}


/* =========================================================
   Edge Function
========================================================= */

async function callFileAccess(
  action,
  fileId,
  password = "",
  deleteKey = ""
) {

  if (!supabaseClient) {

    throw new Error(
      "Supabaseが初期化されていません。"
    );
  }


  const session =
    await supabaseClient.auth.getSession();


  const accessToken =
    session?.data?.session
      ?.access_token;


  const body = {
    action,
    fileId
  };


  if (password) {
    body.password =
      password;
  }


  if (deleteKey) {
    body.deleteKey =
      deleteKey;
  }


  const response =
    await fetch(
      `${SUPABASE_URL}/functions/v1/file-access`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "apikey":
            SUPABASE_PUBLISHABLE_KEY,

          ...(accessToken
            ? {
                "Authorization":
                  `Bearer ${accessToken}`
              }
            : {})
        },

        body:
          JSON.stringify(body)
      }
    );


  let result = null;


  try {

    result =
      await response.json();

  } catch {

    result = {
      error:
        "サーバーから正しい応答がありません。"
    };
  }


  if (!response.ok) {

    throw new Error(
      result?.error ||
      `サーバーエラー (${response.status})`
    );
  }


  return result;
}


/* =========================================================
   Download
========================================================= */

async function downloadFile(
  fileId,
  password
) {

  showLoading(
    "ダウンロードURLを取得しています..."
  );


  try {

    const result =
      await callFileAccess(
        "download",
        fileId,
        password
      );


    if (
      !result?.url
    ) {

      throw new Error(
        "ダウンロードURLを取得できませんでした。"
      );
    }


    showLoading(
      "ファイルをダウンロードしています..."
    );


    const response =
      await fetch(
        result.url
      );


    if (!response.ok) {

      throw new Error(
        "ファイルの取得に失敗しました。"
      );
    }


    const blob =
      await response.blob();


    const url =
      URL.createObjectURL(
        blob
      );


    const a =
      document.createElement(
        "a"
      );


    a.href =
      url;

    a.download =
      currentFile?.name ||
      "download";

    a.style.display =
      "none";


    document.body.appendChild(
      a
    );

    a.click();

    a.remove();


    setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );


  } catch (error) {

    console.error(
      "Download error:",
      error
    );

    alert(
      "ダウンロードに失敗しました。\n\n" +
      getErrorMessage(error)
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   URL
========================================================= */

async function showFileURL(
  fileId,
  password
) {

  showLoading(
    "URLを作成しています..."
  );


  try {

    const result =
      await callFileAccess(
        "url",
        fileId,
        password
      );


    if (
      !result?.url
    ) {

      throw new Error(
        "URLを取得できませんでした。"
      );
    }


    urlText.value =
      result.url;


    openModal(
      "urlModal"
    );


  } catch (error) {

    console.error(
      "URL error:",
      error
    );

    alert(
      "URLの作成に失敗しました。\n\n" +
      getErrorMessage(error)
    );

  } finally {

    hideLoading();
  }
}


/* =========================================================
   Delete
========================================================= */

function openDeleteModal(
  file
) {

  currentDeleteFile =
    file;


  deleteModalFileName.textContent =
    `「${file.name}」を削除します。`;


  deleteKeyInput.value =
    "";

  deleteError.classList.add(
    "hidden"
  );


  openModal(
    "deleteModal"
  );


  setTimeout(
    () => {
      deleteKeyInput.focus();
    },
    50
  );
}


async function submitDelete() {

  if (!currentDeleteFile) {
    return;
  }


  const deleteKey =
    deleteKeyInput.value.trim();


  if (!deleteKey) {

    showDeleteError(
      "削除キーを入力してください。"
    );

    return;
  }


  deleteSubmit.disabled =
    true;

  deleteSubmit.textContent =
    "削除中...";


  try {

    const result =
      await callFileAccess(
        "delete",
        currentDeleteFile.id,
        "",
        deleteKey
      );


    if (
      !result?.success
    ) {

      throw new Error(
        result?.error ||
        "削除に失敗しました。"
      );
    }


    closeModal(
      "deleteModal"
    );


    alert(
      "ファイルを削除しました。"
    );


    currentDeleteFile =
      null;


    await loadFiles();


  } catch (error) {

    console.error(
      "Delete error:",
      error
    );

    showDeleteError(
      getErrorMessage(error)
    );

  } finally {

    deleteSubmit.disabled =
      false;

    deleteSubmit.textContent =
      "削除する";
  }
}


function showDeleteError(
  message
) {

  deleteError.textContent =
    message;

  deleteError.classList.remove(
    "hidden"
  );
}


/* =========================================================
   Copy
========================================================= */

async function copyText(
  text
) {

  try {

    await navigator.clipboard.writeText(
      text
    );

    return true;

  } catch {

    try {

      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        text;

      textarea.style.position =
        "fixed";

      textarea.style.opacity =
        "0";

      document.body.appendChild(
        textarea
      );

      textarea.focus();

      textarea.select();

      const success =
        document.execCommand(
          "copy"
        );

      textarea.remove();

      return success;

    } catch {

      return false;
    }
  }
}


/* =========================================================
   Events
========================================================= */

function setupEvents() {

  uploadButton.addEventListener(
    "click",
    uploadFile
  );


  reloadButton.addEventListener(
    "click",
    async function () {

      showLoading(
        "ファイル一覧を更新しています..."
      );

      try {

        await loadFiles();

      } finally {

        hideLoading();
      }
    }
  );


  searchInput.addEventListener(
    "input",
    applySearch
  );


  searchClear.addEventListener(
    "click",
    function () {

      searchInput.value =
        "";

      applySearch();

      searchInput.focus();
    }
  );


  fileList.addEventListener(
    "click",
    function (event) {

      const button =
        event.target.closest(
          "[data-action]"
        );

      if (!button) {
        return;
      }

      handleFileAction(
        button.dataset.action,
        button.dataset.id
      );
    }
  );


  pagination.addEventListener(
    "click",
    function (event) {

      const button =
        event.target.closest(
          "[data-page]"
        );

      if (!button) {
        return;
      }

      const page =
        Number(
          button.dataset.page
        );

      if (!page) {
        return;
      }

      currentPage =
        page;

      renderFiles();

      window.scrollTo({
        top:
          document.querySelector(
            ".files-card"
          )?.offsetTop - 20 || 0,

        behavior:
          "smooth"
      });
    }
  );


  passwordSubmit.addEventListener(
    "click",
    submitPassword
  );


  accessPassword.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        submitPassword();
      }
    }
  );


  deleteSubmit.addEventListener(
    "click",
    submitDelete
  );


  deleteKeyInput.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        submitDelete();
      }
    }
  );


  copyUrlButton.addEventListener(
    "click",
    async function () {

      const success =
        await copyText(
          urlText.value
        );


      if (success) {

        copyUrlButton.textContent =
          "コピーしました！";

        setTimeout(
          () => {
            copyUrlButton.textContent =
              "コピー";
          },
          1500
        );

      } else {

        alert(
          "コピーできませんでした。URLを手動でコピーしてください。"
        );
      }
    }
  );


  copyDeleteKeyButton.addEventListener(
    "click",
    async function () {

      const success =
        await copyText(
          deleteKeyText.textContent
        );


      if (success) {

        copyDeleteKeyButton.textContent =
          "コピーしました！";

        setTimeout(
          () => {
            copyDeleteKeyButton.textContent =
              "コピー";
          },
          1500
        );
      }
    }
  );


  document.querySelectorAll(
    "[data-close-modal]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          closeModal(
            button.dataset.closeModal
          );
        }
      );
    }
  );


  document.querySelectorAll(
    ".modal-backdrop"
  ).forEach(
    backdrop => {

      backdrop.addEventListener(
        "click",
        function () {

          const modal =
            this.parentElement;

          modal.classList.add(
            "hidden"
          );
        }
      );
    }
  );


  document.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Escape"
      ) {

        closeAllModals();
      }
    }
  );
}


/* =========================================================
   Error
========================================================= */

function getErrorMessage(
  error
) {

  if (!error) {
    return "不明なエラーです。";
  }

  if (
    typeof error ===
    "string"
  ) {

    return error;
  }

  if (
    error.message
  ) {

    return error.message;
  }

  if (
    error.error_description
  ) {

    return error.error_description;
  }

  try {

    return JSON.stringify(
      error
    );

  } catch {

    return "不明なエラーです。";
  }
}


/* =========================================================
   Initialization
========================================================= */

function initialize() {

  console.log(
    "FileBox starting..."
  );


  /* DOM */

  fileInput =
    $("fileInput");

  dropZone =
    $("dropZone");

  dropIcon =
    $("dropIcon");

  dropTitle =
    $("dropTitle");

  dropDescription =
    $("dropDescription");

  selectedFile =
    $("selectedFile");

  fileName =
    $("fileName");

  fileSize =
    $("fileSize");

  clearFileButton =
    $("clearFileButton");

  uploadPassword =
    $("uploadPassword");

  togglePassword =
    $("togglePassword");

  uploadButton =
    $("uploadButton");

  progressArea =
    $("progressArea");

  progressText =
    $("progressText");

  progressPercent =
    $("progressPercent");

  progressValue =
    $("progressValue");

  deleteKeyBox =
    $("deleteKeyBox");

  deleteKeyText =
    $("deleteKeyText");

  copyDeleteKeyButton =
    $("copyDeleteKeyButton");

  reloadButton =
    $("reloadButton");

  searchInput =
    $("searchInput");

  searchClear =
    $("searchClear");

  fileCount =
    $("fileCount");

  fileList =
    $("fileList");

  pagination =
    $("pagination");

  passwordModal =
    $("passwordModal");

  passwordModalFileName =
    $("passwordModalFileName");

  accessPassword =
    $("accessPassword");

  passwordError =
    $("passwordError");

  passwordSubmit =
    $("passwordSubmit");

  deleteModal =
    $("deleteModal");

  deleteModalFileName =
    $("deleteModalFileName");

  deleteKeyInput =
    $("deleteKeyInput");

  deleteError =
    $("deleteError");

  deleteSubmit =
    $("deleteSubmit");

  urlModal =
    $("urlModal");

  urlText =
    $("urlText");

  copyUrlButton =
    $("copyUrlButton");

  loadingModal =
    $("loadingModal");

  loadingText =
    $("loadingText");


  /* DOMチェック */

  const requiredElements = [

    ["fileInput", fileInput],
    ["dropZone", dropZone],
    ["uploadButton", uploadButton],
    ["fileList", fileList],
    ["searchInput", searchInput],
    ["passwordModal", passwordModal],
    ["deleteModal", deleteModal],
    ["urlModal", urlModal]

  ];


  const missing =
    requiredElements
      .filter(
        item => !item[1]
      )
      .map(
        item => item[0]
      );


  if (
    missing.length > 0
  ) {

    console.error(
      "Missing DOM elements:",
      missing
    );

    alert(
      "FileBoxのHTMLに必要な要素がありません。\n\n不足: " +
      missing.join(", ")
    );

    return;
  }


  /* Supabase */

  const initialized =
    initSupabase();


  if (!initialized) {

    console.error(
      "Supabase initialization failed."
    );

    fileList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>

        <strong>
          Supabaseに接続できません
        </strong>

        <p>
          script.jsのSupabase設定を確認してください。
        </p>
      </div>
    `;

    return;
  }


  /* Events */

  setupFileSelection();

  setupPasswordToggle();

  setupEvents();


  /* Files */

  loadFiles();


  console.log(
    "FileBox initialized successfully."
  );
}


/* =========================================================
   Start
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();
}

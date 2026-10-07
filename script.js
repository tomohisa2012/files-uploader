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

let fileDescription;
let descriptionCount;
let allowUrlInputs;


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

function getAllowUrlValue() {

  if (!allowUrlInputs || allowUrlInputs.length === 0) {
    return false;
  }

  const checked =
    Array.from(allowUrlInputs).find(
      input => input.checked
    );

  return checked?.value === "true";
}


function setupDescriptionCounter() {

  if (!fileDescription) {
    return;
  }

  const update = () => {

    if (fileDescription.value.length > 1000) {
      fileDescription.value =
        fileDescription.value.slice(0, 1000);
    }

    if (descriptionCount) {
      descriptionCount.textContent =
        `${fileDescription.value.length}/1000`;
    }
  };

  fileDescription.addEventListener(
    "input",
    update
  );

  update();
}


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

      description:
        fileDescription
          ? fileDescription.value.trim().slice(0, 1000)
          : "",

      allow_url:
        getAllowUrlValue(),

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

    if (fileDescription) {
      fileDescription.value = "";
    }

    if (allowUrlInputs) {
      allowUrlInputs.forEach(
        input => {
          input.checked =
            input.value === "false";
        }
      );
    }

    if (descriptionCount) {
      descriptionCount.textContent =
        "0/1000";
    }

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
   File List
========================================================= */

async function loadFiles() {

  if (!supabaseClient) {
    return;
  }

  fileList.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <div class="empty-title">読み込み中...</div>
    </div>
  `;

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("files")
        .select(
          "id,name,storage_path,size,mime_type,public_url,created_at,has_password,description,allow_url"
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
      data || [];

    applySearch();

  } catch (error) {

    console.error(
      "Load files error:",
      error
    );

    fileList.innerHTML = `
      <div class="empty-state error-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">
          ファイル一覧を読み込めませんでした
        </div>
        <div class="empty-description">
          ${escapeHTML(
            getErrorMessage(error)
          )}
        </div>
      </div>
    `;
  }
}


/* =========================================================
   Search
========================================================= */

function setupSearch() {

  searchInput.addEventListener(
    "input",
    function () {

      applySearch();

    }
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
}


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
        file => {

          const name =
            String(
              file.name || ""
            ).toLowerCase();

          const description =
            String(
              file.description || ""
            ).toLowerCase();

          return (
            name.includes(keyword) ||
            description.includes(keyword)
          );
        }
      );
  }


  currentPage =
    1;

  renderFiles();
}


/* =========================================================
   Render Files
========================================================= */

function renderFiles() {

  const total =
    filteredFiles.length;


  fileCount.textContent =
    `${total}件`;


  if (total === 0) {

    fileList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <div class="empty-title">
          ${allFiles.length === 0
            ? "まだファイルがありません"
            : "検索結果がありません"}
        </div>
        <div class="empty-description">
          ${allFiles.length === 0
            ? "ファイルをアップロードすると、ここに表示されます。"
            : "別のキーワードで検索してみてください。"}
        </div>
      </div>
    `;

    pagination.innerHTML =
      "";

    return;
  }


  const start =
    (currentPage - 1) *
    PAGE_SIZE;

  const end =
    start +
    PAGE_SIZE;


  const pageFiles =
    filteredFiles.slice(
      start,
      end
    );


  fileList.innerHTML =
    pageFiles
      .map(
        createFileHTML
      )
      .join("");


  setupFileButtons();

  renderPagination();
}


/* =========================================================
   File HTML
========================================================= */

function createFileHTML(file) {

  const icon =
    getFileIcon(file);


  const urlButton =
    file.allow_url === true
      ? `
        <button
          class="file-action-button url-button"
          data-action="url"
          data-id="${escapeHTML(file.id)}"
        >
          🔗 URL発行
        </button>
      `
      : "";


  const descriptionHTML =
    file.description
      ? `
        <div class="file-item-description">
          ${escapeHTML(
            file.description
          )}
        </div>
      `
      : "";


  return `
    <article
      class="file-item"
      data-id="${escapeHTML(file.id)}"
    >

      <div class="file-item-main">

        <div class="file-icon">
          ${icon}
        </div>


        <div class="file-info">

          <div class="file-name">
            ${escapeHTML(
              file.name
            )}
          </div>

          ${descriptionHTML}

          <div class="file-meta">

            <span>
              ${formatFileSize(
                file.size
              )}
            </span>

            <span>
              ${formatDate(
                file.created_at
              )}
            </span>

            ${
              file.has_password
                ? `<span>🔒 パスワード保護</span>`
                : ""
            }

          </div>

        </div>

      </div>


      <div class="file-actions">

        <button
          class="file-action-button download-button"
          data-action="download"
          data-id="${escapeHTML(file.id)}"
        >
          ⬇️ ダウンロード
        </button>

        ${urlButton}

        <button
          class="file-action-button delete-button"
          data-action="delete"
          data-id="${escapeHTML(file.id)}"
        >
          🗑️ 削除
        </button>

      </div>

    </article>
  `;
}


/* =========================================================
   File Buttons
========================================================= */

function setupFileButtons() {

  const buttons =
    fileList.querySelectorAll(
      "[data-action]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        function () {

          const action =
            this.dataset.action;

          const id =
            this.dataset.id;

          const file =
            allFiles.find(
              item =>
                String(item.id) ===
                String(id)
            );


          if (!file) {

            alert(
              "ファイル情報が見つかりません。"
            );

            return;
          }


          if (
            action ===
            "download"
          ) {

            openPasswordModal(
              file,
              "download"
            );

          } else if (
            action ===
            "url"
          ) {

            openPasswordModal(
              file,
              "url"
            );

          } else if (
            action ===
            "delete"
          ) {

            openDeleteModal(
              file
            );
          }

        }
      );
    }
  );
}


/* =========================================================
   Pagination
========================================================= */

function renderPagination() {

  const totalPages =
    Math.ceil(
      filteredFiles.length /
      PAGE_SIZE
    );


  if (
    totalPages <= 1
  ) {

    pagination.innerHTML =
      "";

    return;
  }


  let html =
    "";


  html += `
    <button
      class="page-button"
      data-page="prev"
      ${currentPage <= 1
        ? "disabled"
        : ""}
    >
      ‹
    </button>
  `;


  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    html += `
      <button
        class="page-button ${
          page === currentPage
            ? "active"
            : ""
        }"
        data-page="${page}"
      >
        ${page}
      </button>
    `;
  }


  html += `
    <button
      class="page-button"
      data-page="next"
      ${currentPage >= totalPages
        ? "disabled"
        : ""}
    >
      ›
    </button>
  `;


  pagination.innerHTML =
    html;


  pagination
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          function () {

            const value =
              this.dataset.page;

            const total =
              Math.ceil(
                filteredFiles.length /
                PAGE_SIZE
              );


            if (
              value ===
              "prev"
            ) {

              if (
                currentPage > 1
              ) {
                currentPage--;
              }

            } else if (
              value ===
              "next"
            ) {

              if (
                currentPage <
                total
              ) {
                currentPage++;
              }

            } else {

              currentPage =
                Number(value);
            }


            renderFiles();

            window.scrollTo({
              top:
                fileList.offsetTop -
                100,
              behavior:
                "smooth"
            });

          }
        );
      }
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
    file.name;


  accessPassword.value =
    "";


  passwordError.textContent =
    "";


  passwordError.classList.add(
    "hidden"
  );


  passwordSubmit.disabled =
    false;


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


function closePasswordModal() {

  currentFile =
    null;

  currentAction =
    null;

  accessPassword.value =
    "";

  passwordError.textContent =
    "";

  closeModal(
    "passwordModal"
  );
}


/* =========================================================
   Password Access
========================================================= */

async function submitPassword() {

  if (
    !currentFile ||
    !currentAction
  ) {
    return;
  }


  const password =
    accessPassword.value.trim();


  if (!password) {

    showPasswordError(
      "パスワードを入力してください。"
    );

    return;
  }


  passwordSubmit.disabled =
    true;


  passwordError.classList.add(
    "hidden"
  );


  try {

    const result =
      await callFileAccess(
        currentAction,
        {
          id:
            currentFile.id,

          password:
            password
        }
      );


    if (
      !result ||
      !result.url
    ) {

      throw new Error(
        "ダウンロードURLを取得できませんでした。"
      );
    }


    const url =
      result.url;


    if (
      currentAction ===
      "download"
    ) {

      closePasswordModal();

      window.location.href =
        url;

    } else if (
      currentAction ===
      "url"
    ) {

      closePasswordModal();

      openUrlModal(
        url
      );
    }


  } catch (error) {

    console.error(
      "Password access error:",
      error
    );


    showPasswordError(
      getErrorMessage(
        error
      )
    );


    passwordSubmit.disabled =
      false;
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
   Delete Modal
========================================================= */

function openDeleteModal(
  file
) {

  currentDeleteFile =
    file;


  deleteModalFileName.textContent =
    file.name;


  deleteKeyInput.value =
    "";


  deleteError.textContent =
    "";


  deleteError.classList.add(
    "hidden"
  );


  deleteSubmit.disabled =
    false;


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


function closeDeleteModal() {

  currentDeleteFile =
    null;

  deleteKeyInput.value =
    "";

  deleteError.textContent =
    "";

  closeModal(
    "deleteModal"
  );
}


/* =========================================================
   Delete File
========================================================= */

async function submitDelete() {

  if (!currentDeleteFile) {
    return;
  }


  const deleteKey =
    deleteKeyInput.value.trim();


  if (!deleteKey) {

    deleteError.textContent =
      "削除キーを入力してください。";

    deleteError.classList.remove(
      "hidden"
    );

    return;
  }


  deleteSubmit.disabled =
    true;


  deleteError.classList.add(
    "hidden"
  );


  try {

    await callFileAccess(
      "delete",
      {
        id:
          currentDeleteFile.id,

        deleteKey:
          deleteKey
      }
    );


    closeDeleteModal();


    alert(
      "ファイルを削除しました。"
    );


    await loadFiles();


  } catch (error) {

    console.error(
      "Delete error:",
      error
    );


    deleteError.textContent =
      getErrorMessage(
        error
      );

    deleteError.classList.remove(
      "hidden"
    );


    deleteSubmit.disabled =
      false;
  }
}


/* =========================================================
   URL Modal
========================================================= */

function openUrlModal(
  url
) {

  urlText.value =
    url;


  openModal(
    "urlModal"
  );
}


function closeUrlModal() {

  urlText.value =
    "";

  closeModal(
    "urlModal"
  );
}


async function copyUrl() {

  const url =
    urlText.value;


  if (!url) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      url
    );

    copyUrlButton.textContent =
      "✓ コピーしました";

    setTimeout(
      () => {

        copyUrlButton.textContent =
          "URLをコピー";

      },
      1500
    );


  } catch (error) {

    console.error(
      "Copy URL error:",
      error
    );


    urlText.select();

    document.execCommand(
      "copy"
    );

  }
}


/* =========================================================
   Delete Key Copy
========================================================= */

async function copyDeleteKey() {

  const key =
    deleteKeyText.textContent.trim();


  if (!key) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      key
    );


    copyDeleteKeyButton.textContent =
      "✓ コピーしました";


    setTimeout(
      () => {

        copyDeleteKeyButton.textContent =
          "コピー";

      },
      1500
    );


  } catch (error) {

    console.error(
      "Copy delete key error:",
      error
    );


    const range =
      document.createRange();

    range.selectNodeContents(
      deleteKeyText
    );


    const selection =
      window.getSelection();

    selection.removeAllRanges();

    selection.addRange(
      range
    );


    try {

      document.execCommand(
        "copy"
      );

    } catch (_) {}

    selection.removeAllRanges();
  }
}


/* =========================================================
   Supabase Edge Function
========================================================= */

async function callFileAccess(
  action,
  body
) {

  if (!supabaseClient) {

    throw new Error(
      "Supabaseが初期化されていません。"
    );
  }


  const payload = {
    action:
      action,

    ...body
  };


  const {
    data,
    error
  } =
    await supabaseClient.functions.invoke(
      "file-access",
      {
        body:
          payload
      }
    );


  if (error) {

    console.error(
      "Edge Function error:",
      error
    );


    /*
      FunctionsHttpErrorの場合、
      response bodyを取得できることがあります。
    */

    try {

      if (
        error.context &&
        typeof error.context.json ===
          "function"
      ) {

        const body =
          await error.context.json();

        if (
          body &&
          body.error
        ) {

          throw new Error(
            body.error
          );
        }
      }

    } catch (innerError) {

      if (
        innerError instanceof Error &&
        innerError.message
      ) {

        throw innerError;
      }
    }


    throw error;
  }


  if (
    data &&
    data.error
  ) {

    throw new Error(
      data.error
    );
  }


  return data;
}


/* =========================================================
   Error Message
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

  } catch (_) {

    return "不明なエラーです。";
  }
}


/* =========================================================
   Reload
========================================================= */

function setupReload() {

  reloadButton.addEventListener(
    "click",
    async function () {

      reloadButton.disabled =
        true;

      try {

        await loadFiles();

      } finally {

        reloadButton.disabled =
          false;
      }

    }
  );
}


/* =========================================================
   Modal Events
========================================================= */

function setupModalEvents() {

  /* Password modal */

  document
    .querySelectorAll(
      '[data-close-modal="passwordModal"]'
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          closePasswordModal
        );

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

        event.preventDefault();

        submitPassword();
      }
    }
  );


  /* Delete modal */

  document
    .querySelectorAll(
      '[data-close-modal="deleteModal"]'
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          closeDeleteModal
        );

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

        event.preventDefault();

        submitDelete();
      }
    }
  );


  /* URL modal */

  document
    .querySelectorAll(
      '[data-close-modal="urlModal"]'
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          closeUrlModal
        );

      }
    );


  copyUrlButton.addEventListener(
    "click",
    copyUrl
  );


  /* Click outside modal */

  document.addEventListener(
    "click",
    function (event) {

      if (
        event.target.classList.contains(
          "modal"
        )
      ) {

        const id =
          event.target.id;

        if (
          id ===
          "passwordModal"
        ) {

          closePasswordModal();

        } else if (
          id ===
          "deleteModal"
        ) {

          closeDeleteModal();

        } else if (
          id ===
          "urlModal"
        ) {

          closeUrlModal();
        }
      }
    }
  );


  /* ESC */

  document.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }


      if (
        passwordModal &&
        !passwordModal.classList.contains(
          "hidden"
        )
      ) {

        closePasswordModal();

      } else if (
        deleteModal &&
        !deleteModal.classList.contains(
          "hidden"
        )
      ) {

        closeDeleteModal();

      } else if (
        urlModal &&
        !urlModal.classList.contains(
          "hidden"
        )
      ) {

        closeUrlModal();
      }

    }
  );
}
/* =========================================================
   Initialize DOM
========================================================= */

function initializeDOM() {

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


  /* -----------------------------------------
     説明文
  ----------------------------------------- */

  fileDescription =
    $("fileDescription");

  descriptionCount =
    $("descriptionCount");


  /* -----------------------------------------
     URL発行設定
  ----------------------------------------- */

  allowUrlInputs =
    document.querySelectorAll(
      'input[name="allowUrl"]'
    );
}


/* =========================================================
   DOM Check
========================================================= */

function checkRequiredDOM() {

  const required = {

    fileInput,
    dropZone,
    selectedFile,

    fileName,
    fileSize,
    clearFileButton,

    uploadPassword,
    togglePassword,
    uploadButton,

    progressArea,
    progressText,
    progressPercent,
    progressValue,

    deleteKeyBox,
    deleteKeyText,
    copyDeleteKeyButton,

    reloadButton,
    searchInput,
    searchClear,
    fileCount,
    fileList,
    pagination,

    passwordModal,
    passwordModalFileName,
    accessPassword,
    passwordError,
    passwordSubmit,

    deleteModal,
    deleteModalFileName,
    deleteKeyInput,
    deleteError,
    deleteSubmit,

    urlModal,
    urlText,
    copyUrlButton,

    loadingModal,
    loadingText
  };


  const missing =
    Object.entries(required)
      .filter(
        ([, element]) =>
          !element
      )
      .map(
        ([name]) =>
          name
      );


  if (
    missing.length > 0
  ) {

    console.error(
      "FileBox: 必要なHTML要素が見つかりません:",
      missing
    );

    return false;
  }


  return true;
}


/* =========================================================
   Upload Button
========================================================= */

function setupUploadButton() {

  uploadButton.addEventListener(
    "click",
    function (event) {

      event.preventDefault();

      uploadFile();

    }
  );
}


/* =========================================================
   Delete Key
========================================================= */

function setupDeleteKey() {

  copyDeleteKeyButton.addEventListener(
    "click",
    function (event) {

      event.preventDefault();

      copyDeleteKey();

    }
  );
}


/* =========================================================
   Description
========================================================= */

function setupDescription() {

  setupDescriptionCounter();
}


/* =========================================================
   URL Setting
========================================================= */

function setupUrlSetting() {

  if (
    !allowUrlInputs ||
    allowUrlInputs.length === 0
  ) {
    return;
  }


  allowUrlInputs.forEach(
    input => {

      input.addEventListener(
        "change",
        function () {

          /*
            URL発行設定はアップロード時に
            getAllowUrlValue() から取得する。
          */

          console.log(
            "allow_url:",
            getAllowUrlValue()
          );
        }
      );

    }
  );
}


/* =========================================================
   Keyboard Shortcuts
========================================================= */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    function (event) {

      /*
        Ctrl + K
        検索欄へ移動
      */

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }

        return;
      }


      /*
        Ctrl + U
        アップロード欄へ移動
      */

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "u"
      ) {

        event.preventDefault();

        if (fileInput) {
          fileInput.click();
        }

        return;
      }

    }
  );
}


/* =========================================================
   Page Visibility
========================================================= */

function setupVisibilityRefresh() {

  document.addEventListener(
    "visibilitychange",
    function () {

      if (
        document.visibilityState ===
        "visible"
      ) {

        /*
          ページに戻ってきたとき、
          ファイル一覧を更新する。
        */

        if (supabaseClient) {
          loadFiles();
        }
      }

    }
  );
}


/* =========================================================
   Online / Offline
========================================================= */

function setupConnectionEvents() {

  window.addEventListener(
    "online",
    function () {

      console.log(
        "FileBox: online"
      );

      loadFiles();

    }
  );


  window.addEventListener(
    "offline",
    function () {

      console.warn(
        "FileBox: offline"
      );

    }
  );
}


/* =========================================================
   Prevent accidental submit
========================================================= */

function setupFormProtection() {

  document.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();

    }
  );
}


/* =========================================================
   Initialization
========================================================= */

async function initializeFileBox() {

  console.log(
    "FileBox initializing..."
  );


  /* -----------------------------------------
     DOM
  ----------------------------------------- */

  initializeDOM();


  /* -----------------------------------------
     DOM check
  ----------------------------------------- */

  if (
    !checkRequiredDOM()
  ) {

    console.error(
      "FileBoxの初期化を中止しました。HTMLのIDを確認してください。"
    );

    return;
  }


  /* -----------------------------------------
     Supabase
  ----------------------------------------- */

  const initialized =
    initSupabase();


  if (!initialized) {

    alert(
      "Supabaseの初期化に失敗しました。\n\n" +
      "script.jsのSUPABASE_URLとSUPABASE_PUBLISHABLE_KEYを確認してください。"
    );

    return;
  }


  /* -----------------------------------------
     File selection
  ----------------------------------------- */

  setupFileSelection();


  /* -----------------------------------------
     Password
  ----------------------------------------- */

  setupPasswordToggle();


  /* -----------------------------------------
     Upload
  ----------------------------------------- */

  setupUploadButton();


  /* -----------------------------------------
     Search
  ----------------------------------------- */

  setupSearch();


  /* -----------------------------------------
     Reload
  ----------------------------------------- */

  setupReload();


  /* -----------------------------------------
     Delete key
  ----------------------------------------- */

  setupDeleteKey();


  /* -----------------------------------------
     Modals
  ----------------------------------------- */

  setupModalEvents();


  /* -----------------------------------------
     Description
  ----------------------------------------- */

  setupDescription();


  /* -----------------------------------------
     URL setting
  ----------------------------------------- */

  setupUrlSetting();


  /* -----------------------------------------
     Keyboard
  ----------------------------------------- */

  setupKeyboardShortcuts();


  /* -----------------------------------------
     Visibility
  ----------------------------------------- */

  setupVisibilityRefresh();


  /* -----------------------------------------
     Network
  ----------------------------------------- */

  setupConnectionEvents();


  /* -----------------------------------------
     Form
  ----------------------------------------- */

  setupFormProtection();


  /* -----------------------------------------
     Initial state
  ----------------------------------------- */

  clearSelectedFile();


  if (fileDescription) {

    fileDescription.value =
      "";

  }


  if (descriptionCount) {

    descriptionCount.textContent =
      "0/1000";

  }


  if (allowUrlInputs) {

    allowUrlInputs.forEach(
      input => {

        input.checked =
          input.value === "false";

      }
    );
  }


  deleteKeyBox.classList.add(
    "hidden"
  );


  progressArea.classList.add(
    "hidden"
  );


  /* -----------------------------------------
     Load files
  ----------------------------------------- */

  await loadFiles();


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
    initializeFileBox,
    {
      once: true
    }
  );

} else {

  initializeFileBox();

}

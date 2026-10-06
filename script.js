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

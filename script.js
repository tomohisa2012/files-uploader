/* =========================================================
   FileBox
   Supabase File Sharing
========================================================= */


/* =========================
   Supabase設定
========================= */

const SUPABASE_URL = "https://jlmskpyaftbndqhfqvwq.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_q3H9vNZW28PZVGHebbB72g_brELXdmZ";

const BUCKET_NAME =
  "files";

const FUNCTION_NAME =
  "file-access";

const MAX_FILE_SIZE =
  100 * 1024 * 1024;

const MIN_PASSWORD_LENGTH =
  4;


/* =========================
   Supabase
========================= */

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   状態
========================= */

let selectedFile = null;

let allFiles = [];

let currentDeleteFile = null;

let latestDeleteKey = null;


/* =========================
   DOM
========================= */

const fileInput =
  document.getElementById(
    "fileInput"
  );

const dropZone =
  document.getElementById(
    "dropZone"
  );

const selectedFileBox =
  document.getElementById(
    "selectedFile"
  );

const selectedFileName =
  document.getElementById(
    "selectedFileName"
  );

const selectedFileSize =
  document.getElementById(
    "selectedFileSize"
  );

const clearFileButton =
  document.getElementById(
    "clearFileButton"
  );

const uploadPassword =
  document.getElementById(
    "uploadPassword"
  );

const uploadButton =
  document.getElementById(
    "uploadButton"
  );

const progressArea =
  document.getElementById(
    "progressArea"
  );

const progressBar =
  document.getElementById(
    "progressBar"
  );

const progressPercent =
  document.getElementById(
    "progressPercent"
  );

const message =
  document.getElementById(
    "message"
  );

const fileList =
  document.getElementById(
    "fileList"
  );

const fileCount =
  document.getElementById(
    "fileCount"
  );

const loading =
  document.getElementById(
    "loading"
  );

const emptyState =
  document.getElementById(
    "emptyState"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const clearSearchButton =
  document.getElementById(
    "clearSearchButton"
  );

const reloadButton =
  document.getElementById(
    "reloadButton"
  );

const refreshButton =
  document.getElementById(
    "refreshButton"
  );

const darkModeButton =
  document.getElementById(
    "darkModeButton"
  );


/* =========================
   削除キーDOM
========================= */

const deleteKeyBox =
  document.getElementById(
    "deleteKeyBox"
  );

const deleteKeyDisplay =
  document.getElementById(
    "deleteKeyDisplay"
  );

const copyDeleteKey =
  document.getElementById(
    "copyDeleteKey"
  );


/* =========================
   削除モーダル
========================= */

const deleteModal =
  document.getElementById(
    "deleteModal"
  );

const deleteKeyInput =
  document.getElementById(
    "deleteKeyInput"
  );

const deleteModalError =
  document.getElementById(
    "deleteModalError"
  );

const closeDeleteModal =
  document.getElementById(
    "closeDeleteModal"
  );

const cancelDeleteButton =
  document.getElementById(
    "cancelDeleteButton"
  );

const confirmDeleteButton =
  document.getElementById(
    "confirmDeleteButton"
  );


/* =========================
   キーモーダル
========================= */

const keyModal =
  document.getElementById(
    "keyModal"
  );

const largeDeleteKey =
  document.getElementById(
    "largeDeleteKey"
  );

const largeCopyKey =
  document.getElementById(
    "largeCopyKey"
  );

const closeKeyModal =
  document.getElementById(
    "closeKeyModal"
  );


/* =========================================================
   初期化
========================================================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    restoreDarkMode();

    setupEvents();

    loadFiles();

  }
);


/* =========================================================
   イベント
========================================================= */

function setupEvents() {

  fileInput.addEventListener(
    "change",
    handleFileInput
  );


  dropZone.addEventListener(
    "dragover",
    (event) => {

      event.preventDefault();

      dropZone.classList.add(
        "dragover"
      );

    }
  );


  dropZone.addEventListener(
    "dragleave",
    () => {

      dropZone.classList.remove(
        "dragover"
      );

    }
  );


  dropZone.addEventListener(
    "drop",
    (event) => {

      event.preventDefault();

      dropZone.classList.remove(
        "dragover"
      );

      const files =
        event.dataTransfer.files;

      if (
        files &&
        files.length
      ) {

        setSelectedFile(
          files[0]
        );

      }

    }
  );


  clearFileButton.addEventListener(
    "click",
    clearSelectedFile
  );


  uploadButton.addEventListener(
    "click",
    uploadFile
  );


  searchInput.addEventListener(
    "input",
    renderFilteredFiles
  );


  clearSearchButton.addEventListener(
    "click",
    () => {

      searchInput.value = "";

      renderFilteredFiles();

      searchInput.focus();

    }
  );


  reloadButton.addEventListener(
    "click",
    loadFiles
  );


  refreshButton.addEventListener(
    "click",
    loadFiles
  );


  darkModeButton.addEventListener(
    "click",
    toggleDarkMode
  );


  copyDeleteKey.addEventListener(
    "click",
    copyLatestDeleteKey
  );


  closeDeleteModal.addEventListener(
    "click",
    closeDeleteModalWindow
  );


  cancelDeleteButton.addEventListener(
    "click",
    closeDeleteModalWindow
  );


  confirmDeleteButton.addEventListener(
    "click",
    confirmDelete
  );


  closeKeyModal.addEventListener(
    "click",
    closeKeyModalWindow
  );


  largeCopyKey.addEventListener(
    "click",
    async () => {

      if (
        !latestDeleteKey
      ) {
        return;
      }

      await copyText(
        latestDeleteKey
      );

      largeCopyKey.textContent =
        "✓ コピーしました";

      setTimeout(
        () => {

          largeCopyKey.textContent =
            "📋 削除キーをコピー";

        },
        1500
      );

    }
  );


  deleteKeyInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        confirmDelete();

      }

    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        closeDeleteModalWindow();

        closeKeyModalWindow();

      }

    }
  );

}


/* =========================================================
   ファイル選択
========================================================= */

function handleFileInput(
  event
) {

  const file =
    event.target.files[0];

  if (!file) {
    return;
  }

  setSelectedFile(
    file
  );

}


function setSelectedFile(
  file
) {

  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    showMessage(
      "ファイルサイズは100MB以下にしてください。",
      "error"
    );

    fileInput.value = "";

    return;

  }


  selectedFile =
    file;


  selectedFileName.textContent =
    file.name;


  selectedFileSize.textContent =
    formatFileSize(
      file.size
    );


  selectedFileBox.classList.remove(
    "hidden"
  );

}


function clearSelectedFile() {

  selectedFile =
    null;

  fileInput.value =
    "";

  selectedFileBox.classList.add(
    "hidden"
  );

}


/* =========================================================
   パスワードハッシュ
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


function base64ToBytes(
  base64
) {

  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }

  return bytes;

}


async function hashPassword(
  password,
  saltBase64
) {

  const salt =
    base64ToBytes(
      saltBase64
    );


  const encoder =
    new TextEncoder();


  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        password
      ),
      "PBKDF2",
      false,
      [
        "deriveBits"
      ]
    );


  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name:
          "PBKDF2",

        salt:
          salt,

        iterations:
          120000,

        hash:
          "SHA-256"
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


/* =========================================================
   ランダム削除キー
========================================================= */

function generateDeleteKey() {

  const bytes =
    crypto.getRandomValues(
      new Uint8Array(32)
    );


  const base64 =
    bytesToBase64(
      bytes
    );


  return base64
    .replace(
      /[^a-zA-Z0-9]/g,
      ""
    )
    .substring(
      0,
      40
    );

}


/* =========================================================
   アップロード
========================================================= */

async function uploadFile() {

  if (
    !selectedFile
  ) {

    showMessage(
      "アップロードするファイルを選択してください。",
      "error"
    );

    return;

  }


  const password =
    uploadPassword.value;


  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {

    showMessage(
      "ダウンロードパスワードは4文字以上にしてください。",
      "error"
    );

    uploadPassword.focus();

    return;

  }


  if (
    selectedFile.size >
    MAX_FILE_SIZE
  ) {

    showMessage(
      "ファイルサイズは100MB以下にしてください。",
      "error"
    );

    return;

  }


  uploadButton.disabled =
    true;

  uploadButton.textContent =
    "アップロード中...";


  progressArea.classList.remove(
    "hidden"
  );

  setProgress(
    5
  );


  try {

    /*
     * ==========================
     * パスワード用Salt
     * ==========================
     */

    const passwordSaltBytes =
      crypto.getRandomValues(
        new Uint8Array(16)
      );


    const passwordSalt =
      bytesToBase64(
        passwordSaltBytes
      );


    const passwordHash =
      await hashPassword(
        password,
        passwordSalt
      );


    /*
     * ==========================
     * 削除キー
     * ==========================
     */

    const deleteKey =
      generateDeleteKey();


    const deleteSaltBytes =
      crypto.getRandomValues(
        new Uint8Array(16)
      );


    const deleteSalt =
      bytesToBase64(
        deleteSaltBytes
      );


    const deleteHash =
      await hashPassword(
        deleteKey,
        deleteSalt
      );


    /*
     * ==========================
     * Storageパス
     * ==========================
     */

    const randomId =
      crypto.randomUUID();


    const safeName =
      sanitizeFileName(
        selectedFile.name
      );


    const storagePath =
      randomId +
      "_" +
      safeName;


    setProgress(
      10
    );


    /*
     * ==========================
     * Storageへアップロード
     * ==========================
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
            cacheControl:
              "3600",

            contentType:
              selectedFile.type ||
              "application/octet-stream",

            upsert:
              false
          }
        );


    if (
      uploadError
    ) {

      throw new Error(
        uploadError.message ||
        "ファイルのアップロードに失敗しました。"
      );

    }


    setProgress(
      70
    );


    /*
     * ==========================
     * DBへ登録
     * ==========================
     */

    const {
      error: dbError
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

          public_url:
            "",

          password_salt:
            passwordSalt,

          password_hash:
            passwordHash,

          has_password:
            true,

          delete_salt:
            deleteSalt,

          delete_hash:
            deleteHash

        });


    if (
      dbError
    ) {

      /*
       * DB登録に失敗した場合、
       * Storageに残ったファイルを
       * 可能なら削除する
       */

      try {

        await supabaseClient
          .storage
          .from(BUCKET_NAME)
          .remove([
            storagePath
          ]);

      } catch (
        cleanupError
      ) {

        console.error(
          cleanupError
        );

      }


      throw new Error(
        dbError.message ||
        "ファイル情報の登録に失敗しました。"
      );

    }


    setProgress(
      100
    );


    /*
     * ==========================
     * 削除キー表示
     * ==========================
     */

    latestDeleteKey =
      deleteKey;


    deleteKeyDisplay.textContent =
      deleteKey;


    deleteKeyBox.classList.remove(
      "hidden"
    );


    largeDeleteKey.textContent =
      deleteKey;


    /*
     * ==========================
     * 完了
     * ==========================
     */

    showMessage(
      "アップロードが完了しました！削除キーを保存してください。",
      "success"
    );


    clearSelectedFile();


    uploadPassword.value =
      "";


    await loadFiles();


    /*
     * 削除キーを大きく表示
     */

    openKeyModal();


  } catch (
    error
  ) {

    console.error(
      error
    );


    showMessage(
      error.message ||
      "アップロードに失敗しました。",
      "error"
    );


  } finally {

    setTimeout(
      () => {

        progressArea.classList.add(
          "hidden"
        );

        setProgress(
          0
        );

        uploadButton.disabled =
          false;

        uploadButton.textContent =
          "📤 アップロード";

      },
      700
    );

  }

}


/* =========================================================
   ファイル一覧取得
========================================================= */

async function loadFiles() {

  loading.classList.remove(
    "hidden"
  );

  emptyState.classList.add(
    "hidden"
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("files")
        .select(
          "id,name,size,mime_type,storage_path,created_at,has_password"
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        );


    if (
      error
    ) {

      throw new Error(
        error.message
      );

    }


    allFiles =
      data || [];


    fileCount.textContent =
      allFiles.length +
      "件";


    renderFilteredFiles();


  } catch (
    error
  ) {

    console.error(
      error
    );


    fileList.innerHTML =
      "";


    showMessage(
      "ファイル一覧の取得に失敗しました。\n" +
      error.message,
      "error"
    );

  } finally {

    loading.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   検索
========================================================= */

function renderFilteredFiles() {

  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();


  if (
    keyword
  ) {

    clearSearchButton.classList.remove(
      "hidden"
    );

  } else {

    clearSearchButton.classList.add(
      "hidden"
    );

  }


  const filtered =
    allFiles.filter(
      (file) => {

        return String(
          file.name || ""
        )
          .toLowerCase()
          .includes(
            keyword
          );

      }
    );


  renderFiles(
    filtered
  );

}


/* =========================================================
   ファイル描画
========================================================= */

function renderFiles(
  files
) {

  fileList.innerHTML =
    "";


  if (
    !files.length
  ) {

    emptyState.classList.remove(
      "hidden"
    );


    if (
      allFiles.length
    ) {

      emptyState.querySelector(
        "h3"
      ).textContent =
        "見つかりませんでした";


      emptyState.querySelector(
        "p"
      ).textContent =
        "検索条件を変更してください。";

    } else {

      emptyState.querySelector(
        "h3"
      ).textContent =
        "ファイルがありません";


      emptyState.querySelector(
        "p"
      ).textContent =
        "最初のファイルをアップロードしてみましょう。";

    }


    return;

  }


  emptyState.classList.add(
    "hidden"
  );


  files.forEach(
    (file) => {

      fileList.appendChild(
        createFileCard(
          file
        )
      );

    }
  );

}


/* =========================================================
   ファイルカード
========================================================= */

function createFileCard(
  file
) {

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "file-card";


  const top =
    document.createElement(
      "div"
    );

  top.className =
    "file-top";


  const icon =
    document.createElement(
      "div"
    );

  icon.className =
    "file-icon";

  icon.textContent =
    getFileIcon(
      file.mime_type,
      file.name
    );


  const info =
    document.createElement(
      "div"
    );

  info.className =
    "file-info";


  const name =
    document.createElement(
      "div"
    );

  name.className =
    "file-name";

  name.textContent =
    file.name;


  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "file-meta";

  meta.textContent =
    formatFileSize(
      file.size
    ) +
    " ・ " +
    formatDate(
      file.created_at
    );


  info.appendChild(
    name
  );

  info.appendChild(
    meta
  );


  top.appendChild(
    icon
  );

  top.appendChild(
    info
  );


  /*
   * ==========================
   * パスワード認証
   * ==========================
   */

  const passwordArea =
    document.createElement(
      "div"
    );

  passwordArea.className =
    "password-area";


  const passwordInput =
    document.createElement(
      "input"
    );

  passwordInput.type =
    "password";

  passwordInput.className =
    "text-input";

  passwordInput.placeholder =
    "ダウンロードパスワード";

  passwordInput.autocomplete =
    "off";


  const authButton =
    document.createElement(
      "button"
    );

  authButton.type =
    "button";

  authButton.className =
    "auth-button";

  authButton.textContent =
    "認証";


  const authMessage =
    document.createElement(
      "div"
    );

  authMessage.className =
    "auth-message";


  passwordArea.appendChild(
    passwordInput
  );

  passwordArea.appendChild(
    authButton
  );


  /*
   * ==========================
   * アクション
   * ==========================
   */

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "file-actions hidden";


  const downloadButton =
    document.createElement(
      "button"
    );

  downloadButton.type =
    "button";

  downloadButton.className =
    "action-button";

  downloadButton.textContent =
    "⬇️ ダウンロード";


  const urlButton =
    document.createElement(
      "button"
    );

  urlButton.type =
    "button";

  urlButton.className =
    "action-button";

  urlButton.textContent =
    "🔗 URL";


  const deleteButton =
    document.createElement(
      "button"
    );

  deleteButton.type =
    "button";

  deleteButton.className =
    "action-button delete";

  deleteButton.textContent =
    "🗑️ 削除";


  actions.appendChild(
    downloadButton
  );

  actions.appendChild(
    urlButton
  );

  actions.appendChild(
    deleteButton
  );


  /*
   * ==========================
   * 認証状態
   * ==========================
   */

  let authenticated =
    false;


  let authenticatedPassword =
    "";


  /*
   * ==========================
   * 認証
   * ==========================
   */

  authButton.addEventListener(
    "click",
    async () => {

      const password =
        passwordInput.value;


      if (
        !password
      ) {

        setAuthMessage(
          authMessage,
          "パスワードを入力してください。",
          "error"
        );

        return;

      }


      authButton.disabled =
        true;

      authButton.textContent =
        "確認中...";


      try {

        await callFunction({
          action:
            "download",

          fileId:
            file.id,

          password:
            password

        });


        authenticated =
          true;

        authenticatedPassword =
          password;


        actions.classList.remove(
          "hidden"
        );


        setAuthMessage(
          authMessage,
          "✓ 認証しました。操作できます。",
          "success"
        );


        passwordInput.type =
          "password";


      } catch (
        error
      ) {

        authenticated =
          false;

        authenticatedPassword =
          "";


        actions.classList.add(
          "hidden"
        );


        setAuthMessage(
          authMessage,
          error.message ||
          "パスワードが違います。",
          "error"
        );

      } finally {

        authButton.disabled =
          false;

        authButton.textContent =
          "認証";

      }

    }
  );


  /*
   * Enterでも認証
   */

  passwordInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        authButton.click();

      }

    }
  );


  /*
   * ==========================
   * ダウンロード
   * ==========================
   */

  downloadButton.addEventListener(
    "click",
    async () => {

      if (
        !authenticated
      ) {
        return;
      }


      downloadButton.disabled =
        true;

      downloadButton.textContent =
        "⬇️ ダウンロード中...";


      try {

        const result =
          await callFunction({

            action:
              "download",

            fileId:
              file.id,

            password:
              authenticatedPassword

          });


        await downloadFromUrl(
          result.url,
          file.name
        );


        setAuthMessage(
          authMessage,
          "✓ ダウンロードを開始しました。",
          "success"
        );


      } catch (
        error
      ) {

        setAuthMessage(
          authMessage,
          error.message ||
          "ダウンロードに失敗しました。",
          "error"
        );

      } finally {

        downloadButton.disabled =
          false;

        downloadButton.textContent =
          "⬇️ ダウンロード";

      }

    }
  );


  /*
   * ==========================
   * URL
   * ==========================
   */

  urlButton.addEventListener(
    "click",
    async () => {

      if (
        !authenticated
      ) {
        return;
      }


      urlButton.disabled =
        true;

      urlButton.textContent =
        "作成中...";


      try {

        const result =
          await callFunction({

            action:
              "url",

            fileId:
              file.id,

            password:
              authenticatedPassword

          });


        await copyText(
          result.url
        );


        urlButton.textContent =
          "✓ コピーしました";


        setTimeout(
          () => {

            urlButton.textContent =
              "🔗 URL";

          },
          1500
        );


      } catch (
        error
      ) {

        setAuthMessage(
          authMessage,
          error.message ||
          "URLの作成に失敗しました。",
          "error"
        );

        urlButton.textContent =
          "🔗 URL";

      } finally {

        urlButton.disabled =
          false;

      }

    }
  );


  /*
   * ==========================
   * 削除
   * ==========================
   */

  deleteButton.addEventListener(
    "click",
    () => {

      if (
        !authenticated
      ) {
        return;
      }


      openDeleteModal(
        file,
        card
      );

    }
  );


  card.appendChild(
    top
  );

  card.appendChild(
    passwordArea
  );

  card.appendChild(
    authMessage
  );

  card.appendChild(
    actions
  );


  return card;

}


/* =========================================================
   削除モーダル
========================================================= */

function openDeleteModal(
  file,
  card
) {

  currentDeleteFile = {
    file,
    card
  };


  deleteKeyInput.value =
    "";


  deleteModalError.textContent =
    "";


  deleteModalError.classList.add(
    "hidden"
  );


  deleteModal.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      deleteKeyInput.focus();

    },
    50
  );

}


function closeDeleteModalWindow() {

  currentDeleteFile =
    null;


  deleteKeyInput.value =
    "";


  deleteModalError.textContent =
    "";


  deleteModalError.classList.add(
    "hidden"
  );


  deleteModal.classList.add(
    "hidden"
  );

}


/* =========================================================
   削除確認
========================================================= */

async function confirmDelete() {

  if (
    !currentDeleteFile
  ) {
    return;
  }


  const deleteKey =
    deleteKeyInput.value
      .trim();


  if (
    !deleteKey
  ) {

    showDeleteModalError(
      "削除キーを入力してください。"
    );

    return;

  }


  const file =
    currentDeleteFile.file;


  const card =
    currentDeleteFile.card;


  const confirmed =
    confirm(
      `「${file.name}」を削除しますか？\n\nこの操作は元に戻せません。`
    );


  if (
    !confirmed
  ) {
    return;
  }


  confirmDeleteButton.disabled =
    true;

  confirmDeleteButton.textContent =
    "削除中...";


  try {

    /*
     * 重要：
     *
     * ここでは password を送らない。
     * deleteKey だけを送る。
     */

    await callFunction({

      action:
        "delete",

      fileId:
        file.id,

      deleteKey:
        deleteKey

    });


    /*
     * カード削除
     */

    card.remove();


    /*
     * 配列からも削除
     */

    allFiles =
      allFiles.filter(
        (item) =>
          item.id !== file.id
      );


    fileCount.textContent =
      allFiles.length +
      "件";


    if (
      !allFiles.length
    ) {

      emptyState.classList.remove(
        "hidden"
      );

      emptyState.querySelector(
        "h3"
      ).textContent =
        "ファイルがありません";

      emptyState.querySelector(
        "p"
      ).textContent =
        "最初のファイルをアップロードしてみましょう。";

    }


    closeDeleteModalWindow();


    showMessage(
      "ファイルを削除しました。",
      "success"
    );


  } catch (
    error
  ) {

    console.error(
      error
    );


    showDeleteModalError(
      error.message ||
      "削除キーが違います。"
    );


  } finally {

    confirmDeleteButton.disabled =
      false;

    confirmDeleteButton.textContent =
      "🗑️ 削除する";

  }

}


/* =========================================================
   Edge Function呼び出し
========================================================= */

async function callFunction(
  body
) {

  const response =
    await fetch(
      SUPABASE_URL +
      "/functions/v1/" +
      FUNCTION_NAME,
      {
        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

          "apikey":
            SUPABASE_KEY

        },

        body:
          JSON.stringify(
            body
          )

      }
    );


  let data = null;


  try {

    data =
      await response.json();

  } catch (
    error
  ) {

    throw new Error(
      "サーバーから正しい応答を取得できませんでした。"
    );

  }


  if (
    !response.ok
  ) {

    throw new Error(
      data?.error ||
      "サーバー側でエラーが発生しました。"
    );

  }


  if (
    data?.error
  ) {

    throw new Error(
      data.error
    );

  }


  return data;

}


/* =========================================================
   ダウンロード
========================================================= */

async function downloadFromUrl(
  url,
  filename
) {

  const response =
    await fetch(
      url
    );


  if (
    !response.ok
  ) {

    throw new Error(
      "ファイルを取得できませんでした。"
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
    filename || "download";


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

}


/* =========================================================
   コピー
========================================================= */

async function copyText(
  text
) {

  try {

    await navigator.clipboard.writeText(
      text
    );

  } catch (
    error
  ) {

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

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

  }

}


/* =========================================================
   削除キーコピー
========================================================= */

async function copyLatestDeleteKey() {

  if (
    !latestDeleteKey
  ) {
    return;
  }


  await copyText(
    latestDeleteKey
  );


  copyDeleteKey.textContent =
    "✓ コピーしました";


  setTimeout(
    () => {

      copyDeleteKey.textContent =
        "コピー";

    },
    1500
  );

}


/* =========================================================
   キーモーダル
========================================================= */

function openKeyModal() {

  if (
    !latestDeleteKey
  ) {
    return;
  }


  largeDeleteKey.textContent =
    latestDeleteKey;


  keyModal.classList.remove(
    "hidden"
  );

}


function closeKeyModalWindow() {

  keyModal.classList.add(
    "hidden"
  );

}


/* =========================================================
   メッセージ
========================================================= */

function showMessage(
  text,
  type = ""
) {

  message.textContent =
    text;

  message.className =
    "message";


  if (
    type
  ) {

    message.classList.add(
      type
    );

  }


  message.classList.remove(
    "hidden"
  );


  clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    setTimeout(
      () => {

        message.classList.add(
          "hidden"
        );

      },
      6000
    );

}


function setAuthMessage(
  element,
  text,
  type
) {

  element.textContent =
    text;

  element.className =
    "auth-message";


  if (
    type
  ) {

    element.classList.add(
      type
    );

  }

}


function showDeleteModalError(
  text
) {

  deleteModalError.textContent =
    text;

  deleteModalError.classList.remove(
    "hidden"
  );

}


/* =========================================================
   進捗
========================================================= */

function setProgress(
  percent
) {

  const value =
    Math.max(
      0,
      Math.min(
        100,
        percent
      )
    );


  progressBar.style.width =
    value + "%";


  progressPercent.textContent =
    Math.round(
      value
    ) + "%";

}


/* =========================================================
   ファイルサイズ
========================================================= */

function formatFileSize(
  bytes
) {

  const size =
    Number(
      bytes || 0
    );


  if (
    size < 1024
  ) {

    return (
      size +
      " B"
    );

  }


  if (
    size < 1024 * 1024
  ) {

    return (
      (size / 1024)
        .toFixed(1) +
      " KB"
    );

  }


  if (
    size < 1024 * 1024 * 1024
  ) {

    return (
      (size /
        (1024 * 1024)
      ).toFixed(1) +
      " MB"
    );

  }


  return (
    (size /
      (1024 * 1024 * 1024)
    ).toFixed(2) +
    " GB"
  );

}


/* =========================================================
   日付
========================================================= */

function formatDate(
  date
) {

  if (
    !date
  ) {

    return "";

  }


  const d =
    new Date(
      date
    );


  if (
    Number.isNaN(
      d.getTime()
    )
  ) {

    return "";

  }


  return d.toLocaleString(
    "ja-JP",
    {
      year:
        "numeric",

      month:
        "numeric",

      day:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit"

    }
  );

}


/* =========================================================
   ファイルアイコン
========================================================= */

function getFileIcon(
  mime,
  name
) {

  const type =
    String(
      mime || ""
    ).toLowerCase();


  const filename =
    String(
      name || ""
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
    type ===
    "application/pdf" ||
    filename.endsWith(
      ".pdf"
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
    ) ||
    filename.endsWith(
      ".zip"
    )
  ) {
    return "🗜️";
  }


  if (
    type.includes(
      "text"
    ) ||
    filename.endsWith(
      ".txt"
    )
  ) {
    return "📄";
  }


  if (
    filename.endsWith(
      ".html"
    ) ||
    filename.endsWith(
      ".css"
    ) ||
    filename.endsWith(
      ".js"
    )
  ) {
    return "💻";
  }


  return "📦";

}


/* =========================================================
   ファイル名安全化
========================================================= */

function sanitizeFileName(
  name
) {

  return String(
    name || "file"
  )
    .replace(
      /[/\\?%*:|"<>]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    )
    .substring(
      0,
      180
    );

}


/* =========================================================
   ダークモード
========================================================= */

function restoreDarkMode() {

  const enabled =
    localStorage.getItem(
      "filebox_dark_mode"
    ) === "1";


  if (
    enabled
  ) {

    document.body.classList.add(
      "dark-mode"
    );

    darkModeButton.textContent =
      "☀️";

  }

}


function toggleDarkMode() {

  const enabled =
    document.body.classList.toggle(
      "dark-mode"
    );


  localStorage.setItem(
    "filebox_dark_mode",
    enabled
      ? "1"
      : "0"
  );


  darkModeButton.textContent =
    enabled
      ? "☀️"
      : "🌙";

}

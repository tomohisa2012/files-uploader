/* =========================================================
   FileBox
   Main JavaScript
========================================================= */

"use strict";


/* =========================================================
   Supabase設定
=========================================================

   ↓↓↓ ここだけ自分のSupabaseの値に変更 ↓↓↓
*/

const SUPABASE_URL = "https://jlmskpyaftbndqhfqvwq.supabase.co"; 

const SUPABASE_KEY = "sb_publishable_q3H9vNZW28PZVGHebbB72g_brELXdmZ";

/* =========================================================
   設定
========================================================= */

const STORAGE_BUCKET = "files";

const EDGE_FUNCTION_NAME = "file-access";

const FILES_PER_PAGE = 10;

const SIGNED_URL_SECONDS = 300;


/* =========================================================
   アプリ
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  let supabaseClient = null;

  let allFiles = [];

  let filteredFiles = [];

  let currentPage = 1;

  let selectedFile = null;

  let currentPasswordFile = null;

  let currentDeleteFile = null;

  let currentSignedUrl = null;

  let toastTimer = null;


  /* =======================================================
     DOM取得
  ======================================================= */

  const fileInput =
    document.getElementById("fileInput");

  const fileSelectButton =
    document.getElementById("fileSelectButton");

  const dropZone =
    document.getElementById("dropZone");

  const dropIcon =
    document.getElementById("dropIcon");

  const dropTitle =
    document.getElementById("dropTitle");

  const dropDescription =
    document.getElementById("dropDescription");

  const selectedFileBox =
    document.getElementById("selectedFile");

  const fileName =
    document.getElementById("fileName");

  const fileSize =
    document.getElementById("fileSize");

  const clearFileButton =
    document.getElementById("clearFileButton");

  const uploadPassword =
    document.getElementById("uploadPassword");

  const toggleUploadPassword =
    document.getElementById("toggleUploadPassword");

  const uploadButton =
    document.getElementById("uploadButton");

  const uploadResult =
    document.getElementById("uploadResult");

  const progressArea =
    document.getElementById("progressArea");

  const progressText =
    document.getElementById("progressText");

  const progressPercent =
    document.getElementById("progressPercent");

  const progressValue =
    document.getElementById("progressValue");

  const fileList =
    document.getElementById("fileList");

  const fileCount =
    document.getElementById("fileCount");

  const reloadButton =
    document.getElementById("reloadButton");

  const searchInput =
    document.getElementById("searchInput");

  const searchClear =
    document.getElementById("searchClear");

  const pagination =
    document.getElementById("pagination");

  const passwordModal =
    document.getElementById("passwordModal");

  const passwordModalFileName =
    document.getElementById("passwordModalFileName");

  const filePasswordInput =
    document.getElementById("filePasswordInput");

  const passwordError =
    document.getElementById("passwordError");

  const verifyPasswordButton =
    document.getElementById("verifyPasswordButton");

  const deleteModal =
    document.getElementById("deleteModal");

  const deleteModalFileName =
    document.getElementById("deleteModalFileName");

  const deleteKeyInput =
    document.getElementById("deleteKeyInput");

  const deleteError =
    document.getElementById("deleteError");

  const confirmDeleteButton =
    document.getElementById("confirmDeleteButton");

  const urlModal =
    document.getElementById("urlModal");

  const urlInput =
    document.getElementById("urlInput");

  const copyUrlButton =
    document.getElementById("copyUrlButton");

  const toast =
    document.getElementById("toast");

  const toastIcon =
    document.getElementById("toastIcon");

  const toastMessage =
    document.getElementById("toastMessage");

  const loadingOverlay =
    document.getElementById("loadingOverlay");

  const loadingText =
    document.getElementById("loadingText");


  /* =======================================================
     Supabase初期化
  ======================================================= */

  function initializeSupabase() {

    if (
      typeof window.supabase === "undefined"
    ) {
      showFatalError(
        "Supabaseライブラリを読み込めませんでした。"
      );

      return false;
    }

    if (
      !SUPABASE_URL ||
      SUPABASE_URL.includes("YOUR-PROJECT-ID")
    ) {
      showFatalError(
        "script.js のSupabase URLを設定してください。"
      );

      return false;
    }

    if (
      !SUPABASE_ANON_KEY ||
      SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
    ) {
      showFatalError(
        "script.js のSupabaseキーを設定してください。"
      );

      return false;
    }

    try {

      supabaseClient =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );

      return true;

    } catch (error) {

      console.error(
        "Supabase initialization error:",
        error
      );

      showFatalError(
        "Supabaseの初期化に失敗しました。"
      );

      return false;
    }
  }


  /* =======================================================
     Fatal Error
  ======================================================= */

  function showFatalError(message) {

    hideLoading();

    if (fileList) {

      fileList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">!</div>
          <h3>エラーが発生しました</h3>
          <p>${escapeHtml(message)}</p>
        </div>
      `;
    }
  }


  /* =======================================================
     Utility
  ======================================================= */

  function escapeHtml(value) {

    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function formatFileSize(bytes) {

    const value = Number(bytes);

    if (!Number.isFinite(value)) {
      return "0 B";
    }

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    if (value < 1024 * 1024 * 1024) {
      return `${(
        value /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      value /
      (1024 * 1024 * 1024)
    ).toFixed(2)} GB`;
  }


  function formatDate(dateString) {

    if (!dateString) {
      return "";
    }

    const date =
      new Date(dateString);

    if (Number.isNaN(date.getTime())) {
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
      String(file.mime_type || "")
        .toLowerCase();

    const name =
      String(file.name || "")
        .toLowerCase();

    if (mime.startsWith("image/")) {
      return "🖼️";
    }

    if (mime.startsWith("video/")) {
      return "🎬";
    }

    if (mime.startsWith("audio/")) {
      return "🎵";
    }

    if (
      mime.includes("pdf") ||
      name.endsWith(".pdf")
    ) {
      return "📕";
    }

    if (
      mime.includes("zip") ||
      mime.includes("compressed") ||
      name.endsWith(".zip")
    ) {
      return "📦";
    }

    if (
      mime.includes("text") ||
      name.endsWith(".txt")
    ) {
      return "📄";
    }

    return "📁";
  }


  /* =======================================================
     Loading
  ======================================================= */

  function showLoading(text = "読み込み中...") {

    if (!loadingOverlay) {
      return;
    }

    if (loadingText) {
      loadingText.textContent = text;
    }

    loadingOverlay.classList.remove(
      "hidden"
    );
  }


  function hideLoading() {

    if (!loadingOverlay) {
      return;
    }

    loadingOverlay.classList.add(
      "hidden"
    );
  }


  /* =======================================================
     Toast
  ======================================================= */

  function showToast(
    message,
    type = "success"
  ) {

    if (!toast) {
      return;
    }

    clearTimeout(toastTimer);

    toastMessage.textContent =
      message;

    toastIcon.textContent =
      type === "error"
        ? "!"
        : "✓";

    toast.classList.remove(
      "hidden"
    );

    toastTimer =
      setTimeout(() => {

        toast.classList.add(
          "hidden"
        );

      }, 2800);
  }


  /* =======================================================
     ファイル選択
  ======================================================= */

  function handleSelectedFile(file) {

    if (!file) {
      clearSelectedFile();
      return;
    }

    selectedFile = file;

    fileName.textContent =
      file.name;

    fileSize.textContent =
      formatFileSize(file.size);

    selectedFileBox.classList.remove(
      "hidden"
    );

    dropZone.classList.add(
      "has-file"
    );

    dropIcon.textContent = "✓";

    dropTitle.textContent =
      "ファイルが選択されています";

    dropDescription.textContent =
      "別のファイルに変更する場合は「ファイルを選ぶ」を押してください";

    uploadButton.disabled = false;

    hideUploadResult();
  }


  function clearSelectedFile() {

    selectedFile = null;

    if (fileInput) {
      fileInput.value = "";
    }

    selectedFileBox.classList.add(
      "hidden"
    );

    dropZone.classList.remove(
      "has-file"
    );

    dropIcon.textContent = "↑";

    dropTitle.textContent =
      "ファイルを選択";

    dropDescription.textContent =
      "下のボタンからファイルを選択してください";

    uploadButton.disabled = true;
  }


  /*
   * ここがファイル選択のメイン。
   *
   * labelを使わず、
   * ボタン → input.click()
   *
   * にしているので、
   * 「押してもファイル選択画面が出ない」
   * という問題を避けやすくしています。
   */

  if (fileSelectButton) {

    fileSelectButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        if (fileInput) {
          fileInput.click();
        }

      }
    );
  }


  if (fileInput) {

    fileInput.addEventListener(
      "change",
      () => {

        const file =
          fileInput.files &&
          fileInput.files[0];

        if (!file) {
          return;
        }

        handleSelectedFile(file);

      }
    );
  }


  if (clearFileButton) {

    clearFileButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();
        event.stopPropagation();

        clearSelectedFile();

      }
    );
  }


  /* =======================================================
     ドラッグ＆ドロップ
  ======================================================= */

  if (dropZone) {

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
      (event) => {

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
      (event) => {

        event.preventDefault();

        dropZone.classList.remove(
          "dragover"
        );

        const files =
          event.dataTransfer &&
          event.dataTransfer.files;

        if (
          !files ||
          files.length === 0
        ) {
          return;
        }

        const file = files[0];

        try {

          const dataTransfer =
            new DataTransfer();

          dataTransfer.items.add(file);

          fileInput.files =
            dataTransfer.files;

        } catch (error) {

          console.warn(
            "input.filesへの設定に失敗:",
            error
          );
        }

        handleSelectedFile(file);

      }
    );
  }


  /* =======================================================
     パスワード表示切替
  ======================================================= */

  if (toggleUploadPassword) {

    toggleUploadPassword.addEventListener(
      "click",
      () => {

        if (
          uploadPassword.type ===
          "password"
        ) {

          uploadPassword.type =
            "text";

          toggleUploadPassword.textContent =
            "非表示";

        } else {

          uploadPassword.type =
            "password";

          toggleUploadPassword.textContent =
            "表示";
        }

      }
    );
  }


  /* =======================================================
     ランダム文字列
  ======================================================= */

  function randomString(length = 32) {

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
      "abcdefghijklmnopqrstuvwxyz" +
      "0123456789";

    let result = "";

    const array =
      new Uint32Array(length);

    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {

      result +=
        chars[
          array[i] % chars.length
        ];
    }

    return result;
  }


  /* =======================================================
     Base64
  ======================================================= */

  function bytesToBase64(bytes) {

    let binary = "";

    const chunkSize = 0x8000;

    for (
      let i = 0;
      i < bytes.length;
      i += chunkSize
    ) {

      const chunk =
        bytes.subarray(
          i,
          Math.min(
            i + chunkSize,
            bytes.length
          )
        );

      binary += String.fromCharCode(
        ...chunk
      );
    }

    return btoa(binary);
  }


  /* =======================================================
     Password Hash
  ======================================================= */

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

          salt,

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


  /* =======================================================
     Upload
  ======================================================= */

  async function uploadFile() {

    if (!selectedFile) {

      showToast(
        "先にファイルを選択してください。",
        "error"
      );

      return;
    }


    const password =
      uploadPassword.value;


    if (!password) {

      showToast(
        "パスワードを入力してください。",
        "error"
      );

      uploadPassword.focus();

      return;
    }


    if (password.length < 1) {

      showToast(
        "パスワードを入力してください。",
        "error"
      );

      return;
    }


    if (!supabaseClient) {

      showToast(
        "Supabaseが初期化されていません。",
        "error"
      );

      return;
    }


    uploadButton.disabled = true;

    clearUploadResult();

    progressArea.classList.remove(
      "hidden"
    );

    setProgress(
      5,
      "アップロードの準備中..."
    );


    try {

      /*
       * パスワード用ソルト
       */

      const passwordSaltBytes =
        new Uint8Array(16);

      crypto.getRandomValues(
        passwordSaltBytes
      );

      const passwordSalt =
        bytesToBase64(
          passwordSaltBytes
        );


      /*
       * パスワードハッシュ
       */

      setProgress(
        10,
        "パスワードを保護しています..."
      );

      const passwordHash =
        await hashPassword(
          password,
          passwordSalt
        );


      /*
       * 削除キー
       */

      const deleteKey =
        randomString(32);

      const deleteSaltBytes =
        new Uint8Array(16);

      crypto.getRandomValues(
        deleteSaltBytes
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
       * Storageパス
       */

      const safeName =
        selectedFile.name
          .replace(/[^\w.\-()\[\] ]/g, "_");

      const uniqueName =
        `${Date.now()}_${randomString(10)}_${safeName}`;

      const storagePath =
        uniqueName;


      /*
       * Storageへアップロード
       */

      setProgress(
        15,
        "ファイルをアップロードしています..."
      );


      const {
        error: storageError
      } =
        await supabaseClient
          .storage
          .from(STORAGE_BUCKET)
          .upload(
            storagePath,
            selectedFile,
            {
              cacheControl: "3600",
              upsert: false,

              contentType:
                selectedFile.type ||
                "application/octet-stream"
            }
          );


      if (storageError) {

        console.error(
          storageError
        );

        throw new Error(
          storageError.message ||
          "Storageへのアップロードに失敗しました。"
        );
      }


      setProgress(
        75,
        "ファイル情報を保存しています..."
      );


      /*
       * DBへ保存
       *
       * public_urlは
       * private bucketでもNULL不可なので
       * 空文字を入れます。
       */

      const insertData = {

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
      };


      const {
        data: insertedFile,
        error: dbError
      } =
        await supabaseClient
          .from("files")
          .insert(
            insertData
          )
          .select()
          .single();


      if (dbError) {

        console.error(
          dbError
        );


        /*
         * DB登録に失敗したら
         * Storageのファイルを
         * 可能な限り削除します。
         */

        try {

          await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .remove([
              storagePath
            ]);

        } catch (
          cleanupError
        ) {

          console.warn(
            cleanupError
          );
        }


        throw new Error(
          dbError.message ||
          "ファイル情報の保存に失敗しました。"
        );
      }


      setProgress(
        100,
        "アップロード完了！"
      );


      /*
       * 削除キーを一度だけ表示
       */

      showUploadSuccess(
        insertedFile,
        deleteKey
      );


      showToast(
        "ファイルをアップロードしました！"
      );


      /*
       * 入力をリセット
       */

      clearSelectedFile();

      uploadPassword.value = "";

      await loadFiles();


    } catch (error) {

      console.error(
        "Upload error:",
        error
      );


      showUploadResult(
        "error",
        error.message ||
        "アップロードに失敗しました。"
      );


      showToast(
        error.message ||
        "アップロードに失敗しました。",
        "error"
      );

    } finally {

      setTimeout(() => {

        progressArea.classList.add(
          "hidden"
        );

        setProgress(
          0,
          "アップロード中..."
        );

        uploadButton.disabled =
          !selectedFile;

      }, 1000);
    }
  }


  /* =======================================================
     Progress
  ======================================================= */

  function setProgress(
    percent,
    text
  ) {

    const safePercent =
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      );

    progressValue.style.width =
      `${safePercent}%`;

    progressPercent.textContent =
      `${Math.round(safePercent)}%`;

    progressText.textContent =
      text;
  }


  /* =======================================================
     Upload Result
  ======================================================= */

  function clearUploadResult() {

    uploadResult.className =
      "upload-result hidden";

    uploadResult.innerHTML = "";
  }


  function hideUploadResult() {

    clearUploadResult();
  }


  function showUploadResult(
    type,
    html
  ) {

    uploadResult.className =
      `upload-result ${type}`;

    uploadResult.innerHTML =
      html;
  }


  function showUploadSuccess(
    insertedFile,
    deleteKey
  ) {

    const safeKey =
      escapeHtml(deleteKey);

    const safeName =
      escapeHtml(
        insertedFile?.name ||
        selectedFile?.name ||
        "ファイル"
      );


    showUploadResult(
      "success",

      `
        <strong>
          ✓ アップロード完了
        </strong>

        <div style="margin-top:8px;">
          <b>${safeName}</b>
        </div>

        <div
          style="
            margin-top:10px;
            padding:10px;
            border-radius:9px;
            background:#fff8df;
            color:#84671f;
          "
        >
          <b>削除キー</b><br>
          <code
            style="
              word-break:break-all;
              font-size:12px;
            "
          >${safeKey}</code>

          <br><br>

          <span>
            ⚠ このキーはこの画面でしか表示しません。
            必要なら安全な場所に保存してください。
          </span>
        </div>
      `
    );
  }


  /* =======================================================
     File List
  ======================================================= */

  async function loadFiles() {

    if (!supabaseClient) {
      return;
    }


    showLoading(
      "ファイル一覧を読み込んでいます..."
    );


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("files")
          .select(
            `
              id,
              name,
              storage_path,
              size,
              mime_type,
              public_url,
              created_at,
              password_salt,
              password_hash,
              has_password,
              delete_salt,
              delete_hash
            `
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


      applySearch();


    } catch (error) {

      console.error(error);

      fileList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">!</div>
          <h3>読み込みに失敗しました</h3>
          <p>${escapeHtml(
            error.message ||
            "不明なエラー"
          )}</p>
        </div>
      `;

      fileCount.textContent =
        "0 件";

    } finally {

      hideLoading();
    }
  }


  /* =======================================================
     Search
  ======================================================= */

  function applySearch() {

    const query =
      String(
        searchInput.value || ""
      )
        .trim()
        .toLowerCase();


    if (!query) {

      filteredFiles =
        [...allFiles];

    } else {

      filteredFiles =
        allFiles.filter(
          (file) =>
            String(
              file.name || ""
            )
              .toLowerCase()
              .includes(query)
        );
    }


    currentPage = 1;

    updateSearchClear();

    renderFileList();

    renderPagination();
  }


  function updateSearchClear() {

    if (
      searchInput.value
    ) {

      searchClear.classList.remove(
        "hidden"
      );

    } else {

      searchClear.classList.add(
        "hidden"
      );
    }
  }


  /* =======================================================
     File List Render
  ======================================================= */

  function renderFileList() {

    fileCount.textContent =
      `${filteredFiles.length} 件`;


    if (
      filteredFiles.length === 0
    ) {

      fileList.innerHTML = `
        <div class="empty-state">

          <div class="empty-icon">
            ${allFiles.length === 0
              ? "📁"
              : "🔎"}
          </div>

          <h3>
            ${
              allFiles.length === 0
                ? "まだファイルがありません"
                : "ファイルが見つかりません"
            }
          </h3>

          <p>
            ${
              allFiles.length === 0
                ? "ファイルをアップロードするとここに表示されます。"
                : "検索条件を変更してみてください。"
            }
          </p>

        </div>
      `;

      return;
    }


    const start =
      (currentPage - 1) *
      FILES_PER_PAGE;

    const end =
      start +
      FILES_PER_PAGE;

    const pageFiles =
      filteredFiles.slice(
        start,
        end
      );


    fileList.innerHTML =
      pageFiles
        .map(
          (file) =>
            createFileItem(file)
        )
        .join("");


    attachFileActionEvents();
  }


  /* =======================================================
     File Item
  ======================================================= */

  function createFileItem(file) {

    const id =
      Number(file.id);

    const name =
      escapeHtml(
        file.name ||
        "名称未設定"
      );

    const size =
      formatFileSize(
        file.size
      );

    const date =
      escapeHtml(
        formatDate(
          file.created_at
        )
      );

    const icon =
      getFileIcon(file);

    const hasPassword =
      Boolean(
        file.password_hash &&
        file.password_salt
      );


    return `
      <div
        class="file-item"
        data-file-id="${id}"
      >

        <div class="file-item-icon">
          ${icon}
        </div>

        <div class="file-item-main">

          <span
            class="file-item-name"
            title="${name}"
          >
            ${name}
          </span>

          <div class="file-item-meta">

            <span>
              ${size}
            </span>

            <span>
              ${date}
            </span>

            ${
              hasPassword
                ? `
                  <span class="password-badge">
                    🔒 パスワード保護
                  </span>
                `
                : `
                  <span>
                    ⚠ 保護情報なし
                  </span>
                `
            }

          </div>

        </div>


        <div
          class="file-actions"
          data-actions-for="${id}"
        >

          ${
            hasPassword
              ? `
                <button
                  type="button"
                  class="file-action unlock"
                  data-action="unlock"
                  data-id="${id}"
                >
                  🔓
                  <span>解除</span>
                </button>

                <button
                  type="button"
                  class="file-action download"
                  data-action="download"
                  data-id="${id}"
                >
                  ⬇️
                  <span>ダウンロード</span>
                </button>

                <button
                  type="button"
                  class="file-action url"
                  data-action="url"
                  data-id="${id}"
                >
                  🔗
                  <span>URL</span>
                </button>
              `
              : `
                <button
                  type="button"
                  class="file-action download"
                  data-action="download"
                  data-id="${id}"
                >
                  ⬇️
                  <span>ダウンロード</span>
                </button>

                <button
                  type="button"
                  class="file-action url"
                  data-action="url"
                  data-id="${id}"
                >
                  🔗
                  <span>URL</span>
                </button>
              `
          }

          <button
            type="button"
            class="file-action delete"
            data-action="delete"
            data-id="${id}"
          >
            🗑️
            <span>削除</span>
          </button>

        </div>

      </div>
    `;
  }


  /* =======================================================
     Action Events
  ======================================================= */

  function attachFileActionEvents() {

    const buttons =
      fileList.querySelectorAll(
        "[data-action]"
      );


    buttons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const action =
              button.dataset.action;

            const id =
              Number(
                button.dataset.id
              );

            const file =
              allFiles.find(
                (item) =>
                  Number(item.id) === id
              );


            if (!file) {

              showToast(
                "ファイル情報が見つかりません。",
                "error"
              );

              return;
            }


            if (
              action === "unlock"
            ) {

              openPasswordModal(
                file
              );

              return;
            }


            if (
              action === "download"
            ) {

              await downloadFile(
                file
              );

              return;
            }


            if (
              action === "url"
            ) {

              await showFileUrl(
                file
              );

              return;
            }


            if (
              action === "delete"
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


  /* =======================================================
     Pagination
  ======================================================= */

  function renderPagination() {

    pagination.innerHTML = "";


    const totalPages =
      Math.ceil(
        filteredFiles.length /
        FILES_PER_PAGE
      );


    if (
      totalPages <= 1
    ) {
      return;
    }


    const prev =
      document.createElement(
        "button"
      );

    prev.className =
      "page-button";

    prev.textContent =
      "‹";

    prev.disabled =
      currentPage <= 1;

    prev.addEventListener(
      "click",
      () => {

        if (
          currentPage <= 1
        ) {
          return;
        }

        currentPage--;

        renderFileList();

        renderPagination();

        scrollToFiles();

      }
    );

    pagination.appendChild(
      prev
    );


    const maxButtons = 7;

    let startPage =
      Math.max(
        1,
        currentPage -
        Math.floor(
          maxButtons / 2
        )
      );

    let endPage =
      Math.min(
        totalPages,
        startPage +
        maxButtons -
        1
      );


    if (
      endPage -
      startPage +
      1 <
      maxButtons
    ) {

      startPage =
        Math.max(
          1,
          endPage -
          maxButtons +
          1
        );
    }


    for (
      let page = startPage;
      page <= endPage;
      page++
    ) {

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "page-button";

      if (
        page === currentPage
      ) {

        button.classList.add(
          "active"
        );
      }

      button.textContent =
        String(page);

      button.addEventListener(
        "click",
        () => {

          currentPage =
            page;

          renderFileList();

          renderPagination();

          scrollToFiles();

        }
      );

      pagination.appendChild(
        button
      );
    }


    const next =
      document.createElement(
        "button"
      );

    next.className =
      "page-button";

    next.textContent =
      "›";

    next.disabled =
      currentPage >= totalPages;

    next.addEventListener(
      "click",
      () => {

        if (
          currentPage >= totalPages
        ) {
          return;
        }

        currentPage++;

        renderFileList();

        renderPagination();

        scrollToFiles();

      }
    );

    pagination.appendChild(
      next
    );
  }


  function scrollToFiles() {

    const card =
      document.querySelector(
        ".files-card"
      );

    if (!card) {
      return;
    }

    card.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  /* =======================================================
     Password Modal
  ======================================================= */

  function openPasswordModal(file) {

    currentPasswordFile =
      file;

    passwordModalFileName.textContent =
      file.name ||
      "ファイル";

    filePasswordInput.value = "";

    passwordError.classList.add(
      "hidden"
    );

    passwordError.textContent =
      "";

    passwordModal.classList.remove(
      "hidden"
    );

    setTimeout(() => {

      filePasswordInput.focus();

    }, 50);
  }


  function closePasswordModal() {

    currentPasswordFile =
      null;

    passwordModal.classList.add(
      "hidden"
    );

    filePasswordInput.value = "";

    passwordError.classList.add(
      "hidden"
    );
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


  /* =======================================================
     Password Verify
  ======================================================= */

  async function verifyFilePassword() {

    if (
      !currentPasswordFile
    ) {
      return;
    }


    const password =
      filePasswordInput.value;


    if (!password) {

      showPasswordError(
        "パスワードを入力してください。"
      );

      return;
    }


    verifyPasswordButton.disabled =
      true;

    verifyPasswordButton.textContent =
      "確認中...";


    try {

      const result =
        await callEdgeFunction(
          {
            action: "url",

            fileId:
              currentPasswordFile.id,

            password
          }
        );


      if (
        !result ||
        !result.success
      ) {

        throw new Error(
          result?.error ||
          "パスワードの確認に失敗しました。"
        );
      }


      /*
       * このファイルについて
       * 認証済みとしてマーク。
       */

      markFileUnlocked(
        currentPasswordFile.id
      );


      closePasswordModal();

      showToast(
        "パスワードを確認しました！"
      );


    } catch (error) {

      console.error(
        "Password verification error:",
        error
      );

      showPasswordError(
        error.message ||
        "パスワードが違います。"
      );

    } finally {

      verifyPasswordButton.disabled =
        false;

      verifyPasswordButton.textContent =
        "🔓 ロックを解除";
    }
  }


  /*
   * sessionStorageを使用。
   *
   * ページを閉じれば基本的に
   * 認証状態も消えます。
   */

  function getUnlockedIds() {

    try {

      const raw =
        sessionStorage.getItem(
          "filebox_unlocked"
        );

      if (!raw) {
        return {};
      }

      return JSON.parse(raw);

    } catch {

      return {};
    }
  }


  function markFileUnlocked(id) {

    const unlocked =
      getUnlockedIds();

    unlocked[String(id)] =
      true;

    try {

      sessionStorage.setItem(
        "filebox_unlocked",
        JSON.stringify(
          unlocked
        )
      );

    } catch (error) {

      console.warn(
        "sessionStorage error:",
        error
      );
    }


    updateFileActionState(
      id
    );
  }


  function isFileUnlocked(id) {

    const unlocked =
      getUnlockedIds();

    return Boolean(
      unlocked[String(id)]
    );
  }


  function updateFileActionState(id) {

    const actions =
      fileList.querySelector(
        `[data-actions-for="${CSS.escape(String(id))}"]`
      );

    if (!actions) {
      return;
    }

    if (
      isFileUnlocked(id)
    ) {

      actions.classList.add(
        "unlocked"
      );

    } else {

      actions.classList.remove(
        "unlocked"
      );
    }
  }


  /* =======================================================
     Download
  ======================================================= */

  async function downloadFile(file) {

    /*
     * パスワード保護ファイルの場合、
     * 先に解除が必要。
     */

    if (
      file.password_hash &&
      file.password_salt &&
      !isFileUnlocked(file.id)
    ) {

      openPasswordModal(
        file
      );

      return;
    }


    showLoading(
      "ダウンロードURLを作成しています..."
    );


    try {

      const password =
        getTemporaryPasswordForFile(
          file.id
        );


      let result;


      /*
       * パスワード保護あり
       */

      if (
        file.password_hash &&
        file.password_salt
      ) {

        /*
         * フロント側には
         * パスワードそのものを
         * 保存していないので、
         * unlock時のsigned URLを
         * 再利用する方法ではなく、
         * sessionStorageに一時認証情報を
         * 保存する方式にはしていません。
         *
         * そのため、実際のダウンロード時は
         * 再度パスワードが必要になる場合があります。
         *
         * 下のgetStoredPassword()が
         * 空の場合はモーダルを開きます。
         */

        const storedPassword =
          getStoredPassword(
            file.id
          );

        if (!storedPassword) {

          hideLoading();

          openPasswordModal(
            file
          );

          return;
        }


        result =
          await callEdgeFunction(
            {
              action: "download",

              fileId:
                file.id,

              password:
                storedPassword
            }
          );

      } else {

        /*
         * パスワードなしの
         * 古いファイル向け。
         */

        result =
          await callEdgeFunction(
            {
              action: "download",

              fileId:
                file.id,

              password:
                "legacy"
            }
          );
      }


      if (
        !result?.success ||
        !result?.url
      ) {

        throw new Error(
          result?.error ||
          "ダウンロードURLを取得できませんでした。"
        );
      }


      await forceDownload(
        result.url,
        file.name
      );


      showToast(
        "ダウンロードを開始しました！"
      );


    } catch (error) {

      console.error(
        "Download error:",
        error
      );

      showToast(
        error.message ||
        "ダウンロードに失敗しました。",
        "error"
      );

    } finally {

      hideLoading();
    }
  }


  /*
   * 旧コード互換用。
   */

  function getTemporaryPasswordForFile() {
    return null;
  }


  /* =======================================================
     パスワード保存
  =======================================================

     パスワードそのものを保存すると
     セキュリティ上よくないため、
     今回は「解除済み」の状態と
     一時的な認証情報だけを扱います。

     実際にはブラウザにパスワードを
     永久保存しない構成です。
  ======================================================= */

  function getStoredPassword(id) {

    try {

      return sessionStorage.getItem(
        `filebox_password_${id}`
      );

    } catch {

      return null;
    }
  }


  function storeTemporaryPassword(
    id,
    password
  ) {

    try {

      sessionStorage.setItem(
        `filebox_password_${id}`,
        password
      );

    } catch (error) {

      console.warn(
        error
      );
    }
  }


  /* =======================================================
     パスワード確認処理を上書き
  ======================================================= */

  const originalVerify =
    verifyFilePassword;


  /*
   * unlock成功時に
   * 次回ダウンロードでも使えるように
   * sessionStorageへ一時保存。
   */

  async function verifyPasswordAndStore() {

    if (
      !currentPasswordFile
    ) {
      return;
    }


    const file =
      currentPasswordFile;

    const password =
      filePasswordInput.value;


    if (!password) {

      showPasswordError(
        "パスワードを入力してください。"
      );

      return;
    }


    verifyPasswordButton.disabled =
      true;

    verifyPasswordButton.textContent =
      "確認中...";


    try {

      const result =
        await callEdgeFunction(
          {
            action: "url",

            fileId:
              file.id,

            password
          }
        );


      if (
        !result?.success
      ) {

        throw new Error(
          result?.error ||
          "パスワードが違います。"
        );
      }


      /*
       * 5分程度で再入力が必要になる
       * signed URLを発行した後、
       * パスワード自体はsessionStorageに
       * 一時保存。
       *
       * ページを閉じると消えます。
       */

      storeTemporaryPassword(
        file.id,
        password
      );

      markFileUnlocked(
        file.id
      );


      closePasswordModal();

      showToast(
        "ロックを解除しました！"
      );


    } catch (error) {

      console.error(
        error
      );

      showPasswordError(
        error.message ||
        "パスワードが違います。"
      );

    } finally {

      verifyPasswordButton.disabled =
        false;

      verifyPasswordButton.textContent =
        "🔓 ロックを解除";
    }
  }


  /*
   * 上の関数を実際のボタンに接続
   */

  if (verifyPasswordButton) {

    verifyPasswordButton.onclick =
      verifyPasswordAndStore;
  }


  /* =======================================================
     Force Download
  ======================================================= */

  async function forceDownload(
    url,
    fileName
  ) {

    /*
     * fetch → Blob → download
     *
     * これによって画像などが
     * 新しいタブで開かれるだけになる
     * 問題を避けます。
     */

    const response =
      await fetch(
        url
      );


    if (!response.ok) {

      throw new Error(
        `ファイル取得に失敗しました (${response.status})`
      );
    }


    const blob =
      await response.blob();


    const blobUrl =
      URL.createObjectURL(
        blob
      );


    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      blobUrl;

    anchor.download =
      fileName ||
      "download";


    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();


    setTimeout(() => {

      URL.revokeObjectURL(
        blobUrl
      );

    }, 2000);
  }


  /* =======================================================
     URL
  ======================================================= */

  async function showFileUrl(file) {

    if (
      file.password_hash &&
      file.password_salt &&
      !isFileUnlocked(file.id)
    ) {

      openPasswordModal(
        file
      );

      return;
    }


    const storedPassword =
      getStoredPassword(
        file.id
      );


    if (
      file.password_hash &&
      file.password_salt &&
      !storedPassword
    ) {

      openPasswordModal(
        file
      );

      return;
    }


    showLoading(
      "URLを作成しています..."
    );


    try {

      const result =
        await callEdgeFunction(
          {
            action: "url",

            fileId:
              file.id,

            password:
              storedPassword ||
              "legacy"
          }
        );


      if (
        !result?.success ||
        !result?.url
      ) {

        throw new Error(
          result?.error ||
          "URLを取得できませんでした。"
        );
      }


      currentSignedUrl =
        result.url;


      urlInput.value =
        result.url;


      urlModal.classList.remove(
        "hidden"
      );


    } catch (error) {

      console.error(
        error
      );

      showToast(
        error.message ||
        "URL取得に失敗しました。",
        "error"
      );

    } finally {

      hideLoading();
    }
  }


  /* =======================================================
     Delete Modal
  ======================================================= */

  function openDeleteModal(file) {

    currentDeleteFile =
      file;

    deleteModalFileName.textContent =
      file.name ||
      "ファイル";

    deleteKeyInput.value = "";

    deleteError.classList.add(
      "hidden"
    );

    deleteError.textContent =
      "";

    deleteModal.classList.remove(
      "hidden"
    );


    setTimeout(() => {

      deleteKeyInput.focus();

    }, 50);
  }


  function closeDeleteModal() {

    currentDeleteFile =
      null;

    deleteModal.classList.add(
      "hidden"
    );

    deleteKeyInput.value = "";

    deleteError.classList.add(
      "hidden"
    );
  }


  /* =======================================================
     Delete
  ======================================================= */

  async function deleteFile() {

    if (
      !currentDeleteFile
    ) {
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


    confirmDeleteButton.disabled =
      true;

    confirmDeleteButton.textContent =
      "削除中...";


    try {

      const result =
        await callEdgeFunction(
          {
            action: "delete",

            fileId:
              currentDeleteFile.id,

            deleteKey
          }
        );


      if (
        !result?.success
      ) {

        throw new Error(
          result?.error ||
          "ファイルを削除できませんでした。"
        );
      }


      const deletedId =
        currentDeleteFile.id;


      closeDeleteModal();


      /*
       * 認証情報も削除
       */

      try {

        sessionStorage.removeItem(
          `filebox_password_${deletedId}`
        );

      } catch {}


      showToast(
        "ファイルを削除しました。"
      );


      await loadFiles();


    } catch (error) {

      console.error(
        "Delete error:",
        error
      );


      deleteError.textContent =
        error.message ||
        "削除に失敗しました。";

      deleteError.classList.remove(
        "hidden"
      );


    } finally {

      confirmDeleteButton.disabled =
        false;

      confirmDeleteButton.textContent =
        "🗑️ 削除する";
    }
  }


  /* =======================================================
     Edge Function
  ======================================================= */

  async function callEdgeFunction(
    body
  ) {

    const endpoint =
      `${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`;


    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_ANON_KEY,

            "Authorization":
              `Bearer ${SUPABASE_ANON_KEY}`
          },

          body:
            JSON.stringify(body)
        }
      );


    let data = null;


    try {

      data =
        await response.json();

    } catch {

      throw new Error(
        `サーバーから正常なJSONが返ってきませんでした (${response.status})`
      );
    }


    if (!response.ok) {

      throw new Error(
        data?.error ||
        `サーバーエラー (${response.status})`
      );
    }


    return data;
  }


  /* =======================================================
     Copy URL
  ======================================================= */

  async function copyUrl() {

    const value =
      urlInput.value;


    if (!value) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        value
      );


      copyUrlButton.textContent =
        "コピーしました！";


      showToast(
        "URLをコピーしました！"
      );


      setTimeout(() => {

        copyUrlButton.textContent =
          "コピー";

      }, 1600);


    } catch (error) {

      /*
       * Clipboard APIが使えない場合
       */

      urlInput.focus();

      urlInput.select();

      document.execCommand(
        "copy"
      );


      showToast(
        "URLをコピーしました！"
      );
    }
  }


  /* =======================================================
     Modal Close
  ======================================================= */

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.close;

            const modal =
              document.getElementById(
                id
              );

            if (modal) {

              modal.classList.add(
                "hidden"
              );
            }

          }
        );
      }
    );


  /*
   * 背景クリックでも閉じる
   */

  [
    passwordModal,
    deleteModal,
    urlModal
  ].forEach(
    (modal) => {

      if (!modal) {
        return;
      }

      const backdrop =
        modal.querySelector(
          ".modal-backdrop"
        );

      if (!backdrop) {
        return;
      }

      backdrop.addEventListener(
        "click",
        () => {

          modal.classList.add(
            "hidden"
          );

        }
      );
    }
  );


  /* =======================================================
     ESCでModalを閉じる
  ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      [
        passwordModal,
        deleteModal,
        urlModal
      ].forEach(
        (modal) => {

          if (modal) {

            modal.classList.add(
              "hidden"
            );
          }
        }
      );
    }
  );


  /* =======================================================
     Enter
  ======================================================= */

  if (filePasswordInput) {

    filePasswordInput.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          verifyPasswordAndStore();
        }

      }
    );
  }


  if (deleteKeyInput) {

    deleteKeyInput.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          deleteFile();
        }

      }
    );
  }


  /* =======================================================
     Search Event
  ======================================================= */

  if (searchInput) {

    let searchTimer = null;

    searchInput.addEventListener(
      "input",
      () => {

        clearTimeout(
          searchTimer
        );

        searchTimer =
          setTimeout(
            applySearch,
            120
          );

      }
    );
  }


  if (searchClear) {

    searchClear.addEventListener(
      "click",
      () => {

        searchInput.value = "";

        applySearch();

        searchInput.focus();

      }
    );
  }


  /* =======================================================
     Reload
  ======================================================= */

  if (reloadButton) {

    reloadButton.addEventListener(
      "click",
      async () => {

        await loadFiles();

        showToast(
          "一覧を更新しました。"
        );

      }
    );
  }


  /* =======================================================
     Upload Event
  ======================================================= */

  if (uploadButton) {

    uploadButton.addEventListener(
      "click",
      uploadFile
    );
  }


  /* =======================================================
     Delete Event
  ======================================================= */

  if (confirmDeleteButton) {

    confirmDeleteButton.addEventListener(
      "click",
      deleteFile
    );
  }


  /* =======================================================
     URL Copy
  ======================================================= */

  if (copyUrlButton) {

    copyUrlButton.addEventListener(
      "click",
      copyUrl
    );
  }


  /* =======================================================
     初期化
  ======================================================= */

  try {

    const initialized =
      initializeSupabase();


    if (!initialized) {
      return;
    }


    /*
     * 最初はアップロードボタンを
     * 無効化。
     */

    if (uploadButton) {

      uploadButton.disabled =
        true;
    }


    /*
     * ファイル一覧を取得
     */

    loadFiles();


  } catch (error) {

    console.error(
      "Application initialization error:",
      error
    );

    showFatalError(
      "ページの初期化中にエラーが発生しました。"
    );
  }

});

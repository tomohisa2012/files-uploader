/* ==================================================
   Supabase設定
================================================== */

// Supabase Dashboardから取得
const SUPABASE_URL = "https://jlmskpyaftbndqhfqvwq.supabase.co";

const SUPABASE_KEY = "sb_publishable_q3H9vNZW28PZVGHebbB72g_brELXdmZ";


/* ==================================================
   設定
================================================== */

const BUCKET_NAME = "files";

// 1ファイル最大サイズ
// 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;


/* ==================================================
   Supabase初期化
================================================== */

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* ==================================================
   DOM
================================================== */

const fileInput =
  document.getElementById("fileInput");

const dropArea =
  document.getElementById("dropArea");

const selectedFile =
  document.getElementById("selectedFile");

const selectedFileName =
  document.getElementById("selectedFileName");

const selectedFileSize =
  document.getElementById("selectedFileSize");

const uploadBtn =
  document.getElementById("uploadBtn");

const refreshBtn =
  document.getElementById("refreshBtn");

const fileList =
  document.getElementById("fileList");

const fileCount =
  document.getElementById("fileCount");

const loading =
  document.getElementById("loading");

const empty =
  document.getElementById("empty");

const searchInput =
  document.getElementById("searchInput");

const message =
  document.getElementById("message");

const progressContainer =
  document.getElementById("progressContainer");

const progressBar =
  document.getElementById("progressBar");

const progressText =
  document.getElementById("progressText");

const fileTemplate =
  document.getElementById("fileTemplate");


/* ==================================================
   状態
================================================== */

let selectedFileObject = null;

let allFiles = [];


/* ==================================================
   初期化
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadFiles();

  }
);


/* ==================================================
   ファイル選択
================================================== */

fileInput.addEventListener(
  "change",
  () => {

    if (!fileInput.files.length) {
      return;
    }

    selectFile(fileInput.files[0]);

  }
);


/* ==================================================
   ファイル選択処理
================================================== */

function selectFile(file) {

  if (!file) {
    return;
  }


  // サイズチェック

  if (file.size > MAX_FILE_SIZE) {

    showMessage(
      "ファイルサイズは100MB以下にしてください。",
      "error"
    );

    fileInput.value = "";

    return;
  }


  selectedFileObject = file;


  selectedFileName.textContent =
    file.name;

  selectedFileSize.textContent =
    formatBytes(file.size);


  selectedFile.classList.remove(
    "hidden"
  );

}


/* ==================================================
   ドラッグ&ドロップ
================================================== */

[
  "dragenter",
  "dragover"
].forEach(eventName => {

  dropArea.addEventListener(
    eventName,
    event => {

      event.preventDefault();

      dropArea.classList.add(
        "dragover"
      );

    }
  );

});


[
  "dragleave",
  "drop"
].forEach(eventName => {

  dropArea.addEventListener(
    eventName,
    event => {

      event.preventDefault();

      dropArea.classList.remove(
        "dragover"
      );

    }
  );

});


dropArea.addEventListener(
  "drop",
  event => {

    const files =
      event.dataTransfer.files;

    if (!files.length) {
      return;
    }

    selectFile(files[0]);

  }
);


/* ==================================================
   アップロード
================================================== */

uploadBtn.addEventListener(
  "click",
  uploadFile
);


async function uploadFile() {

  if (!selectedFileObject) {

    showMessage(
      "ファイルを選択してください。",
      "error"
    );

    return;
  }


  const file =
    selectedFileObject;


  // ボタン停止

  uploadBtn.disabled = true;

  uploadBtn.textContent =
    "アップロード中...";


  progressContainer.classList.remove(
    "hidden"
  );

  setProgress(5);


  try {

    /*
      同じファイル名でも衝突しないように
      ランダムIDを付ける
    */

    const randomId =
      crypto.randomUUID();


    const safeName =
      sanitizeFileName(file.name);


    const path =
      `${randomId}_${safeName}`;


    setProgress(20);


    /*
      Supabase Storageへアップロード

      upsert:false にして、
      既存ファイルを上書きしない
    */

    const {
      data,
      error
    } = await supabaseClient
      .storage
      .from(BUCKET_NAME)
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          contentType:
            file.type ||
            "application/octet-stream",
          upsert: false
        }
      );


    if (error) {

      console.error(error);

      throw error;

    }


    setProgress(75);


    /*
      公開URLを取得
    */

    const {
      data: publicData
    } =
      supabaseClient
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);


    const publicUrl =
      publicData.publicUrl;


    setProgress(90);


    /*
      ファイル情報をDatabaseへ保存
    */

    const {
      error: dbError
    } =
      await supabaseClient
        .from("files")
        .insert({

          name: file.name,

          storage_path: path,

          size: file.size,

          mime_type:
            file.type ||
            "application/octet-stream",

          public_url: publicUrl

        });


    if (dbError) {

      /*
        DB保存に失敗した場合、
        Storageに残ったファイルを削除
      */

      await supabaseClient
        .storage
        .from(BUCKET_NAME)
        .remove([path]);

      console.error(dbError);

      throw dbError;

    }


    setProgress(100);


    showMessage(
      "アップロードしました！",
      "success"
    );


    // リセット

    resetUpload();


    // 一覧更新

    await loadFiles();


  } catch (error) {

    console.error(
      "Upload error:",
      error
    );


    showMessage(
      getErrorMessage(error),
      "error"
    );


  } finally {

    uploadBtn.disabled = false;

    uploadBtn.textContent =
      "アップロード";


    setTimeout(() => {

      progressContainer.classList.add(
        "hidden"
      );

      setProgress(0);

    }, 800);

  }

}


/* ==================================================
   ファイル一覧取得
================================================== */

async function loadFiles() {

  loading.classList.remove(
    "hidden"
  );

  empty.classList.add(
    "hidden"
  );

  fileList.innerHTML = "";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("files")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    allFiles = data || [];


    renderFiles(allFiles);


  } catch (error) {

    console.error(
      "Load files error:",
      error
    );


    showMessage(
      getErrorMessage(error),
      "error"
    );

  } finally {

    loading.classList.add(
      "hidden"
    );

  }

}


/* ==================================================
   ファイル表示
================================================== */

function renderFiles(files) {

  fileList.innerHTML = "";


  fileCount.textContent =
    `${files.length}個のファイル`;


  if (!files.length) {

    empty.classList.remove(
      "hidden"
    );

    return;
  }


  empty.classList.add(
    "hidden"
  );


  files.forEach(file => {

    const element =
      fileTemplate.content
        .cloneNode(true);


    const fileName =
      element.querySelector(
        ".file-name"
      );

    const fileSize =
      element.querySelector(
        ".file-size"
      );

    const fileDate =
      element.querySelector(
        ".file-date"
      );

    const downloadBtn =
      element.querySelector(
        ".download-btn"
      );

    const copyBtn =
      element.querySelector(
        ".copy-btn"
      );


    fileName.textContent =
      file.name;


    fileSize.textContent =
      formatBytes(file.size);


    fileDate.textContent =
      formatDate(file.created_at);


    downloadBtn.href =
      file.public_url;


    downloadBtn.download =
      file.name;


    copyBtn.addEventListener(
      "click",
      async () => {

        await copyUrl(
          file.public_url,
          copyBtn
        );

      }
    );


    fileList.appendChild(
      element
    );

  });

}


/* ==================================================
   検索
================================================== */

searchInput.addEventListener(
  "input",
  () => {

    const keyword =
      searchInput.value
        .trim()
        .toLowerCase();


    if (!keyword) {

      renderFiles(allFiles);

      return;

    }


    const filtered =
      allFiles.filter(file =>

        file.name
          .toLowerCase()
          .includes(keyword)

      );


    renderFiles(filtered);

  }
);


/* ==================================================
   URLコピー
================================================== */

async function copyUrl(
  url,
  button
) {

  try {

    await navigator.clipboard.writeText(
      url
    );


    const original =
      button.textContent;


    button.textContent =
      "✓ コピーしました";


    setTimeout(() => {

      button.textContent =
        original;

    }, 1500);


  } catch (error) {

    console.error(error);


    showMessage(
      "URLのコピーに失敗しました。",
      "error"
    );

  }

}


/* ==================================================
   更新
================================================== */

refreshBtn.addEventListener(
  "click",
  async () => {

    refreshBtn.disabled = true;

    refreshBtn.textContent =
      "更新中...";


    await loadFiles();


    refreshBtn.disabled = false;

    refreshBtn.textContent =
      "↻ 更新";

  }
);


/* ==================================================
   アップロードリセット
================================================== */

function resetUpload() {

  selectedFileObject = null;

  fileInput.value = "";

  selectedFile.classList.add(
    "hidden"
  );

}


/* ==================================================
   進捗
================================================== */

function setProgress(value) {

  const safe =
    Math.max(
      0,
      Math.min(100, value)
    );


  progressBar.style.width =
    `${safe}%`;


  progressText.textContent =
    `${safe}%`;

}


/* ==================================================
   ファイル名安全化
================================================== */

function sanitizeFileName(
  fileName
) {

  return fileName
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    )
    .slice(
      0,
      180
    );

}


/* ==================================================
   ファイルサイズ
================================================== */

function formatBytes(
  bytes
) {

  if (
    bytes === 0 ||
    !bytes
  ) {
    return "0 B";
  }


  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB"
  ];


  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );


  const value =
    bytes /
    Math.pow(
      1024,
      index
    );


  return `${value.toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;

}


/* ==================================================
   日付
================================================== */

function formatDate(
  date
) {

  if (!date) {
    return "-";
  }


  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(
    new Date(date)
  );

}


/* ==================================================
   メッセージ
================================================== */

function showMessage(
  text,
  type = "info"
) {

  message.textContent =
    text;

  message.className =
    `message ${type}`;


  message.classList.remove(
    "hidden"
  );


  clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    setTimeout(() => {

      message.classList.add(
        "hidden"
      );

    }, 5000);

}


/* ==================================================
   エラー
================================================== */

function getErrorMessage(
  error
) {

  if (!error) {
    return "不明なエラーが発生しました。";
  }


  console.error(error);


  if (
    error.message
      ?.toLowerCase()
      .includes("duplicate")
  ) {

    return "同じファイルがすでに存在します。";

  }


  if (
    error.message
      ?.toLowerCase()
      .includes("payload")
  ) {

    return "ファイルサイズが大きすぎます。";

  }


  if (
    error.message
      ?.toLowerCase()
      .includes("row-level")
  ) {

    return "Supabaseの権限設定を確認してください。";

  }


  return (
    error.message ||
    "エラーが発生しました。"
  );

}
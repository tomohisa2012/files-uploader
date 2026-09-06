const SUPABASE_URL = "https://jlmskpyaftbndqhfqvwq.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_q3H9vNZW28PZVGHebbB72g_brELXdmZ";

const BUCKET_NAME = "files";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const FUNCTION_NAME = "file-access";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


const fileInput =
  document.getElementById("fileInput");

const dropZone =
  document.getElementById("dropZone");

const selectedFileBox =
  document.getElementById("selectedFile");

const selectedFileName =
  document.getElementById("selectedFileName");

const selectedFileSize =
  document.getElementById("selectedFileSize");

const uploadPassword =
  document.getElementById("uploadPassword");

const passwordArea =
  document.getElementById("passwordArea");

const uploadButton =
  document.getElementById("uploadButton");

const removeSelectedFile =
  document.getElementById("removeSelectedFile");

const progressArea =
  document.getElementById("progressArea");

const progressBar =
  document.getElementById("progressBar");

const progressText =
  document.getElementById("progressText");

const message =
  document.getElementById("message");

const fileList =
  document.getElementById("fileList");

const loading =
  document.getElementById("loading");

const empty =
  document.getElementById("empty");

const searchInput =
  document.getElementById("searchInput");

const fileCount =
  document.getElementById("fileCount");

const refreshButton =
  document.getElementById("refreshButton");


let selectedFile = null;
let allFiles = [];


document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadFiles();
  }
);


fileInput.addEventListener(
  "change",
  () => {
    if (fileInput.files.length > 0) {
      selectFile(fileInput.files[0]);
    }
  }
);


dropZone.addEventListener(
  "dragover",
  (event) => {
    event.preventDefault();

    dropZone.classList.add("dragover");
  }
);


dropZone.addEventListener(
  "dragleave",
  () => {
    dropZone.classList.remove("dragover");
  }
);


dropZone.addEventListener(
  "drop",
  (event) => {
    event.preventDefault();

    dropZone.classList.remove("dragover");

    const file =
      event.dataTransfer.files[0];

    if (file) {
      selectFile(file);
    }
  }
);


removeSelectedFile.addEventListener(
  "click",
  clearSelectedFile
);


uploadPassword.addEventListener(
  "input",
  updateUploadButton
);


uploadButton.addEventListener(
  "click",
  uploadSelectedFile
);


refreshButton.addEventListener(
  "click",
  loadFiles
);


searchInput.addEventListener(
  "input",
  () => {
    renderFiles(
      searchInput.value.trim().toLowerCase()
    );
  }
);


function selectFile(file) {

  if (file.size > MAX_FILE_SIZE) {

    showMessage(
      "ファイルサイズは100MB以下にしてください。",
      "error"
    );

    return;
  }

  selectedFile = file;

  selectedFileName.textContent =
    file.name;

  selectedFileSize.textContent =
    formatSize(file.size);

  selectedFileBox.classList.remove(
    "hidden"
  );

  passwordArea.classList.remove(
    "hidden"
  );

  updateUploadButton();

  hideMessage();
}


function clearSelectedFile() {

  selectedFile = null;

  fileInput.value = "";

  uploadPassword.value = "";

  selectedFileBox.classList.add(
    "hidden"
  );

  passwordArea.classList.add(
    "hidden"
  );

  updateUploadButton();
}


function updateUploadButton() {

  const valid =
    selectedFile &&
    uploadPassword.value.length >= 4;

  uploadButton.disabled = !valid;
}


async function uploadSelectedFile() {

  if (!selectedFile) {
    return;
  }

  const password =
    uploadPassword.value;

  if (password.length < 4) {

    showMessage(
      "パスワードは4文字以上にしてください。",
      "error"
    );

    return;
  }

  uploadButton.disabled = true;

  progressArea.classList.remove(
    "hidden"
  );

  setProgress(5);

  hideMessage();

  try {

    /*
      パスワード用のランダムなsalt
    */

    const saltBytes =
      crypto.getRandomValues(
        new Uint8Array(16)
      );

    const salt =
      bytesToBase64(saltBytes);


    setProgress(15);


    /*
      PBKDF2でパスワードをハッシュ化
    */

    const passwordHash =
      await hashPassword(
        password,
        salt
      );


    setProgress(25);


    /*
      Storage上のファイル名
    */

    const randomId =
      crypto.randomUUID();

    const safeName =
      sanitizeFileName(
        selectedFile.name
      );

    const storagePath =
      `${randomId}_${safeName}`;


    /*
      Storageへアップロード
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
      throw uploadError;
    }


    setProgress(70);


    /*
      Databaseへ保存
    */

    const {
      error: dbError
    } =
      await supabaseClient
        .from("files")
        .insert({
          name: selectedFile.name,
          storage_path: storagePath,
          size: selectedFile.size,
          mime_type:
            selectedFile.type ||
            "application/octet-stream",
          public_url: "",
          password_salt: salt,
          password_hash: passwordHash,
          has_password: true
        });


    if (dbError) {

      await supabaseClient
        .storage
        .from(BUCKET_NAME)
        .remove([
          storagePath
        ]);

      throw dbError;
    }


    setProgress(100);


    showMessage(
      "アップロードが完了しました！",
      "success"
    );


    clearSelectedFile();


    setTimeout(() => {
      progressArea.classList.add(
        "hidden"
      );

      setProgress(0);
    }, 1000);


    await loadFiles();

  } catch (error) {

    console.error(error);

    showMessage(
      getErrorMessage(error),
      "error"
    );

    progressArea.classList.add(
      "hidden"
    );

    setProgress(0);

  } finally {

    updateUploadButton();
  }
}


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
        .select(
          "id,name,size,mime_type,storage_path,created_at,has_password"
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


    allFiles = data || [];

    fileCount.textContent =
      allFiles.length;


    renderFiles(
      searchInput.value
        .trim()
        .toLowerCase()
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "ファイル一覧の読み込みに失敗しました。",
      "error"
    );

  } finally {

    loading.classList.add(
      "hidden"
    );
  }
}


function renderFiles(keyword = "") {

  fileList.innerHTML = "";


  const filtered =
    allFiles.filter(
      (file) =>
        file.name
          .toLowerCase()
          .includes(keyword)
    );


  if (filtered.length === 0) {

    empty.classList.remove(
      "hidden"
    );

    return;
  }


  empty.classList.add(
    "hidden"
  );


  filtered.forEach(
    (file) => {
      fileList.appendChild(
        createFileCard(file)
      );
    }
  );
}


function createFileCard(file) {

  const template =
    document.getElementById(
      "fileTemplate"
    );

  const card =
    template.content
      .firstElementChild
      .cloneNode(true);


  const fileName =
    card.querySelector(
      ".file-name"
    );

  const fileSize =
    card.querySelector(
      ".file-size"
    );

  const fileDate =
    card.querySelector(
      ".file-date"
    );

  const fileIcon =
    card.querySelector(
      ".file-icon"
    );

  const passwordInput =
    card.querySelector(
      ".file-password"
    );

  const authButton =
    card.querySelector(
      ".auth-button"
    );

  const authMessage =
    card.querySelector(
      ".auth-message"
    );

  const actions =
    card.querySelector(
      ".file-actions"
    );

  const downloadButton =
    card.querySelector(
      ".download-button"
    );

  const copyButton =
    card.querySelector(
      ".copy-button"
    );

  const deleteButton =
    card.querySelector(
      ".delete-button"
    );


  fileName.textContent =
    file.name;

  fileSize.textContent =
    formatSize(file.size);

  fileDate.textContent =
    formatDate(file.created_at);

  fileIcon.textContent =
    getFileIcon(
      file.mime_type,
      file.name
    );


  let verified = false;
  let signedUrl = null;
  let currentPassword = null;


  authButton.addEventListener(
    "click",
    async () => {

      const password =
        passwordInput.value;


      if (password.length < 4) {

        setAuthMessage(
          authMessage,
          "パスワードを入力してください。",
          "error"
        );

        return;
      }


      authButton.disabled = true;

      authButton.textContent =
        "確認中...";


      try {

        const result =
          await callFunction({
            action: "download",
            fileId: file.id,
            password
          });


        verified = true;

        currentPassword =
          password;

        signedUrl =
          result.url;


        actions.classList.remove(
          "hidden"
        );


        setAuthMessage(
          authMessage,
          "✓ 認証成功！ボタンが表示されました。",
          "success"
        );


        passwordInput.disabled =
          true;

        authButton.classList.add(
          "hidden"
        );


      } catch (error) {

        console.error(error);

        verified = false;

        signedUrl = null;

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


  downloadButton.addEventListener(
    "click",
    async () => {

      if (!verified) {
        return;
      }


      try {

        if (!signedUrl) {

          const result =
            await callFunction({
              action: "download",
              fileId: file.id,
              password: currentPassword
            });

          signedUrl =
            result.url;
        }


        /*
          直接URLを開くのではなく、
          fetch → Blob → download
          にすることで画像なども
          ダウンロードさせる
        */

        await downloadFile(
          signedUrl,
          file.name
        );

      } catch (error) {

        console.error(error);

        setAuthMessage(
          authMessage,
          "ダウンロードに失敗しました。",
          "error"
        );
      }
    }
  );


  copyButton.addEventListener(
    "click",
    async () => {

      if (!verified) {
        return;
      }


      try {

        const result =
          await callFunction({
            action: "url",
            fileId: file.id,
            password: currentPassword
          });


        signedUrl =
          result.url;


        await navigator.clipboard.writeText(
          signedUrl
        );


        setAuthMessage(
          authMessage,
          "✓ 期限付きダウンロードURLをコピーしました。",
          "success"
        );

      } catch (error) {

        console.error(error);

        setAuthMessage(
          authMessage,
          "URLのコピーに失敗しました。",
          "error"
        );
      }
    }
  );


  deleteButton.addEventListener(
    "click",
    async () => {

      if (!verified) {
        return;
      }


      const confirmed =
        confirm(
          `「${file.name}」を削除しますか？\n\nこの操作は元に戻せません。`
        );


      if (!confirmed) {
        return;
      }


      deleteButton.disabled =
        true;

      deleteButton.textContent =
        "削除中...";


      try {

        await callFunction({
          action: "delete",
          fileId: file.id,
          password: currentPassword
        });


        card.remove();


        allFiles =
          allFiles.filter(
            (item) =>
              item.id !== file.id
          );


        fileCount.textContent =
          allFiles.length;


        if (allFiles.length === 0) {
          empty.classList.remove(
            "hidden"
          );
        }

      } catch (error) {

        console.error(error);

        setAuthMessage(
          authMessage,
          error.message ||
            "削除に失敗しました。",
          "error"
        );

        deleteButton.disabled =
          false;

        deleteButton.textContent =
          "🗑️ 削除";
      }
    }
  );


  return card;
}


async function callFunction(body) {

  const url =
    `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;


  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "apikey":
            SUPABASE_KEY
        },

        body:
          JSON.stringify(body)
      }
    );


  let data;

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }


  if (!response.ok) {

    throw new Error(
      data.error ||
        "処理に失敗しました。"
    );
  }


  if (data.error) {

    throw new Error(
      data.error
    );
  }


  return data;
}


async function downloadFile(
  url,
  filename
) {

  const response =
    await fetch(url);


  if (!response.ok) {
    throw new Error(
      "ファイルを取得できませんでした。"
    );
  }


  const blob =
    await response.blob();


  const blobUrl =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href =
    blobUrl;

  link.download =
    filename;

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


function base64ToBytes(base64) {

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


function bytesToBase64(bytes) {

  let binary = "";


  for (const byte of bytes) {
    binary += String.fromCharCode(
      byte
    );
  }


  return btoa(binary);
}


function sanitizeFileName(name) {

  return name
    .replace(
      /[\\/:*?"<>|]/g,
      "_"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .slice(0, 180);
}


function formatSize(bytes) {

  if (!bytes) {
    return "0 B";
  }


  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];


  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );


  return (
    Math.round(
      (bytes /
        Math.pow(
          1024,
          index
        )) *
        10
    ) / 10
  ) +
    " " +
    units[index];
}


function formatDate(date) {

  return new Date(
    date
  ).toLocaleString(
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


function getFileIcon(
  mime,
  name
) {

  if (
    mime &&
    mime.startsWith("image/")
  ) {
    return "🖼️";
  }

  if (
    mime &&
    mime.startsWith("video/")
  ) {
    return "🎬";
  }

  if (
    mime &&
    mime.startsWith("audio/")
  ) {
    return "🎵";
  }

  if (
    mime === "application/pdf"
  ) {
    return "📕";
  }

  if (
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z")
  ) {
    return "🗜️";
  }

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md")
  ) {
    return "📝";
  }

  return "📄";
}


function setProgress(value) {

  progressBar.style.width =
    `${value}%`;

  progressText.textContent =
    `${value}%`;
}


function showMessage(
  text,
  type
) {

  message.textContent =
    text;

  message.className =
    `message ${type}`;
}


function hideMessage() {

  message.textContent = "";

  message.className =
    "message hidden";
}


function setAuthMessage(
  element,
  text,
  type
) {

  element.textContent =
    text;

  element.className =
    `auth-message ${type}`;
}


function getErrorMessage(error) {

  if (
    error?.message
  ) {
    return error.message;
  }

  return "エラーが発生しました。";
}

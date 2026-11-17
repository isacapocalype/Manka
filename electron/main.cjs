const { app, BrowserWindow, Menu, dialog, protocol, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const APP_SCHEME = 'manka';
const APP_HOST = 'app';
const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ICON_PATH = path.join(__dirname, '..', 'build', 'icon.png');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

app.setName('Manka');

if (process.env.MANKA_USER_DATA_DIR) {
  app.setPath('userData', path.resolve(process.env.MANKA_USER_DATA_DIR));
}

let mainWindow = null;

function resolveDistFile(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl).pathname);
  } catch {
    return null;
  }
  if (!pathname || pathname === '/') pathname = '/index.html';

  const candidate = path.resolve(DIST_DIR, `.${pathname}`);
  if (!candidate.startsWith(`${DIST_DIR}${path.sep}`) && candidate !== DIST_DIR) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

  // Aplikasi memakai hash router, tetapi fallback ini menjaga permintaan path
  // tanpa ekstensi tetap dilayani index.html.
  if (!path.extname(pathname)) return path.join(DIST_DIR, 'index.html');
  return null;
}

async function registerAppProtocol() {
  await protocol.handle(APP_SCHEME, async (request) => {
    const filePath = resolveDistFile(request.url);
    if (!filePath) {
      return new Response('Tidak ditemukan', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    try {
      const data = await fs.promises.readFile(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const headers = {
        'content-type': MIME_TYPES[extension] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      };
      if (extension === '.wasm') {
        headers['cross-origin-embedder-policy'] = 'require-corp';
        headers['cross-origin-opener-policy'] = 'same-origin';
      }
      return new Response(data, { status: 200, headers });
    } catch {
      return new Response('Gagal membaca file', {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  });
}

function uniqueDownloadPath(directory, fileName) {
  const parsed = path.parse(fileName || 'manka-file');
  let candidate = path.join(directory, `${parsed.name}${parsed.ext}`);
  let counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(directory, `${parsed.name} (${counter})${parsed.ext}`);
    counter += 1;
  }
  return candidate;
}

function saveDialogFilters(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === '.manka') return [{ name: 'Backup Manka', extensions: ['manka'] }];
  if (extension === '.csv') return [{ name: 'CSV', extensions: ['csv'] }];
  if (extension === '.xlsx') return [{ name: 'Excel', extensions: ['xlsx'] }];
  if (extension === '.pdf') return [{ name: 'PDF', extensions: ['pdf'] }];
  return [];
}

function configureDownloads() {
  session.defaultSession.on('will-download', (_event, item) => {
    const fileName = item.getFilename() || 'manka-file';
    const testDirectory = process.env.MANKA_DOWNLOAD_DIR;
    let targetPath;

    if (testDirectory) {
      const directory = path.resolve(testDirectory);
      fs.mkdirSync(directory, { recursive: true });
      targetPath = uniqueDownloadPath(directory, fileName);
    } else {
      const result = dialog.showSaveDialogSync({
        title: 'Simpan file',
        defaultPath: path.join(app.getPath('downloads'), fileName),
        filters: saveDialogFilters(fileName),
      });
      if (!result) {
        item.cancel();
        return;
      }
      targetPath = result;
    }

    item.setSavePath(targetPath);
  });
}

function createMenu() {
  const template = [
    {
      label: 'Manka',
      submenu: [
        { role: 'about', label: 'Tentang Manka' },
        { type: 'separator' },
        {
          label: 'Pengaturan',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (!mainWindow) return;
            mainWindow.webContents.executeJavaScript(
              "window.location.hash = '#/settings';",
            );
            mainWindow.show();
            mainWindow.focus();
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Keluar' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Urungkan' },
        { role: 'redo', label: 'Ulangi' },
        { type: 'separator' },
        { role: 'cut', label: 'Potong' },
        { role: 'copy', label: 'Salin' },
        { role: 'paste', label: 'Tempel' },
        { role: 'selectAll', label: 'Pilih semua' },
      ],
    },
    {
      label: 'Tampilan',
      submenu: [
        { role: 'reload', label: 'Muat ulang' },
        { role: 'toggleDevTools', label: 'Alat pengembang' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Perbesar' },
        { role: 'zoomOut', label: 'Perkecil' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Layar penuh' },
      ],
    },
    {
      label: 'Jendela',
      submenu: [
        { role: 'minimize', label: 'Perkecil' },
        { role: 'close', label: 'Tutup jendela' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'Manka',
    backgroundColor: '#F6F8FC',
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${APP_ORIGIN}/`)) event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  void mainWindow.loadURL(`${APP_ORIGIN}/index.html`);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    await registerAppProtocol();
    configureDownloads();
    createMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}

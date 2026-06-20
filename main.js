const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f3f4f6',
      symbolColor: '#4b5563',
      height: 36
    },
    backgroundColor: '#f3f4f6',
    show: false
  });

  const isDev = process.argv.includes('--dev');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ─── IPC: API calls ──────────────────────────────────────────────────────────

function makeRequest(method, urlStr, body) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch (e) {
      return reject(new Error('URL không hợp lệ: ' + urlStr));
    }

    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      },
      timeout: 120000
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout (120s). Phân tích repo lớn cần nhiều thời gian hơn.'));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// POST /api/analysis/analyze
ipcMain.handle('api:analyze', async (_event, { baseUrl, repositoryPath, outputDir }) => {
  try {
    const result = await makeRequest('POST', `${baseUrl}/api/analysis/analyze`, {
      repositoryPath,
      outputDir: outputDir || null
    });
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET /api/features
ipcMain.handle('api:getFeatures', async (_event, { baseUrl }) => {
  try {
    const result = await makeRequest('GET', `${baseUrl}/api/features`);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET /api/analysis-runs
ipcMain.handle('api:getAnalysisRuns', async (_event, { baseUrl }) => {
  try {
    const result = await makeRequest('GET', `${baseUrl}/api/analysis-runs`);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET /api/features/:id
ipcMain.handle('api:getFeatureById', async (_event, { baseUrl, id }) => {
  try {
    const result = await makeRequest('GET', `${baseUrl}/api/features/${id}`);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET /api/businesses/:id/codeflow
ipcMain.handle('api:getCodeFlow', async (_event, { baseUrl, id }) => {
  try {
    const result = await makeRequest('GET', `${baseUrl}/api/businesses/${id}/codeflow`);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET /api/businesses
ipcMain.handle('api:getBusinessFlows', async (_event, { baseUrl }) => {
  try {
    const result = await makeRequest('GET', `${baseUrl}/api/businesses`);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET /api/businesses/:id
ipcMain.handle('api:getBusinessFlowById', async (_event, { baseUrl, id }) => {
  try {
    const result = await makeRequest('GET', `${baseUrl}/api/businesses/${id}`);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// POST /api/QuestionGenerator/generate
ipcMain.handle('api:generateQuestions', async (_event, { baseUrl, businessFlowId, numberOfQuestions, difficulty, additionalContext, fewShotExampleIds }) => {
  try {
    const result = await makeRequest('POST', `${baseUrl}/api/QuestionGenerator/generate`, {
      businessId: businessFlowId,
      numberOfQuestions,
      difficulty,
      description: additionalContext || null,
      fewShotExampleIds: fewShotExampleIds || null
    });
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// GET /api/fewshot
ipcMain.handle('api:getFewShots', async (_event, { baseUrl }) => {
  try {
    const result = await makeRequest('GET', `${baseUrl}/api/fewshot`);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// POST /api/fewshot
ipcMain.handle('api:createFewShot', async (_event, { baseUrl, payload }) => {
  try {
    const result = await makeRequest('POST', `${baseUrl}/api/fewshot`, payload);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Select folder dialog
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Open external link
ipcMain.handle('shell:openExternal', async (_event, url) => {
  await shell.openExternal(url);
});

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// ─── IPC: Read file content for code viewer ──────────────────────────────────

ipcMain.handle('graph:readFile', async (_event, filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path.' };
    }
    // Safety: only allow reading text files with known source extensions
    const ALLOWED = new Set(['.js', '.ts', '.jsx', '.tsx', '.cs', '.json', '.md', '.html', '.css', '.py', '.java', '.go']);
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return { success: false, error: 'File type not allowed for preview.' };
    }
    const content = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    // Cap at 600 lines to avoid flooding the UI
    const lines = content.split('\n');
    const truncated = lines.length > 600;
    return {
      success: true,
      content: truncated ? lines.slice(0, 600).join('\n') + '\n\n// ... (truncated)' : content,
      lines: lines.length,
      truncated,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── IPC: Local Codebase Scanner ─────────────────────────────────────────────


/**
 * Recursively walk a directory and collect all source files.
 * @param {string} dir - Absolute directory path
 * @param {string} rootDir - Root to compute relative paths from
 * @param {string[]} exts - Allowed file extensions (e.g. ['.js', '.ts'])
 * @param {string[]} results - Accumulator array
 * @returns {string[]} Array of absolute file paths
 */
function walkDir(dir, rootDir, exts, results = []) {
  // Directories to skip — keeps graph focused on source files
  const SKIP_DIRS = new Set([
    'node_modules', '.git', '.svn', 'dist', 'build', 'out', '.next',
    '__pycache__', '.cache', 'coverage', '.nyc_output', 'vendor',
    '.turbo', '.expo', 'android', 'ios',
  ]);

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, rootDir, exts, results);
    } else if (entry.isFile() && exts.includes(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Parse a source file and extract all imported/required local module paths.
 * Handles: import … from, dynamic import(), require(), export … from
 * Only local paths (starting with . or /) are returned.
 * @param {string} content - Raw file content
 * @returns {string[]} Array of raw specifier strings (e.g. './utils', '../hooks/useAuth')
 */
function extractImports(content) {
  const specifiers = [];

  // Patterns to match (order matters — most specific first)
  const patterns = [
    // Static import:  import X from './path'  |  import './path'  |  import { X } from './path'
    /\bimport\s+(?:(?:[\w*{}\s,$]+)\s+from\s+)?['"]([^'"]+)['"]/g,
    // Dynamic import: import('./path')  |  import( './path' )
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Require:        require('./path')  |  require( './path' )
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Re-export:      export { X } from './path'  |  export * from './path'
    /\bexport\s+(?:[\w*{}\s,]+\s+)?from\s+['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      const spec = match[1];
      // Only keep local relative/absolute paths (skip package names & urls)
      if (spec && (spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/'))) {
        specifiers.push(spec);
      }
    }
  }

  return specifiers;
}

/**
 * Given a source file path and a raw import specifier, resolve the target file path.
 * Tries .js, .ts, .jsx, .tsx, /index.* extensions.
 * @param {string} sourceFile - Absolute path of the importing file
 * @param {string} specifier - Raw import specifier (e.g. './utils')
 * @param {string[]} exts - Allowed extensions
 * @returns {string|null} Absolute path of resolved file, or null if not found
 */
function resolveImport(sourceFile, specifier, exts) {
  const sourceDir = path.dirname(sourceFile);
  const baseResolved = path.resolve(sourceDir, specifier);

  // Candidates: exact path, then with each extension, then index file
  const candidates = [
    baseResolved,
    ...exts.map(e => baseResolved + e),
    ...exts.map(e => path.join(baseResolved, 'index' + e)),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // File doesn't exist, try next candidate
    }
  }
  return null;
}

/**
 * Return a deterministic color for a file based on its extension.
 */
function colorForExt(ext) {
  const map = {
    '.ts':  '#6366f1',   // indigo  — TypeScript
    '.tsx': '#8b5cf6',   // violet  — TypeScript React
    '.js':  '#06b6d4',   // cyan    — JavaScript
    '.jsx': '#f59e0b',   // amber   — JavaScript React
    '.cs':  '#10b981',   // emerald — C#
  };
  return map[ext] || '#94a3b8';
}

// ─── C# specific helpers ──────────────────────────────────────────────────────

/**
 * Extract the declared namespace of a C# file.
 * Supports both classic `namespace Foo.Bar { }` and file-scoped `namespace Foo.Bar;`
 * Returns the FIRST namespace found (most C# files declare one).
 * @param {string} content - Raw C# file content
 * @returns {string|null}
 */
function extractCSharpNamespace(content) {
  // File-scoped namespace (C# 10+):  namespace Foo.Bar;
  // Classic block namespace:          namespace Foo.Bar {
  const match = content.match(/^\s*namespace\s+([\w.]+)\s*[;{]/m);
  return match ? match[1].trim() : null;
}

/**
 * Extract all `using Namespace;` statements from a C# file.
 * Excludes `using static`, `using alias =`, and `using (...)` blocks.
 * @param {string} content - Raw C# file content
 * @returns {string[]} Array of namespace strings (e.g. ['System.IO', 'MyApp.Services'])
 */
function extractCSharpUsings(content) {
  const namespaces = [];
  // Match:  using Foo.Bar;  (NOT: using static X; NOT: using Y = X; NOT: using (...) { )
  const pattern = /^\s*using\s+(?!static\b)(?![\w]+\s*=)([\w.]+)\s*;/gm;
  let match;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(content)) !== null) {
    const ns = match[1].trim();
    // Skip System.* and Microsoft.* — these are BCL/framework, not project files
    if (!ns.startsWith('System') && !ns.startsWith('Microsoft') && !ns.startsWith('NUnit') && !ns.startsWith('Xunit')) {
      namespaces.push(ns);
    }
  }
  return namespaces;
}

/**
 * Main IPC handler: scan a local directory and return a Graphology-compatible
 * graph JSON { nodes, edges }.
 */
ipcMain.handle('graph:scanLocal', async (_event, folderPath) => {
  try {
    if (!folderPath || typeof folderPath !== 'string') {
      return { success: false, error: 'Đường dẫn thư mục không hợp lệ.' };
    }

    const EXTS = ['.js', '.ts', '.jsx', '.tsx', '.cs'];
    const JS_EXTS = ['.js', '.ts', '.jsx', '.tsx'];  // path-based resolution only for JS/TS
    const rootDir = path.resolve(folderPath);

    // ── Step 1: Walk the directory tree ──────────────────────────
    const allFiles = walkDir(rootDir, rootDir, EXTS);

    if (allFiles.length === 0) {
      return {
        success: true,
        nodes: [],
        edges: [],
        stats: { files: 0, edges: 0 },
      };
    }

    // Build a Set for O(1) membership checks
    const fileSet = new Set(allFiles);

    // ── Step 2a: C# namespace map (needed before edge building) ──
    // Map: namespace string → absolute file path
    // Used to resolve `using Foo.Bar;` → which .cs file declares `namespace Foo.Bar`
    const namespaceToFile = new Map();
    for (const sourceFile of allFiles) {
      if (path.extname(sourceFile).toLowerCase() !== '.cs') continue;
      let content;
      try { content = fs.readFileSync(sourceFile, 'utf8'); } catch { continue; }
      const ns = extractCSharpNamespace(content);
      if (ns) namespaceToFile.set(ns, sourceFile);
    }

    // ── Step 2b: Parse imports/usings for each file ───────────────
    // edgeSet prevents duplicate edges; inDegree tracks popularity for node sizing
    const edgeSet  = new Set();
    const edgeList = [];
    const inDegree = new Map();
    allFiles.forEach(f => inDegree.set(f, 0));

    for (const sourceFile of allFiles) {
      let content;
      try {
        content = fs.readFileSync(sourceFile, 'utf8');

      } catch {
        continue;
      }

      const ext = path.extname(sourceFile).toLowerCase();
      const isCS = ext === '.cs';

      const addEdge = (srcAbs, tgtAbs) => {
        if (!tgtAbs || !fileSet.has(tgtAbs) || tgtAbs === srcAbs) return;
        const srcRel = path.relative(rootDir, srcAbs).replace(/\\/g, '/');
        const tgtRel = path.relative(rootDir, tgtAbs).replace(/\\/g, '/');
        const key = `${srcRel}→${tgtRel}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edgeList.push({ source: srcRel, target: tgtRel });
          inDegree.set(tgtAbs, (inDegree.get(tgtAbs) || 0) + 1);
        }
      };

      if (isCS) {
        // ── C#: match `using Foo.Bar;` → namespace map ────────────
        const usedNamespaces = extractCSharpUsings(content);
        for (const ns of usedNamespaces) {
          // Exact match first
          const targetFile = namespaceToFile.get(ns);
          if (targetFile) { addEdge(sourceFile, targetFile); continue; }
          // Prefix match: `using Foo.Bar.Baz` might belong to file declaring `Foo.Bar`
          for (const [declaredNs, declaredFile] of namespaceToFile) {
            if (ns.startsWith(declaredNs + '.') || declaredNs.startsWith(ns + '.')) {
              addEdge(sourceFile, declaredFile);
            }
          }
        }
      } else {
        // ── JS/TS: path-based import resolution ───────────────────
        const specifiers = extractImports(content);
        for (const spec of specifiers) {
          const targetFile = resolveImport(sourceFile, spec, JS_EXTS);
          addEdge(sourceFile, targetFile);
        }
      }
    }

    // ── Step 3: Build nodes array ─────────────────────────────────
    const nodes = allFiles.map(absPath => {
      const relPath = path.relative(rootDir, absPath).replace(/\\/g, '/');
      const ext = path.extname(absPath).toLowerCase();
      const label = path.basename(absPath);
      const degree = inDegree.get(absPath) || 0;

      // Size: base 8, grows with in-degree (capped at 28)
      const size = Math.min(8 + degree * 3, 28);

      return {
        id: relPath,
        attributes: {
          label,
          size,
          color: colorForExt(ext),
          ext,
          // Initial random position — ForceAtlas2 will recompute
          x: Math.random() * 1000 - 500,
          y: Math.random() * 1000 - 500,
        },
      };
    });

    // ── Step 4: Build edges array ─────────────────────────────────
    const edges = edgeList.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      attributes: { size: 1.5 },
    }));

    return {
      success: true,
      nodes,
      edges,
      stats: { files: nodes.length, edges: edges.length },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});


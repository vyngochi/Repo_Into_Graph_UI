// Panel controls fix script — run with: node scripts/fix-app.js
const fs   = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'renderer', 'app.js');
const content = fs.readFileSync(appPath, 'utf8');
const lines   = content.split('\n');

// Keep everything up to (not including) line 985 (idx 984)
const keepLines = lines.slice(0, 984);

const panelCode = `
(function initPanelControls() {
  document.addEventListener('DOMContentLoaded', setup, { once: true });
  if (document.readyState !== 'loading') setup();

  function setup() {
    initFiletreePanel();
    initCodePanel();
    initNodeOverlayButtons();
  }

  // File Tree panel: toggle + horizontal resize
  function initFiletreePanel() {
    var panel     = document.getElementById('filetreePanel');
    var divider   = document.getElementById('filetreeDivider');
    var layout    = document.getElementById('graphLayout');
    var toggleBtn = document.getElementById('btnToggleFiletree');
    if (!panel || !divider || !layout) return;
    var savedWidth = 220;
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var collapsed = panel.classList.toggle('collapsed');
        if (!collapsed) { panel.style.width = savedWidth + 'px'; }
        else { savedWidth = panel.offsetWidth; panel.style.width = ''; }
        _sr();
      });
    }
    var dragging = false, sx = 0, sw = 0;
    divider.addEventListener('mousedown', function (e) {
      if (panel.classList.contains('collapsed')) return;
      dragging = true; sx = e.clientX; sw = panel.offsetWidth;
      divider.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var w = Math.max(160, Math.min(sw + e.clientX - sx, layout.offsetWidth * 0.45));
      panel.style.width = w + 'px';
    });
    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      divider.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      savedWidth = panel.offsetWidth;
      _sr();
    });
  }

  // Code panel: drag handle (vertical resize) + close button
  function initCodePanel() {
    var panel    = document.getElementById('codePanel');
    var handle   = document.getElementById('codePanelHandle');
    var main     = document.getElementById('graphMainArea');
    var closeBtn = document.getElementById('btnCloseCode');
    if (!panel || !handle) return;
    if (closeBtn) closeBtn.addEventListener('click', closeCodePanel);
    var dragging = false, sy = 0, sh = 0;
    handle.addEventListener('mousedown', function (e) {
      dragging = true; sy = e.clientY; sh = panel.offsetHeight;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var delta = sy - e.clientY;
      var maxH  = main ? main.offsetHeight * 0.85 : 700;
      panel.style.height = Math.max(100, Math.min(sh + delta, maxH)) + 'px';
    });
    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      _sr();
    });
  }

  // Node info overlay buttons
  function initNodeOverlayButtons() {
    var closeNio = document.getElementById('nioClose');
    if (closeNio) {
      closeNio.addEventListener('click', function () {
        var overlay = document.getElementById('nodeInfoOverlay');
        if (overlay) overlay.classList.add('hidden');
        if (window.sigmaEngine) window.sigmaEngine.clearHighlight();
        closeCodePanel();
      });
    }
    var viewCodeBtn = document.getElementById('btnViewCode');
    if (viewCodeBtn) {
      viewCodeBtn.addEventListener('click', function () {
        if (_codePanelCurrentPayload) openCodePanel();
      });
    }
  }

  function _sr() {
    setTimeout(function () {
      if (window.sigmaEngine && window.sigmaEngine.sigma) {
        window.sigmaEngine.sigma.refresh();
      }
    }, 280);
  }
})();
`;

var newContent = keepLines.join('\n') + panelCode;
fs.writeFileSync(appPath, newContent, 'utf8');
console.log('app.js fixed. Total lines:', newContent.split('\n').length);

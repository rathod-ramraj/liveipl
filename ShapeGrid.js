/**
 * ShapeGrid - Vanilla JS adapter (no bundler, no dependencies)
 * Exposes window.ShapeGridApp.init(containerElement, options) → { dispose }
 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    direction: 'diagonal',
    speed: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    squareSize: 40,
    hoverFillColor: 'rgba(255,77,109,0.35)',
    shape: 'square',
    hoverTrailAmount: 5,
    /* solid canvas base + tinted edge vignette (avoid harsh black on dark UI) */
    backgroundColor: '',
    vignetteEdge: 'rgba(8, 6, 14, 0.35)',
  };

  function init(container, userOpts) {
    var o = Object.assign({}, DEFAULTS, userOpts || {});

    var direction = o.direction;
    var speed = o.speed;
    var borderColor = o.borderColor;
    var squareSize = o.squareSize;
    var hoverFillColor = o.hoverFillColor;
    var shape = o.shape;
    var hoverTrailAmount = o.hoverTrailAmount;
    var backgroundColor = o.backgroundColor;
    var vignetteEdge = o.vignetteEdge;

    var isHex = shape === 'hexagon';
    var isTri = shape === 'triangle';
    var hexH = squareSize * 1.5;
    var hexV = squareSize * Math.sqrt(3);

    /* ── canvas setup ─────────────────────────────────── */
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;position:absolute;inset:0;pointer-events:none;';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var rafId = null;
    var disposed = false;
    var paused = false;
    var frozen = false;
    var speedMul = 1;

    var gridOffset = { x: 0, y: 0 };
    var hoveredSquare = null;
    var trailCells = [];
    var cellOpacities = new Map();

    function resize() {
      canvas.width = container.offsetWidth || 1;
      canvas.height = container.offsetHeight || 1;
    }
    window.addEventListener('resize', resize);
    resize();

    /* ── shape drawers ────────────────────────────────── */
    function drawHex(cx, cy, size) {
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = (Math.PI / 3) * i;
        var vx = cx + size * Math.cos(a);
        var vy = cy + size * Math.sin(a);
        if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
    }
    function drawCircle(cx, cy, size) {
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.closePath();
    }
    function drawTriangle(cx, cy, size, flip) {
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(cx, cy + size / 2);
        ctx.lineTo(cx + size / 2, cy - size / 2);
        ctx.lineTo(cx - size / 2, cy - size / 2);
      } else {
        ctx.moveTo(cx, cy - size / 2);
        ctx.lineTo(cx + size / 2, cy + size / 2);
        ctx.lineTo(cx - size / 2, cy + size / 2);
      }
      ctx.closePath();
    }

    /* ── grid renderer ────────────────────────────────── */
    function drawGrid() {
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (isHex) {
        var colShift = Math.floor(gridOffset.x / hexH);
        var ox = ((gridOffset.x % hexH) + hexH) % hexH;
        var oy = ((gridOffset.y % hexV) + hexV) % hexV;
        var cols = Math.ceil(canvas.width / hexH) + 3;
        var rows = Math.ceil(canvas.height / hexV) + 3;
        for (var c = -2; c < cols; c++) {
          for (var r = -2; r < rows; r++) {
            var cx = c * hexH + ox;
            var cy = r * hexV + ((c + colShift) % 2 !== 0 ? hexV / 2 : 0) + oy;
            var k = c + ',' + r;
            var al = cellOpacities.get(k);
            if (al) { ctx.globalAlpha = al; drawHex(cx, cy, squareSize); ctx.fillStyle = hoverFillColor; ctx.fill(); ctx.globalAlpha = 1; }
            drawHex(cx, cy, squareSize); ctx.strokeStyle = borderColor; ctx.stroke();
          }
        }
      } else if (isTri) {
        var hw = squareSize / 2;
        var colShift2 = Math.floor(gridOffset.x / hw);
        var rowShift = Math.floor(gridOffset.y / squareSize);
        var ox2 = ((gridOffset.x % hw) + hw) % hw;
        var oy2 = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        var cols2 = Math.ceil(canvas.width / hw) + 4;
        var rows2 = Math.ceil(canvas.height / squareSize) + 4;
        for (var c2 = -2; c2 < cols2; c2++) {
          for (var r2 = -2; r2 < rows2; r2++) {
            var cx2 = c2 * hw + ox2;
            var cy2 = r2 * squareSize + squareSize / 2 + oy2;
            var flip = ((c2 + colShift2 + r2 + rowShift) % 2 + 2) % 2 !== 0;
            var k2 = c2 + ',' + r2;
            var al2 = cellOpacities.get(k2);
            if (al2) { ctx.globalAlpha = al2; drawTriangle(cx2, cy2, squareSize, flip); ctx.fillStyle = hoverFillColor; ctx.fill(); ctx.globalAlpha = 1; }
            drawTriangle(cx2, cy2, squareSize, flip); ctx.strokeStyle = borderColor; ctx.stroke();
          }
        }
      } else if (shape === 'circle') {
        var ox3 = ((gridOffset.x % squareSize) + squareSize) % squareSize;
        var oy3 = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        var cols3 = Math.ceil(canvas.width / squareSize) + 3;
        var rows3 = Math.ceil(canvas.height / squareSize) + 3;
        for (var c3 = -2; c3 < cols3; c3++) {
          for (var r3 = -2; r3 < rows3; r3++) {
            var cx3 = c3 * squareSize + squareSize / 2 + ox3;
            var cy3 = r3 * squareSize + squareSize / 2 + oy3;
            var k3 = c3 + ',' + r3;
            var al3 = cellOpacities.get(k3);
            if (al3) { ctx.globalAlpha = al3; drawCircle(cx3, cy3, squareSize); ctx.fillStyle = hoverFillColor; ctx.fill(); ctx.globalAlpha = 1; }
            drawCircle(cx3, cy3, squareSize); ctx.strokeStyle = borderColor; ctx.stroke();
          }
        }
      } else {
        var ox4 = ((gridOffset.x % squareSize) + squareSize) % squareSize;
        var oy4 = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        var cols4 = Math.ceil(canvas.width / squareSize) + 3;
        var rows4 = Math.ceil(canvas.height / squareSize) + 3;
        for (var c4 = -2; c4 < cols4; c4++) {
          for (var r4 = -2; r4 < rows4; r4++) {
            var sx = c4 * squareSize + ox4;
            var sy = r4 * squareSize + oy4;
            var k4 = c4 + ',' + r4;
            var al4 = cellOpacities.get(k4);
            if (al4) { ctx.globalAlpha = al4; ctx.fillStyle = hoverFillColor; ctx.fillRect(sx, sy, squareSize, squareSize); ctx.globalAlpha = 1; }
            ctx.strokeStyle = borderColor; ctx.strokeRect(sx, sy, squareSize, squareSize);
          }
        }
      }

      /* radial vignette overlay */
      var grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2,
        Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2
      );
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.7, 'rgba(0,0,0,0)');
      grd.addColorStop(1, vignetteEdge);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /* ── animation offset ─────────────────────────────── */
    function updateOffset() {
      var sp = Math.max(speed * speedMul, 0.1);
      var wrapX = isHex ? hexH * 2 : squareSize;
      var wrapY = isHex ? hexV : isTri ? squareSize * 2 : squareSize;
      switch (direction) {
        case 'right': gridOffset.x = (gridOffset.x - sp + wrapX) % wrapX; break;
        case 'left': gridOffset.x = (gridOffset.x + sp + wrapX) % wrapX; break;
        case 'up': gridOffset.y = (gridOffset.y + sp + wrapY) % wrapY; break;
        case 'down': gridOffset.y = (gridOffset.y - sp + wrapY) % wrapY; break;
        case 'diagonal':
          gridOffset.x = (gridOffset.x - sp + wrapX) % wrapX;
          gridOffset.y = (gridOffset.y - sp + wrapY) % wrapY;
          break;
      }
    }

    /* ── hover / trail opacity ────────────────────────── */
    function updateOpacities() {
      var targets = new Map();
      if (hoveredSquare) targets.set(hoveredSquare.x + ',' + hoveredSquare.y, 1);
      if (hoverTrailAmount > 0) {
        for (var i = 0; i < trailCells.length; i++) {
          var t = trailCells[i];
          var k = t.x + ',' + t.y;
          if (!targets.has(k)) targets.set(k, (trailCells.length - i) / (trailCells.length + 1));
        }
      }
      for (var entry of targets) { if (!cellOpacities.has(entry[0])) cellOpacities.set(entry[0], 0); }
      for (var entry2 of cellOpacities) {
        var target = targets.get(entry2[0]) || 0;
        var next = entry2[1] + (target - entry2[1]) * 0.15;
        if (next < 0.005) cellOpacities.delete(entry2[0]);
        else cellOpacities.set(entry2[0], next);
      }
    }

    function frame() {
      if (disposed || paused || frozen) return;
      updateOffset();
      updateOpacities();
      drawGrid();
      rafId = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (disposed || paused || frozen) return;
      if (rafId != null) return;
      rafId = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    rafId = requestAnimationFrame(frame);

    /* ── mouse tracking ───────────────────────────────── */
    function getCell(mx, my) {
      if (isHex) {
        var colShift = Math.floor(gridOffset.x / hexH);
        var ox = ((gridOffset.x % hexH) + hexH) % hexH;
        var oy = ((gridOffset.y % hexV) + hexV) % hexV;
        var col = Math.round((mx - ox) / hexH);
        var rowOff = (col + colShift) % 2 !== 0 ? hexV / 2 : 0;
        var row = Math.round((my - oy - rowOff) / hexV);
        return { x: col, y: row };
      }
      if (isTri) {
        var hw = squareSize / 2;
        var ox2 = ((gridOffset.x % hw) + hw) % hw;
        var oy2 = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        return { x: Math.round((mx - ox2) / hw), y: Math.floor((my - oy2) / squareSize) };
      }
      if (shape === 'circle') {
        var ox3 = ((gridOffset.x % squareSize) + squareSize) % squareSize;
        var oy3 = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        return { x: Math.round((mx - ox3) / squareSize), y: Math.round((my - oy3) / squareSize) };
      }
      var ox4 = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      var oy4 = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      return { x: Math.floor((mx - ox4) / squareSize), y: Math.floor((my - oy4) / squareSize) };
    }

    function onMouseMove(e) {
      var rect = canvas.getBoundingClientRect();
      var cell = getCell(e.clientX - rect.left, e.clientY - rect.top);
      if (!hoveredSquare || hoveredSquare.x !== cell.x || hoveredSquare.y !== cell.y) {
        if (hoveredSquare && hoverTrailAmount > 0) {
          trailCells.unshift({ x: hoveredSquare.x, y: hoveredSquare.y });
          if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
        }
        hoveredSquare = cell;
      }
    }
    function onMouseLeave() {
      if (hoveredSquare && hoverTrailAmount > 0) {
        trailCells.unshift({ x: hoveredSquare.x, y: hoveredSquare.y });
        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
      }
      hoveredSquare = null;
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return {
      pause: function () {
        paused = true;
        stopLoop();
      },
      resume: function () {
        if (disposed || frozen) return;
        paused = false;
        startLoop();
      },
      freeze: function () {
        frozen = true;
        paused = true;
        stopLoop();
        drawGrid();
      },
      unfreeze: function () {
        frozen = false;
        paused = false;
        startLoop();
      },
      setSpeedMultiplier: function (m) {
        speedMul = typeof m === 'number' && m > 0 ? m : 1;
      },
      isRunning: function () {
        return rafId != null && !paused && !frozen;
      },
      dispose: function () {
        disposed = true;
        stopLoop();
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
    };
  }

  global.ShapeGridApp = { init: init };
})(window);

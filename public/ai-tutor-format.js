(function () {
  'use strict';

  /* =====================================================
     MIIMIID AI TUTOR: response formatter
     Turns the tutor's Markdown text into safe, clean HTML.
     All text is HTML-escaped first, so nothing the AI
     returns can inject markup or scripts.
     ===================================================== */

  var ITEM = /^(\s*)([-*+\u2022]|\d{1,3}[.)])\s+(.*)$/;
  var HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
  var HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
  var FENCE_OPEN = /^\s*```[\w+-]*\s*$/;
  var FENCE_CLOSE = /^\s*```\s*$/;
  var TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- inline: code, links, bold, italic ---------- */
  function inline(text) {
    var codes = [];
    var s = esc(text).replace(/`([^`\n]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });

    s = s.replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    s = s
      .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_\n]+?)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_([^_\s][^_\n]*?)_(?![_\w])/g, '$1<em>$2</em>')
      .replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');

    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return '<code>' + codes[+i] + '</code>';
    });
  }

  /* ---------- lists (nested, ordered + bullet) ---------- */
  function listHtml(items) {
    var pos = 0;

    function build(indent) {
      var first = items[pos];
      var tag = first.ordered ? 'ol' : 'ul';
      var start = first.ordered && first.num > 1 ? ' start="' + first.num + '"' : '';
      var html = '<' + tag + start + '>';

      while (pos < items.length) {
        var it = items[pos];
        if (it.indent < indent) break;
        pos++;
        var li = inline(it.text).replace(/\n/g, '<br>');
        if (pos < items.length && items[pos].indent > it.indent) {
          li += build(items[pos].indent);
        }
        html += '<li>' + li + '</li>';
      }
      return html + '</' + tag + '>';
    }

    var out = '';
    while (pos < items.length) out += build(items[pos].indent);
    return out;
  }

  function parseList(lines, i) {
    var items = [];
    while (i < lines.length) {
      var m = lines[i].match(ITEM);
      if (m) {
        var entry = {
          indent: m[1].replace(/\t/g, '    ').length,
          ordered: /\d/.test(m[2]),
          num: parseInt(m[2], 10),
          text: m[3]
        };
        // a different list type at the top level starts a new list
        if (items.length && entry.indent <= items[0].indent && entry.ordered !== items[0].ordered) break;
        items.push(entry);
        i++;
        continue;
      }
      if (/^\s*$/.test(lines[i])) {
        var j = i;
        while (j < lines.length && /^\s*$/.test(lines[j])) j++;
        if (j < lines.length && ITEM.test(lines[j])) {
          var nm = lines[j].match(ITEM);
          var sameType = /\d/.test(nm[2]) === items[0].ordered;
          if (nm[1].replace(/\t/g, '    ').length > items[0].indent || sameType) { i = j; continue; }
        }
        break;
      }
      if (items.length && /^\s{2,}\S/.test(lines[i]) && !FENCE_OPEN.test(lines[i])) {
        items[items.length - 1].text += '\n' + lines[i].trim();
        i++;
        continue;
      }
      break;
    }
    return { html: listHtml(items), next: i };
  }

  /* ---------- tables ---------- */
  function splitRow(line) {
    var t = line.trim();
    if (t.charAt(0) === '|') t = t.slice(1);
    if (t.charAt(t.length - 1) === '|') t = t.slice(0, -1);
    return t.split('|').map(function (c) { return c.trim(); });
  }

  function parseTable(lines, i) {
    var head = splitRow(lines[i]);
    var aligns = splitRow(lines[i + 1]).map(function (c) {
      var l = c.charAt(0) === ':';
      var r = c.charAt(c.length - 1) === ':';
      return l && r ? 'center' : r ? 'right' : l ? 'left' : '';
    });
    i += 2;

    var rows = [];
    while (i < lines.length && lines[i].indexOf('|') !== -1 && !/^\s*$/.test(lines[i])) {
      rows.push(splitRow(lines[i]));
      i++;
    }

    function cell(tag, text, idx) {
      var a = aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '';
      return '<' + tag + a + '>' + inline(text || '') + '</' + tag + '>';
    }

    var html = '<div class="mm-md-table-wrap"><table><thead><tr>' +
      head.map(function (c, k) { return cell('th', c, k); }).join('') +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr>' + head.map(function (_, k) { return cell('td', r[k], k); }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></div>';

    return { html: html, next: i };
  }

  /* ---------- blocks ---------- */
  function startsBlock(lines, i) {
    var line = lines[i];
    return FENCE_OPEN.test(line) ||
      HEADING.test(line) ||
      HR.test(line) ||
      ITEM.test(line) ||
      /^\s{0,3}>/.test(line) ||
      (line.indexOf('|') !== -1 && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]));
  }

  function toHtml(markdown) {
    var lines = String(markdown == null ? '' : markdown).replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { i++; continue; }

      if (FENCE_OPEN.test(line)) {
        var code = [];
        i++;
        while (i < lines.length && !FENCE_CLOSE.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push('<pre class="mm-md-pre"><code>' + esc(code.join('\n')) + '</code></pre>');
        continue;
      }

      var h = line.match(HEADING);
      if (h) {
        var level = Math.min(h[1].length + 1, 6);
        out.push('<h' + level + '>' + inline(h[2]) + '</h' + level + '>');
        i++;
        continue;
      }

      if (HR.test(line)) { out.push('<hr>'); i++; continue; }

      if (/^\s{0,3}>/.test(line)) {
        var quote = [];
        while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
          quote.push(lines[i].replace(/^\s{0,3}>\s?/, ''));
          i++;
        }
        out.push('<blockquote>' + toHtml(quote.join('\n')) + '</blockquote>');
        continue;
      }

      if (line.indexOf('|') !== -1 && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
        var t = parseTable(lines, i);
        out.push(t.html);
        i = t.next;
        continue;
      }

      if (ITEM.test(line)) {
        var l = parseList(lines, i);
        out.push(l.html);
        i = l.next;
        continue;
      }

      var para = [line.trim()];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !startsBlock(lines, i)) {
        para.push(lines[i].trim());
        i++;
      }
      out.push('<p>' + para.map(inline).join('<br>') + '</p>');
    }

    return out.join('');
  }

  function renderInto(el, content) {
    el.classList.add('mm-md');
    el.innerHTML = toHtml(content);
  }

  window.MiimiidTutorFormat = { render: renderInto, toHtml: toHtml };
})();

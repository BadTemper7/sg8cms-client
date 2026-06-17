// components/editor/DocumentEditor.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiList,
  FiChevronDown,
} from "react-icons/fi";
import {
  MdFormatColorText,
  MdFormatSize,
  MdTableChart,
  MdFormatListNumbered,
  MdAdd,
  MdRemoveCircleOutline,
  MdOutlineDeleteSweep,
  MdUndo,
  MdRedo,
  MdUpload,
  MdMerge,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

// ─── Microsoft-style Table Picker ────────────────────────────────────────────
const TablePicker = ({ onSelect, onClose }) => {
  const [hovered, setHovered] = useState({ rows: 0, cols: 0 });
  const MAX_ROWS = 8;
  const MAX_COLS = 10;
  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3"
      style={{ top: "calc(100% + 6px)", left: 0, minWidth: 220 }}
    >
      <p className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">
        {hovered.rows > 0 && hovered.cols > 0
          ? `${hovered.rows} × ${hovered.cols} Table`
          : "Insert Table"}
      </p>
      <div className="flex flex-col gap-0.5">
        {Array.from({ length: 8 }, (_, r) => (
          <div key={r} className="flex gap-0.5">
            {Array.from({ length: 10 }, (_, c) => {
              const isActive = r < hovered.rows && c < hovered.cols;
              return (
                <div
                  key={c}
                  onMouseEnter={() => setHovered({ rows: r + 1, cols: c + 1 })}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(r + 1, c + 1);
                    onClose();
                  }}
                  className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${
                    isActive
                      ? "bg-blue-100 border-blue-500"
                      : "bg-gray-50 border-gray-300 hover:border-blue-300"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Font Size Picker ─────────────────────────────────────────────────────────
const FontSizePicker = ({ fontSize, onSelect, onClose }) => {
  const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg py-1 w-24 overflow-y-auto"
      style={{ top: "calc(100% + 6px)", left: 0, maxHeight: 220 }}
    >
      {sizes.map((s) => (
        <button
          key={s}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(s);
            onClose();
          }}
          className={`w-full text-left px-3 py-1 text-sm hover:bg-blue-50 transition ${
            fontSize === s
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-700"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
};

// ─── Bullet List Style Picker ─────────────────────────────────────────────────
const BULLET_STYLES = [
  { label: "Disc", value: "disc", preview: "● Item" },
  { label: "Circle", value: "circle", preview: "○ Item" },
  { label: "Square", value: "square", preview: "■ Item" },
  { label: "None", value: "none", preview: "  Item" },
];

const UnorderedListPicker = ({ onSelect, onClose }) => (
  <div
    className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg py-1 min-w-[160px]"
    style={{ top: "calc(100% + 6px)", left: 0 }}
  >
    <p className="text-xs text-gray-400 px-3 pt-1 pb-1.5 uppercase tracking-wide font-semibold">
      Bullet style
    </p>
    {BULLET_STYLES.map((s) => (
      <button
        key={s.value}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelect(s.value);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex items-center gap-3 text-gray-700"
      >
        <span className="w-16 font-mono text-gray-500 text-xs">
          {s.preview}
        </span>
        <span>{s.label}</span>
      </button>
    ))}
  </div>
);

// ─── Ordered List Style Picker ────────────────────────────────────────────────
const ORDERED_STYLES = [
  { label: "Numbers", value: "decimal", preview: "1. 2. 3." },
  { label: "Letters (a b c)", value: "lower-alpha", preview: "a. b. c." },
  { label: "Letters (A B C)", value: "upper-alpha", preview: "A. B. C." },
  { label: "Roman (i ii iii)", value: "lower-roman", preview: "i. ii. iii." },
  { label: "Roman (I II III)", value: "upper-roman", preview: "I. II. III." },
];

const OrderedListPicker = ({ onSelect, onClose }) => (
  <div
    className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg py-1 min-w-[200px]"
    style={{ top: "calc(100% + 6px)", left: 0 }}
  >
    <p className="text-xs text-gray-400 px-3 pt-1 pb-1.5 uppercase tracking-wide font-semibold">
      List style
    </p>
    {ORDERED_STYLES.map((s) => (
      <button
        key={s.value}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelect(s.value);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex items-center gap-3 text-gray-700"
      >
        <span className="w-24 font-mono text-gray-500 text-xs">
          {s.preview}
        </span>
        <span>{s.label}</span>
      </button>
    ))}
  </div>
);

// ─── Table Context Menu (Updated with boundary detection) ───────────────────
const TableContextMenu = ({
  x,
  y,
  onDelete,
  onDeleteRow,
  onDeleteCol,
  onAddRow,
  onAddCol,
  onMergeCells,
  onSplitCell,
  onClose,
}) => {
  const menuRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      // Adjust horizontally if menu goes off screen
      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 10;
      }
      if (newX < 10) newX = 10;

      // Adjust vertically if menu goes off screen
      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 10;
      }
      if (newY < 10) newY = 10;

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] bg-white border border-gray-200 shadow-xl rounded-lg py-1 min-w-[220px] max-w-[280px]"
      style={{
        top: adjustedPosition.y,
        left: adjustedPosition.x,
        position: "fixed",
      }}
    >
      <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-100">
        Table Actions
      </div>
      <button
        onClick={() => {
          onAddRow();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
      >
        <MdAdd className="text-green-600 text-base" />
        <span>Add Row Below</span>
      </button>
      <button
        onClick={() => {
          onAddCol();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
      >
        <MdAdd className="text-green-600 text-base" />
        <span>Add Column Right</span>
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => {
          onDeleteRow();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 flex items-center gap-2 transition-colors"
      >
        <MdRemoveCircleOutline className="text-orange-500 text-base" />
        <span>Delete Current Row</span>
      </button>
      <button
        onClick={() => {
          onDeleteCol();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 flex items-center gap-2 transition-colors"
      >
        <MdRemoveCircleOutline className="text-orange-500 text-base" />
        <span>Delete Current Column</span>
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => {
          onMergeCells();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
      >
        <MdMerge className="text-blue-600 text-base" />
        <span>Merge Selected Cells</span>
      </button>
      <button
        onClick={() => {
          onSplitCell();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
      >
        <MdMerge className="text-blue-600 text-base transform rotate-90" />
        <span>Split Cell</span>
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
      >
        <MdOutlineDeleteSweep className="text-base" />
        <span>Delete Entire Table</span>
      </button>
    </div>
  );
};

// ─── Sanitise pasted HTML (no heading tags allowed) ─────────────────────────
const ALLOWED_TAGS = new Set([
  "b",
  "i",
  "u",
  "s",
  "em",
  "strong",
  "span",
  "p",
  "br",
  "div",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "blockquote",
  "pre",
  "code",
  "sub",
  "sup",
  "mark",
  "del",
  "ins",
  // No heading tags (h1, h2, h3, h4, h5, h6) - removed
]);

const DANGEROUS_ATTRS = /^on|^src$|^href$|^action$|^formaction$/i;

function sanitiseHtml(html) {
  const tpl = document.createElement("div");
  tpl.innerHTML = html;
  const walk = (node) => {
    const toRemove = [];
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
          const text = document.createTextNode(
            child.innerText || child.textContent || "",
          );
          child.parentNode.insertBefore(text, child);
          toRemove.push(child);
        } else {
          Array.from(child.attributes).forEach((attr) => {
            if (DANGEROUS_ATTRS.test(attr.name))
              child.removeAttribute(attr.name);
          });
          walk(child);
        }
      }
    });
    toRemove.forEach((n) => n.parentNode?.removeChild(n));
  };
  walk(tpl);
  return tpl.innerHTML;
}

// ─── Main Editor Component ───────────────────────────────────────────────────
const DocumentEditor = ({
  initialContent = "",
  onChange,
  onSave,
  readOnly = false,
  fontSize: externalFontSize,
  onFontSizeChange,
  showToolbar = true,
  customToolbarButtons,
  className = "",
  editorClassName = "",
}) => {
  const [content, setContent] = useState(initialContent);
  const [fontSize, setFontSize] = useState(externalFontSize || 12);
  const [fontColor, setFontColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState("left");
  const [showToolbarState, setShowToolbarState] = useState(showToolbar);

  // History
  const historyStack = useRef([]);
  const historyIdx = useRef(-1);
  const isUndoRedoing = useRef(false);
  const [historyUiPos, setHistoryUiPos] = useState({ idx: -1, len: 0 });

  // UI state
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showBulletPicker, setShowBulletPicker] = useState(false);
  const [showOrderedPicker, setShowOrderedPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    table: null,
    row: null,
    cell: null,
    colIndex: undefined,
  });

  const editorRef = useRef(null);
  const tableBtnRef = useRef(null);
  const fontSizeBtnRef = useRef(null);
  const bulletBtnRef = useRef(null);
  const orderedBtnRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const justOpenedContextMenu = useRef(false);

  // Update content when initialContent changes
  useEffect(() => {
    if (initialContent !== content && editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent);
    }
  }, [initialContent]);

  // Sync external fontSize
  useEffect(() => {
    if (externalFontSize && externalFontSize !== fontSize) {
      setFontSize(externalFontSize);
      if (editorRef.current) {
        editorRef.current.style.fontSize = `${externalFontSize}px`;
      }
    }
  }, [externalFontSize]);

  // Selection helpers
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0)
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (
      sel &&
      savedSelectionRef.current &&
      editorRef.current?.contains(savedSelectionRef.current.startContainer)
    ) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // History helpers
  const getCurrentHtml = useCallback(() => {
    return editorRef.current?.innerHTML || "";
  }, []);

  const pushHistory = useCallback(() => {
    if (isUndoRedoing.current) return;
    const currentHtml = getCurrentHtml();
    if (historyStack.current[historyIdx.current] === currentHtml) return;

    historyStack.current = historyStack.current.slice(
      0,
      historyIdx.current + 1,
    );
    historyStack.current.push(currentHtml);

    if (historyStack.current.length > 100) {
      historyStack.current.shift();
    } else {
      historyIdx.current = historyStack.current.length - 1;
    }

    setHistoryUiPos({
      idx: historyIdx.current,
      len: historyStack.current.length,
    });
  }, [getCurrentHtml]);

  const handleUndo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    isUndoRedoing.current = true;
    historyIdx.current -= 1;
    const html = historyStack.current[historyIdx.current];

    if (editorRef.current && html !== undefined) {
      const sel = window.getSelection();
      const range = sel?.rangeCount > 0 ? sel.getRangeAt(0) : null;
      editorRef.current.innerHTML = html;
      setContent(html);
      onChange?.(html);

      if (range && editorRef.current.contains(range.startContainer)) {
        try {
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {
          const newRange = document.createRange();
          newRange.selectNodeContents(editorRef.current);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }

    setHistoryUiPos({
      idx: historyIdx.current,
      len: historyStack.current.length,
    });
    isUndoRedoing.current = false;
  }, [onChange]);

  const handleRedo = useCallback(() => {
    if (historyIdx.current >= historyStack.current.length - 1) return;
    isUndoRedoing.current = true;
    historyIdx.current += 1;
    const html = historyStack.current[historyIdx.current];

    if (editorRef.current && html !== undefined) {
      editorRef.current.innerHTML = html;
      setContent(html);
      onChange?.(html);

      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    setHistoryUiPos({
      idx: historyIdx.current,
      len: historyStack.current.length,
    });
    isUndoRedoing.current = false;
  }, [onChange]);

  const commitToHistory = useCallback(() => pushHistory(), [pushHistory]);
  const canUndo = historyUiPos.idx > 0;
  const canRedo = historyUiPos.idx < historyUiPos.len - 1;

  // Close pickers
  useEffect(() => {
    const h = (e) => {
      if (tableBtnRef.current && !tableBtnRef.current.contains(e.target))
        setShowTablePicker(false);
      if (fontSizeBtnRef.current && !fontSizeBtnRef.current.contains(e.target))
        setShowFontSizePicker(false);
      if (bulletBtnRef.current && !bulletBtnRef.current.contains(e.target))
        setShowBulletPicker(false);
      if (orderedBtnRef.current && !orderedBtnRef.current.contains(e.target))
        setShowOrderedPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // execCommand
  const execCommand = useCallback(
    (command, value = null) => {
      if (readOnly) return;
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      updateFormatState();
      setTimeout(() => commitToHistory(), 10);
    },
    [commitToHistory, readOnly],
  );

  const updateFormatState = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    setIsUnderline(document.queryCommandState("underline"));
  };

  const applyFontSize = useCallback(
    (size) => {
      if (readOnly) return;
      setFontSize(size);
      onFontSizeChange?.(size);
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("fontSize", false, "7");
      editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
        el.removeAttribute("size");
        el.style.fontSize = `${size}px`;
      });
      setTimeout(() => commitToHistory(), 10);
    },
    [commitToHistory, readOnly, onFontSizeChange],
  );

  const handleColorChange = (e) => {
    setFontColor(e.target.value);
    execCommand("foreColor", e.target.value);
  };

  const handleAlignment = (align) => {
    setAlignment(align);
    execCommand(
      { left: "justifyLeft", center: "justifyCenter", right: "justifyRight" }[
        align
      ],
    );
  };

  const insertUnorderedList = useCallback(
    (styleType = "disc") => {
      if (readOnly) return;
      editorRef.current?.focus();
      document.execCommand("insertUnorderedList", false, null);
      const sel = window.getSelection();
      if (sel?.rangeCount > 0) {
        let node = sel.getRangeAt(0).startContainer;
        while (node && node !== editorRef.current) {
          if (node.tagName === "UL") {
            node.style.listStyleType = styleType;
            node.style.paddingLeft = "1.5rem";
            node.style.margin = "0.5rem 0";
            break;
          }
          node = node.parentElement;
        }
      }
      setTimeout(() => commitToHistory(), 10);
    },
    [commitToHistory, readOnly],
  );

  const insertOrderedList = useCallback(
    (styleType = "decimal") => {
      if (readOnly) return;
      editorRef.current?.focus();
      document.execCommand("insertOrderedList", false, null);
      const sel = window.getSelection();
      if (sel?.rangeCount > 0) {
        let node = sel.getRangeAt(0).startContainer;
        while (node && node !== editorRef.current) {
          if (node.tagName === "OL") {
            node.style.listStyleType = styleType;
            node.style.paddingLeft = "1.5rem";
            node.style.margin = "0.5rem 0";
            break;
          }
          node = node.parentElement;
        }
      }
      setTimeout(() => commitToHistory(), 10);
    },
    [commitToHistory, readOnly],
  );

  const handlePaste = useCallback(
    (e) => {
      if (readOnly) return;
      e.preventDefault();
      const htmlData = e.clipboardData.getData("text/html");
      const textData = e.clipboardData.getData("text/plain");
      if (htmlData) {
        const clean = sanitiseHtml(htmlData);
        document.execCommand("insertHTML", false, clean);
      } else {
        const escaped = textData
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>");
        document.execCommand("insertHTML", false, escaped);
      }
      setTimeout(() => commitToHistory(), 10);
    },
    [commitToHistory, readOnly],
  );

  // Table functions
  const findParentTable = (el) => {
    let cur = el;
    while (cur && cur !== editorRef.current) {
      if (cur.tagName === "TABLE") return cur;
      cur = cur.parentElement;
    }
    return null;
  };

  const findTableCell = (el) => {
    let cur = el;
    while (cur && cur !== editorRef.current) {
      if (cur.tagName === "TD" || cur.tagName === "TH") return cur;
      cur = cur.parentElement;
    }
    return null;
  };

  const findTableRow = (cell) => {
    let cur = cell;
    while (cur && cur !== editorRef.current) {
      if (cur.tagName === "TR") return cur;
      cur = cur.parentElement;
    }
    return null;
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
      table: null,
      row: null,
      cell: null,
      colIndex: undefined,
    });
  }, []);

  const handleTableContextMenu = useCallback(
    (e) => {
      const cell = findTableCell(e.target);
      if (cell && !readOnly) {
        e.preventDefault();
        e.stopPropagation();

        const table = findParentTable(cell);
        const row = findTableRow(cell);
        const colIndex = Array.from(row.children).indexOf(cell);

        closeContextMenu();

        // Get click position
        let x = e.clientX;
        let y = e.clientY;

        // Add offset
        const offsetX = 10;
        const offsetY = 10;
        x += offsetX;
        y += offsetY;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Estimate menu dimensions (will be adjusted after render)
        const estimatedMenuWidth = 240;
        const estimatedMenuHeight = 320;

        // Adjust if menu would go off screen horizontally
        if (x + estimatedMenuWidth > viewportWidth) {
          x = e.clientX - estimatedMenuWidth - offsetX;
        }

        // Adjust if menu would go off screen vertically
        if (y + estimatedMenuHeight > viewportHeight) {
          y = e.clientY - estimatedMenuHeight - offsetY;
        }

        // Ensure minimum boundaries
        x = Math.max(10, Math.min(x, viewportWidth - 20));
        y = Math.max(10, Math.min(y, viewportHeight - 20));

        setContextMenu({
          show: true,
          x,
          y,
          table,
          row,
          cell,
          colIndex,
        });
      } else {
        closeContextMenu();
      }
    },
    [closeContextMenu, readOnly, findTableCell, findParentTable, findTableRow],
  );

  const commitTableEdit = () => {
    closeContextMenu();
    editorRef.current?.focus();
    setTimeout(() => commitToHistory(), 10);
  };

  const deleteTable = () => {
    if (contextMenu.table) {
      contextMenu.table.remove();
      commitTableEdit();
    }
  };

  const deleteCurrentColumn = () => {
    if (!contextMenu.table || contextMenu.colIndex === undefined) return;
    const rows = contextMenu.table.querySelectorAll("tr");
    if (rows[0]?.children.length <= 1) {
      if (window.confirm("This is the last column. Delete the entire table?")) {
        deleteTable();
      }
      return;
    }
    rows.forEach((row) => {
      if (row.children[contextMenu.colIndex]) {
        row.children[contextMenu.colIndex].remove();
      }
    });
    commitTableEdit();
  };

  const deleteCurrentRow = () => {
    if (!contextMenu.row) return;
    const rows = contextMenu.table.querySelectorAll("tr");
    if (rows.length <= 1) {
      if (window.confirm("This is the last row. Delete the entire table?")) {
        deleteTable();
      }
      return;
    }
    contextMenu.row.remove();
    commitTableEdit();
  };

  const addRowBelow = () => {
    if (!contextMenu.table || !contextMenu.row) return;
    const colCount = contextMenu.row.children.length;
    const newRow = document.createElement("tr");
    const firstRow = contextMenu.table.querySelector("tr");
    const hasHeaders = firstRow && firstRow.querySelector("th") !== null;
    for (let i = 0; i < colCount; i++) {
      const cell = document.createElement(
        hasHeaders && contextMenu.row === firstRow ? "th" : "td",
      );
      cell.innerHTML = "&nbsp;";
      cell.style.cssText =
        "border:1px solid #cbd5e1;padding:8px 12px;min-width:80px;";
      if (hasHeaders && contextMenu.row === firstRow) {
        cell.style.background = "#f1f5f9";
        cell.style.fontWeight = "600";
      }
      newRow.appendChild(cell);
    }
    contextMenu.row.insertAdjacentElement("afterend", newRow);
    commitTableEdit();
  };

  const addColumnRight = () => {
    if (!contextMenu.table || contextMenu.colIndex === undefined) return;
    const rows = contextMenu.table.querySelectorAll("tr");
    rows.forEach((row, index) => {
      const isHeaderRow = index === 0 && row.querySelector("th") !== null;
      const cell = document.createElement(isHeaderRow ? "th" : "td");
      cell.innerHTML = "&nbsp;";
      cell.style.cssText = `border:1px solid #cbd5e1;padding:8px 12px;min-width:80px;${
        isHeaderRow ? "background:#f1f5f9;font-weight:600;" : ""
      }`;
      const refCell = row.children[contextMenu.colIndex + 1];
      if (refCell) {
        refCell.insertAdjacentElement("beforebegin", cell);
      } else {
        row.appendChild(cell);
      }
    });
    commitTableEdit();
  };

  const mergeSelectedCells = () => {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    let startCell = findTableCell(sel.getRangeAt(0).startContainer);
    let endCell = findTableCell(sel.getRangeAt(0).endContainer);
    if (!startCell || !endCell || startCell === endCell) return;

    const startRow = findTableRow(startCell);
    const endRow = findTableRow(endCell);
    const startCol = Array.from(startRow.children).indexOf(startCell);
    const endCol = Array.from(endRow.children).indexOf(endCell);
    const startRowIdx = Array.from(
      contextMenu.table.querySelectorAll("tr"),
    ).indexOf(startRow);
    const endRowIdx = Array.from(
      contextMenu.table.querySelectorAll("tr"),
    ).indexOf(endRow);
    const minRow = Math.min(startRowIdx, endRowIdx);
    const maxRow = Math.max(startRowIdx, endRowIdx);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;

    const targetCell =
      contextMenu.table.querySelectorAll("tr")[minRow].children[minCol];
    targetCell.setAttribute("colspan", colSpan);
    targetCell.setAttribute("rowspan", rowSpan);
    targetCell.style.textAlign = "center";
    targetCell.style.verticalAlign = "middle";

    const cellsToRemove = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = contextMenu.table.querySelectorAll("tr")[r];
      for (let c = r === minRow ? minCol + 1 : minCol; c <= maxCol; c++) {
        if (row.children[c]) cellsToRemove.push(row.children[c]);
      }
    }
    cellsToRemove.forEach((cell) => cell.remove());
    commitTableEdit();
  };

  const splitCell = () => {
    if (!contextMenu.cell) return;
    const colspan = parseInt(contextMenu.cell.getAttribute("colspan") || "1");
    const rowspan = parseInt(contextMenu.cell.getAttribute("rowspan") || "1");
    if (colspan === 1 && rowspan === 1) return;

    contextMenu.cell.removeAttribute("colspan");
    contextMenu.cell.removeAttribute("rowspan");
    const row = contextMenu.row;
    const cellIndex = Array.from(row.children).indexOf(contextMenu.cell);
    const allRows = Array.from(contextMenu.table.querySelectorAll("tr"));
    const currentRowIndex = allRows.indexOf(row);

    for (let r = 0; r < rowspan; r++) {
      const targetRow = allRows[currentRowIndex + r];
      if (targetRow) {
        for (let c = r === 0 ? 1 : 0; c < colspan; c++) {
          const newCell = document.createElement(contextMenu.cell.tagName);
          newCell.innerHTML = "&nbsp;";
          newCell.style.cssText = contextMenu.cell.style.cssText;
          const insertIndex = cellIndex + c;
          const refCell = targetRow.children[insertIndex];
          if (refCell) {
            refCell.insertAdjacentElement("beforebegin", newCell);
          } else {
            targetRow.appendChild(newCell);
          }
        }
      }
    }
    commitTableEdit();
  };

  const insertTable = (rows, cols) => {
    if (readOnly) return;
    if (!rows || !cols) return;

    const border = "1px solid #cbd5e1";
    const cellBase = `border:${border};padding:8px 12px;min-width:80px;`;
    const thStyle = `${cellBase}background:#f1f5f9;font-weight:600;text-align:left;`;

    let html =
      '<table style="border-collapse:collapse;width:100%;margin:12px 0;border:1px solid #cbd5e1;">';

    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          html += `<th style="${thStyle}">&nbsp;</th>`;
        } else {
          html += `<td style="${cellBase}">&nbsp;</td>`;
        }
      }
      html += "</tr>";
    }
    html += "</table>";

    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const table = editorRef.current?.querySelector("table:last-child");
      if (table) {
        range.setStartAfter(table);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    savedSelectionRef.current = null;
    setTimeout(() => commitToHistory(), 10);
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      if (readOnly) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
    },
    [handleUndo, handleRedo, readOnly, onSave],
  );

  // Initialize editor
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      editorRef.current.style.fontSize = `${fontSize}px`;
      historyStack.current = [initialContent];
      historyIdx.current = 0;
      setHistoryUiPos({ idx: 0, len: 1 });
    }
  }, []);

  // Bind editor events
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const onInput = () => {
      const newContent = editor.innerHTML;
      setContent(newContent);
      onChange?.(newContent);
      if (!isUndoRedoing.current) pushHistory();
    };

    const onMouseUp = () => updateFormatState();
    const onContextMenu = (e) => handleTableContextMenu(e);

    editor.addEventListener("paste", handlePaste);
    editor.addEventListener("keydown", handleKeyDown);
    editor.addEventListener("mouseup", onMouseUp);
    editor.addEventListener("input", onInput);
    editor.addEventListener("contextmenu", onContextMenu);

    return () => {
      editor.removeEventListener("paste", handlePaste);
      editor.removeEventListener("keydown", handleKeyDown);
      editor.removeEventListener("mouseup", onMouseUp);
      editor.removeEventListener("input", onInput);
      editor.removeEventListener("contextmenu", onContextMenu);
    };
  }, [
    handlePaste,
    handleKeyDown,
    pushHistory,
    handleTableContextMenu,
    onChange,
  ]);

  const ToolbarBtn = ({
    onClick,
    active,
    title,
    children,
    disabled = false,
  }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled && !readOnly) onClick();
      }}
      title={title}
      disabled={disabled || readOnly}
      className={`p-1.5 rounded text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? "bg-blue-100 text-blue-700 shadow-inner"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="w-px h-5 bg-gray-300 mx-0.5 self-center" />
  );

  const closeAllPickers = () => {
    setShowTablePicker(false);
    setShowFontSizePicker(false);
    setShowBulletPicker(false);
    setShowOrderedPicker(false);
  };

  const wordCount =
    editorRef.current?.innerText?.split(/\s+/).filter((w) => w.length > 0)
      .length || 0;
  const charCount = editorRef.current?.innerText?.length || 0;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {showToolbarState && !readOnly && (
        <div className="border-b border-gray-200 px-3 py-1.5 bg-gray-50 flex flex-wrap items-center gap-0.5 shrink-0">
          {/* Toolbar content remains the same */}
          <ToolbarBtn
            onClick={() => execCommand("bold")}
            active={isBold}
            title="Bold (Ctrl+B)"
          >
            <FiBold />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => execCommand("italic")}
            active={isItalic}
            title="Italic (Ctrl+I)"
          >
            <FiItalic />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => execCommand("underline")}
            active={isUnderline}
            title="Underline (Ctrl+U)"
          >
            <FiUnderline />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn
            onClick={() => handleAlignment("left")}
            active={alignment === "left"}
            title="Align Left"
          >
            <FiAlignLeft />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => handleAlignment("center")}
            active={alignment === "center"}
            title="Center"
          >
            <FiAlignCenter />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => handleAlignment("right")}
            active={alignment === "right"}
            title="Align Right"
          >
            <FiAlignRight />
          </ToolbarBtn>
          <Divider />
          <div className="relative flex items-center" ref={bulletBtnRef}>
            <ToolbarBtn
              onClick={() => {
                insertUnorderedList("disc");
                closeAllPickers();
              }}
              title="Bullet List"
            >
              <FiList />
            </ToolbarBtn>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowBulletPicker((p) => !p);
                setShowOrderedPicker(false);
                setShowTablePicker(false);
                setShowFontSizePicker(false);
              }}
              title="Bullet style options"
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
            >
              <FiChevronDown className="text-xs" />
            </button>
            {showBulletPicker && (
              <UnorderedListPicker
                onSelect={(s) => {
                  restoreSelection();
                  insertUnorderedList(s);
                }}
                onClose={() => setShowBulletPicker(false)}
              />
            )}
          </div>
          <div className="relative flex items-center" ref={orderedBtnRef}>
            <ToolbarBtn
              onClick={() => {
                insertOrderedList("decimal");
                closeAllPickers();
              }}
              title="Numbered List"
            >
              <MdFormatListNumbered className="text-base" />
            </ToolbarBtn>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowOrderedPicker((p) => !p);
                setShowBulletPicker(false);
                setShowTablePicker(false);
                setShowFontSizePicker(false);
              }}
              title="Numbered list style options"
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
            >
              <FiChevronDown className="text-xs" />
            </button>
            {showOrderedPicker && (
              <OrderedListPicker
                onSelect={(s) => {
                  restoreSelection();
                  insertOrderedList(s);
                }}
                onClose={() => setShowOrderedPicker(false)}
              />
            )}
          </div>
          <Divider />
          <div className="relative" ref={fontSizeBtnRef}>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowFontSizePicker((p) => !p);
                setShowTablePicker(false);
                setShowBulletPicker(false);
                setShowOrderedPicker(false);
              }}
              title="Font Size"
              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-200 transition font-medium min-w-[44px]"
            >
              <MdFormatSize className="text-base" /> {fontSize}
            </button>
            {showFontSizePicker && (
              <FontSizePicker
                fontSize={fontSize}
                onSelect={applyFontSize}
                onClose={() => setShowFontSizePicker(false)}
              />
            )}
          </div>
          <div className="relative flex items-center">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                document.getElementById("colorPicker-editor")?.click();
              }}
              title="Font Color"
              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 transition flex items-center gap-1"
            >
              <MdFormatColorText className="text-base" />
              <span
                className="w-3 h-1.5 rounded-sm inline-block"
                style={{ backgroundColor: fontColor }}
              />
            </button>
            <input
              type="color"
              id="colorPicker-editor"
              value={fontColor}
              onChange={handleColorChange}
              className="hidden"
            />
          </div>
          <Divider />
          <div className="relative" ref={tableBtnRef}>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setShowTablePicker((p) => !p);
                setShowFontSizePicker(false);
                setShowBulletPicker(false);
                setShowOrderedPicker(false);
              }}
              title="Insert Table"
              className="flex items-center gap-1 px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200 transition"
            >
              <MdTableChart className="text-base" />
              <span className="text-xs font-medium">Table</span>
            </button>
            {showTablePicker && (
              <TablePicker
                onSelect={insertTable}
                onClose={() => setShowTablePicker(false)}
              />
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 transition disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <MdUndo className="text-sm" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-200 transition disabled:opacity-30"
              title="Redo (Ctrl+Y)"
            >
              <MdRedo className="text-sm" />
            </button>
          </div>
          {customToolbarButtons}
          <div className="text-xs text-gray-400 ml-2 select-none">
            Tab = indent list · Right-click table to edit
          </div>
        </div>
      )}

      {/* Editor Area - Fixed scrolling */}
      <div className="flex-1 overflow-auto bg-white min-h-0">
        <div className="w-full mx-auto p-6">
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className={`outline-none focus:ring-0
            [&_table]:border-collapse [&_table]:w-full [&_table]:my-3
            [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:min-w-[80px]
            [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:font-semibold [&_th]:text-left [&_th]:min-w-[80px]
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
            [&_li]:my-0.5
            [&_ul_ul]:list-[circle] [&_ul_ul]:pl-6 [&_ul_ul]:my-1
            [&_ul_ul_ul]:list-[square] [&_ul_ul_ul]:pl-6 [&_ul_ul_ul]:my-1
            [&_ol_ol]:pl-6 [&_ol_ol]:my-1 ${editorClassName}`}
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: "'Segoe UI','Calibri','Georgia',serif",
              lineHeight: "1.7",
              color: readOnly ? "#4a5568" : "#1a1a1a",
              minHeight: "300px",
            }}
          />
        </div>
      </div>

      {/* Status Bar */}
      {!readOnly && (
        <div className="border-t border-gray-200 px-4 py-1.5 bg-gray-50 text-xs text-gray-500 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} characters</span>
          </div>
          <button
            onClick={() => setShowToolbarState((p) => !p)}
            className="px-2 py-0.5 hover:bg-gray-200 rounded transition text-gray-500"
          >
            {showToolbarState ? "Hide toolbar" : "Show toolbar"}
          </button>
        </div>
      )}

      {/* Table Context Menu */}
      {contextMenu.show && !readOnly && (
        <TableContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={deleteTable}
          onDeleteRow={deleteCurrentRow}
          onDeleteCol={deleteCurrentColumn}
          onAddRow={addRowBelow}
          onAddCol={addColumnRight}
          onMergeCells={mergeSelectedCells}
          onSplitCell={splitCell}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default DocumentEditor;

import fs from "node:fs"

const filePath = "src/index.css"
let css = fs.readFileSync(filePath, "utf8")

css = css.replace(
  "@keyframes spin { to { transform: rotate(360deg); } }\n@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }",
  "@keyframes spin { to { transform: rotate(360deg); } }\n@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }\n@keyframes modalIn {\n  from { opacity: 0; transform: translateY(10px) scale(0.985); }\n  to { opacity: 1; transform: translateY(0) scale(1); }\n}"
)

css = css.replace(
`/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeUp 0.2s ease;
}
.modal {
  background: white; border-radius: var(--radius-lg); width: 100%;
  max-width: 480px; box-shadow: var(--shadow-lg);
  animation: fadeUp 0.2s ease;
}
.modal-header {
  padding: 20px 24px; border-bottom: 1px solid var(--gray-200);
  display: flex; align-items: center; justify-content: space-between;
}
.modal-header h3 { font-size: 18px; font-weight: 600; color: var(--gray-900); }
.modal-body { padding: 24px; }
.modal-footer {
  padding: 16px 24px; border-top: 1px solid var(--gray-200);
  display: flex; justify-content: flex-end; gap: 10px;
}`,
`/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background:
    radial-gradient(circle at 10% 15%, rgba(212,193,156,0.18) 0%, rgba(212,193,156,0.06) 24%, transparent 56%),
    rgba(20, 9, 13, 0.52);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeUp 0.22s ease;
}
.modal {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: linear-gradient(180deg, #ffffff 0%, #fffdfb 100%);
  border: 1px solid rgba(98,17,50,0.14);
  border-radius: 12px;
  box-shadow:
    0 24px 52px rgba(20, 9, 13, 0.24),
    0 10px 18px rgba(20, 9, 13, 0.12);
  overflow: hidden;
  animation: modalIn 0.24s cubic-bezier(.22,.75,.2,1) both;
}
.modal-header {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(98,17,50,0.12);
  background: linear-gradient(180deg, rgba(98,17,50,0.06) 0%, rgba(98,17,50,0.02) 100%);
  display: flex; align-items: center; justify-content: space-between;
}
.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--guinda-dark);
  letter-spacing: -0.01em;
}
.modal-body {
  padding: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(250,250,250,0.9) 100%);
}
.modal-body .form-group:last-child { margin-bottom: 0; }
.modal-footer {
  padding: 14px 22px;
  border-top: 1px solid rgba(98,17,50,0.1);
  background: rgba(255,255,255,0.92);
  display: flex; justify-content: flex-end; gap: 10px;
}`
)

css = css.replace(
`  .modal {
    max-width: 96vw;
  }
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }`,
`  .modal {
    max-width: 100%;
    border-radius: 10px;
  }
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  .modal-header h3 {
    font-size: 18px;
  }
  .modal-footer {
    flex-wrap: wrap;
  }
  .modal-footer .btn {
    flex: 1 1 calc(50% - 6px);
  }`
)

fs.writeFileSync(filePath, css)
console.log("modal styles updated")

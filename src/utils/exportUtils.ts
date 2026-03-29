export async function gerarPdfDeElemento(elementId: string, nomeArquivo: string) {
  try {
    const el = document.getElementById(elementId);
    if (!el) { alert('Elemento não encontrado'); return; }
    window.print();
  } catch (e) {
    console.error('Erro ao gerar PDF:', e);
    alert('Erro ao gerar PDF. Tente usar Ctrl+P para imprimir.');
  }
}

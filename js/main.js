// ==========================================
// ELEMENTOS DOM
// ==========================================
const notepad = document.getElementById('notepad');
const formattedContent = document.getElementById('formattedContent');
const saveIndicator = document.getElementById('saveIndicator');

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let saveTimeout;
let noteContent = '';
let isUpdatingCursor = false;

// ==========================================
// FUNÇÕES DE FORMATAÇÃO
// ==========================================

/**
* Detecta e formata URLs em texto
* @param {string} text - Texto a ser processado
* @returns {string} - Texto com URLs formatadas como links
*/
function formatUrls(text) {
    // Detecta posição do cursor
    const cursorMarker = '«CURSOR»';
    const cursorIndex = text.indexOf(cursorMarker);

    // Regex para encontrar URLs
    const urlRegex = /(^|[\s\n])(https?:\/\/[^\s<>"'`]+|ftp:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+\.[a-z]{2,}[^\s<>"'`]*)/gi;

    return text.replace(urlRegex, (match, prefix, url, offset) => {
        let href = url;
        let displayUrl = url;

        if (url.toLowerCase().startsWith('www.')) {
            href = 'https://' + url;
        }

        // Verifica se o cursor está dentro desta URL
        const start = offset + prefix.length;
        const end = start + url.length;

        const cursorInside = cursorIndex >= start && cursorIndex <= end;

        if (cursorInside) {
            // Exibe como texto plano editável (mantém o cursor)
            return prefix + url;
        }

        // Caso normal (link fora do foco)
        return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer" data-url="${href}">${displayUrl}</a>`;
    });
}

/**
* Formata o texto aplicando os estilos disponíveis
* @param {string} text - Texto a ser formatado
* @returns {string} - Texto formatado em HTML
*/
function formatText(text) {
    // Escapa caracteres HTML para segurança
    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // ORDEM CORRIGIDA: Aplica formatações de texto ANTES das URLs
    
    // Linha divisória: --- (linha completa)
    text = text.replace(/^---$/gm, '<span class="divider"></span>');
    
    // Texto em negrito: *texto* - evita conflito com URLs
    text = text.replace(/\*([^*\n<]+)\*/g, '<span class="bold">$1</span>');
    
    // Texto em itálico: _texto_ - evita conflito com URLs que contém _
    // Regex mais específica para não pegar underscores em URLs
    text = text.replace(/(?<!https?:\/\/[^\s]*|www\.[^\s]*|[a-zA-Z0-9])_([^_\n<]+)_(?![a-zA-Z0-9])/g, '<span class="italic">$1</span>');
    
    // Lista não ordenada: - texto
    text = text.replace(/^-\s(.+)$/gm, '<span class="list-item">• $1</span>');
    
    // Formata URLs POR ÚLTIMO para não interferir nas outras formatações
    text = formatUrls(text);
    
    return text;
}

/**
* Atualiza o conteúdo formatado visível
*/
function updateFormattedContent() {
    const text = notepad.value;
    const cursorPos = notepad.selectionStart;

    // Usa marcador que não vai interferir nas regex de URL
    const CURSOR_MARKER = '«CURSOR»';

    // Insere o marcador no ponto do cursor
    const textWithMarker = text.slice(0, cursorPos) + CURSOR_MARKER + text.slice(cursorPos);

    // Formata o texto (URLs, negrito, etc.)
    let formatted = formatText(textWithMarker);

    // Substitui o marcador pelo cursor visual
    formatted = formatted.replace(CURSOR_MARKER, '<span id="cursor-fake"></span>');

    formattedContent.innerHTML = formatted;

    syncLayout();
}

// ==========================================
// SINCRONIZAÇÃO DE LAYOUT E ROLAGEM
// ==========================================

/**
* Sincroniza completamente o layout entre textarea e conteúdo formatado
*/
function syncLayout() {
    // Copia todas as propriedades de estilo relevantes do textarea
    const computedStyle = window.getComputedStyle(notepad);
    
    // Sincroniza dimensões exatas
    formattedContent.style.width = notepad.offsetWidth + 'px';
    formattedContent.style.height = notepad.offsetHeight + 'px';
    
    // Sincroniza padding interno
    formattedContent.style.paddingTop = computedStyle.paddingTop;
    formattedContent.style.paddingRight = computedStyle.paddingRight;
    formattedContent.style.paddingBottom = computedStyle.paddingBottom;
    formattedContent.style.paddingLeft = computedStyle.paddingLeft;
    
    // Sincroniza propriedades de texto
    formattedContent.style.fontSize = computedStyle.fontSize;
    formattedContent.style.fontFamily = computedStyle.fontFamily;
    formattedContent.style.lineHeight = computedStyle.lineHeight;
    formattedContent.style.letterSpacing = computedStyle.letterSpacing;
    formattedContent.style.wordSpacing = computedStyle.wordSpacing;
    
    // Sincroniza bordes se houver
    formattedContent.style.borderWidth = computedStyle.borderWidth;
    formattedContent.style.borderStyle = computedStyle.borderStyle;
    
    // Sincroniza posicionamento
    const rect = notepad.getBoundingClientRect();
    const parentRect = notepad.parentElement.getBoundingClientRect();
    
    formattedContent.style.position = 'absolute';
    formattedContent.style.left = (rect.left - parentRect.left) + 'px';
    formattedContent.style.top = (rect.top - parentRect.top) + 'px';
    
    // Sincroniza rolagem
    formattedContent.scrollTop = notepad.scrollTop;
    formattedContent.scrollLeft = notepad.scrollLeft;
}

/**
* Sincroniza apenas a rolagem entre o textarea e o conteúdo formatado
*/
function syncScroll() {
    formattedContent.scrollTop = notepad.scrollTop;
    formattedContent.scrollLeft = notepad.scrollLeft;
}

// ==========================================
// SISTEMA DE SALVAMENTO
// ==========================================

/**
* Carrega o conteúdo salvo (atualmente vazio)
*/
function loadContent() {
    const saved = noteContent || '';
    notepad.value = saved;
    updateFormattedContent();
}

/**
* Salva automaticamente o conteúdo
*/
function autoSave() {
    noteContent = notepad.value;
    
    // Mostra indicador de salvamento
    saveIndicator.classList.add('show');
    
    // Esconde indicador após 2 segundos
    setTimeout(() => {
        saveIndicator.classList.remove('show');
    }, 2000);
}

// ==========================================
// MANIPULAÇÃO DE LINHAS DIVISÓRIAS
// ==========================================

/**
* Detecta e processa entrada de três traços (---)
* @param {HTMLTextAreaElement} textarea - Elemento textarea
* @returns {boolean} - True se processou uma linha divisória
*/
function handleTripleDash(textarea) {
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;
    const textBefore = text.substring(0, cursorPosition);
    const textAfter = text.substring(cursorPosition);
    
    // Verifica se os últimos três caracteres digitados foram "---"
    if (textBefore.endsWith('---')) {
        // Encontra o início da linha atual
        let lineStart = cursorPosition - 3;
        while (lineStart > 0 && text[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        // Extrai o texto antes dos "---" na linha atual
        const textBeforeDash = text.substring(lineStart, cursorPosition - 3);
        const textBeforeCurrentLine = text.substring(0, lineStart);
        
        // Constrói o novo texto
        let newText = textBeforeCurrentLine;
        
        // Se há texto antes do "---" na linha atual, mantém ele
        if (textBeforeDash.trim()) {
            newText += textBeforeDash + '\n';
        }
        
        // Adiciona a linha divisória e pula para próxima linha
        newText += '---\n' + textAfter;
        
        textarea.value = newText;
        
        // Posiciona cursor na linha após a divisória
        const newCursorPosition = newText.length - textAfter.length;
        textarea.selectionStart = newCursorPosition;
        textarea.selectionEnd = newCursorPosition;
        
        updateFormattedContent();
        autoResize();
        
        return true;
    }
    return false;
}

// ==========================================
// REDIMENSIONAMENTO AUTOMÁTICO
// ==========================================

/**
* Ajusta automaticamente a altura do textarea
*/
function autoResize() {
    const minHeight = window.innerHeight - 100;
    notepad.style.height = 'auto';
    
    const height = Math.max(notepad.scrollHeight, minHeight) + 'px';
    notepad.style.height = height;
    
    // Sincroniza o layout após redimensionar
    syncLayout();
}

// ==========================================
// GERENCIAMENTO DE CLIQUES EM LINKS
// ==========================================

/**
* Gerencia cliques em links dentro do conteúdo formatado
*/
function handleLinkClicks(event) {
    // Se o clique foi em um link ou dentro de um link
    let linkElement = event.target;
    
    // Se clicou em um elemento dentro do link (como bold ou em), busca o link pai
    if (linkElement.tagName !== 'A') {
        linkElement = linkElement.closest('a');
    }
    
    if (linkElement && linkElement.tagName === 'A') {
        event.preventDefault();
        event.stopPropagation();
        
        const url = linkElement.getAttribute('href') || linkElement.getAttribute('data-url');
        
        if (url) {
            // Abre o link em uma nova aba
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        
        // Retorna o foco para o textarea
        setTimeout(() => {
            notepad.focus();
        }, 100);
        
        return false;
    }
}

/**
* Gerencia eventos de mouse para melhorar a UX dos links
*/
function handleMouseEvents(event) {
    // Encontra o link mais próximo
    let linkElement = event.target;
    if (linkElement.tagName !== 'A') {
        linkElement = linkElement.closest('a');
    }
    
    if (linkElement && linkElement.tagName === 'A') {
        // Muda o cursor para pointer quando sobre links
        formattedContent.style.cursor = 'pointer';
    } else {
        // Volta ao cursor normal
        formattedContent.style.cursor = 'default';
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Listener para cliques em links
formattedContent.addEventListener('click', handleLinkClicks);
formattedContent.addEventListener('mouseover', handleMouseEvents);
formattedContent.addEventListener('mouseout', (event) => {
    formattedContent.style.cursor = 'default';
});

// Listener para entrada de texto
notepad.addEventListener('input', (e) => {
    // Verifica entrada de traço para linha divisória
    if (e.inputType === 'insertText' && e.data === '-') {
        setTimeout(() => {
            if (handleTripleDash(notepad)) {
                return;
            }
            updateFormattedContent();
        }, 0);
    } else {
        updateFormattedContent();
    }

    notepad.addEventListener('keyup', () => {
        updateFormattedContent();
    });
    notepad.addEventListener('click', () => {
        updateFormattedContent();
    });
    
    // Debounce para salvamento automático
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(autoSave, 1000);
});

// Listener para sincronização de rolagem e layout
notepad.addEventListener('scroll', syncScroll);

// Listener para redimensionamento e sincronização
notepad.addEventListener('input', () => {
    autoResize();
    // Pequeno delay para garantir que o DOM foi atualizado
    setTimeout(syncLayout, 0);
});

window.addEventListener('resize', () => {
    autoResize();
    setTimeout(syncLayout, 0);
});

// ==========================================
// ATALHOS DE FORMATAÇÃO
// ==========================================

/**
* Aplica formatação de negrito ao texto selecionado
*/
function applyBold() {
    const start = notepad.selectionStart;
    const end = notepad.selectionEnd;
    const text = notepad.value;
    
    if (start === end) {
        // Nenhum texto selecionado, apenas adiciona marcadores
        const beforeText = text.substring(0, start);
        const afterText = text.substring(end);
        const formattedText = '**';
        
        notepad.value = beforeText + formattedText + afterText;
        
        // Posiciona cursor entre os asteriscos
        const newPosition = start + 1;
        notepad.selectionStart = newPosition;
        notepad.selectionEnd = newPosition;
    } else {
        // Texto selecionado - encontra o início e fim das linhas
        let lineStart = start;
        let lineEnd = end;
        
        // Vai para o início da primeira linha selecionada
        while (lineStart > 0 && text[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        // Vai para o final da última linha selecionada
        while (lineEnd < text.length && text[lineEnd] !== '\n') {
            lineEnd++;
        }
        
        // Extrai as linhas selecionadas
        const selectedLines = text.substring(lineStart, lineEnd);
        const lines = selectedLines.split('\n');
        
        // Aplica formatação em cada linha não vazia
        const formattedLines = lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return line; // Mantém linhas vazias
            
            // Se já está em negrito, remove a formatação
            if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*') && trimmedLine.length > 2) {
                return line.replace(/^\s*\*/, '').replace(/\*\s*$/, '');
            } else {
                // Aplica negrito preservando indentação
                return line.replace(/^(\s*)(.*)$/, '$1*$2*');
            }
        });
        
        const beforeText = text.substring(0, lineStart);
        const afterText = text.substring(lineEnd);
        const formattedText = formattedLines.join('\n');
        
        notepad.value = beforeText + formattedText + afterText;
        
        // Mantém a seleção nas linhas formatadas
        const newEnd = lineStart + formattedText.length;
        notepad.selectionStart = lineStart;
        notepad.selectionEnd = newEnd;
    }
    
    updateFormattedContent();
    autoResize();
    
    // Garante que o foco permaneça no textarea
    notepad.focus();
}

/**
* Aplica formatação de itálico ao texto selecionado
*/
function applyItalic() {
    const start = notepad.selectionStart;
    const end = notepad.selectionEnd;
    const text = notepad.value;
    
    if (start === end) {
        // Nenhum texto selecionado, apenas adiciona marcadores
        const beforeText = text.substring(0, start);
        const afterText = text.substring(end);
        const formattedText = '__';
        
        notepad.value = beforeText + formattedText + afterText;
        
        // Posiciona cursor entre os underscores
        const newPosition = start + 1;
        notepad.selectionStart = newPosition;
        notepad.selectionEnd = newPosition;
    } else {
        // Texto selecionado - encontra o início e fim das linhas
        let lineStart = start;
        let lineEnd = end;
        
        // Vai para o início da primeira linha selecionada
        while (lineStart > 0 && text[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        // Vai para o final da última linha selecionada
        while (lineEnd < text.length && text[lineEnd] !== '\n') {
            lineEnd++;
        }
        
        // Extrai as linhas selecionadas
        const selectedLines = text.substring(lineStart, lineEnd);
        const lines = selectedLines.split('\n');
        
        // Aplica formatação em cada linha não vazia
        const formattedLines = lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return line; // Mantém linhas vazias
            
            // Se já está em itálico, remove a formatação
            if (trimmedLine.startsWith('_') && trimmedLine.endsWith('_') && trimmedLine.length > 2) {
                return line.replace(/^\s*_/, '').replace(/_\s*$/, '');
            } else {
                // Aplica itálico preservando indentação
                return line.replace(/^(\s*)(.*)$/, '$1_$2_');
            }
        });
        
        const beforeText = text.substring(0, lineStart);
        const afterText = text.substring(lineEnd);
        const formattedText = formattedLines.join('\n');
        
        notepad.value = beforeText + formattedText + afterText;
        
        // Mantém a seleção nas linhas formatadas
        const newEnd = lineStart + formattedText.length;
        notepad.selectionStart = lineStart;
        notepad.selectionEnd = newEnd;
    }
    
    updateFormattedContent();
    autoResize();
    
    // Garante que o foco permaneça no textarea
    notepad.focus();
}

/**
* Converte linhas selecionadas em lista não ordenada
*/
function applyUnorderedList() {
    const start = notepad.selectionStart;
    const end = notepad.selectionEnd;
    const text = notepad.value;
    
    // Encontra o início e fim das linhas que contêm a seleção
    let lineStart = start;
    let lineEnd = end;
    
    // Vai para o início da primeira linha selecionada
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
        lineStart--;
    }
    
    // Vai para o final da última linha selecionada
    while (lineEnd < text.length && text[lineEnd] !== '\n') {
        lineEnd++;
    }
    
    // Extrai as linhas selecionadas
    const selectedLines = text.substring(lineStart, lineEnd);
    const lines = selectedLines.split('\n');
    
    // Converte cada linha não vazia em item de lista
    const listLines = lines.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return line; // Mantém linhas vazias
        
        // Se já é um item de lista, remove o formato
        if (trimmedLine.startsWith('- ')) {
            return trimmedLine.substring(2);
        } else {
            return `- ${trimmedLine}`;
        }
    });
    
    const beforeText = text.substring(0, lineStart);
    const afterText = text.substring(lineEnd);
    const formattedText = listLines.join('\n');
    
    notepad.value = beforeText + formattedText + afterText;
    
    // Mantém a seleção nas linhas formatadas
    const newEnd = lineStart + formattedText.length;
    notepad.selectionStart = lineStart;
    notepad.selectionEnd = newEnd;
    
    updateFormattedContent();
    autoResize();
    
    // Garante que o foco permaneça no textarea
    notepad.focus();
}

// Listener para atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl+S para salvar manualmente
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        autoSave();
    }
    
    // Ctrl+B para negrito
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        applyBold();
    }
    
    // Ctrl+I para itálico
    if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        applyItalic();
    }
    
    // Ctrl+O para lista não ordenada
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        applyUnorderedList();
    }

    // Ctrl + Z → desfazer
    if (e.ctrlKey && e.key === 'z') {
        setTimeout(() => {
            updateFormattedContent();
            autoResize();
        }, 0);
        return; // deixa o navegador fazer o undo padrão
    }

    // Ctrl + Y → refazer
    if (e.ctrlKey && e.key === 'y') {
        setTimeout(() => {
            updateFormattedContent();
            autoResize();
        }, 0);
        return; // deixa o navegador fazer o redo padrão
    }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

// Carrega conteúdo e ajusta layout
loadContent();
autoResize();

// Aguarda um frame para garantir que o DOM está pronto
requestAnimationFrame(() => {
    syncLayout();
    notepad.focus();
});

// Foca no textarea quando a página carrega
window.addEventListener('load', () => {
    setTimeout(() => {
        syncLayout();
        notepad.focus();
    }, 100);
});
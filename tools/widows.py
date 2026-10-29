#!/usr/bin/env python3
"""Garante que a última linha de cada bloco de texto tenha pelo menos
três palavras: junta as últimas palavras com &nbsp; (regra do Rafa:
nunca 1 ou 2 palavras sozinhas na última linha).

Uso: python3 tools/widows.py index.html
"""
import re, sys

BLOCKS = r'p|h1|h2|h3|h4|h5|li|small|figcaption|dt|dd|summary'
MIN_WORDS = 3

def glue(inner: str) -> str:
    tokens = re.split(r'(<[^>]+>)', inner)
    words_after = 0      # palavras já contadas (à direita do cursor)
    in_word = False
    done = False
    for ti in range(len(tokens) - 1, -1, -1):
        tok = tokens[ti]
        if not tok:
            continue
        if tok.startswith('<'):
            if re.match(r'<br\b', tok, re.I):
                break
            continue
        if tok.strip() == '':
            # espaço puro entre tags: conta como separador real
            if words_after < MIN_WORDS and words_after > 0 and in_word is False:
                pass
            continue
        chars = list(tok)
        i = len(chars) - 1
        out = chars[:]
        while i >= 0 and not done:
            c = chars[i]
            # entidade &nbsp; (lida de trás para frente)
            if c == ';' and ''.join(chars[max(0, i - 5):i + 1]) == '&nbsp;':
                if in_word:
                    words_after += 1
                in_word = False
                i -= 6
                if words_after >= MIN_WORDS:
                    done = True
                continue
            if c in ' \n\t':
                if in_word:
                    words_after += 1
                    in_word = False
                    if words_after >= MIN_WORDS:
                        done = True
                        break
                # espaço no início do token (antes dele vem uma tag inline)
                out[i] = '&nbsp;'
                # colapsa espaços consecutivos
                j = i - 1
                while j >= 0 and chars[j] in ' \n\t':
                    out[j] = ''
                    j -= 1
                i = j
                continue
            in_word = True
            i -= 1
        tokens[ti] = ''.join(out)
        if done:
            break
    return ''.join(tokens)

def process(html: str) -> str:
    def repl(m):
        tag, attrs, inner = m.group(1), m.group(2) or '', m.group(3)
        if len(re.findall(r'\w+', re.sub(r'<[^>]+>', ' ', inner))) < 4:
            return m.group(0)
        return f'<{tag}{attrs}>{glue(inner)}</{tag}>'
    # só blocos "folha": o conteúdo não pode abrir outro bloco de texto
    pattern = re.compile(r'<(%s)(\s[^>]*)?>((?:(?!<(?:%s)\b).)*?)</\1>' % (BLOCKS, BLOCKS), re.S)
    return pattern.sub(repl, html)

if __name__ == '__main__':
    path = sys.argv[1]
    src = open(path, encoding='utf-8').read()
    out = process(src)
    open(path, 'w', encoding='utf-8').write(out)
    print('ok', path)

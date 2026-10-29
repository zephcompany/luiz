# Swipe Flow

Site estático completo, pronto para publicar no GitHub Pages. O `index.html` está na raiz. Não precisa de npm, instalação de dependências ou comando de build.

## Publicar pelo navegador

1. Extraia o ZIP no seu computador. Não envie o arquivo ZIP para o repositório.
2. Crie um repositório no GitHub. Um repositório público permite usar o GitHub Pages no plano gratuito.
3. Envie todos os arquivos e pastas extraídos para a raiz do repositório, preservando `assets/` e `vendor/`. O arquivo `index.html` deve aparecer logo ao abrir o repositório, e não dentro de uma pasta `dist` ou `swipe-flow-github`.
4. Confirme o envio na branch `main`.
5. Abra **Settings → Pages → Build and deployment**.
6. Em **Source**, escolha **Deploy from a branch**.
7. Selecione **main** e **/ (root)**. Clique em **Save**.
8. Aguarde a publicação. O endereço aparece nessa mesma tela, no botão **Visit site**.

Para um repositório comum, o endereço terá o formato `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Os caminhos relativos deste pacote já funcionam nesse formato.

Não renomeie o `index.html` nem altere a estrutura das pastas. Inclua o arquivo `.nojekyll` na raiz; ele pode estar oculto no explorador de arquivos. Se o envio pelo navegador não incluí-lo, crie no GitHub um arquivo com esse nome e uma linha em branco.

## Estrutura

- `index.html`: página principal.
- `sales.css`: todos os estilos (tokens em `:root`, tipografia Manrope + Instrument Serif, botões, cards, faixas, mockups animados e responsivo).
- `app.js`: header, barra de progresso, FAQ animado, luz de borda que acompanha o cursor nos cards, estados "ao vivo" das demonstrações.
- `scroll-experience.js`: galeria em arco da hero, Lenis (rolagem suave), seção fixada dos recursos e entrada dos planos.
- `motion.js`: preloader + entrada da hero, títulos revelados por linha/palavra (SplitText), títulos que se preenchem com o scroll, seleção animada nos destaques (cursor clica e arrasta, em loop enquanto visível), reveals, timeline fixada dos formatos (blocos trocam conforme o scroll), cards empilhados e wordmark.
- `menu-highlight.js`: destaque deslizante do menu.
- `guarantee-seal.js`: movimento do selo de garantia.
- `flow-bands.js`: faixas horizontais que reagem à velocidade do scroll (param em movimento reduzido).
- `assets/`: imagens, selo, avatares e favicon usados no site.
- `vendor/`: GSAP, ScrollTrigger, SplitText, Lenis e avisos de origem/licença.
- `tools/widows.py`: utilitário opcional (`python3 tools/widows.py index.html`) que junta as últimas três palavras de cada bloco de texto com `&nbsp;` para nunca deixar 1 ou 2 palavras sozinhas na última linha. Rode depois de editar textos.
- `.nojekyll`: publicação dos arquivos estáticos diretamente.

## Atualizações

Depois da primeira publicação, basta enviar os arquivos alterados para a mesma branch. O GitHub Pages atualiza o site automaticamente.

Os botões de planos mantêm o destino atual `https://swipeflow.com/`. Para usar links de checkout específicos, altere os links de Basic, Pro e Ultra no `index.html`.

As fontes são carregadas do Google Fonts. Os scripts de animação e as imagens estão incluídos no pacote. O site não depende do endereço anterior de hospedagem.

## Referência oficial

- [Criar um site no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Configurar a origem de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

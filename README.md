# desafio_teste_domino

Casos de teste em **JavaScript** para uma **partida de dominó com 2 jogadores**, implementada também em JavaScript.

## Colaborador

| Nome | RA |
| --- | --- |
| João Paulo Candido da Costa | 24000797-2 |

## Especificação do desafio

Enunciado: *"casos de teste para testar uma partida para 02 jogadores; casos de teste em Javascript para testar Javascript"*.

Regras adotadas na implementação (`src/index.js`):

- Jogo **duplo-seis**: 28 peças únicas, de `[0,0]` a `[6,6]`. `[1,0]` e `[0,1]` são a mesma peça.
- **2 jogadores** com **7 peças** cada. As **14 restantes** formam o monte de compra (dorme).
- **Abertura**: começa quem tem a **maior dupla** e deve abrir com ela. Se ninguém tiver dupla, abre a peça de **maior soma**, com desempate pelo **maior lado**.
- Cada peça deve encaixar na **ponta esquerda ou direita** da mesa, e é virada automaticamente quando necessário.
- **Compra obrigatória**: sem peça que encaixe, o jogador compra do monte (sempre a primeira peça) até conseguir jogar. Comprar não passa a vez, e quem tem jogada não pode comprar.
- **Passar** só é permitido sem jogada e com o monte vazio.
- **Vitória**: quem esvaziar a mão primeiro vence.
- **Jogo fechado**: dois passes seguidos encerram a partida. Vence quem tiver a **menor soma de pontos na mão**; somas iguais dão **empate**.
- Jogar fora da vez, com peça alheia, peça que não encaixa ou lado inválido lança erro.

### API

```js
const { Domino, STATUS } = require('./src/index.js');
const jogo = new Domino();                     // ou new Domino({ maos: [m0, m1], dorme })
jogo.vez; jogo.pecaDeAbertura; jogo.pontas;    // [esquerda, direita]
jogo.jogadasPossiveis(0);                      // [{ peca, lado }]
jogo.jogar(0, [6, 6]);                         // retorna a peça orientada
jogo.comprar(1); jogo.passar(1);
jogo.status; jogo.vencedor;                    // 'jogando' | 'vitoria' | 'fechado'
```

## Casos de teste

Os testes ficam em `tests/domino.test.js` e usam `node:test` e `node:assert/strict`. Há três **distribuições fixas** com as 28 peças:

- **A**: J0 tem o `[6,6]` e J1 tem peças com 6.
- **B**: J1 não tem nenhum 6 e precisa comprar.
- **C**: ninguém tem dupla.

Situações difíceis de alcançar jogando, como monte esgotado, última peça na mão ou jogo fechado, são montadas alterando o estado do jogo diretamente.

| ID | O que é verificado |
| --- | --- |
| DO01 | 28 peças únicas. A distribuição sorteada tem 7/7/14 e preserva todas as peças. |
| DO02 | Peça repetida (inclusive invertida), peça inexistente e quantidades erradas são recusadas. |
| DO03 | Maior dupla abre, com qualquer um dos jogadores. Sem duplas, maior soma com desempate pelo maior lado. Não se abre com outra peça. |
| DO04 | Encaixe à esquerda e à direita com inversão da peça. Lista de jogadas possíveis. |
| DO05 | Peça que não encaixa, peça de outro jogador, fora da vez e lado ou jogador inválidos são recusados. |
| DO06 | Compra obrigatória até poder jogar. Comprar não passa a vez. Quem tem jogada não compra. |
| DO07 | Passar só sem jogada e com monte vazio. Uma jogada zera a contagem de passes. |
| DO08 | Esvaziar a mão dá a vitória e encerra a partida. |
| DO09 | Jogo fechado: vence a menor soma na mão. Somas iguais dão empate. |

## Como executar

Requisito: **Node.js 20 ou superior**, sem dependências.

```bash
npm test
npm run coverage
```

Resultado: **21 testes, 21 aprovados.**

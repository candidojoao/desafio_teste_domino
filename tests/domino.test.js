'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { Domino, STATUS, todasAsPecas, chave } = require('../src/index.js');

/** Distribuição A: J0 tem o [6,6]; J1 tem peças com 6 para responder. */
const DIST_A = () => ({
  maos: [
    [[6, 6], [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [0, 0]],
    [[5, 5], [6, 1], [6, 2], [6, 3], [4, 4], [1, 1], [2, 2]],
  ],
  dorme: [[0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [1, 4], [1, 5], [2, 3], [2, 5], [3, 3], [3, 4], [4, 5], [4, 6], [5, 6]],
});

/** Distribuição B: J1 não tem nenhum 6 e precisará comprar. */
const DIST_B = () => ({
  maos: [
    [[6, 6], [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [0, 0]],
    [[5, 5], [1, 1], [1, 2], [1, 4], [1, 5], [2, 2], [2, 3]],
  ],
  dorme: [[0, 3], [0, 4], [0, 5], [0, 6], [1, 6], [2, 5], [2, 6], [3, 3], [3, 4], [3, 6], [4, 4], [4, 5], [4, 6], [5, 6]],
});

/** Distribuição C: nenhuma dupla nas mãos. */
const DIST_C = () => ({
  maos: [
    [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2]],
    [[1, 3], [1, 4], [1, 5], [1, 6], [2, 3], [2, 4], [2, 5]],
  ],
  dorme: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [2, 6], [3, 4], [3, 5], [3, 6], [4, 5], [4, 6], [5, 6]],
});

const todasAsChaves = (jogo) => [...jogo.maos.flat(), ...jogo.dorme, ...jogo.mesa].map(chave).sort();

describe('DO01 - distribuição', () => {
  test('existem 28 peças únicas de [0,0] a [6,6]', () => {
    const pecas = todasAsPecas();
    assert.equal(pecas.length, 28);
    assert.equal(new Set(pecas.map(chave)).size, 28);
  });

  test('distribuição sorteada tem 7/7/14 e preserva as 28 peças', () => {
    for (let i = 0; i < 20; i++) {
      const jogo = new Domino();
      assert.equal(jogo.maos[0].length, 7);
      assert.equal(jogo.maos[1].length, 7);
      assert.equal(jogo.dorme.length, 14);
      assert.deepEqual(todasAsChaves(jogo), todasAsPecas().map(chave).sort());
    }
  });
});

describe('DO02 - peças inválidas', () => {
  test('peça repetida é recusada', () => {
    const d = DIST_A();
    d.dorme[0] = [1, 0]; // [0,1] já está com J0 (ordem invertida conta como a mesma peça)
    assert.throws(() => new Domino(d), /repetida/);
  });

  test('peça inexistente é recusada', () => {
    const d = DIST_A();
    d.dorme[0] = [7, 0];
    assert.throws(() => new Domino(d), TypeError);
  });

  test('quantidade errada de peças é recusada', () => {
    const d = DIST_A();
    d.maos[0].pop();
    assert.throws(() => new Domino(d), /7 peças/);
    const e = DIST_A();
    e.dorme.pop();
    assert.throws(() => new Domino(e), /14 peças/);
  });
});

describe('DO03 - abertura', () => {
  test('começa quem tem a maior dupla e deve abrir com ela', () => {
    const jogo = new Domino(DIST_A());
    assert.equal(jogo.vez, 0);
    assert.deepEqual(jogo.pecaDeAbertura, [6, 6]);
    assert.throws(() => jogo.jogar(0, [0, 1]), /abrir com 6-6/);
    jogo.jogar(0, [6, 6]);
    assert.deepEqual(jogo.pontas, [6, 6]);
    assert.equal(jogo.vez, 1);
  });

  test('a maior dupla pode estar com o segundo jogador', () => {
    const d = DIST_A();
    [d.maos[0], d.maos[1]] = [d.maos[1], d.maos[0]];
    const jogo = new Domino(d);
    assert.equal(jogo.vez, 1);
  });

  test('sem duplas, abre a maior soma, com desempate pelo maior lado', () => {
    const jogo = new Domino(DIST_C());
    // J0: melhor é [0,6] (soma 6); J1: [1,6] e [2,5] somam 7 -> [1,6] tem o maior lado
    assert.equal(jogo.vez, 1);
    assert.deepEqual(jogo.pecaDeAbertura, [1, 6]);
  });
});

describe('DO04 - encaixe nas pontas', () => {
  test('peças encaixam à esquerda e à direita e são viradas quando preciso', () => {
    const jogo = new Domino(DIST_A());
    jogo.jogar(0, [6, 6]);
    assert.deepEqual(jogo.jogar(1, [6, 1], 'direita'), [6, 1]);
    assert.deepEqual(jogo.pontas, [6, 1]);
    assert.deepEqual(jogo.jogar(0, [0, 1], 'direita'), [1, 0]); // virada
    assert.deepEqual(jogo.jogar(1, [6, 2], 'esquerda'), [2, 6]); // virada
    assert.deepEqual(jogo.mesa, [[2, 6], [6, 6], [6, 1], [1, 0]]);
    assert.deepEqual(jogo.pontas, [2, 0]);
  });

  test('jogadas possíveis listam as peças que encaixam em cada ponta', () => {
    const jogo = new Domino(DIST_A());
    assert.deepEqual(jogo.jogadasPossiveis(0), [{ peca: [6, 6], lado: 'direita' }]);
    jogo.jogar(0, [6, 6]);
    const pecas = jogo.jogadasPossiveis(1).map((j) => chave(j.peca));
    assert.deepEqual([...new Set(pecas)].sort(), ['1-6', '2-6', '3-6']);
    assert.deepEqual(jogo.jogadasPossiveis(0), []); // não é a vez
  });
});

describe('DO05 - jogadas ilegais', () => {
  test('peça que não encaixa é recusada', () => {
    const jogo = new Domino(DIST_A());
    jogo.jogar(0, [6, 6]);
    assert.throws(() => jogo.jogar(1, [5, 5]), /não encaixa/);
  });

  test('peça de outro jogador é recusada', () => {
    const jogo = new Domino(DIST_A());
    jogo.jogar(0, [6, 6]);
    assert.throws(() => jogo.jogar(1, [0, 1]), /não tem/);
  });

  test('jogar fora da vez, lado ou jogador inválidos são recusados', () => {
    const jogo = new Domino(DIST_A());
    assert.throws(() => jogo.jogar(1, [6, 1]), /vez/);
    assert.throws(() => jogo.jogar(2, [6, 1]), RangeError);
    jogo.jogar(0, [6, 6]);
    assert.throws(() => jogo.jogar(1, [6, 1], 'meio'), /lado/);
  });
});

describe('DO06 - compra obrigatória', () => {
  test('sem encaixe e com monte, compra até conseguir jogar', () => {
    const jogo = new Domino(DIST_B());
    jogo.jogar(0, [6, 6]);
    assert.deepEqual(jogo.jogadasPossiveis(1), []);
    assert.throws(() => jogo.passar(1), /obrigatório comprar/);
    assert.deepEqual(jogo.comprar(1), [0, 3]);
    assert.deepEqual(jogo.comprar(1), [0, 4]);
    assert.deepEqual(jogo.comprar(1), [0, 5]);
    assert.deepEqual(jogo.comprar(1), [0, 6]);
    assert.equal(jogo.maos[1].length, 11);
    assert.equal(jogo.dorme.length, 10);
    assert.equal(jogo.vez, 1); // comprar não passa a vez
    assert.throws(() => jogo.comprar(1), /tem jogada/);
    jogo.jogar(1, [0, 6], 'direita');
    assert.deepEqual(jogo.pontas, [6, 0]);
  });

  test('quem tem jogada não pode comprar', () => {
    const jogo = new Domino(DIST_A());
    jogo.jogar(0, [6, 6]);
    assert.throws(() => jogo.comprar(1), /tem jogada/);
  });
});

describe('DO07 - passar a vez', () => {
  test('só passa sem encaixe e com o monte vazio', () => {
    const jogo = new Domino(DIST_B());
    jogo.jogar(0, [6, 6]);
    jogo.dorme = []; // estado montado: monte esgotado
    jogo.passar(1);
    assert.equal(jogo.vez, 0);
    assert.equal(jogo.passesSeguidos, 1);
  });

  test('quem tem jogada não pode passar', () => {
    const jogo = new Domino(DIST_A());
    jogo.jogar(0, [6, 6]);
    jogo.dorme = [];
    assert.throws(() => jogo.passar(1), /tem jogada/);
  });

  test('uma jogada zera a contagem de passes', () => {
    const jogo = new Domino(DIST_B());
    jogo.jogar(0, [6, 6]);
    jogo.dorme = [];
    jogo.maos[0].push([6, 5]); // J0 ainda tem um 6
    jogo.passar(1);
    jogo.jogar(0, [6, 5]);
    assert.equal(jogo.passesSeguidos, 0);
    assert.equal(jogo.status, STATUS.JOGANDO);
  });
});

describe('DO08 - vitória por bater', () => {
  test('quem esvazia a mão vence e a partida termina', () => {
    const jogo = new Domino(DIST_A());
    jogo.jogar(0, [6, 6]);
    jogo.maos[1] = [[6, 1]]; // estado montado: J1 com a última peça
    jogo.jogar(1, [6, 1]);
    assert.equal(jogo.status, STATUS.VITORIA);
    assert.equal(jogo.vencedor, 1);
    assert.throws(() => jogo.jogar(0, [0, 1]), /terminou/);
  });
});

describe('DO09 - jogo fechado (bloqueado)', () => {
  test('dois passes seguidos fecham o jogo; vence a menor soma na mão', () => {
    const jogo = new Domino(DIST_B());
    jogo.jogar(0, [6, 6]);
    jogo.dorme = [];
    jogo.passar(1);
    jogo.passar(0);
    assert.equal(jogo.status, STATUS.FECHADO);
    assert.equal(jogo.pontosNaMao(0), 21); // 1+2+4+6+8+0
    assert.equal(jogo.pontosNaMao(1), 35);
    assert.equal(jogo.vencedor, 0);
  });

  test('somas iguais terminam empatadas', () => {
    const jogo = new Domino(DIST_B());
    jogo.jogar(0, [6, 6]);
    jogo.dorme = [];
    jogo.maos[0] = [[1, 2]];
    jogo.maos[1] = [[0, 3]];
    jogo.passar(1);
    jogo.passar(0);
    assert.equal(jogo.status, STATUS.FECHADO);
    assert.equal(jogo.vencedor, null);
  });
});

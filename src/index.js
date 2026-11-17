'use strict';

/**
 * Dominó (duplo-seis) para 2 jogadores.
 * Autor: João Paulo Candido da Costa (RA 24000797-2)
 *
 * Peça: [a, b] com 0 <= a, b <= 6.
 */

const STATUS = Object.freeze({ JOGANDO: 'jogando', VITORIA: 'vitoria', FECHADO: 'fechado' });
const PECAS_POR_MAO = 7;

const chave = ([a, b]) => (a <= b ? `${a}-${b}` : `${b}-${a}`);
const soma = (peca) => peca[0] + peca[1];
const ehDupla = (peca) => peca[0] === peca[1];

function validarPeca(peca) {
  if (!Array.isArray(peca) || peca.length !== 2 || !peca.every((v) => Number.isInteger(v) && v >= 0 && v <= 6)) {
    throw new TypeError(`peça inválida: ${JSON.stringify(peca)}`);
  }
}

/** As 28 peças do jogo, de [0,0] a [6,6]. */
function todasAsPecas() {
  const pecas = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) pecas.push([a, b]);
  return pecas;
}

function embaralhar(pecas, aleatorio) {
  const lista = pecas.map((p) => [...p]);
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

/** Peça mais forte para abrir: maior dupla; sem duplas, maior soma (desempate: maior lado). */
function melhorAbertura(pecas) {
  const peso = (p) => (ehDupla(p) ? 100 + p[0] : soma(p) * 10 + Math.max(...p));
  return pecas.reduce((melhor, p) => (peso(p) > peso(melhor) ? p : melhor));
}

class Domino {
  /**
   * @param {object} [opcoes]
   * @param {[Array, Array]} [opcoes.maos] mãos fixas (7 peças cada)
   * @param {Array} [opcoes.dorme] monte de compra (14 peças)
   * @param {() => number} [opcoes.aleatorio] usado para embaralhar quando não há mãos fixas
   */
  constructor({ maos, dorme, aleatorio = Math.random } = {}) {
    if (maos === undefined) {
      const pecas = embaralhar(todasAsPecas(), aleatorio);
      maos = [pecas.slice(0, 7), pecas.slice(7, 14)];
      dorme = pecas.slice(14);
    }
    if (!Array.isArray(maos) || maos.length !== 2 || maos.some((m) => !Array.isArray(m) || m.length !== PECAS_POR_MAO)) {
      throw new Error('cada um dos 2 jogadores deve receber 7 peças');
    }
    if (!Array.isArray(dorme) || dorme.length !== 14) throw new Error('o monte deve ter 14 peças');

    const vistas = new Set();
    for (const peca of [...maos.flat(), ...dorme]) {
      validarPeca(peca);
      const k = chave(peca);
      if (vistas.has(k)) throw new Error(`peça repetida: ${k}`);
      vistas.add(k);
    }

    this.maos = maos.map((m) => m.map((p) => [...p]));
    this.dorme = dorme.map((p) => [...p]);
    this.mesa = [];
    this.status = STATUS.JOGANDO;
    this.vencedor = null;
    this.passesSeguidos = 0;

    const candidatas = [0, 1].map((j) => melhorAbertura(this.maos[j]));
    const abre = melhorAbertura(candidatas) === candidatas[0] ? 0 : 1;
    this.vez = abre;
    this.pecaDeAbertura = [...candidatas[abre]];
  }

  /** Números expostos nas pontas [esquerda, direita], ou null com a mesa vazia. */
  get pontas() {
    if (this.mesa.length === 0) return null;
    return [this.mesa[0][0], this.mesa[this.mesa.length - 1][1]];
  }

  /** Lista de jogadas válidas `{ peca, lado }` para o jogador. */
  jogadasPossiveis(jogador) {
    this.#validarJogador(jogador);
    if (this.status !== STATUS.JOGANDO || jogador !== this.vez) return [];
    if (this.mesa.length === 0) return [{ peca: [...this.pecaDeAbertura], lado: 'direita' }];
    const [esq, dir] = this.pontas;
    const jogadas = [];
    for (const peca of this.maos[jogador]) {
      if (peca.includes(esq)) jogadas.push({ peca: [...peca], lado: 'esquerda' });
      if (peca.includes(dir)) jogadas.push({ peca: [...peca], lado: 'direita' });
    }
    return jogadas;
  }

  jogar(jogador, peca, lado = 'direita') {
    this.#exigirVez(jogador);
    validarPeca(peca);
    if (lado !== 'esquerda' && lado !== 'direita') throw new Error(`lado inválido: ${lado}`);
    const mao = this.maos[jogador];
    const indice = mao.findIndex((p) => chave(p) === chave(peca));
    if (indice === -1) throw new Error(`o jogador ${jogador} não tem a peça ${chave(peca)}`);

    let orientada;
    if (this.mesa.length === 0) {
      if (chave(peca) !== chave(this.pecaDeAbertura)) {
        throw new Error(`a partida deve abrir com ${chave(this.pecaDeAbertura)}`);
      }
      orientada = [...peca];
      this.mesa.push(orientada);
    } else {
      const [esq, dir] = this.pontas;
      const [a, b] = peca;
      if (lado === 'esquerda') {
        if (b === esq) orientada = [a, b];
        else if (a === esq) orientada = [b, a];
        else throw new Error(`a peça ${chave(peca)} não encaixa na ponta ${esq}`);
        this.mesa.unshift(orientada);
      } else {
        if (a === dir) orientada = [a, b];
        else if (b === dir) orientada = [b, a];
        else throw new Error(`a peça ${chave(peca)} não encaixa na ponta ${dir}`);
        this.mesa.push(orientada);
      }
    }

    mao.splice(indice, 1);
    this.passesSeguidos = 0;
    if (mao.length === 0) {
      this.status = STATUS.VITORIA;
      this.vencedor = jogador;
    } else {
      this.vez = 1 - jogador;
    }
    return orientada;
  }

  /** Compra do monte; só é permitido quando o jogador não tem jogada. */
  comprar(jogador) {
    this.#exigirVez(jogador);
    if (this.jogadasPossiveis(jogador).length > 0) throw new Error('o jogador tem jogada e não pode comprar');
    if (this.dorme.length === 0) throw new Error('o monte está vazio');
    const peca = this.dorme.shift();
    this.maos[jogador].push(peca);
    this.passesSeguidos = 0;
    return [...peca];
  }

  /** Passa a vez; só é permitido sem jogada e com o monte vazio. */
  passar(jogador) {
    this.#exigirVez(jogador);
    if (this.jogadasPossiveis(jogador).length > 0) throw new Error('o jogador tem jogada e não pode passar');
    if (this.dorme.length > 0) throw new Error('é obrigatório comprar enquanto houver peças no monte');
    this.passesSeguidos++;
    if (this.passesSeguidos === 2) {
      this.#fecharJogo();
    } else {
      this.vez = 1 - jogador;
    }
  }

  /** Soma dos pontos que restam na mão do jogador. */
  pontosNaMao(jogador) {
    this.#validarJogador(jogador);
    return this.maos[jogador].reduce((total, p) => total + soma(p), 0);
  }

  #fecharJogo() {
    this.status = STATUS.FECHADO;
    const [p0, p1] = [this.pontosNaMao(0), this.pontosNaMao(1)];
    this.vencedor = p0 === p1 ? null : p0 < p1 ? 0 : 1;
  }

  #validarJogador(jogador) {
    if (jogador !== 0 && jogador !== 1) throw new RangeError(`jogador inválido: ${jogador}`);
  }

  #exigirVez(jogador) {
    this.#validarJogador(jogador);
    if (this.status !== STATUS.JOGANDO) throw new Error('a partida já terminou');
    if (jogador !== this.vez) throw new Error(`não é a vez do jogador ${jogador}`);
  }
}

module.exports = { Domino, STATUS, todasAsPecas, melhorAbertura, chave };

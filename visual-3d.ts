/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Analyser} from './analyser';

/**
 * A colorful waveform-style audio visualizer.
 */
@customElement('gdm-waveform-visualizer')
export class GdmWaveformVisualizer extends LitElement {
  private inputAnalyser!: Analyser;
  private outputAnalyser!: Analyser;
  private canvas!: HTMLCanvasElement;
  private canvasCtx!: CanvasRenderingContext2D;

  private _outputNode!: AudioNode;
  @property()
  set outputNode(node: AudioNode) {
    this._outputNode = node;
    this.outputAnalyser = new Analyser(this._outputNode);
  }
  get outputNode() {
    return this._outputNode;
  }

  private _inputNode!: AudioNode;
  @property()
  set inputNode(node: AudioNode) {
    this._inputNode = node;
    this.inputAnalyser = new Analyser(this._inputNode);
  }

  static styles = css`
    :host {
      display: block;
      width: 240px;
      height: 120px;
    }
    canvas {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.2);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.animation();
  }

  private animation() {
    requestAnimationFrame(() => this.animation());

    if (!this.canvasCtx || !this.inputAnalyser || !this.outputAnalyser) {
      return;
    }

    this.inputAnalyser.update();
    this.outputAnalyser.update();

    const canvas = this.canvas;
    const canvasCtx = this.canvasCtx;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const data = this.outputAnalyser.data;
    const inputData = this.inputAnalyser.data;
    const bufferLength = data.length;
    const barWidth = WIDTH / bufferLength;

    canvasCtx.lineWidth = barWidth > 2 ? barWidth - 1 : 1;
    canvasCtx.lineCap = 'round';

    for (let i = 0; i < bufferLength; i++) {
      const combinedValue = (data[i] + inputData[i]) / 2;
      const barHeight = (combinedValue / 255) * HEIGHT * 0.9;

      const hue = (i / bufferLength) * 360;
      canvasCtx.strokeStyle = `hsl(${hue}, 100%, 70%)`;

      const x = i * barWidth + barWidth / 2;
      const y1 = HEIGHT / 2 - barHeight / 2;
      const y2 = HEIGHT / 2 + barHeight / 2;

      if (barHeight > 0) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, y1);
        canvasCtx.lineTo(x, y2);
        canvasCtx.stroke();
      }
    }
  }

  protected firstUpdated() {
    this.canvas = this.shadowRoot!.querySelector('canvas') as HTMLCanvasElement;
    this.canvas.width = 240;
    this.canvas.height = 120;
    this.canvasCtx = this.canvas.getContext('2d')!;
  }

  protected render() {
    return html`<canvas></canvas>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-waveform-visualizer': GdmWaveformVisualizer;
  }
}

/**
 * ChartRenderer
 * SVGを用いてシンプルなグラフを描画するモジュール
 */
export const ChartRenderer = {

  /**
   * 棒グラフを描画する
   * @param {HTMLElement} container - 描画先のコンテナ要素
   * @param {Array} data - データ配列 (数値の配列、または {label, value} の配列)
   * @param {Object} options - オプション
   */
  renderBarChart(container, data, options = {}) {
    if (!container || !data || data.length === 0) return;

    const config = {
      height: options.height || 200,
      color: options.color || 'var(--primary-color)',
      barWidth: options.barWidth || 0.6, // 0.0 - 1.0 (カテゴリ幅に対する相対値)
      labels: options.labels || [], // データが単純な配列の場合に使用
      yAxisLabel: options.yAxisLabel || '',
      animate: options.animate !== false
    };

    // データの正規化
    const normalizedData = data.map((d, i) => {
      if (typeof d === 'number') {
        return { value: d, label: config.labels[i] || '' };
      }
      return d;
    });

    const maxValue = Math.max(...normalizedData.map(d => d.value), 1); // ゼロ除算防止
    const count = normalizedData.length;

    // SVGの生成
    const svg = this.createSVGElement('svg', {
      viewBox: `0 0 100 100`,
      preserveAspectRatio: 'none',
      class: 'chart-svg bar-chart'
    });

    // バーの描画
    const slotWidth = 100 / count;
    const barW = slotWidth * config.barWidth;
    const offset = (slotWidth - barW) / 2;

    normalizedData.forEach((d, i) => {
      const x = i * slotWidth + offset;
      const heightPercentage = (d.value / maxValue) * 100;
      const y = 100 - heightPercentage;

      const group = this.createSVGElement('g', { class: 'bar-group' });

      // バー本体
      const rect = this.createSVGElement('rect', {
        x: x,
        y: y,
        width: barW,
        height: heightPercentage,
        fill: config.color,
        rx: 1, // 角丸
        class: 'chart-bar'
      });

      // アニメーション (CSSでも可だが、単純な高さアニメーション)
      if (config.animate) {
        rect.innerHTML = `
          <animate attributeName="height" from="0" to="${heightPercentage}" dur="0.5s" fill="freeze" />
          <animate attributeName="y" from="100" to="${y}" dur="0.5s" fill="freeze" />
        `;
      }

      // 値ラベル (バーの上)
      const textValue = this.createSVGElement('text', {
        x: x + barW / 2,
        y: y - 2,
        'text-anchor': 'middle',
        'font-size': '4',
        fill: 'var(--text-color)',
        class: 'chart-value-label'
      });
      textValue.textContent = d.value > 0 ? d.value : '';

      group.appendChild(rect);
      group.appendChild(textValue);
      svg.appendChild(group);
    });

    // コンテナのクリアと追加
    container.innerHTML = '';
    container.appendChild(svg);

    // X軸ラベル (HTML)
    const xAxis = document.createElement('div');
    xAxis.className = 'chart-x-axis';
    xAxis.style.display = 'grid';
    xAxis.style.gridTemplateColumns = `repeat(${count}, 1fr)`;

    normalizedData.forEach(d => {
      const label = document.createElement('div');
      label.className = 'chart-x-label';
      label.textContent = d.label;
      label.style.textAlign = 'center';
      label.style.fontSize = '0.8rem';
      label.style.color = 'var(--text-muted)';
      xAxis.appendChild(label);
    });
    container.appendChild(xAxis);
  },

  /**
   * 折れ線グラフを描画する
   * @param {HTMLElement} container
   * @param {Array} data - [{ label, value }, ...]
   * @param {Object} options
   */
  renderLineChart(container, data, options = {}) {
    if (!container || !data || data.length === 0) return;

    // コンテナの実際のピクセルサイズを取得してアスペクト比を維持する
    const rect = container.getBoundingClientRect();
    // 表示されていない場合などのフォールバック
    const width = rect.width || 300;
    const height = rect.height || 200;

    const config = {
      color: options.color || 'var(--accent-color)',
      strokeWidth: options.strokeWidth || 2,
      animate: options.animate !== false
    };

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const count = data.length;

    const svg = this.createSVGElement('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'chart-svg line-chart'
    });

    // パディング（上下左右）
    const paddingX = width * 0.05;
    const paddingY = height * 0.1;
    const graphWidth = width - (paddingX * 2);
    const graphHeight = height - (paddingY * 2);

    // ポイントの計算
    const points = data.map((d, i) => {
      const x = paddingX + (i / (count - 1)) * graphWidth;
      const y = (height - paddingY) - ((d.value / maxValue) * graphHeight);
      return { x, y, value: d.value, label: d.label };
    });

    // 折れ線パス
    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    const path = this.createSVGElement('path', {
      d: pathD,
      fill: 'none',
      stroke: config.color,
      'stroke-width': config.strokeWidth,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'chart-line'
    });

    if (config.animate) {
       const length = width; // 近似値
       path.style.strokeDasharray = length;
       path.style.strokeDashoffset = length;
       path.innerHTML = `<animate attributeName="stroke-dashoffset" from="${length}" to="0" dur="1s" fill="freeze" />`;
    }

    svg.appendChild(path);

    // ポイントマーカー
    points.forEach(p => {
      const circle = this.createSVGElement('circle', {
        cx: p.x,
        cy: p.y,
        r: 4, // 固定サイズ
        fill: '#fff',
        stroke: config.color,
        'stroke-width': 2,
        class: 'chart-point'
      });
      svg.appendChild(circle);

      // 値ラベル
      const text = this.createSVGElement('text', {
        x: p.x,
        y: p.y - 10,
        'text-anchor': 'middle',
        'font-size': '12',
        fill: 'var(--text-color)',
        class: 'chart-value-label'
      });
      text.textContent = p.value;
      svg.appendChild(text);
    });

    container.innerHTML = '';
    container.appendChild(svg);

    // X軸ラベル
    const xAxis = document.createElement('div');
    xAxis.className = 'chart-x-axis';
    xAxis.style.display = 'flex';
    xAxis.style.justifyContent = 'space-between';
    xAxis.style.padding = `0 ${paddingX}px`; // SVGのパディングに合わせる

    data.forEach(d => {
      const label = document.createElement('div');
      label.textContent = d.label;
      label.style.fontSize = '0.8rem';
      label.style.color = 'var(--text-muted)';
      xAxis.appendChild(label);
    });
    container.appendChild(xAxis);
  },

  /**
   * SVG要素を生成するヘルパー
   * @param {string} tag
   * @param {Object} attrs
   * @returns {SVGElement}
   */
  createSVGElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    return el;
  }
};

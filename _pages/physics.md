---
layout: page
title: physics
permalink: /physics/
description: 인터랙티브 물리 시뮬레이션 — 전자기학 · 양자역학 · 역학 · 파동. 실제 지배방정식을 그대로 수치 적분합니다.
nav: true
nav_order: 6
_styles: >
  .phys-wrap { display: flex; flex-direction: column; gap: 2.2rem; margin-top: 1.2rem; }
  .phys-card { border: 1px solid var(--global-divider-color); border-radius: 10px; padding: 1.2rem 1.3rem 1.4rem; background: var(--global-card-bg-color, transparent); }
  .phys-card h3 { margin-top: 0; margin-bottom: 0.15rem; font-size: 1.2rem; letter-spacing: 0.02em; }
  .phys-card .phys-sub { font-size: 0.82rem; opacity: 0.7; margin-bottom: 0.9rem; }
  .phys-eq { background: rgba(127,127,127,0.08); border-left: 3px solid var(--global-theme-color); padding: 0.55rem 0.9rem; margin: 0.6rem 0 0.9rem; border-radius: 0 6px 6px 0; font-size: 0.92rem; overflow-x: auto; }
  .phys-canvas { display: block; width: 100%; max-width: 100%; background: #0b0e14; border-radius: 8px; touch-action: none; cursor: crosshair; }
  html[data-theme="light"] .phys-canvas { background: #f5f7fa; }
  .phys-ctrl { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.6rem 1.1rem; margin-top: 0.9rem; font-size: 0.85rem; }
  .phys-ctrl label { display: flex; flex-direction: column; gap: 0.25rem; }
  .phys-ctrl .phys-val { font-variant-numeric: tabular-nums; opacity: 0.85; font-size: 0.78rem; }
  .phys-ctrl input[type=range] { width: 100%; accent-color: var(--global-theme-color); }
  .phys-ctrl button { background: var(--global-theme-color); color: #fff; border: none; padding: 0.35rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
  .phys-ctrl button:hover { filter: brightness(1.1); }
  .phys-hint { font-size: 0.78rem; opacity: 0.65; margin-top: 0.5rem; font-style: italic; }
  .phys-readout { display: flex; gap: 1.2rem; flex-wrap: wrap; font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8; font-variant-numeric: tabular-nums; }
  .phys-readout span b { font-weight: 600; opacity: 1; }
  .phys-intro { font-size: 0.92rem; line-height: 1.55; margin-bottom: 1.4rem; opacity: 0.9; }
---

<div class="phys-intro">
이 페이지의 모든 시뮬레이션은 <b>해당 물리 법칙의 실제 방정식</b>을 그대로 계산합니다. 근사식이 아니라 쿨롱 합, 슈뢰딩거 정상 해, 비선형 진자의 Runge–Kutta 4차 적분, Fraunhofer 회절식을 직접 풉니다. 슬라이더를 움직여 매개변수의 의미를 느껴보세요.
</div>

<div class="phys-wrap">

<!-- ============== 1. ELECTRIC FIELD ============== -->
<section class="phys-card">
  <h3>① 전기장 — 쿨롱 법칙</h3>
  <div class="phys-sub">점전하 분포에서의 벡터장. 전하를 <b>드래그</b>해서 이동, 클릭으로 부호 변경.</div>

  <div class="phys-eq">
  $$\vec{E}(\vec{r}) \;=\; \frac{1}{4\pi\varepsilon_0}\sum_i \frac{q_i\,(\vec{r}-\vec{r}_i)}{\lvert\vec{r}-\vec{r}_i\rvert^{3}}$$
  </div>

  <canvas id="phys-efield" class="phys-canvas" height="420"></canvas>

  <div class="phys-ctrl">
    <label>격자 밀도 <span class="phys-val" id="phys-efield-grid-v">22</span>
      <input type="range" id="phys-efield-grid" min="10" max="40" value="22">
    </label>
    <label>장선 표시
      <button id="phys-efield-toggle">on/off</button>
    </label>
    <label>전하 추가
      <button id="phys-efield-add-pos">+q 추가</button>
    </label>
    <label>&nbsp;
      <button id="phys-efield-add-neg">−q 추가</button>
    </label>
    <label>&nbsp;
      <button id="phys-efield-reset">초기화</button>
    </label>
  </div>
  <div class="phys-hint">빨강 = 양전하, 파랑 = 음전하. 화살표는 양성자가 받을 힘의 방향이며, 색의 밝기는 $|\vec{E}|$ 의 크기를 로그 스케일로 나타냅니다.</div>
</section>

<!-- ============== 2. INFINITE SQUARE WELL ============== -->
<section class="phys-card">
  <h3>② 1차원 무한 우물 — 정상 상태</h3>
  <div class="phys-sub">경계 $\psi(0)=\psi(L)=0$ 에서의 해밀토니안 고유함수. 파동함수와 확률밀도를 동시에 표시.</div>

  <div class="phys-eq">
  $$\hat{H}\psi \;=\; -\frac{\hbar^2}{2m}\frac{d^2\psi}{dx^2} \;=\; E\,\psi, \qquad
  \psi_n(x) \;=\; \sqrt{\frac{2}{L}}\sin\!\left(\frac{n\pi x}{L}\right), \qquad
  E_n \;=\; \frac{n^{2}\pi^{2}\hbar^{2}}{2mL^{2}}$$
  </div>

  <canvas id="phys-well" class="phys-canvas" height="380"></canvas>

  <div class="phys-ctrl">
    <label>양자수 n <span class="phys-val" id="phys-well-n-v">1</span>
      <input type="range" id="phys-well-n" min="1" max="10" value="1" step="1">
    </label>
    <label>중첩 상수 c₂ (n=2 가중치) <span class="phys-val" id="phys-well-c-v">0.0</span>
      <input type="range" id="phys-well-c" min="0" max="100" value="0">
    </label>
    <label>시간 진화
      <button id="phys-well-play">▶ 재생</button>
    </label>
  </div>
  <div class="phys-readout">
    <span>에너지: <b id="phys-well-E">E₁</b></span>
    <span>파장: <b id="phys-well-lambda">λ = 2L/n</b></span>
    <span>노드 수: <b id="phys-well-nodes">0</b></span>
  </div>
  <div class="phys-hint">중첩 활성화 시: $\Psi(x,t) = c_1\psi_n e^{-iE_n t/\hbar} + c_2\psi_2 e^{-iE_2 t/\hbar}$. 서로 다른 고유에너지의 위상 차이가 확률밀도의 시간 변동(맥놀이)을 만듭니다.</div>
</section>

<!-- ============== 3. NONLINEAR PENDULUM ============== -->
<section class="phys-card">
  <h3>③ 비선형 진자 — RK4 적분</h3>
  <div class="phys-sub">작은 각 근사 $\sin\theta\approx\theta$ 를 쓰지 <b>않고</b> 원래 방정식을 4차 Runge–Kutta로 직접 풉니다.</div>

  <div class="phys-eq">
  $$\ddot{\theta} + \frac{g}{L}\sin\theta \;=\; 0, \qquad
  T_{\text{small}} = 2\pi\sqrt{\tfrac{L}{g}}, \qquad
  T(\theta_0) \;=\; 4\sqrt{\tfrac{L}{g}}\;K\!\left(\sin\tfrac{\theta_0}{2}\right)$$
  </div>

  <canvas id="phys-pendulum" class="phys-canvas" height="420"></canvas>

  <div class="phys-ctrl">
    <label>길이 L (m) <span class="phys-val" id="phys-pend-L-v">1.00</span>
      <input type="range" id="phys-pend-L" min="30" max="300" value="100">
    </label>
    <label>중력 g (m/s²) <span class="phys-val" id="phys-pend-g-v">9.81</span>
      <input type="range" id="phys-pend-g" min="100" max="2000" value="981">
    </label>
    <label>초기각 θ₀ (°) <span class="phys-val" id="phys-pend-th-v">45</span>
      <input type="range" id="phys-pend-th" min="1" max="179" value="45">
    </label>
    <label>감쇠 γ <span class="phys-val" id="phys-pend-d-v">0.00</span>
      <input type="range" id="phys-pend-d" min="0" max="100" value="0">
    </label>
    <label>&nbsp;
      <button id="phys-pend-reset">재시작</button>
    </label>
  </div>
  <div class="phys-readout">
    <span>주기 (소진폭): <b id="phys-pend-Ts">—</b></span>
    <span>주기 (실제, 타원적분): <b id="phys-pend-T">—</b></span>
    <span>총에너지 E: <b id="phys-pend-E">—</b></span>
  </div>
  <div class="phys-hint">오른쪽 위상평면 $(\theta,\dot\theta)$ 은 시간에 따라 궤도를 그립니다. 감쇠가 없으면 닫힌 곡선(보존계), 있으면 원점으로 수렴.</div>
</section>

<!-- ============== 4. DOUBLE SLIT ============== -->
<section class="phys-card">
  <h3>④ 이중 슬릿 — Fraunhofer 회절·간섭</h3>
  <div class="phys-sub">단일 슬릿 회절 엔벨로프와 이중 슬릿 간섭의 곱. 실험값을 직접 바꿔 가시성을 관찰.</div>

  <div class="phys-eq">
  $$I(\theta) \;=\; I_0 \left[\frac{\sin\beta}{\beta}\right]^{2} \cos^{2}\alpha, \qquad
  \alpha = \frac{\pi d \sin\theta}{\lambda}, \qquad
  \beta = \frac{\pi a \sin\theta}{\lambda}$$
  </div>

  <canvas id="phys-slit" class="phys-canvas" height="380"></canvas>

  <div class="phys-ctrl">
    <label>파장 λ (nm) <span class="phys-val" id="phys-slit-lam-v">550</span>
      <input type="range" id="phys-slit-lam" min="400" max="750" value="550">
    </label>
    <label>슬릿 간격 d (μm) <span class="phys-val" id="phys-slit-d-v">20</span>
      <input type="range" id="phys-slit-d" min="5" max="80" value="20">
    </label>
    <label>슬릿 폭 a (μm) <span class="phys-val" id="phys-slit-a-v">4</span>
      <input type="range" id="phys-slit-a" min="1" max="30" value="4">
    </label>
    <label>스크린 거리 L (m) <span class="phys-val" id="phys-slit-L-v">1.00</span>
      <input type="range" id="phys-slit-L" min="50" max="300" value="100">
    </label>
  </div>
  <div class="phys-readout">
    <span>주 극대 간격: <b id="phys-slit-fringe">—</b></span>
    <span>단일 슬릿 1차 영점: <b id="phys-slit-env">—</b></span>
    <span>가시성 V: <b id="phys-slit-vis">—</b></span>
  </div>
  <div class="phys-hint">λ 를 바꾸면 파장 자체의 색이 스크린 위에 나타나며 (가시광 ≈ 380–780 nm), d 가 커질수록 프린지가 촘촘해집니다. 단일 슬릿의 $\text{sinc}^2$ 엔벨로프는 밝기 감쇠를 지배.</div>
</section>

</div>

<script src="{{ '/assets/js/physics.js' | relative_url }}" defer></script>

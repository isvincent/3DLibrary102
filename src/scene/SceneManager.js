// 3D 場景核心：渲染器、鏡頭、OrbitControls、模式切換、點選、高亮、導覽線、日夜與效能
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { gsap } from 'gsap';
import { LibraryModel } from './building.js';
import { buildIsland } from './island.js';
import { WORLD, PLAN } from '../data/config.js';
import { getZone } from '../data/zones.js';
import { pxToWorld } from '../core/coords.js';
import { rectW, mat, box } from './kit.js';
import { emit } from '../core/events.js';
import { settings } from '../core/store.js';

const H = WORLD.floorHeight;
const OUT = rectW(PLAN.outline);

// 分頁被節流時也讓鏡頭動畫依實際時間完成，避免動畫被拉長
gsap.ticker.lagSmoothing(0);

export const MODES = ['full', 'explode', 'f1', 'f2', 'interior', 'compare', 'validate'];

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.mode = 'explode';
    this.floor = 1;
    this.explode = WORLD.explodeDefault;
    this.selected = null;
    this.clock = new THREE.Clock();
    this.lastFrame = 0;
    this.overlays = { 1: new THREE.Group(), 2: new THREE.Group() };

    const perf = settings.performance;
    this.renderer = new THREE.WebGLRenderer({ antialias: perf !== 'saver', alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'scene-canvas';

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'label-layer';
    container.appendChild(this.labelRenderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 600);
    this.camera.position.set(34, 36, 48);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 140;
    this.controls.screenSpacePanning = true;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener('start', () => {
      gsap.killTweensOf(this.camera.position);
      gsap.killTweensOf(this.controls.target);
    });

    this.setupLights();
    this.island = buildIsland();
    this.scene.add(this.island.group);
    this.model = new LibraryModel();
    this.scene.add(this.model.root);
    this.model.floors[1].group.add(this.overlays[1]);
    this.model.floors[2].group.add(this.overlays[2]);
    this.setupConnectors();
    this.setupHighlight();
    this.pathGroup = new THREE.Group();
    this.scene.add(this.pathGroup);
    this.arrows = [];
    this.setupAvatar();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.bindPointer();
    this.labelRenderer.domElement.addEventListener('click', (e) => {
      const id = e.target.closest?.('.zone-label')?.dataset.zone;
      if (id) this.handleZoneClick(id);
    });

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    this.applyPerformance(settings.performance);
    this.setNight(settings.night, true);
    this.setLabels(settings.labels);
    this.setAutoRotate(settings.autoRotate);
    this.setMode('explode', { instant: true });
    this.renderer.setAnimationLoop(() => this.loop());
  }

  dur(sec) {
    return sec / (settings.animSpeed || 1);
  }

  // ---------- 燈光 ----------
  setupLights() {
    this.hemi = new THREE.HemisphereLight('#e8f4ff', '#7a8b5a', 1.1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff4e0', 2.3);
    this.sun.position.set(-30, 50, 30);
    this.sun.castShadow = true;
    const s = this.sun.shadow;
    s.mapSize.set(2048, 2048);
    s.camera.left = -45;
    s.camera.right = 45;
    s.camera.top = 35;
    s.camera.bottom = -35;
    s.camera.near = 1;
    s.camera.far = 140;
    s.bias = -0.0006;
    s.normalBias = 0.03;
    this.scene.add(this.sun);
    this.ambient = new THREE.AmbientLight('#ffffff', 0.25);
    this.scene.add(this.ambient);
    this.interiorLights = [];
    [1, 2].forEach((f) => {
      [[-12, -4], [0, -4], [12, -4], [-8, 5], [8, 5]].forEach(([x, z]) => {
        const p = new THREE.PointLight('#ffd8a8', 0, 16, 1.6);
        p.position.set(x, 3, z);
        p.userData.floor = f; // 於 setupConnectors 加入對應樓層
        this.interiorLights.push(p);
      });
    });
  }

  setupConnectors() {
    const corners = [[OUT.minX, OUT.minZ], [OUT.maxX, OUT.minZ], [OUT.minX, OUT.maxZ], [OUT.maxX, OUT.maxZ]];
    const stair = pxToWorld(1775, 1017);
    const pts = [...corners, [stair.x, stair.z]];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(pts.length * 6).fill(0), 3));
    this.connectorPts = pts;
    this.connectors = new THREE.LineSegments(geo, new THREE.LineDashedMaterial({ color: '#4895ef', dashSize: 0.5, gapSize: 0.35, transparent: true, opacity: 0.8 }));
    this.scene.add(this.connectors);
    this.interiorLights.forEach((l) => this.model.floors[l.userData.floor].group.add(l));
  }

  updateConnectors() {
    const a = this.connectors.geometry.attributes.position;
    const y2 = this.model.floors[2].group.position.y - WORLD.slabThickness;
    this.connectorPts.forEach(([x, z], i) => {
      a.setXYZ(i * 2, x, WORLD.wallHeight * this.model.floors[1].walls.scale.y, z);
      a.setXYZ(i * 2 + 1, x, y2, z);
    });
    a.needsUpdate = true;
    this.connectors.computeLineDistances();
  }

  // ---------- 模式 ----------
  setMode(mode, { instant = false, floor } = {}) {
    if (!MODES.includes(mode)) return;
    if (floor) this.floor = floor;
    this.mode = mode;
    const f1 = this.model.floors[1];
    const f2 = this.model.floors[2];
    const d = instant ? 0 : this.dur(1.1);
    const cut = mode === 'full' ? 1 : WORLD.cutawayWallScale;
    const exploded = mode === 'explode';
    const showF2 = !(['f1', 'interior', 'compare', 'validate'].includes(mode) && this.floor === 1);
    const hideF1 = ['compare', 'validate'].includes(mode) && this.floor === 2;
    [f1, f2].forEach((f) => gsap.to(f.walls.scale, { y: cut, duration: d, ease: 'power2.inOut' }));
    f2.roof.visible = mode === 'full';
    f2.group.visible = showF2;
    f1.group.visible = !hideF1;
    const y2 = exploded ? H + this.explode : H;
    gsap.to(f2.group.position, { y: y2, duration: d, ease: 'power2.inOut', onUpdate: () => this.updateConnectors(), onComplete: () => this.updateConnectors() });
    this.connectors.visible = exploded;
    this.controls.maxPolarAngle = ['f1', 'f2', 'compare', 'validate'].includes(mode) ? Math.PI * 0.32 : Math.PI * 0.47;
    this.refreshLabels();
    this.flyTo(this.presetFor(mode), d);
    emit('mode', { mode, floor: this.floor });
  }

  setFloor(floor) {
    this.floor = floor;
    if (['full', 'explode'].includes(this.mode)) this.setMode(floor === 1 ? 'f1' : 'f2');
    else if (['f1', 'f2'].includes(this.mode)) this.setMode(floor === 1 ? 'f1' : 'f2');
    else this.setMode(this.mode);
    emit('floor', floor);
  }

  floorY(floor) {
    return this.model.floors[floor].group.position.y;
  }

  targetFloorY(floor) {
    if (floor === 1) return 0;
    return this.mode === 'explode' ? H + this.explode : H;
  }

  // 依畫面長寬比計算能完整容納寬 w、深 d 範圍的鏡頭距離
  fitDistance(w, d, margin = 1.12) {
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const aspect = Math.max(0.3, this.camera.aspect);
    return Math.max(d / 2 / tanV, w / 2 / (tanV * aspect)) * margin;
  }

  presetFor(mode) {
    const e = this.explode;
    const dir = (dist, ux, uy, uz) => {
      const l = Math.hypot(ux, uy, uz);
      return [(ux / l) * dist, (uy / l) * dist, (uz / l) * dist];
    };
    switch (mode) {
      case 'full': {
        const p = dir(this.fitDistance(this.camera.aspect < 0.8 ? 42 : 50, 34), 0.55, 0.55, 0.75);
        return { pos: [p[0], p[1] + 3.5, p[2]], target: [0, 3.5, 0] };
      }
      case 'explode': {
        const ty = (H + e) / 2 + 1;
        const p = dir(this.fitDistance(this.camera.aspect < 0.8 ? 44 : 52, 38 + e * 1.2), 0.5, 0.6, 0.75);
        return { pos: [p[0], p[1] + ty, p[2]], target: [0, ty, 0] };
      }
      case 'f1':
      case 'f2':
      case 'compare':
      case 'validate': {
        const floor = mode === 'f1' ? 1 : mode === 'f2' ? 2 : this.floor;
        const y = mode === 'f2' ? H : this.targetFloorY(floor);
        const dist = this.fitDistance(WORLD.width + 1, WORLD.depth + 1, mode === 'compare' || mode === 'validate' ? 1.05 : 1.12);
        const tilt = mode === 'f1' || mode === 'f2' ? 0.3 : 0.06;
        if (mode === 'validate') {
          // 右側有驗證面板：放大視野並把建築置於左側
          const wide = window.innerWidth > 860;
          const d2 = wide ? this.fitDistance(WORLD.width * 2.15, WORLD.depth + 1, 1.0) : this.fitDistance(WORLD.width + 1, WORLD.depth * 2.2, 1.02);
          const shiftX = wide ? WORLD.width * 0.5 : 0;
          const shiftZ = wide ? 0.4 : WORLD.depth * 0.5;
          return { pos: [shiftX, y + d2, shiftZ + d2 * 0.04], target: [shiftX, y, shiftZ] };
        }
        return { pos: [0, y + dist, dist * tilt], target: [0, y, 0.4] };
      }
      case 'interior': {
        const y = this.targetFloorY(this.floor);
        const p = dir(this.fitDistance(30, 20), -0.15, 0.75, 0.75);
        return { pos: [p[0], p[1] + y, p[2]], target: [0, y, 0] };
      }
      default:
        return { pos: [30, 30, 44], target: [0, 2, 0] };
    }
  }

  flyTo({ pos, target }, duration = this.dur(1.1)) {
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);
    if (!duration) {
      this.camera.position.set(...pos);
      this.controls.target.set(...target);
      this.controls.update();
      return;
    }
    gsap.to(this.camera.position, { x: pos[0], y: pos[1], z: pos[2], duration, ease: 'power2.inOut' });
    gsap.to(this.controls.target, { x: target[0], y: target[1], z: target[2], duration, ease: 'power2.inOut' });
  }

  home() {
    this.clearSelection();
    this.flyTo(this.presetFor(this.mode));
  }

  birdView() {
    const y = this.mode === 'explode' ? (H + this.explode) / 2 : 2;
    this.flyTo({ pos: [0.01, 78, 18], target: [0, y, 0] });
  }

  setExplode(v) {
    this.explode = v;
    if (this.mode === 'explode') {
      gsap.to(this.model.floors[2].group.position, { y: H + v, duration: this.dur(0.4), onUpdate: () => this.updateConnectors() });
      this.refreshPath();
    }
  }

  // ---------- 點選 ----------
  bindPointer() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    el.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const id = this.pick(e);
      if (id) this.handleZoneClick(id);
      else emit('zone:miss');
    });
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const id = this.pick(e);
        this.setHover(id);
        el.style.cursor = id ? 'pointer' : 'grab';
      });
    });
    el.addEventListener('pointerleave', () => this.setHover(null));
  }

  pick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const cands = this.model.pickables.filter((p) => this.model.floors[p.userData.floor].group.visible);
    const hits = this.raycaster.intersectObjects(cands, false);
    if (!hits.length) return null;
    const floor = hits[0].object.userData.floor;
    const same = hits.filter((h) => h.object.userData.floor === floor);
    same.sort((a, b) => a.object.userData.area - b.object.userData.area);
    return same[0].object.userData.zoneId;
  }

  handleZoneClick(id) {
    const zone = getZone(id);
    if (!zone) return;
    if (this.mode === 'full') {
      this.floor = zone.floor;
      this.setMode('interior');
    }
    this.select(id);
    emit('zone:click', zone);
  }

  // ---------- 高亮 ----------
  setupHighlight() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    this.selBox = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffb703', transparent: true, opacity: 0.28, depthWrite: false }));
    this.selEdges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#fb8500' }));
    this.selBox.add(this.selEdges);
    this.selBox.visible = false;
    this.selBox.renderOrder = 5;
    this.hoverBox = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#8ecae6', transparent: true, opacity: 0.22, depthWrite: false }));
    this.hoverBox.visible = false;
    this.scene.add(this.selBox, this.hoverBox);
  }

  placeBox(mesh, id) {
    const zo = this.model.zoneObjects.get(id);
    if (!zo) return false;
    const r = zo.rect;
    const h = Math.max(0.3, zo.top) + 0.15;
    const parent = this.model.floors[zo.zone.floor].group;
    if (mesh.parent !== parent) parent.add(mesh);
    mesh.position.set(r.x, h / 2, r.z);
    mesh.scale.set(r.w + 0.2, h, r.d + 0.2);
    mesh.visible = true;
    return true;
  }

  setHover(id) {
    if (!id || id === this.selected) {
      this.hoverBox.visible = false;
      emit('zone:hover', null);
      return;
    }
    this.placeBox(this.hoverBox, id);
    emit('zone:hover', getZone(id));
  }

  select(id, { fly = true } = {}) {
    const zone = getZone(id);
    if (!zone) return;
    this.selected = id;
    this.placeBox(this.selBox, id);
    gsap.killTweensOf(this.selBox.material);
    this.selBox.material.opacity = 0.45;
    gsap.to(this.selBox.material, { opacity: 0.15, duration: 0.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    document.querySelectorAll('.zone-label.selected').forEach((el) => el.classList.remove('selected'));
    document.querySelector(`.zone-label[data-zone="${id}"]`)?.classList.add('selected');
    if (fly) this.focusZone(id);
    emit('zone:select', zone);
  }

  clearSelection() {
    this.selected = null;
    this.selBox.visible = false;
    gsap.killTweensOf(this.selBox.material);
    document.querySelectorAll('.zone-label.selected').forEach((el) => el.classList.remove('selected'));
    emit('zone:select', null);
  }

  // 依場域範圍計算安全視角：鏡頭始終位於剖面牆與家具上方，不穿牆、不進入家具
  focusZone(id) {
    const zo = this.model.zoneObjects.get(id);
    if (!zo) return;
    const zone = zo.zone;
    const needFloorSwitch = zone.floor !== this.floor || (zone.floor === 1 && this.model.floors[2].group.visible && !['explode'].includes(this.mode));
    if (['full', 'f1', 'f2', 'interior'].includes(this.mode) && needFloorSwitch) {
      this.floor = zone.floor;
      this.setMode(this.mode === 'full' ? 'interior' : this.mode === 'interior' ? 'interior' : zone.floor === 1 ? 'f1' : 'f2');
    } else if (['compare', 'validate'].includes(this.mode) && zone.floor !== this.floor) {
      this.floor = zone.floor;
      this.setMode(this.mode);
    }
    const y = this.targetFloorY(zone.floor);
    const r = zo.rect;
    const span = Math.max(r.w, r.d);
    const dist = Math.min(28, Math.max(10, span * 1.1));
    let pos;
    if (['compare', 'validate'].includes(this.mode)) pos = [r.x, y + 30, r.z + 2];
    else if (this.mode === 'explode' && zone.floor === 1) {
      // 樓層展開時從兩層之間的空隙斜看一樓，避免鏡頭碰到上層樓板
      const gapTop = H + this.explode - WORLD.slabThickness - 1.2;
      pos = [r.x + dist * 0.2, Math.max(3.5, Math.min(gapTop, dist * 0.6)), Math.max(r.z + dist * 1.2, OUT.maxZ + 4)];
    } else pos = [r.x + dist * 0.25, y + Math.max(8, dist * 0.9), r.z + dist * 0.8];
    // 室內模式下限制在島嶼範圍內
    pos[0] = THREE.MathUtils.clamp(pos[0], -32, 32);
    pos[2] = THREE.MathUtils.clamp(pos[2], -26, 34);
    this.flyTo({ pos, target: [r.x, y + 0.5, r.z] });
  }

  // ---------- 標籤 ----------
  setLabels(on) {
    this.labelsOn = on;
    this.labelRenderer.domElement.style.display = on ? '' : 'none';
    this.refreshLabels();
  }

  refreshLabels() {
    [1, 2].forEach((f) => {
      this.model.floors[f].labels.visible = !!this.labelsOn;
    });
    // 樓層展開與完整建築模式下，書架標籤較密集，僅顯示主要區域
    const narrow = this.container.clientWidth < 700;
    const dense = ['full', 'explode'].includes(this.mode) || (narrow && this.mode !== 'interior');
    this.labelRenderer.domElement.classList.toggle('dense', dense);
  }

  // ---------- 導覽線與人物 ----------
  setupAvatar() {
    const g = new THREE.Group();
    g.add(box(0.4, 0.7, 0.26, '#1d3557', 0, 0, 0));
    g.add(box(0.48, 0.62, 0.3, '#e63946', 0, 0.7, 0));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat('#f1c27d'));
    head.position.y = 1.55;
    g.add(head);
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 4), mat('#ffb703', { emissive: '#ffb703', emissiveIntensity: 0.6 }));
    marker.rotation.x = Math.PI;
    marker.position.y = 2.4;
    g.add(marker);
    g.visible = false;
    this.avatar = g;
    this.avatarMarker = marker;
    this.scene.add(g);
  }

  pathPointWorld(p) {
    const w = pxToWorld(p.px[0], p.px[1]);
    let y;
    if (p.level >= 1) y = this.floorY(2);
    else y = p.level * H;
    return new THREE.Vector3(w.x, y + 0.06, w.z);
  }

  showPath(points) {
    this.currentPath = points;
    this.refreshPath();
  }

  refreshPath() {
    this.pathGroup.clear();
    this.arrows = [];
    const points = this.currentPath;
    if (!points || points.length < 2) return;
    const pts = points.map((p) => this.pathPointWorld(p));
    this.pathPts = pts;
    const curve = new THREE.CurvePath();
    for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    this.pathCurve = curve;
    const len = curve.getLength();
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 12), 0.09, 6, false), new THREE.MeshBasicMaterial({ color: '#ffb703' }));
    this.pathGroup.add(tube);
    const arrowGeo = new THREE.ConeGeometry(0.32, 0.7, 3);
    arrowGeo.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({ color: '#fb5607' });
    const n = Math.max(3, Math.floor(len / 1.4));
    for (let i = 0; i < n; i++) {
      const a = new THREE.Mesh(arrowGeo, arrowMat);
      this.pathGroup.add(a);
      this.arrows.push(a);
    }
    this.pathLen = len;
    const end = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 6, 20), new THREE.MeshBasicMaterial({ color: '#fb5607' }));
    end.rotation.x = Math.PI / 2;
    end.position.copy(pts[pts.length - 1]).add(new THREE.Vector3(0, 0.05, 0));
    this.pathGroup.add(end);
  }

  clearPath() {
    this.currentPath = null;
    this.pathGroup.clear();
    this.arrows = [];
  }

  placeAvatar(p) {
    this.avatar.visible = true;
    this.avatar.position.copy(this.pathPointWorld(p));
  }

  hideAvatar() {
    this.avatar.visible = false;
  }

  walkAvatar(points) {
    return new Promise((resolve) => {
      if (!points || points.length < 2) return resolve();
      const pts = points.map((p) => this.pathPointWorld(p));
      const curve = new THREE.CurvePath();
      for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
      const state = { t: 0 };
      this.avatar.visible = true;
      gsap.to(state, {
        t: 1,
        duration: this.dur(Math.min(7, curve.getLength() / 5)),
        ease: 'none',
        onUpdate: () => {
          const p = curve.getPointAt(state.t);
          const ahead = curve.getPointAt(Math.min(1, state.t + 0.01));
          this.avatar.position.copy(p);
          if (ahead.distanceToSquared(p) > 1e-6) this.avatar.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z);
        },
        onComplete: resolve,
      });
    });
  }

  // ---------- 日夜／效能／自動旋轉 ----------
  setNight(on, instant = false) {
    this.night = on;
    document.body.classList.toggle('night', on);
    const d = instant ? 0 : this.dur(1.2);
    gsap.to(this.hemi, { intensity: on ? 0.28 : 1.1, duration: d });
    gsap.to(this.sun, { intensity: on ? 0.35 : 2.3, duration: d });
    this.sun.color.set(on ? '#9db4ff' : '#fff4e0');
    this.hemi.color.set(on ? '#5c6f9c' : '#e8f4ff');
    this.interiorLights.forEach((l, i) => {
      const enabled = settings.performance !== 'saver' || i % 5 === 0;
      gsap.to(l, { intensity: on && enabled ? 22 : 0, duration: d });
    });
    this.island.stars.visible = on;
    this.island.lamps.forEach((b) => (b.material.emissiveIntensity = on ? 2.2 : 0.2));
    this.scene.traverse((o) => {
      if (o.isMesh && o.material?.userData?.isWindow) {
        o.material.emissive.set(on ? '#ffcf70' : '#000000');
        o.material.emissiveIntensity = on ? 0.7 : 0;
      }
    });
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
  }

  applyPerformance(level) {
    this.performance = level;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(level === 'high' ? Math.min(dpr, 2) : level === 'standard' ? Math.min(dpr, 1.5) : 1);
    const shadows = level !== 'saver';
    this.sun.castShadow = shadows;
    this.renderer.shadowMap.enabled = shadows;
    this.sun.shadow.mapSize.set(level === 'high' ? 4096 : 2048, level === 'high' ? 4096 : 2048);
    if (this.sun.shadow.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }
    this.scene.traverse((o) => {
      if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true;
    });
    if (this.night) this.setNight(true, true);
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    if (this.model) this.refreshLabels();
  }

  loop() {
    const now = performance.now();
    if (this.performance === 'saver' && now - this.lastFrame < 1000 / 30) return;
    this.lastFrame = now;
    const dt = Math.min(0.1, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    if (this.performance !== 'saver') this.island.update(t, dt);
    if (this.arrows.length && this.pathCurve) {
      const n = this.arrows.length;
      const off = (t * 0.35) % (1 / n);
      this.arrows.forEach((a, i) => {
        const u = Math.min(0.999, (i / n + off) % 1);
        const p = this.pathCurve.getPointAt(u);
        const q = this.pathCurve.getPointAt(Math.min(1, u + 0.002));
        a.position.copy(p).add(new THREE.Vector3(0, 0.12, 0));
        a.lookAt(q.x, q.y + 0.12, q.z);
      });
    }
    if (this.avatar.visible) this.avatarMarker.position.y = 2.4 + Math.sin(t * 4) * 0.12;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (this.labelsOn) this.labelRenderer.render(this.scene, this.camera);
  }

  rebuildModel() {
    this.model.rebuildAll();
    this.refreshLabels();
    if (this.selected) this.select(this.selected, { fly: false });
  }
}

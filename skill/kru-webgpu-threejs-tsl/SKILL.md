---
name: kru-webgpu-threejs-tsl
description: Comprehensive guide for developing WebGPU-enabled Three.js applications using TSL (Three.js Shading Language). Covers WebGPU renderer setup, TSL syntax and node materials, compute shaders, post-processing effects, and WGSL integration. Use this skill when working with Three.js WebGPU, TSL shaders, node materials, or GPU compute in Three.js.
---

<!-- vendored from `dgreenheck/webgpu-claude-skill` (main, sha af2319b) → `skills/webgpu-threejs-tsl`.
     Dan Greenheck (three.js WebGPU/TSL educator) — the shader/compute half of the team's 3D lane,
     carried ambiently by the UI component builders (`react-ui-builder`/`svelte-ui-builder`).
     MIT per the source README (no LICENSE file upstream — same precedent as the mattpocock skills);
     its code examples derive from three.js, also MIT. Tracks three.js r171+/r183+ TSL API changes.
     The rest of the 3D lane (core three, R3F, Threlte) is Context7-backed, not vendored — see SOURCES.md.
     Kept verbatim; re-sync: re-download SKILL.md + REFERENCE.md + docs/ + examples/ + templates/ from
     https://raw.githubusercontent.com/dgreenheck/webgpu-claude-skill/main/skills/webgpu-threejs-tsl/. -->

# WebGPU Three.js with TSL

TSL (Three.js Shading Language) is a node-based shader abstraction that lets you write GPU shaders in JavaScript instead of GLSL/WGSL strings.

## Quick Start

```javascript
import * as THREE from 'three/webgpu';
import { color, time, oscSine } from 'three/tsl';

const renderer = new THREE.WebGPURenderer();
await renderer.init();

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = color(0xff0000).mul(oscSine(time));
```

## Skill Contents

### Documentation
- `docs/core-concepts.md` - Types, operators, uniforms, control flow
- `docs/materials.md` - Node materials and all properties
- `docs/compute-shaders.md` - GPU compute with instanced arrays
- `docs/post-processing.md` - Built-in and custom effects
- `docs/wgsl-integration.md` - Custom WGSL functions
- `docs/device-loss.md` - Handling GPU device loss and recovery
- `docs/limits-and-features.md` - WebGPU device limits and optional features

### Examples
- `examples/basic-setup.js` - Minimal WebGPU project
- `examples/custom-material.js` - Custom shader material
- `examples/particle-system.js` - GPU compute particles
- `examples/post-processing.js` - Effect pipeline
- `examples/earth-shader.js` - Complete Earth with atmosphere

### Templates
- `templates/webgpu-project.js` - Starter project template
- `templates/compute-shader.js` - Compute shader template

### Reference
- `REFERENCE.md` - Quick reference cheatsheet

## Key Concepts

### Import Pattern
```javascript
// Always use the WebGPU entry point
import * as THREE from 'three/webgpu';
import { /* TSL functions */ } from 'three/tsl';
```

### Node Materials
Replace standard material properties with TSL nodes:
```javascript
material.colorNode = texture(map);        // instead of material.map
material.roughnessNode = float(0.5);      // instead of material.roughness
material.positionNode = displaced;         // vertex displacement
```

### Method Chaining
TSL uses method chaining for operations:
```javascript
// Instead of: sin(time * 2.0 + offset) * 0.5 + 0.5
time.mul(2.0).add(offset).sin().mul(0.5).add(0.5)
```

### Custom Functions
Use `Fn()` for reusable shader logic:
```javascript
const fresnel = Fn(([power = 2.0]) => {
  const nDotV = normalWorld.dot(viewDir).saturate();
  return float(1.0).sub(nDotV).pow(power);
});
```

## When to Use This Skill

- Setting up Three.js with WebGPU renderer
- Creating custom shader materials with TSL
- Writing GPU compute shaders
- Building post-processing pipelines
- Migrating from GLSL to TSL
- Implementing visual effects (particles, water, terrain, etc.)

## Resources

- [Three.js TSL Wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [WebGPU Examples](https://github.com/mrdoob/three.js/tree/master/examples) (files prefixed with `webgpu_`)

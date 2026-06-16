/**
 * Entry point for esbuild — bundles Graphology, Sigma, ForceAtlas2
 * into a single IIFE for use in Electron renderer (no bundler needed).
 *
 * Exports everything to window.GraphLibs so renderer scripts can consume it.
 */

import { MultiGraph } from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

// Expose on window for access from non-module scripts
window.GraphLibs = {
  MultiGraph,
  Sigma,
  forceAtlas2,
  FA2Layout,
};

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';

const wrenDarkColors: ColorsTheme = {
  type: 'dark',
  Background: '#0b0e14',
  Foreground: '#bfbdb6',
  LightBlue: '#59C2FF',
  AccentBlue: '#39BAE6',
  AccentPurple: '#D2A6FF',
  AccentCyan: '#95E6CB',
  AccentGreen: '#AAD94C',
  AccentYellow: '#FFD700',
  AccentRed: '#F26D78',
  Comment: '#646A71',
  Gray: '#3D4149',
  GradientColors: ['#FFD700', '#da7959'],
};

export const WrenDark: Theme = new Theme(
  'Wren Dark',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: wrenDarkColors.Background,
      color: wrenDarkColors.Foreground,
    },
    'hljs-keyword': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-literal': {
      color: wrenDarkColors.AccentPurple,
    },
    'hljs-symbol': {
      color: wrenDarkColors.AccentCyan,
    },
    'hljs-name': {
      color: wrenDarkColors.LightBlue,
    },
    'hljs-link': {
      color: wrenDarkColors.AccentBlue,
    },
    'hljs-function .hljs-keyword': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-subst': {
      color: wrenDarkColors.Foreground,
    },
    'hljs-string': {
      color: wrenDarkColors.AccentGreen,
    },
    'hljs-title': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-type': {
      color: wrenDarkColors.AccentBlue,
    },
    'hljs-attribute': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-bullet': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-addition': {
      color: wrenDarkColors.AccentGreen,
    },
    'hljs-variable': {
      color: wrenDarkColors.Foreground,
    },
    'hljs-template-tag': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-template-variable': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-comment': {
      color: wrenDarkColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: wrenDarkColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: wrenDarkColors.AccentRed,
    },
    'hljs-meta': {
      color: wrenDarkColors.AccentYellow,
    },
    'hljs-doctag': {
      fontWeight: 'bold',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
  },
  wrenDarkColors,
);

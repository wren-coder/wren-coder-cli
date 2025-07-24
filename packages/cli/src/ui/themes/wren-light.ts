/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ColorsTheme, Theme } from './theme.js';

const wrenLightColors: ColorsTheme = {
  type: 'light',
  Background: '#f8f9fa',
  Foreground: '#5c6166',
  LightBlue: '#55b4d4',
  AccentBlue: '#399ee6',
  AccentPurple: '#a37acc',
  AccentCyan: '#4cbf99',
  AccentGreen: '#86b300',
  AccentYellow: '#f2ae49',
  AccentRed: '#f07171',
  Comment: '#ABADB1',
  Gray: '#CCCFD3',
  GradientColors: ['#399ee6', '#86b300'],
};

export const WrenLight: Theme = new Theme(
  'Wren Light',
  'light',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: wrenLightColors.Background,
      color: wrenLightColors.Foreground,
    },
    'hljs-comment': {
      color: wrenLightColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: wrenLightColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-string': {
      color: wrenLightColors.AccentGreen,
    },
    'hljs-constant': {
      color: wrenLightColors.AccentCyan,
    },
    'hljs-number': {
      color: wrenLightColors.AccentPurple,
    },
    'hljs-keyword': {
      color: wrenLightColors.AccentYellow,
    },
    'hljs-selector-tag': {
      color: wrenLightColors.AccentYellow,
    },
    'hljs-attribute': {
      color: wrenLightColors.AccentYellow,
    },
    'hljs-variable': {
      color: wrenLightColors.Foreground,
    },
    'hljs-variable.language': {
      color: wrenLightColors.LightBlue,
      fontStyle: 'italic',
    },
    'hljs-title': {
      color: wrenLightColors.AccentBlue,
    },
    'hljs-section': {
      color: wrenLightColors.AccentGreen,
      fontWeight: 'bold',
    },
    'hljs-type': {
      color: wrenLightColors.LightBlue,
    },
    'hljs-class .hljs-title': {
      color: wrenLightColors.AccentBlue,
    },
    'hljs-tag': {
      color: wrenLightColors.LightBlue,
    },
    'hljs-name': {
      color: wrenLightColors.AccentBlue,
    },
    'hljs-builtin-name': {
      color: wrenLightColors.AccentYellow,
    },
    'hljs-meta': {
      color: wrenLightColors.AccentYellow,
    },
    'hljs-symbol': {
      color: wrenLightColors.AccentRed,
    },
    'hljs-bullet': {
      color: wrenLightColors.AccentYellow,
    },
    'hljs-regexp': {
      color: wrenLightColors.AccentCyan,
    },
    'hljs-link': {
      color: wrenLightColors.LightBlue,
    },
    'hljs-deletion': {
      color: wrenLightColors.AccentRed,
    },
    'hljs-addition': {
      color: wrenLightColors.AccentGreen,
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: wrenLightColors.AccentCyan,
    },
    'hljs-built_in': {
      color: wrenLightColors.AccentRed,
    },
    'hljs-doctag': {
      color: wrenLightColors.AccentRed,
    },
    'hljs-template-variable': {
      color: wrenLightColors.AccentCyan,
    },
    'hljs-selector-id': {
      color: wrenLightColors.AccentRed,
    },
  },
  wrenLightColors,
);

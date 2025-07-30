/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { parseJsonString, hasProperty, extractStructuredResponse } from './jsonParser.js';
import { z } from 'zod';

describe('jsonParser', () => {
  describe('parseJsonString', () => {
    it('should parse a regular JSON string', () => {
      const jsonString = '{"result": "PASS"}';
      const result = parseJsonString(jsonString);
      expect(result).toEqual({ result: 'PASS' });
    });

    it('should parse a JSON string wrapped in code block markers', () => {
      const jsonString = '```json\n{\n  "result": "PASS"\n}\n```';
      const result = parseJsonString(jsonString);
      expect(result).toEqual({ result: 'PASS' });
    });

    it('should parse a JSON string with only triple backticks', () => {
      const jsonString = '```json\n{\n  "result": "PASS"\n}\n```';
      const result = parseJsonString(jsonString);
      expect(result).toEqual({ result: 'PASS' });
    });

    it('should parse a JSON string with content after code block', () => {
      const jsonString = '```json\n{\n  "result": "PASS"\n}\n```\nSome additional text';
      const result = parseJsonString(jsonString);
      expect(result).toEqual({ result: 'PASS' });
    });

    it('should handle nested objects', () => {
      const jsonString = '```json\n{\n  "result": "PASS",\n  "details": {\n    "score": 100,\n    "message": "All tests passed"\n  }\n}\n```';
      const result = parseJsonString(jsonString);
      expect(result).toEqual({
        result: 'PASS',
        details: {
          score: 100,
          message: 'All tests passed'
        }
      });
    });

    it('should handle arrays', () => {
      const jsonString = '```json\n[\n  {"name": "test1", "result": "PASS"},\n  {"name": "test2", "result": "FAIL"}\n]\n```';
      const result = parseJsonString(jsonString);
      expect(result).toEqual([
        { name: 'test1', result: 'PASS' },
        { name: 'test2', result: 'FAIL' }
      ]);
    });

    it('should throw an error for malformed JSON', () => {
      const jsonString = '```json\n{\n  "result": PASS\n}\n```'; // Missing quotes around PASS
      expect(() => parseJsonString(jsonString)).toThrow();
    });

    it('should handle strings with no code block markers', () => {
      const jsonString = '{ "result": "PASS" }';
      const result = parseJsonString(jsonString);
      expect(result).toEqual({ result: 'PASS' });
    });

    it('should handle extra whitespace', () => {
      const jsonString = '   ```json\n{\n  "result": "PASS"\n}\n```   ';
      const result = parseJsonString(jsonString);
      expect(result).toEqual({ result: 'PASS' });
    });
  });

  describe('hasProperty', () => {
    it('should return true when object has the property', () => {
      const obj = { result: 'PASS', details: 'Test passed' };
      expect(hasProperty(obj, 'result')).toBe(true);
      expect(hasProperty(obj, 'details')).toBe(true);
    });

    it('should return false when object does not have the property', () => {
      const obj = { result: 'PASS' };
      expect(hasProperty(obj, 'details')).toBe(false);
    });
  });

  describe('extractStructuredResponse', () => {
    // Define a simple schema for testing
    const TestSchema = z.object({
      result: z.string(),
      errors: z.array(z.string()).optional()
    });

    it('should use structuredResponse when available', () => {
      const result = {
        structuredResponse: { result: 'PASS', errors: [] }
      };

      const fallbackMessageExtractor = vi.fn();

      const extracted = extractStructuredResponse(
        result,
        TestSchema,
        fallbackMessageExtractor
      );

      expect(extracted).toEqual({ result: 'PASS', errors: [] });
      expect(fallbackMessageExtractor).not.toHaveBeenCalled();
    });

    it('should fall back to string parsing when structuredResponse is not available', () => {
      const result = { 
        messages: [{
          content: '```json\n{\n  "result": "PASS",\n  "errors": []\n}\n```'
        }] 
      };

      const extracted = extractStructuredResponse(
        result,
        TestSchema
      );

      expect(extracted).toEqual({ result: 'PASS', errors: [] });
    });
  });
})
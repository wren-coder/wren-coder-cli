/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, Mocked } from 'vitest';
import * as fsPromises from 'fs/promises';
import * as fsSync from 'fs';
import { Stats, Dirent } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadServerHierarchicalMemory } from './memoryDiscovery.js';
import {
  CONFIG_DIR,
  setMdFilename,
  getCurrentMdFilename,
  DEFAULT_CONTEXT_FILENAME,
} from '../tools/memoryTool.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';

const ORIGINAL__MD_FILENAME_CONST_FOR_TEST = DEFAULT_CONTEXT_FILENAME;

// Mock the entire fs/promises module
vi.mock('fs/promises');
// Mock the parts of fsSync we might use (like constants or existsSync if needed)
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof fsSync>();
  return {
    ...actual, // Spread actual to get all exports, including Stats and Dirent if they are classes/constructors
    constants: { ...actual.constants }, // Preserve constants
  };
});
vi.mock('os');

describe('loadServerHierarchicalMemory', () => {
  const mockFs = fsPromises as Mocked<typeof fsPromises>;
  const mockOs = os as Mocked<typeof os>;

  const CWD = '/test/project/src';
  const PROJECT_ROOT = '/test/project';
  const USER_HOME = '/test/userhome';

  let GLOBAL__DIR: string;
  let GLOBAL__FILE: string; // Defined in beforeEach

  const fileService = new FileDiscoveryService(PROJECT_ROOT);
  beforeEach(() => {
    vi.resetAllMocks();
    // Set environment variables to indicate test environment
    process.env.NODE_ENV = 'test';
    process.env.VITEST = 'true';

    setMdFilename(DEFAULT_CONTEXT_FILENAME); // Use defined const
    mockOs.homedir.mockReturnValue(USER_HOME);

    // Define these here to use potentially reset/updated values from imports
    GLOBAL__DIR = path.join(USER_HOME, CONFIG_DIR);
    GLOBAL__FILE = path.join(
      GLOBAL__DIR,
      getCurrentMdFilename(), // Use current filename
    );

    mockFs.stat.mockRejectedValue(new Error('File not found'));
    mockFs.readdir.mockResolvedValue([]);
    mockFs.readFile.mockRejectedValue(new Error('File not found'));
    mockFs.access.mockRejectedValue(new Error('File not found'));
  });

  it('should return empty memory and count if no context files are found', async () => {
    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );
    expect(memoryContent).toBe('');
    expect(fileCount).toBe(0);
  });

  it('should load only the global context file if present and others are not (default filename)', async () => {
    const globalDefaultFile = path.join(
      GLOBAL__DIR,
      DEFAULT_CONTEXT_FILENAME,
    );
    mockFs.access.mockImplementation(async (p) => {
      if (p === globalDefaultFile) {
        return undefined;
      }
      throw new Error('File not found');
    });
    mockFs.readFile.mockImplementation(async (p) => {
      if (p === globalDefaultFile) {
        return 'Global memory content';
      }
      throw new Error('File not found');
    });

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );

    expect(memoryContent).toBe(
      `--- Context from: ${path.relative(CWD, globalDefaultFile)} ---\nGlobal memory content\n--- End of Context from: ${path.relative(CWD, globalDefaultFile)} ---`,
    );
    expect(fileCount).toBe(1);
    expect(mockFs.readFile).toHaveBeenCalledWith(globalDefaultFile, 'utf-8');
  });

  it('should load only the global custom context file if present and filename is changed', async () => {
    const customFilename = 'CUSTOM_AGENTS.md';
    setMdFilename(customFilename);
    const globalCustomFile = path.join(GLOBAL__DIR, customFilename);

    mockFs.access.mockImplementation(async (p) => {
      if (p === globalCustomFile) {
        return undefined;
      }
      throw new Error('File not found');
    });
    mockFs.readFile.mockImplementation(async (p) => {
      if (p === globalCustomFile) {
        return 'Global custom memory';
      }
      throw new Error('File not found');
    });

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );

    expect(memoryContent).toBe(
      `--- Context from: ${path.relative(CWD, globalCustomFile)} ---\nGlobal custom memory\n--- End of Context from: ${path.relative(CWD, globalCustomFile)} ---`,
    );
    expect(fileCount).toBe(1);
    expect(mockFs.readFile).toHaveBeenCalledWith(globalCustomFile, 'utf-8');
  });

  it('should load context files by upward traversal with custom filename', async () => {
    const customFilename = 'PROJECT_CONTEXT.md';
    setMdFilename(customFilename);
    const projectRootCustomFile = path.join(PROJECT_ROOT, customFilename);
    const srcCustomFile = path.join(CWD, customFilename);

    mockFs.stat.mockImplementation(async (p) => {
      if (p === path.join(PROJECT_ROOT, '.git')) {
        return { isDirectory: () => true } as Stats;
      }
      throw new Error('File not found');
    });

    mockFs.access.mockImplementation(async (p) => {
      if (p === projectRootCustomFile || p === srcCustomFile) {
        return undefined;
      }
      throw new Error('File not found');
    });

    mockFs.readFile.mockImplementation(async (p) => {
      if (p === projectRootCustomFile) {
        return 'Project root custom memory';
      }
      if (p === srcCustomFile) {
        return 'Src directory custom memory';
      }
      throw new Error('File not found');
    });

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );
    const expectedContent =
      `--- Context from: ${path.relative(CWD, projectRootCustomFile)} ---\nProject root custom memory\n--- End of Context from: ${path.relative(CWD, projectRootCustomFile)} ---\n\n` +
      `--- Context from: ${customFilename} ---\nSrc directory custom memory\n--- End of Context from: ${customFilename} ---`;

    expect(memoryContent).toBe(expectedContent);
    expect(fileCount).toBe(2);
    expect(mockFs.readFile).toHaveBeenCalledWith(
      projectRootCustomFile,
      'utf-8',
    );
    expect(mockFs.readFile).toHaveBeenCalledWith(srcCustomFile, 'utf-8');
  });

  it('should load context files by downward traversal with custom filename', async () => {
    const customFilename = 'LOCAL_CONTEXT.md';
    setMdFilename(customFilename);
    const subDir = path.join(CWD, 'subdir');
    const subDirCustomFile = path.join(subDir, customFilename);
    const cwdCustomFile = path.join(CWD, customFilename);

    mockFs.access.mockImplementation(async (p) => {
      if (p === cwdCustomFile || p === subDirCustomFile) return undefined;
      throw new Error('File not found');
    });

    mockFs.readFile.mockImplementation(async (p) => {
      if (p === cwdCustomFile) return 'CWD custom memory';
      if (p === subDirCustomFile) return 'Subdir custom memory';
      throw new Error('File not found');
    });

    mockFs.readdir.mockImplementation((async (
      p: fsSync.PathLike,
    ): Promise<Dirent[]> => {
      if (p === CWD) {
        return [
          {
            name: customFilename,
            isFile: () => true,
            isDirectory: () => false,
          } as Dirent,
          {
            name: 'subdir',
            isFile: () => false,
            isDirectory: () => true,
          } as Dirent,
        ] as Dirent[];
      }
      if (p === subDir) {
        return [
          {
            name: customFilename,
            isFile: () => true,
            isDirectory: () => false,
          } as Dirent,
        ] as Dirent[];
      }
      return [] as Dirent[];
    }) as unknown as typeof fsPromises.readdir);

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );
    const expectedContent =
      `--- Context from: ${customFilename} ---\nCWD custom memory\n--- End of Context from: ${customFilename} ---\n\n` +
      `--- Context from: ${path.join('subdir', customFilename)} ---\nSubdir custom memory\n--- End of Context from: ${path.join('subdir', customFilename)} ---`;

    expect(memoryContent).toBe(expectedContent);
    expect(fileCount).toBe(2);
  });

  it('should load ORIGINAL__MD_FILENAME files by upward traversal from CWD to project root', async () => {
    const projectRootFile = path.join(
      PROJECT_ROOT,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );
    const srcFile = path.join(
      CWD,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );

    mockFs.stat.mockImplementation(async (p) => {
      if (p === path.join(PROJECT_ROOT, '.git')) {
        return { isDirectory: () => true } as Stats;
      }
      throw new Error('File not found');
    });

    mockFs.access.mockImplementation(async (p) => {
      if (p === projectRootFile || p === srcFile) {
        return undefined;
      }
      throw new Error('File not found');
    });

    mockFs.readFile.mockImplementation(async (p) => {
      if (p === projectRootFile) {
        return 'Project root memory';
      }
      if (p === srcFile) {
        return 'Src directory memory';
      }
      throw new Error('File not found');
    });

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );
    const expectedContent =
      `--- Context from: ${path.relative(CWD, projectRootFile)} ---\nProject root memory\n--- End of Context from: ${path.relative(CWD, projectRootFile)} ---\n\n` +
      `--- Context from: ${ORIGINAL__MD_FILENAME_CONST_FOR_TEST} ---\nSrc directory memory\n--- End of Context from: ${ORIGINAL__MD_FILENAME_CONST_FOR_TEST} ---`;

    expect(memoryContent).toBe(expectedContent);
    expect(fileCount).toBe(2);
    expect(mockFs.readFile).toHaveBeenCalledWith(
      projectRootFile,
      'utf-8',
    );
    expect(mockFs.readFile).toHaveBeenCalledWith(srcFile, 'utf-8');
  });

  it('should load ORIGINAL__MD_FILENAME files by downward traversal from CWD', async () => {
    const subDir = path.join(CWD, 'subdir');
    const subDirFile = path.join(
      subDir,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );
    const cwdFile = path.join(
      CWD,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );

    mockFs.access.mockImplementation(async (p) => {
      if (p === cwdFile || p === subDirFile) return undefined;
      throw new Error('File not found');
    });

    mockFs.readFile.mockImplementation(async (p) => {
      if (p === cwdFile) return 'CWD memory';
      if (p === subDirFile) return 'Subdir memory';
      throw new Error('File not found');
    });

    mockFs.readdir.mockImplementation((async (
      p: fsSync.PathLike,
    ): Promise<Dirent[]> => {
      if (p === CWD) {
        return [
          {
            name: ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
            isFile: () => true,
            isDirectory: () => false,
          } as Dirent,
          {
            name: 'subdir',
            isFile: () => false,
            isDirectory: () => true,
          } as Dirent,
        ] as Dirent[];
      }
      if (p === subDir) {
        return [
          {
            name: ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
            isFile: () => true,
            isDirectory: () => false,
          } as Dirent,
        ] as Dirent[];
      }
      return [] as Dirent[];
    }) as unknown as typeof fsPromises.readdir);

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );
    const expectedContent =
      `--- Context from: ${ORIGINAL__MD_FILENAME_CONST_FOR_TEST} ---\nCWD memory\n--- End of Context from: ${ORIGINAL__MD_FILENAME_CONST_FOR_TEST} ---\n\n` +
      `--- Context from: ${path.join('subdir', ORIGINAL__MD_FILENAME_CONST_FOR_TEST)} ---\nSubdir memory\n--- End of Context from: ${path.join('subdir', ORIGINAL__MD_FILENAME_CONST_FOR_TEST)} ---`;

    expect(memoryContent).toBe(expectedContent);
    expect(fileCount).toBe(2);
  });

  it('should load and correctly order global, upward, and downward ORIGINAL__MD_FILENAME files', async () => {
    setMdFilename(ORIGINAL__MD_FILENAME_CONST_FOR_TEST); // Explicitly set for this test

    const globalFileToUse = path.join(
      GLOBAL__DIR,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );
    const projectParentDir = path.dirname(PROJECT_ROOT);
    const projectParentFile = path.join(
      projectParentDir,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );
    const projectRootFile = path.join(
      PROJECT_ROOT,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );
    const cwdFile = path.join(
      CWD,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );
    const subDir = path.join(CWD, 'sub');
    const subDirFile = path.join(
      subDir,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );

    mockFs.stat.mockImplementation(async (p) => {
      if (p === path.join(PROJECT_ROOT, '.git')) {
        return { isDirectory: () => true } as Stats;
      } else if (p === path.join(PROJECT_ROOT, '.')) {
        return { isDirectory: () => true } as Stats;
      }
      throw new Error('File not found');
    });

    mockFs.access.mockImplementation(async (p) => {
      if (
        p === globalFileToUse || // Use the dynamically set global file path
        p === projectParentFile ||
        p === projectRootFile ||
        p === cwdFile ||
        p === subDirFile
      ) {
        return undefined;
      }
      throw new Error('File not found');
    });

    mockFs.readFile.mockImplementation(async (p) => {
      if (p === globalFileToUse) return 'Global memory'; // Use the dynamically set global file path
      if (p === projectParentFile) return 'Project parent memory';
      if (p === projectRootFile) return 'Project root memory';
      if (p === cwdFile) return 'CWD memory';
      if (p === subDirFile) return 'Subdir memory';
      throw new Error('File not found');
    });

    mockFs.readdir.mockImplementation((async (
      p: fsSync.PathLike,
    ): Promise<Dirent[]> => {
      if (p === CWD) {
        return [
          {
            name: 'sub',
            isFile: () => false,
            isDirectory: () => true,
          } as Dirent,
        ] as Dirent[];
      }
      if (p === subDir) {
        return [
          {
            name: ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
            isFile: () => true,
            isDirectory: () => false,
          } as Dirent,
        ] as Dirent[];
      }
      return [] as Dirent[];
    }) as unknown as typeof fsPromises.readdir);

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );

    const relPathGlobal = path.relative(CWD, GLOBAL__FILE);
    const relPathProjectParent = path.relative(CWD, projectParentFile);
    const relPathProjectRoot = path.relative(CWD, projectRootFile);
    const relPathCwd = ORIGINAL__MD_FILENAME_CONST_FOR_TEST;
    const relPathSubDir = path.join(
      'sub',
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );

    const expectedContent = [
      `--- Context from: ${relPathGlobal} ---\nGlobal memory\n--- End of Context from: ${relPathGlobal} ---`,
      `--- Context from: ${relPathProjectParent} ---\nProject parent memory\n--- End of Context from: ${relPathProjectParent} ---`,
      `--- Context from: ${relPathProjectRoot} ---\nProject root memory\n--- End of Context from: ${relPathProjectRoot} ---`,
      `--- Context from: ${relPathCwd} ---\nCWD memory\n--- End of Context from: ${relPathCwd} ---`,
      `--- Context from: ${relPathSubDir} ---\nSubdir memory\n--- End of Context from: ${relPathSubDir} ---`,
    ].join('\n\n');

    expect(memoryContent).toBe(expectedContent);
    expect(fileCount).toBe(5);
  });

  it('should ignore specified directories during downward scan', async () => {
    const ignoredDir = path.join(CWD, 'node_modules');
    const ignoredDirFile = path.join(
      ignoredDir,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    ); // Corrected
    const regularSubDir = path.join(CWD, 'my_code');
    const regularSubDirFile = path.join(
      regularSubDir,
      ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
    );

    mockFs.access.mockImplementation(async (p) => {
      if (p === regularSubDirFile) return undefined;
      if (p === ignoredDirFile)
        throw new Error('Should not access ignored file');
      throw new Error('File not found');
    });

    mockFs.readFile.mockImplementation(async (p) => {
      if (p === regularSubDirFile) return 'My code memory';
      throw new Error('File not found');
    });

    mockFs.readdir.mockImplementation((async (
      p: fsSync.PathLike,
    ): Promise<Dirent[]> => {
      if (p === CWD) {
        return [
          {
            name: 'node_modules',
            isFile: () => false,
            isDirectory: () => true,
          } as Dirent,
          {
            name: 'my_code',
            isFile: () => false,
            isDirectory: () => true,
          } as Dirent,
        ] as Dirent[];
      }
      if (p === regularSubDir) {
        return [
          {
            name: ORIGINAL__MD_FILENAME_CONST_FOR_TEST,
            isFile: () => true,
            isDirectory: () => false,
          } as Dirent,
        ] as Dirent[];
      }
      if (p === ignoredDir) {
        return [] as Dirent[];
      }
      return [] as Dirent[];
    }) as unknown as typeof fsPromises.readdir);

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
    );

    const expectedContent = `--- Context from: ${path.join('my_code', ORIGINAL__MD_FILENAME_CONST_FOR_TEST)} ---\nMy code memory\n--- End of Context from: ${path.join('my_code', ORIGINAL__MD_FILENAME_CONST_FOR_TEST)} ---`;

    expect(memoryContent).toBe(expectedContent);
    expect(fileCount).toBe(1);
    expect(mockFs.readFile).not.toHaveBeenCalledWith(
      ignoredDirFile,
      'utf-8',
    );
  });

  it('should respect MAX_DIRECTORIES_TO_SCAN_FOR_MEMORY during downward scan', async () => {
    const consoleDebugSpy = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => { });

    const dirNames: Dirent[] = [];
    for (let i = 0; i < 250; i++) {
      dirNames.push({
        name: `deep_dir_${i}`,
        isFile: () => false,
        isDirectory: () => true,
      } as Dirent);
    }

    mockFs.readdir.mockImplementation((async (
      p: fsSync.PathLike,
    ): Promise<Dirent[]> => {
      if (p === CWD) return dirNames;
      if (p.toString().startsWith(path.join(CWD, 'deep_dir_')))
        return [] as Dirent[];
      return [] as Dirent[];
    }) as unknown as typeof fsPromises.readdir);
    mockFs.access.mockRejectedValue(new Error('not found'));

    await loadServerHierarchicalMemory(CWD, true, fileService);

    expect(consoleDebugSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG] [BfsFileSearch]'),
      expect.stringContaining('Scanning [200/200]:'),
    );
    consoleDebugSpy.mockRestore();
  });

  it('should load extension context file paths', async () => {
    const extensionFilePath = '/test/extensions/ext1/.md';
    mockFs.access.mockImplementation(async (p) => {
      if (p === extensionFilePath) {
        return undefined;
      }
      throw new Error('File not found');
    });
    mockFs.readFile.mockImplementation(async (p) => {
      if (p === extensionFilePath) {
        return 'Extension memory content';
      }
      throw new Error('File not found');
    });

    const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
      CWD,
      false,
      fileService,
      [extensionFilePath],
    );

    expect(memoryContent).toBe(
      `--- Context from: ${path.relative(CWD, extensionFilePath)} ---\nExtension memory content\n--- End of Context from: ${path.relative(CWD, extensionFilePath)} ---`,
    );
    expect(fileCount).toBe(1);
    expect(mockFs.readFile).toHaveBeenCalledWith(extensionFilePath, 'utf-8');
  });
});

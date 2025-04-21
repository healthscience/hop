import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import FileParser from './helpers/fileParser.js';
import fs from 'fs';

describe('File Processing', () => {
  let fileParser;
  
  beforeAll(async () => {
    fileParser = new FileParser();
    // form a message for the test
    const originalContent = await fileParser.getFileContent('jan3-bitcoin.csv');
    const semicolonContent = originalContent.replace(/,/g, ';');
    
    // Create temporary file
    const tempPath = 'temp-semicolon.csv';
    await fs.promises.writeFile(tempPath, semicolonContent);
    
    try {
      const records = await fileParser.parseCSV(tempPath, { delimiter: ';' });
      expect(records).toBeDefined();
      expect(records.length).toBeGreaterThan(0);
    } finally {
      // Clean up temporary file
      await fs.promises.unlink(tempPath);
    }
  });

  describe('Input small CSV file into node-safeflow and check message OUT', () => {

    it('the data ready for visualization format', async () => {
      // check out data structure
      

    });
/*
    it('should handle malformed CSV data', async () => {
      // Create malformed content by corrupting some rows
      const originalContent = await fileParser.getFileContent('jan3-bitcoin.csv');
      const malformedContent = originalContent.split('\n').map((row, index) => {
        if (index % 3 === 0) {
          return row + ',extra,field'; // Add extra fields to some rows
        }
        return row;
      }).join('\n');
      
      // Create temporary file
      const tempPath = 'temp-malformed.csv';
      await fs.promises.writeFile(tempPath, malformedContent);
      
      try {
        const records = await fileParser.parseCSV(tempPath);
        expect(records).toBeDefined();
        expect(records.length).toBeGreaterThan(0);
      } finally {
        // Clean up temporary file
        await fs.promises.unlink(tempPath);
      }
    });  */
  });
/*
  describe('File System Operations', () => {
    it('should read file content', async () => {
      const content = await fileParser.getFileContent('jan3-bitcoin.csv');
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should get file stats', async () => {
      const stats = await fileParser.getFileStats('jan3-bitcoin.csv');
      expect(stats).toBeDefined();
      expect(stats.size).toBeGreaterThan(0);
    });
  }); */
});
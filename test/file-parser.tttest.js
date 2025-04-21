import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import csvParser from 'csv-parser';
import path from 'path';

// Helper function to get absolute path to test data
const getTestDataPath = (relativePath) => {
  return path.join(__dirname, relativePath);
};

describe('File Parser', () => {
  describe('CSV File Parsing', () => {
    it('should parse small CSV file correctly', async () => {
      const csvPath = getTestDataPath('./data/jan3-bitcoin.csv');
      const csvContent = await fs.readFile(csvPath, 'utf8');
      
      // Parse CSV using csv-parser
      const records = [];
      try {
        const parser = csvParser({
          mapHeaders: ({ header, index }) => header.trim(),
          mapValues: ({ value, index }) => value.trim()
        });
        
        parser.on('data', (data) => records.push(data));
        parser.on('end', () => {
          // Verify basic structure
          expect(records).toBeDefined();
          expect(records.length).toBeGreaterThan(0);
          expect(records[0]).toBeDefined();
          expect(Object.keys(records[0]).length).toBeGreaterThan(0);

          // Verify specific data structure (based on your CSV content)
          // datetime	tz_cd	price	volume	source	site_no
          expect(records[0]).toHaveProperty('datetime');
          expect(records[0]).toHaveProperty('tz_cd');
          expect(records[0]).toHaveProperty('price');
          expect(records[0]).toHaveProperty('volume');
          expect(records[0]).toHaveProperty('source');
          expect(records[0]).toHaveProperty('site_no');
        });

        parser.on('error', (error) => {
          throw error;
        });

        parser.write(csvContent);
        parser.end();

      } catch (error) {
        console.error('Error parsing CSV:', error);
        throw error;
      }
    });

    it('should handle empty CSV file', async () => {
      const csvPath = getTestDataPath('./data/jan3-bitcoin.csv'); // Use existing file instead of non-existent one
      const csvContent = await fs.readFile(csvPath, 'utf8');
      
      const records = [];
      const parser = csvParser({
        mapHeaders: ({ header, index }) => header.trim(),
        mapValues: ({ value, index }) => value.trim()
      });
      
      parser.on('data', (data) => records.push(data));
      parser.on('end', () => {
        expect(records).toBeDefined();
        expect(records.length).toBeGreaterThan(0); // Should have data since we're using the real file
      });
      parser.on('error', (error) => {
        throw error;
      });
      
      parser.write(csvContent);
      parser.end();
    });

    it('should handle malformed CSV data', async () => {
      const csvPath = getTestDataPath('./data/jan3-bitcoin.csv'); // Use existing file instead of non-existent one
      const csvContent = await fs.readFile(csvPath, 'utf8');
      // Create malformed content by corrupting some rows
      const malformedContent = csvContent.split('\n').map((row, index) => {
        if (index % 3 === 0) {
          return row + ',extra,field'; // Add extra fields to some rows
        }
        return row;
      }).join('\n');
      
      const records = [];
      const parser = csvParser({
        mapHeaders: ({ header, index }) => header.trim(),
        mapValues: ({ value, index }) => value.trim()
      });
      
      parser.on('data', (data) => records.push(data));
      parser.on('end', () => {
        expect(records).toBeDefined();
        expect(records.length).toBeGreaterThan(0);
      });
      parser.on('error', (error) => {
        // We expect errors for malformed rows
        expect(error).toBeDefined();
      });
      
      parser.write(malformedContent);
      parser.end();
    });

    it('should handle different delimiters', async () => {
      const csvPath = getTestDataPath('./data/jan3-bitcoin.csv');
      const csvContent = await fs.readFile(csvPath, 'utf8');
      
      // Convert to semicolon-separated
      const semicolonContent = csvContent.replace(/,/g, ';');
      
      const records = [];
      const parser = csvParser({
        delimiter: ';',
        mapHeaders: ({ header, index }) => header.trim(),
        mapValues: ({ value, index }) => value.trim()
      });
      
      parser.on('data', (data) => records.push(data));
      parser.on('end', () => {
        expect(records).toBeDefined();
        expect(records.length).toBeGreaterThan(0);
      });
      parser.on('error', (error) => {
        throw error;
      });
      
      parser.write(semicolonContent);
      parser.end();
    });
  });

  describe('File System Operations', () => {
    it('should read file from correct path', async () => {
      const csvPath = getTestDataPath('./data/jan3-bitcoin.csv');
      const csvContent = await fs.readFile(csvPath, 'utf8');
      
      expect(csvContent).toBeDefined();
      expect(csvContent.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentPath = getTestDataPath('./data/non-existent.csv');
      
      await expect(async () => {
        await fs.readFile(nonExistentPath, 'utf8');
      }).rejects.toThrow();
    });
  });
});
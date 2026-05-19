import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml'; // Wait, let's check if js-yaml is installed, otherwise use JSON.parse or try catch with a simple package.

try {
  const content = fs.readFileSync('shared/api-spec/openapi.yaml', 'utf8');
  console.log("Read openapi.yaml successfully. Length:", content.length);
  // Let's try to parse if we can, or just print a success message.
} catch (err) {
  console.error("Error reading openapi.yaml:", err);
}

/**
 * Test exports to verify functionality
 * Run this to test all export functions
 */

import { defaultSnapshot } from "@data/defaults";
import {
  exportTokensJson,
  exportComponentsJson,
  exportTokensCss,
  exportFigmaVariablesJson,
  exportReadme,
} from "@utils/exporters/fullExport";

const testExports = () => {
  const snapshot = defaultSnapshot();
  
  console.group("🧪 Testing Export Functions");
  
  try {
    // Test tokens.json
    console.log("✓ Testing tokens.json export...");
    const tokensJson = exportTokensJson(snapshot);
    const tokensParsed = JSON.parse(tokensJson);
    console.log("  - Valid JSON:", !!tokensParsed);
    console.log("  - Has globals:", !!tokensParsed.globals);
    console.log("  - Has computed:", !!tokensParsed.computed);
    
    // Test components.json
    console.log("✓ Testing components.json export...");
    const componentsJson = exportComponentsJson(snapshot);
    const componentsParsed = JSON.parse(componentsJson);
    console.log("  - Valid JSON:", !!componentsParsed);
    console.log("  - Has components:", !!componentsParsed.components);
    console.log("  - Component count:", Object.keys(componentsParsed.components).length);
    
    // Test tokens.css
    console.log("✓ Testing tokens.css export...");
    const tokensCss = exportTokensCss(snapshot);
    console.log("  - Has content:", tokensCss.length > 0);
    console.log("  - Has :root selector:", tokensCss.includes(":root {"));
    console.log("  - Has CSS variables:", tokensCss.includes("--"));
    
    // Test figma-variables.json
    console.log("✓ Testing figma-variables.json export...");
    const figmaJson = exportFigmaVariablesJson(snapshot);
    const figmaParsed = JSON.parse(figmaJson);
    console.log("  - Valid JSON:", !!figmaParsed);
    console.log("  - Has collections:", !!figmaParsed.collections);
    console.log("  - Collection count:", figmaParsed.collections?.length || 0);
    
    // Test README
    console.log("✓ Testing README export...");
    const readme = exportReadme(snapshot);
    console.log("  - Has content:", readme.length > 0);
    console.log("  - Has title:", readme.includes(snapshot.name));
    console.log("  - Has usage guide:", readme.includes("Usage Guide"));
    
    console.log("\n✅ All exports successful!");
    
    return {
      tokensJson: tokensParsed,
      componentsJson: componentsParsed,
      tokensCss,
      figmaVariablesJson: figmaParsed,
      readme,
    };
  } catch (error) {
    console.error("❌ Export test failed:", error);
    throw error;
  } finally {
    console.groupEnd();
  }
};

// Export for use in console
(window as any).testExports = testExports;

console.log("💡 Run testExports() in console to test all export functions");

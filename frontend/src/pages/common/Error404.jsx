import React from "react";

// Export con nombre (no "default"): "export *" en index.jsx no re-exporta los default.
export function Error404() {
  return (
    <div>
      <h1>Error 404 Page</h1>
    </div>
  );
}

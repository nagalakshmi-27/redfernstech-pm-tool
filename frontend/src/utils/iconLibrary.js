import * as Icons from "lucide-react";

export const iconLibrary = Object.entries(Icons)
  .filter(([name]) => {
    // Remove helper exports only
    return (
      !name.endsWith("Icon") &&
      name !== "Icon" &&
      name !== "LucideProvider" &&
      name !== "createLucideIcon"
    );
  })
  .map(([name, component]) => ({
    id: name.toLowerCase(),
    name,
    component,
    keywords: [
      name.toLowerCase(),
      ...name
        .replace(/([A-Z])/g, " $1")
        .trim()
        .toLowerCase()
        .split(" "),
    ],
  }));

export default iconLibrary;
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const supportedExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function isFile(candidatePath) {
  if (!existsSync(candidatePath)) {
    return false;
  }

  try {
    return statSync(candidatePath).isFile();
  } catch {
    return false;
  }
}

function resolveAliasPath(specifier) {
  const basePath = path.resolve(process.cwd(), specifier.slice(2));
  const candidates = [
    basePath,
    ...supportedExtensions.map((extension) => `${basePath}${extension}`),
    ...supportedExtensions.map((extension) => path.join(basePath, `index${extension}`)),
  ];

  return candidates.find((candidatePath) => isFile(candidatePath)) ?? null;
}

export function resolve(specifier, context, defaultResolve) {
  if (specifier === "server-only") {
    return {
      shortCircuit: true,
      url: pathToFileURL(path.resolve(process.cwd(), "tests/helpers/server-only-stub.mjs")).href,
    };
  }

  if (!specifier.startsWith("@/")) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  const resolvedPath = resolveAliasPath(specifier);
  if (!resolvedPath) {
    throw new Error(`Unable to resolve test alias import: ${specifier}`);
  }

  return {
    shortCircuit: true,
    url: pathToFileURL(resolvedPath).href,
  };
}

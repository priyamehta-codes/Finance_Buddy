import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Modules that must always be external (native modules and problematic deps)
const alwaysExternal = [
  // Native modules that can't be bundled
  "better-sqlite3",
  "bcrypt",
  "pg",
  "pg-native",
  // Problematic dependencies from @mapbox/node-pre-gyp
  "@mapbox/node-pre-gyp",
  "mock-aws-s3",
  "aws-sdk",
  "nock",
  // Other native/problematic modules
  "bufferutil",
  "utf-8-validate",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  // Filter out allowlisted deps, but always keep alwaysExternal as external
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...alwaysExternal,
  ];
  // Remove duplicates
  const uniqueExternals = [...new Set(externals)];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: uniqueExternals,
    logLevel: "info",
    // Handle .html files and other problematic imports
    loader: {
      ".html": "text",
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

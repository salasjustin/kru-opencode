#!/usr/bin/env -S npx tsx
//
// gen-asset — the graphic-designer specialist's asset generator.
//
// generates (or edits) a raster asset with Google Gemini/Imagen, then runs a
// sharp optimization pass so the output is web-ready (avif/webp, sized) and the
// builder can drop it straight into a project's static/ dir.
//
// official source: @google/genai (Google Gen AI JS SDK). verify model ids /
// params via Context7 (`/googleapis/js-genai`) before changing them — do not
// trust memory. see SOURCES.md.
//
// usage:
//   npm --prefix "{KRU_HOME}/kru" run gen-asset -- \
//     --prompt "abstract brushed-brass texture, warm charcoal ground, no text" \
//     --out ~/projects/jeweler-demo/static/hero.avif \
//     --sizes 1600,800 --formats avif,webp
//
//   # edit / enhance an existing image (Gemini image model, chat mode):
//   npm --prefix "{KRU_HOME}/kru" run gen-asset -- \
//     --input ./client-photo.jpg --prompt "remove background, warm studio light" \
//     --out ~/projects/fastlane/static/product.avif
//
//   # ambient hero VIDEO background (Veo). emits mp4 + webm + poster (avif/webp).
//   # loops are boomeranged by default (veo clips aren't seamless); --boomerang false
//   # keeps the raw one-way clip. --resolution 1080p for crisp full-bleed 16:9 heroes:
//   npm --prefix "{KRU_HOME}/kru" run gen-asset -- \
//     --video --prompt "slow drifting aurora haze over deep charcoal, no people, no text" \
//     --out ~/projects/studio/static/hero.mp4 --vwidth 1600 --aspect 16:9 --resolution 1080p
//
//   # true-alpha CUTOUT (background removal) of an existing photo — via rembg,
//   # NOT gemini (gemini edit models recomposite to an opaque raster, no alpha):
//   npm --prefix "{KRU_HOME}/kru" run gen-asset -- \
//     --cutout --input ./headshot.jpg --out ~/proj/public/broker.webp \
//     --sizes 880 --formats webp     # --rembg-model u2net for objects/products
//
// env: GOOGLE_API_KEY (or GEMINI_API_KEY) — a Google AI Studio key. NOT needed
// for --cutout (rembg runs fully local). video path also needs `ffmpeg`/`ffprobe`
// on PATH. --cutout self-bootstraps a python venv (scripts/.venv-rembg) on first use.
//
import { GoogleGenAI, type Part } from "@google/genai";
import sharp from "sharp";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
  statSync,
  existsSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, extname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

// --- args -----------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    // greedily consume every following token until the next --flag, so an
    // unquoted multi-word value (e.g. a prompt whose quotes the shell dropped)
    // is rejoined instead of truncated to its first word.
    const parts: string[] = [];
    while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      parts.push(argv[++i]);
    }
    out[key] = parts.length ? parts.join(" ") : "true";
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const prompt = args.prompt;
const outPath = args.out;
// gemini-2.5-flash-image ("nano banana") is the general default and the only
// model that supports edit mode. pass an imagen-* id for high-fidelity t2i.
const model = args.model ?? "gemini-2.5-flash-image";
const inputPath = args.input; // when set: edit/enhance this image instead of pure t2i
// --cutout: true-alpha background removal via rembg (local, no API key). gemini
// edit models can't emit alpha — they recomposite onto an opaque matte — so real
// cutouts route here, not through --input on a gemini model.
const isCutout = args.cutout === "true";
// u2net_human_seg is tuned for people (client portraits, headshots); pass
// --rembg-model u2net for objects/products, or any other rembg model id.
const rembgModel = args["rembg-model"] ?? "u2net_human_seg";
const formats = (args.formats ?? (extname(outPath ?? "").slice(1) || "avif"))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const sizes = (args.sizes ?? "")
  .split(",")
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n) && n > 0);
const quality = parseInt(args.quality ?? "72", 10);
// imagen-only: native output size ("1K" default, "2K" largest crisp t2i).
// aspectRatio uses the same --aspect flag as video (default 16:9). ignored by gemini.
const imageSize = args["image-size"] ?? "1K";
const imgAspect = args.aspect ?? "16:9";

// --- video (veo) opts -----------------------------------------------------
// video path is chosen by --video or by passing a veo-* model. everything below
// only applies to that path; the image path ignores it.
const isVideo = args.video === "true" || model.startsWith("veo");
// veo-3.0-fast is the cheap default for ambient loops; override with --model veo-*.
const videoModel = model.startsWith("veo")
  ? model
  : "veo-3.0-fast-generate-001";
const aspect = args.aspect ?? "16:9";
// ambient hero bg wants no people, but the accepted personGeneration values differ
// by model: veo-3.1 preview only accepts 'allow_all' (it rejects dont_allow AND
// allow_adult), while older veo accepts 'dont_allow'. default per model so a
// no-people run doesn't hit a hard API rejection; the prompt still forbids people.
const personGeneration =
  args["person-generation"] ??
  (videoModel.includes("veo-3.1") ? "allow_all" : "dont_allow");
const vwidth = parseInt(args.vwidth ?? "", 10); // optional: scale video to this width (keeps aspect)
// veo native resolution: 720p default, 1080p for full-bleed heroes so a 16:9
// background isn't an upscaled 720p. field is GenerateVideosConfig.resolution.
const resolution = args.resolution ?? "720p";
// veo clips (~8s) do not loop seamlessly. boomerang by default — forward then
// reverse, dropping the duplicated turn + wrap frames — so the loop point is
// invisible. --boomerang false keeps the raw one-way clip.
const boomerang = args.boomerang !== "false";
// poster is a still image, so it gets image formats regardless of the --out (.mp4) ext.
const posterFormats = (args["poster-formats"] ?? "avif,webp")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!outPath || (!prompt && !isCutout)) {
  console.error(
    "error: --out is required (and --prompt too, unless --cutout).\n" +
      "see the header of scripts/gen-asset.ts for usage.",
  );
  process.exit(1);
}

const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
if (!apiKey && !isCutout) {
  // cutout runs fully local through rembg — no Google key needed.
  console.error(
    "error: set GOOGLE_API_KEY (or GEMINI_API_KEY) to a Google AI Studio key.",
  );
  process.exit(1);
}

// --- generate -------------------------------------------------------------

const ai = new GoogleGenAI({ apiKey });

// returns the raw generated image bytes (png-ish) from whichever model path applies.
async function generate(): Promise<Buffer> {
  // imagen path: high-fidelity text-to-image via generateImages.
  if (model.startsWith("imagen")) {
    if (inputPath) {
      throw new Error(
        "edit mode (--input) requires a gemini image model, not imagen.",
      );
    }
    const res = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        includeRaiReason: true,
        aspectRatio: imgAspect,
        imageSize,
      },
    });
    const b64 = res.generatedImages?.[0]?.image?.imageBytes;
    if (!b64) {
      throw new Error(
        `imagen returned no image (rai: ${res.generatedImages?.[0]?.raiFilteredReason ?? "n/a"})`,
      );
    }
    return Buffer.from(b64, "base64");
  }

  // gemini image path. edit mode sends the source image in chat; otherwise pure t2i.
  let parts: Part[] | undefined;
  if (inputPath) {
    const srcB64 = readFileSync(inputPath).toString("base64");
    const chat = ai.chats.create({ model });
    const res = await chat.sendMessage({
      message: [
        { inlineData: { mimeType: "image/png", data: srcB64 } },
        { text: prompt },
      ],
    });
    parts = res.candidates?.[0]?.content?.parts;
  } else {
    const res = await ai.models.generateContent({ model, contents: prompt });
    parts = res.candidates?.[0]?.content?.parts;
  }

  const imgPart = parts?.find((p) => p.inlineData?.data);
  if (!imgPart?.inlineData?.data) {
    const text = parts?.find((p) => p.text)?.text;
    throw new Error(
      `model returned no image${text ? ` (said: ${text.slice(0, 200)})` : ""}`,
    );
  }
  return Buffer.from(imgPart.inlineData.data, "base64");
}

// --- optimize + write -----------------------------------------------------

// emits one file per (size × format). single-size keeps the plain --out name;
// multi-size appends -<width>w before the extension so responsive variants are distinct.
async function optimizeAndWrite(raw: Buffer): Promise<string[]> {
  const dir = dirname(outPath);
  mkdirSync(dir, { recursive: true });
  const stem = basename(outPath, extname(outPath));
  const widths = sizes.length ? sizes : [null]; // null = keep intrinsic width
  const written: string[] = [];

  for (const w of widths) {
    for (const fmt of formats) {
      const suffix = w && widths.length > 1 ? `-${w}w` : "";
      const file = join(dir, `${stem}${suffix}.${fmt}`);
      let pipe = sharp(raw, { failOn: "none" });
      if (w) pipe = pipe.resize({ width: w, withoutEnlargement: true });
      // keep cutout alpha crisp; sharp ignores alphaQuality on opaque sources.
      const buf = await pipe
        .toFormat(fmt as keyof sharp.FormatEnum, {
          quality,
          ...(fmt === "webp" ? { alphaQuality: 100 } : {}),
        })
        .toBuffer();
      writeFileSync(file, buf);
      written.push(`${file} (${(buf.length / 1024).toFixed(0)} KB)`);
    }
  }
  return written;
}

// --- video: generate (veo) + web-encode -----------------------------------

// veo is a long-running async operation: kick it off, poll until done, then
// pull the mp4 bytes from the returned uri.
async function generateVideo(): Promise<Buffer> {
  let op = await ai.models.generateVideos({
    model: videoModel,
    prompt,
    config: { numberOfVideos: 1, aspectRatio: aspect, personGeneration, resolution },
  });
  while (!op.done) {
    await new Promise((r) => setTimeout(r, 10000));
    process.stderr.write(".");
    op = await ai.operations.getVideosOperation({ operation: op });
  }
  process.stderr.write("\n");

  const vid = op.response?.generatedVideos?.[0];
  const uri = vid?.video?.uri;
  if (!uri) {
    const reason = op.response?.raiMediaFilteredReasons?.[0] ?? "n/a";
    throw new Error(`veo returned no video (rai: ${reason})`);
  }
  // ai-studio download uris need the api key appended as a query param.
  const resp = await fetch(uri.includes("key=") ? uri : `${uri}&key=${apiKey}`);
  if (!resp.ok)
    throw new Error(`video download failed: ${resp.status} ${resp.statusText}`);
  return Buffer.from(await resp.arrayBuffer());
}

const kb = (f: string) => `${f} (${(statSync(f).size / 1024).toFixed(0)} KB)`;

// transcodes the raw veo mp4 into drop-in hero-loop assets: a webm (vp9, small,
// listed first in <video>), an mp4 (h264, universal fallback), and a poster
// still so the hero paints instantly while the video buffers. audio is stripped
// — ambient backgrounds are silent — and playback is muted+loop on the builder side.
async function encodeVideo(raw: Buffer): Promise<string[]> {
  const dir = dirname(outPath);
  mkdirSync(dir, { recursive: true });
  const stem = basename(outPath, extname(outPath));
  const srcFile = join(dir, `${stem}.src.mp4`);
  writeFileSync(srcFile, raw);
  const scale =
    Number.isFinite(vwidth) && vwidth > 0 ? ["-vf", `scale=${vwidth}:-2`] : [];
  // filter args for the loop assets (webm/mp4). boomerang needs frame-exact
  // trims, so count the source frames with ffprobe (already required for video).
  let loopFilter = scale;
  if (boomerang) {
    const frames = parseInt(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-count_frames",
        "-show_entries",
        "stream=nb_read_frames",
        "-of",
        "csv=p=0",
        srcFile,
      ])
        .toString()
        .trim(),
      10,
    );
    if (Number.isFinite(frames) && frames > 2) {
      // forward plays frames 0..n-1; reverse contributes n-2..1, so neither the
      // turn frame (n-1) nor the wrap frame (0) appears twice in the loop.
      const graph =
        `[0:v]split[a][b];` +
        `[a]setpts=PTS-STARTPTS[f];` +
        `[b]reverse,trim=start_frame=1:end_frame=${frames - 1},setpts=PTS-STARTPTS[r];` +
        `[f][r]concat=n=2:v=1` +
        (scale.length ? `,scale=${vwidth}:-2` : "") +
        `[v]`;
      loopFilter = ["-filter_complex", graph, "-map", "[v]"];
    } else {
      console.error("boomerang skipped: could not count source frames.");
    }
  }
  const written: string[] = [];

  const webm = join(dir, `${stem}.webm`);
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      srcFile,
      "-an",
      ...loopFilter,
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "34",
      webm,
    ],
    { stdio: "ignore" },
  );
  written.push(kb(webm));

  const mp4 = join(dir, `${stem}.mp4`);
  execFileSync(
    "ffmpeg",
    // faststart moves the moov atom to the front so playback can begin before full download.
    [
      "-y",
      "-i",
      srcFile,
      "-an",
      ...loopFilter,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "24",
      "-movflags",
      "+faststart",
      mp4,
    ],
    { stdio: "ignore" },
  );
  written.push(kb(mp4));

  // grab the first frame, then optimize it through the same sharp path the image assets use.
  const posterPng = join(dir, `${stem}.poster.png`);
  execFileSync(
    "ffmpeg",
    ["-y", "-i", srcFile, "-frames:v", "1", ...scale, posterPng],
    { stdio: "ignore" },
  );
  const posterRaw = readFileSync(posterPng);
  for (const fmt of posterFormats) {
    const file = join(dir, `${stem}-poster.${fmt}`);
    const buf = await sharp(posterRaw)
      .toFormat(fmt as keyof sharp.FormatEnum, { quality })
      .toBuffer();
    writeFileSync(file, buf);
    written.push(`${file} (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  unlinkSync(posterPng);
  unlinkSync(srcFile);
  return written;
}

// --- cutout: rembg (true-alpha background removal, fully local) ------------

// resolve a dedicated venv next to this script; created lazily on first cutout.
const scriptDir = dirname(fileURLToPath(import.meta.url));

// strips the background to true alpha with rembg and returns the PNG bytes,
// which then flow through the same sharp optimize/resize path as generated art.
// rembg + its onnxruntime dep lack wheels for the newest python, so bootstrap a
// venv with the first python (3.12→3.11→3) that has them. the onnx model itself
// caches to ~/.u2net on first use.
function runRembgCutout(): Buffer {
  if (!inputPath) throw new Error("--cutout requires --input <image>.");
  const venvDir = join(scriptDir, ".venv-rembg");
  const rembgBin = join(venvDir, "bin", "rembg");
  if (!existsSync(rembgBin)) {
    const py = ["python3.12", "python3.11", "python3"].find((p) => {
      try {
        execFileSync(p, ["--version"], { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    });
    if (!py) throw new Error("no python3 on PATH to bootstrap rembg.");
    console.error(
      `bootstrapping rembg venv (${py}) — first run only, downloads deps…`,
    );
    execFileSync(py, ["-m", "venv", venvDir], { stdio: "inherit" });
    execFileSync(
      join(venvDir, "bin", "pip"),
      ["install", "-q", "--upgrade", "pip"],
      { stdio: "inherit" },
    );
    execFileSync(
      join(venvDir, "bin", "pip"),
      ["install", "-q", "rembg[cpu,cli]"],
      { stdio: "inherit" },
    );
  }
  // -a = alpha matting (cleaner hair/soft edges than a hard mask).
  const tmp = join(
    dirname(outPath),
    `.cutout-${basename(outPath, extname(outPath))}.png`,
  );
  mkdirSync(dirname(outPath), { recursive: true });
  execFileSync(rembgBin, ["i", "-m", rembgModel, "-a", inputPath, tmp], {
    stdio: "inherit",
  });
  const buf = readFileSync(tmp);
  unlinkSync(tmp);
  return buf;
}

// --- run ------------------------------------------------------------------

try {
  let written: string[];
  if (isVideo) {
    console.error(
      `generating video with ${videoModel} (veo is async — this can take a few minutes)…`,
    );
    written = await encodeVideo(await generateVideo());
  } else if (isCutout) {
    console.error(`cutting out background with rembg (${rembgModel})…`);
    written = await optimizeAndWrite(runRembgCutout());
  } else {
    console.error(
      `generating with ${model}${inputPath ? " (edit mode)" : ""}…`,
    );
    written = await optimizeAndWrite(await generate());
  }
  console.error("wrote:");
  for (const w of written) console.error(`  ${w}`);
} catch (err) {
  console.error(`gen-asset failed: ${(err as Error).message}`);
  process.exit(1);
}

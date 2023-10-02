/**
 * Simple server app for serving generated examples locally
 * Based on: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
 */
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const port = 3000;

const MIME_TYPES: Record<string,string> = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "application/javascript",
  css: "text/css",
};

const STATIC_PATH = path.join(process.cwd(), "./public");

const toBool = [() => true, () => false];

const prepareFile = async (url: string) => {
  const paths = [STATIC_PATH, url];
  if (url.endsWith("/")) {
    paths.push("index.html");
  }
  const filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  // there's no 404, just redirect to index.html in all other cases
  const streamPath = found ? filePath : STATIC_PATH + "/index.html";
  const ext = path.extname(streamPath).substring(1).toLowerCase();
  const stream = fs.createReadStream(streamPath);
  return { found, ext, stream };
};

http
  .createServer(async (req, res) => {
    const file = await prepareFile(req.url!);
    const statusCode = file.found ? 200 : 404;
    const mimeType: string = MIME_TYPES[file.ext] || MIME_TYPES.default;
    res.writeHead(statusCode, { "Content-Type": mimeType });
    file.stream.pipe(res);
    console.log(`${req.method} ${req.url} ${statusCode}`);
  })
  .listen(port);

console.log(`Server for MiniLogo assets listening on http://localhost:${port}`);


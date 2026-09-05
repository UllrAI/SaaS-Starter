import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const database = new URL(required("DATABASE_URL"));
const bucket = required("R2_BACKUP_BUCKET");
const client = new S3Client({
  region: "auto",
  endpoint: required("R2_ENDPOINT"),
  credentials: {
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  },
});
const directory = await mkdtemp(join(tmpdir(), "saas-backup-"));
const file = join(directory, "database.dump");
try {
  // The runner's SSH tunnel is on the Docker host network. Pass credentials
  // through the environment, never Docker arguments or workflow output.
  await new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "run",
        "--rm",
        "--network",
        "host",
        "--user",
        `${process.getuid()}:${process.getgid()}`,
        "-e",
        "PGHOST",
        "-e",
        "PGPORT",
        "-e",
        "PGUSER",
        "-e",
        "PGPASSWORD",
        "-e",
        "PGDATABASE",
        "-v",
        `${directory}:/backup`,
        "postgres:17",
        "pg_dump",
        "--format=custom",
        "--no-owner",
        "--no-acl",
        "--file=/backup/database.dump",
      ],
      {
        env: {
          ...process.env,
          PGHOST: database.hostname,
          PGPORT: database.port || "5432",
          PGUSER: decodeURIComponent(database.username),
          PGPASSWORD: decodeURIComponent(database.password),
          PGDATABASE: decodeURIComponent(database.pathname.slice(1)),
        },
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`pg_dump exited with ${code}.`)),
    );
  });
  const { size } = await stat(file);
  const key = `postgresql/${new Date().toISOString().replaceAll(":", "-")}.dump`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(file),
      ContentLength: size,
      ContentType: "application/octet-stream",
    }),
  );
  console.log(`Database backup saved: ${key} (${size} bytes).`);
} finally {
  client.destroy();
  await rm(directory, { recursive: true, force: true });
}

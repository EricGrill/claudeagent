import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSettingsByCategory, getStorageStatus, ServiceStatus } from "./settings";

let s3Client: S3Client | null = null;
let currentConfig: StorageConfig | null = null;

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
  fallbackHtml?: string;
}

export interface StorageFile {
  key: string;
  size: number;
  lastModified?: Date;
  url: string;
}

async function getStorageConfig(): Promise<StorageConfig | null> {
  const settings = await getSettingsByCategory("storage");
  
  const endpoint = settings["storage.endpoint"];
  const accessKeyId = settings["storage.accessKeyId"];
  const secretAccessKey = settings["storage.secretAccessKey"];
  const bucket = settings["storage.bucket"];

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    endpoint,
    region: settings["storage.region"] || "us-east-1",
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl: settings["storage.publicUrl"] || undefined,
  };
}

async function getS3Client(): Promise<S3Client | null> {
  const config = await getStorageConfig();
  
  if (!config) {
    s3Client = null;
    currentConfig = null;
    return null;
  }

  // Check if config changed and we need a new client
  if (
    s3Client &&
    currentConfig &&
    currentConfig.endpoint === config.endpoint &&
    currentConfig.accessKeyId === config.accessKeyId &&
    currentConfig.secretAccessKey === config.secretAccessKey &&
    currentConfig.region === config.region
  ) {
    return s3Client;
  }

  // Create new client with updated config
  s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Required for MinIO and many S3-compatible services
  });
  
  currentConfig = config;
  return s3Client;
}

export async function isStorageEnabled(): Promise<boolean> {
  const status = await getStorageStatus();
  return status.enabled;
}

export async function getStatus(): Promise<ServiceStatus> {
  return getStorageStatus();
}

function generateLocalFallbackHtml(content: string, filename: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Download: ${filename}</title>
  <script>
    function downloadFile() {
      const content = ${JSON.stringify(content)};
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ${JSON.stringify(filename)};
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    downloadFile();
  </script>
</head>
<body>
  <noscript>
    <p>JavaScript is required to download this file. Please enable JavaScript and refresh the page.</p>
  </noscript>
  <p>Your download should start automatically. If not, <a href="javascript:downloadFile()">click here</a>.</p>
</body>
</html>`;
}

export async function uploadFile(
  key: string,
  content: Buffer | string,
  contentType?: string
): Promise<UploadResult> {
  const client = await getS3Client();
  const config = await getStorageConfig();

  if (!client || !config) {
    // Graceful degradation: return HTML download fallback
    const stringContent = typeof content === "string" ? content : content.toString("utf-8");
    const filename = key.split("/").pop() || "download";
    return {
      success: false,
      error: "Storage not configured",
      fallbackHtml: generateLocalFallbackHtml(stringContent, filename),
    };
  }

  try {
    const body = typeof content === "string" ? Buffer.from(content) : content;
    
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      })
    );

    const url = config.publicUrl
      ? `${config.publicUrl.replace(/\/$/, "")}/${key}`
      : `${config.endpoint}/${config.bucket}/${key}`;

    return {
      success: true,
      key,
      url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to upload: ${message}`,
    };
  }
}

export async function downloadFile(key: string): Promise<Buffer | null> {
  const client = await getS3Client();
  const config = await getStorageConfig();

  if (!client || !config) {
    return null;
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );

    if (response.Body) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<boolean> {
  const client = await getS3Client();
  const config = await getStorageConfig();

  if (!client || !config) {
    return false;
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function fileExists(key: string): Promise<boolean> {
  const client = await getS3Client();
  const config = await getStorageConfig();

  if (!client || !config) {
    return false;
  }

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(prefix?: string): Promise<StorageFile[]> {
  const client = await getS3Client();
  const config = await getStorageConfig();

  if (!client || !config) {
    return [];
  }

  try {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
      })
    );

    const files: StorageFile[] = (response.Contents || []).map((item) => ({
      key: item.Key || "",
      size: item.Size || 0,
      lastModified: item.LastModified,
      url: config.publicUrl
        ? `${config.publicUrl.replace(/\/$/, "")}/${item.Key}`
        : `${config.endpoint}/${config.bucket}/${item.Key}`,
    }));

    return files;
  } catch {
    return [];
  }
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const client = await getS3Client();
  const config = await getStorageConfig();

  if (!client || !config) {
    return { success: false, error: "Storage not configured" };
  }

  try {
    await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        MaxKeys: 1,
      })
    );
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

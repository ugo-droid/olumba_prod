// =============================
// Storage Abstraction Layer
// =============================
// Designed for easy migration from Supabase Storage to S3 or other providers
// Current implementation: Supabase Storage
// Future: AWS S3, Google Cloud Storage, Azure Blob Storage

import { supabaseAdmin } from './supabaseAdmin';

// Storage tier limits (in bytes)
export const STORAGE_LIMITS = {
  STARTER: {
    MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024,      // 2 GB
    TOTAL_STORAGE: 20 * 1024 * 1024 * 1024,     // 20 GB
  },
  PRO: {
    MAX_FILE_SIZE: 20 * 1024 * 1024 * 1024,     // 20 GB
    TOTAL_STORAGE: 100 * 1024 * 1024 * 1024,    // 100 GB
  },
  STUDIO: {
    MAX_FILE_SIZE: 500 * 1024 * 1024 * 1024,    // 500 GB
    TOTAL_STORAGE: 2 * 1024 * 1024 * 1024 * 1024, // 2 TB
  },
} as const;

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File | Buffer;
  contentType?: string;
  organizationId?: string;
  userId?: string;
}

export interface DownloadOptions {
  bucket: string;
  path: string;
}

export interface DeleteOptions {
  bucket: string;
  path: string;
}

export interface ListOptions {
  bucket: string;
  prefix?: string;
  limit?: number;
  offset?: number;
}

export interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
  percentUsed: number;
  fileCount: number;
}

/**
 * Storage Provider Interface
 * Implement this interface to add support for different storage backends
 */
export interface StorageProvider {
  upload(options: UploadOptions): Promise<{ path: string; url: string }>;
  download(options: DownloadOptions): Promise<Blob>;
  delete(options: DeleteOptions): Promise<void>;
  list(options: ListOptions): Promise<{ name: string; size: number }[]>;
  getUsage(organizationId: string): Promise<StorageUsage>;
  getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
}

/**
 * Supabase Storage Implementation
 */
class SupabaseStorageProvider implements StorageProvider {
  /**
   * Upload a file to Supabase Storage
   */
  async upload(options: UploadOptions): Promise<{ path: string; url: string }> {
    const { bucket, path, file, contentType } = options;

    // Convert File to ArrayBuffer if needed
    const fileData = file instanceof File ? await file.arrayBuffer() : file;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, fileData, {
        contentType: contentType || 'application/octet-stream',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  }

  /**
   * Download a file from Supabase Storage
   */
  async download(options: DownloadOptions): Promise<Blob> {
    const { bucket, path } = options;

    const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);

    if (error) {
      console.error('Storage download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a file from Supabase Storage
   */
  async delete(options: DeleteOptions): Promise<void> {
    const { bucket, path } = options;

    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List files in a bucket/folder
   */
  async list(options: ListOptions): Promise<{ name: string; size: number }[]> {
    const { bucket, prefix = '', limit = 100, offset = 0 } = options;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Storage list error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data.map((file) => ({
      name: file.name,
      size: file.metadata?.size || 0,
    }));
  }

  /**
   * Get storage usage for an organization
   * Note: This is a simplified implementation
   * For production, track usage in database for better performance
   */
  async getUsage(organizationId: string): Promise<StorageUsage> {
    // Query database for organization's tier and file records
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('tier')
      .eq('id', organizationId)
      .single();

    const tier = (org?.tier || 'STARTER').toUpperCase() as keyof typeof STORAGE_LIMITS;
    const totalBytes = STORAGE_LIMITS[tier]?.TOTAL_STORAGE || STORAGE_LIMITS.STARTER.TOTAL_STORAGE;

    // Query all files for this organization
    const { data: files } = await supabaseAdmin
      .from('documents')
      .select('file_size')
      .eq('organization_id', organizationId);

    const usedBytes = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
    const fileCount = files?.length || 0;

    return {
      usedBytes,
      totalBytes,
      percentUsed: (usedBytes / totalBytes) * 100,
      fileCount,
    };
  }

  /**
   * Get a signed URL for temporary file access
   */
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Storage signed URL error:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}

/**
 * AWS S3 Storage Implementation (Placeholder for future)
 */
class S3StorageProvider implements StorageProvider {
  async upload(options: UploadOptions): Promise<{ path: string; url: string }> {
    // TODO: Implement S3 upload using AWS SDK
    throw new Error('S3 storage not yet implemented');
  }

  async download(options: DownloadOptions): Promise<Blob> {
    throw new Error('S3 storage not yet implemented');
  }

  async delete(options: DeleteOptions): Promise<void> {
    throw new Error('S3 storage not yet implemented');
  }

  async list(options: ListOptions): Promise<{ name: string; size: number }[]> {
    throw new Error('S3 storage not yet implemented');
  }

  async getUsage(organizationId: string): Promise<StorageUsage> {
    throw new Error('S3 storage not yet implemented');
  }

  async getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string> {
    throw new Error('S3 storage not yet implemented');
  }
}

/**
 * Storage Factory - Returns the configured storage provider
 */
function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'supabase';

  switch (provider.toLowerCase()) {
    case 's3':
    case 'aws':
      return new S3StorageProvider();
    case 'supabase':
    default:
      return new SupabaseStorageProvider();
  }
}

// Export singleton instance
export const storage = createStorageProvider();

/**
 * Helper functions for common storage operations
 */
export const StorageHelpers = {
  /**
   * Check if file size is within tier limits
   */
  isFileSizeAllowed(fileSize: number, tier: keyof typeof STORAGE_LIMITS): boolean {
    return fileSize <= STORAGE_LIMITS[tier].MAX_FILE_SIZE;
  },

  /**
   * Check if organization has enough storage space
   */
  async hasStorageSpace(
    organizationId: string,
    additionalBytes: number
  ): Promise<{ allowed: boolean; current: StorageUsage }> {
    const usage = await storage.getUsage(organizationId);
    const allowed = usage.usedBytes + additionalBytes <= usage.totalBytes;

    return { allowed, current: usage };
  },

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Generate unique file path
   */
  generateFilePath(organizationId: string, projectId: string, filename: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = filename.split('.').pop();
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${organizationId}/${projectId}/${timestamp}-${randomStr}-${cleanName}`;
  },
};



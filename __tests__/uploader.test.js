const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary } = require('../lib/uploader');

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn()
    }
  }
}));

describe('Cloudinary Uploader', () => {
  const mockConfig = {
    cloud_name: 'test-cloud',
    api_key: 'test-key',
    api_secret: 'test-secret',
    folder: 'test-safari'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should configure cloudinary with provided credentials', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image.jpg',
      public_id: 'test/image',
      bytes: 1024
    });

    const results = [{
      outputPath: '/tmp/test.jpg',
      optimizedSize: 1024
    }];

    await uploadToCloudinary(results, mockConfig);

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
      secure: true
    });
  });

  test('should upload all images successfully', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image1.jpg',
      public_id: 'test/image1',
      bytes: 1024
    });

    const results = [
      { outputPath: '/tmp/image1.jpg', optimizedSize: 1024 },
      { outputPath: '/tmp/image2.jpg', optimizedSize: 2048 }
    ];

    const uploadResult = await uploadToCloudinary(results, mockConfig);

    expect(uploadResult.uploaded).toHaveLength(2);
    expect(uploadResult.failed).toHaveLength(0);
    expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(2);
  });

  test('should use correct upload options', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image.jpg',
      public_id: 'test/image',
      bytes: 1024
    });

    const results = [{ outputPath: '/tmp/safari-lion.jpg', optimizedSize: 1024 }];
    await uploadToCloudinary(results, mockConfig);

    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
      '/tmp/safari-lion.jpg',
      expect.objectContaining({
        folder: 'test-safari',
        public_id: 'safari-lion',
        overwrite: true,
        resource_type: 'image',
        context: expect.objectContaining({
          alt: expect.stringContaining('safari'),
          source: 'safari-image-optimizer'
        }),
        tags: ['safari', 'optimized', 'watermarked']
      })
    );
  });

  test('should handle upload failures gracefully', async () => {
    cloudinary.uploader.upload
      .mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image1.jpg',
        public_id: 'test/image1',
        bytes: 1024
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const results = [
      { outputPath: '/tmp/image1.jpg', optimizedSize: 1024 },
      { outputPath: '/tmp/image2.jpg', optimizedSize: 2048 }
    ];

    const uploadResult = await uploadToCloudinary(results, mockConfig);

    expect(uploadResult.uploaded).toHaveLength(1);
    expect(uploadResult.failed).toHaveLength(1);
    expect(uploadResult.failed[0].file).toBe('image2');
  });

  test('should handle empty results array', async () => {
    const uploadResult = await uploadToCloudinary([], mockConfig);
    expect(uploadResult.uploaded).toHaveLength(0);
    expect(uploadResult.failed).toHaveLength(0);
    expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
  });

  test('should handle cloudinary API errors', async () => {
    cloudinary.uploader.upload.mockRejectedValue(new Error('Invalid API credentials'));

    const results = [{ outputPath: '/tmp/test.jpg', optimizedSize: 1024 }];
    const uploadResult = await uploadToCloudinary(results, mockConfig);

    expect(uploadResult.uploaded).toHaveLength(0);
    expect(uploadResult.failed).toHaveLength(1);
  });
});

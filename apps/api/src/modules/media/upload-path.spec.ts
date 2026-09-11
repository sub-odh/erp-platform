import { parseStoredUploadPath } from './upload-path';

describe('parseStoredUploadPath', () => {
  it('accepts a stored procurement document path', () => {
    const parsed = parseStoredUploadPath(
      '/uploads/procurement/550e8400-e29b-41d4-a716-446655440000.pdf',
    );

    expect(parsed).toEqual({
      folder: 'procurement',
      fileName: '550e8400-e29b-41d4-a716-446655440000.pdf',
      relativePath: 'procurement/550e8400-e29b-41d4-a716-446655440000.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('rejects path traversal and unknown folders', () => {
    expect(parseStoredUploadPath('/uploads/../etc/passwd')).toBeNull();
    expect(
      parseStoredUploadPath(
        '/uploads/tmp/550e8400-e29b-41d4-a716-446655440000.png',
      ),
    ).toBeNull();
    expect(
      parseStoredUploadPath(
        '/uploads/users/550e8400-e29b-41d4-a716-446655440000.png/../../x',
      ),
    ).toBeNull();
  });
});

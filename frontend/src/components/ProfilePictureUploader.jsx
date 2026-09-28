import React, { useState, useRef } from 'react';

const getAvatarUrl = (path, apiUrl) => {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiUrl}${path}`;
};

const ProfilePictureUploader = ({ user, onUpdate, apiUrl, role = 'student' }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const initials = (user?.full_name || user?.username || (role === 'lecturer' ? 'LC' : 'ST'))
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFeedback({
        type: 'error',
        text: 'Invalid file format. Please select a PNG, JPG, JPEG, WEBP, or GIF image.'
      });
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        text: 'File is too large. Maximum image size is 5MB.'
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFeedback({ type: '', text: '' });
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    setIsUploading(true);
    setFeedback({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${apiUrl}/users/${user.id}/profile-picture`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const updatedUser = {
          ...user,
          profile_picture: data.profile_picture || data.user?.profile_picture,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUpdate(updatedUser);

        setSelectedFile(null);
        setPreviewUrl(null);
        setFeedback({
          type: 'success',
          text: 'Profile picture updated successfully! 🎉'
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.detail || data.message || 'Failed to upload profile picture.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'Network error while uploading. Please check connection.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFeedback({ type: '', text: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!user?.id || !user?.profile_picture) return;

    if (!window.confirm('Are you sure you want to remove your profile picture and restore your initials avatar?')) {
      return;
    }

    setIsRemoving(true);
    setFeedback({ type: '', text: '' });

    try {
      const response = await fetch(`${apiUrl}/users/${user.id}/profile-picture`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const updatedUser = {
          ...user,
          profile_picture: null,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUpdate(updatedUser);

        setSelectedFile(null);
        setPreviewUrl(null);
        setFeedback({
          type: 'success',
          text: 'Profile picture removed. Reverted to initials avatar.'
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.detail || 'Failed to remove profile picture.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error. Please try again.'
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const currentDisplayUrl = previewUrl || (user?.profile_picture ? getAvatarUrl(user.profile_picture, apiUrl) : null);

  const themeAccent = role === 'lecturer' ? '#f59e0b' : '#3b82f6';
  const roleLabel = role === 'lecturer' ? 'Lecturer' : 'Student';

  return (
    <div className="card profile-picture-card" style={{ margin: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.18rem', margin: 0, fontWeight: 700 }}>
            📸 {roleLabel} Profile Picture
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Upload a custom photo for your digital badge, sidebar, and navbar
          </p>
        </div>
        {user?.profile_picture && (
          <span style={{
            fontSize: '0.7rem',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '3px 8px',
            borderRadius: '999px',
            fontWeight: 700,
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            ✓ Custom Photo Active
          </span>
        )}
      </div>

      {feedback.text && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          color: feedback.type === 'error' ? '#f87171' : '#34d399',
          border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
        }}>
          <span>{feedback.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        {/* Avatar Display Container */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            title="Click to select image file"
            style={{
              width: '104px',
              height: '104px',
              borderRadius: '20px',
              border: `3px solid ${themeAccent}`,
              boxShadow: `0 8px 24px ${themeAccent}33`,
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: role === 'lecturer'
                ? 'linear-gradient(135deg, #d97706, #92400e)'
                : 'linear-gradient(135deg, #2563eb, #7c3aed)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            {currentDisplayUrl ? (
              <img
                src={currentDisplayUrl}
                alt="Profile Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff' }}>
                {initials}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: '-6px',
              background: 'var(--card-bg, #1e293b)',
              color: 'var(--text-main, #f8fafc)',
              border: `2px solid ${themeAccent}`,
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontSize: '0.85rem'
            }}
            title="Choose new image"
          >
            📷
          </button>
        </div>

        {/* Action Controls & Guidelines */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            style={{ display: 'none' }}
          />

          {!selectedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 'fit-content',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  fontSize: '0.88rem'
                }}
              >
                <span>📁</span>
                <span>Select New Picture</span>
              </button>

              {user?.profile_picture && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  style={{
                    width: 'fit-content',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    cursor: isRemoving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px'
                  }}
                >
                  <span>🗑️</span>
                  <span>{isRemoving ? 'Removing...' : 'Remove Photo'}</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.04)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px dashed var(--border)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedFile.name}</div>
                <div>{(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload</div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={isUploading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '0.85rem'
                  }}
                >
                  {isUploading ? (
                    <>
                      <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>⬆️</span>
                      <span>Save & Apply</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancel}
                  disabled={isUploading}
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '12px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Supported formats: <strong>PNG, JPG, WEBP, GIF</strong> (Max: 5MB). Photo updates across all views immediately.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUploader;

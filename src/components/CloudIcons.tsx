import React from 'react';

// Crisp, lightweight, 0ms-delay vector icons for cloud storage providers

export const GoogleDriveIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 87.3 78" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Yellow segment */}
    <path
      d="m58.4 0 28.9 50.1-14.4 25-28.9-50.1z"
      fill="#FFBA00"
    />
    {/* Green segment */}
    <path
      d="M28.9 0 0 50.1l14.4 25 28.9-50.1z"
      fill="#00AC47"
    />
    {/* Blue segment */}
    <path
      d="m14.4 75.1h58.5l14.4-25H28.8z"
      fill="#0066DA"
    />
  </svg>
);

export const DropboxIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dropbox signature blue */}
    <path
      d="M6 3.5L0 7.5L6 11.5L12 7.5L6 3.5Z"
      fill="#0061FF"
    />
    <path
      d="M18 3.5L12 7.5L18 11.5L24 7.5L18 3.5Z"
      fill="#0061FF"
    />
    <path
      d="M0 15.5L6 19.5L12 15.5L6 11.5L0 15.5Z"
      fill="#0061FF"
    />
    <path
      d="M24 15.5L18 11.5L12 15.5L18 19.5L24 15.5Z"
      fill="#0061FF"
    />
    <path
      d="M6 20.5L12 16.5L18 20.5L12 24.5L6 20.5Z"
      fill="#0061FF"
    />
  </svg>
);

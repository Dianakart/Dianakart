"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  getCroppedImage,
  PixelCrop,
} from "@/utils/cropImage";

interface ImageCropperProps {
  imageUrl: string;
  onCancel: () => void;
  onCropDone: (file: File, previewUrl: string) => void;
}

export default function ImageCropper({
  imageUrl,
  onCancel,
  onCropDone,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<PixelCrop | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels({
        x: croppedPixels.x,
        y: croppedPixels.y,
        width: croppedPixels.width,
        height: croppedPixels.height,
      });
    },
    []
  );

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels) {
      setError(
        "Image is not ready yet. Please move or zoom the image once and try again."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const croppedFile = await getCroppedImage(
        imageUrl,
        croppedAreaPixels,
        rotation
      );

      const croppedPreviewUrl =
        URL.createObjectURL(croppedFile);

      onCropDone(
        croppedFile,
        croppedPreviewUrl
      );
    } catch (cropError) {
      console.error(
        "Crop error:",
        cropError
      );

      setError(
        "Unable to crop the image. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setRotation(0);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70">
      <div className="flex h-[100dvh] w-full items-center justify-center p-2 sm:p-4">
        <div className="flex max-h-[calc(100dvh-16px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)]">
          
          {/* HEADER */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                Crop Product Image
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                Drag the image to set the position.
                Product images use a 2:3 portrait ratio.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
            >
              Close
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            
            {/* CROPPER */}
            <div className="relative h-[300px] w-full bg-gray-950 sm:h-[480px]">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={2 / 3}
                cropShape="rect"
                showGrid
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={
                  handleCropComplete
                }
              />
            </div>

            {/* CONTROLS */}
            <div className="space-y-5 px-4 py-5 sm:px-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                  <span>Zoom</span>
                  <span>
                    {zoom.toFixed(1)}x
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(event) =>
                    setZoom(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full accent-pink-600"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                  <span>Rotate</span>
                  <span>
                    {rotation}°
                  </span>
                </div>

                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(event) =>
                    setRotation(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full accent-pink-600"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {/* STICKY BOTTOM ACTIONS */}
          <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-gray-200 bg-white p-3 sm:flex sm:justify-end sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:px-6"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleSaveCrop
              }
              disabled={saving}
              className="rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
            >
              {saving
                ? "Cropping..."
                : "Apply Crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
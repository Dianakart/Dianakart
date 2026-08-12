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
      setError("Please select the crop area.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const croppedFile = await getCroppedImage(
        imageUrl,
        croppedAreaPixels,
        rotation
      );

      const croppedPreviewUrl =
        URL.createObjectURL(croppedFile);

      onCropDone(croppedFile, croppedPreviewUrl);
    } catch (cropError) {
      console.error("Crop error:", cropError);
      setError("Unable to crop the image.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Crop Product Image
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Drag the image to set the position. Product images use a 2:3 portrait ratio.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="relative h-[520px] w-full bg-gray-950">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="rect"
            showGrid
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="mb-2 flex justify-between text-sm font-medium text-gray-700">
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) =>
                setZoom(Number(event.target.value))
              }
              className="w-full accent-pink-600"
            />
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm font-medium text-gray-700">
              <span>Rotate</span>
              <span>{rotation}°</span>
            </div>

            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(event) =>
                setRotation(Number(event.target.value))
              }
              className="w-full accent-pink-600"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
              }}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={saving}
                className="rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Cropping..." : "Apply Crop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}